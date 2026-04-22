#!/bin/bash
set -e

# Genera 13 samples MP3 con crossfade seamless para el instrumento MKS Crossfade.
#
# Toma las grabaciones individuales reales (WAV) del shrutibox MKS y produce
# archivos MP3 cuyo final se funde con su inicio, permitiendo loop continuo
# sin clicks ni discontinuidades audibles.
#
# Proceso por sample:
#   1. Extrae la region estable del WAV (descarta transientes de inicio/fin)
#   2. Superpone los ultimos XFADE_DURATION segundos (con fade-out) sobre
#      los primeros XFADE_DURATION segundos (con fade-in)
#   3. Recorta a (duracion_region - XFADE_DURATION) para que el archivo
#      sea loop-ready de principio a fin
#   4. Normaliza y convierte a MP3 192kbps
#
# Estructura de salida (compatible con noteMap.js):
#   public/sounds-mks-xfade/C3.mp3, D3.mp3, C3-sharp.mp3, ..., C4.mp3
#
# Requisitos: ffmpeg, bc
# Uso: bash scripts/generate-mks-xfade-samples.sh

echo "=== Generando samples crossfade para MKS Crossfade ==="
echo ""

if ! command -v ffmpeg &> /dev/null; then
  echo "ERROR: ffmpeg no esta instalado."
  echo "Instalalo con: brew install ffmpeg"
  exit 1
fi

if ! command -v bc &> /dev/null; then
  echo "ERROR: bc no esta instalado."
  exit 1
fi

SOURCE_DIR="public/original-sounds/shrutibox-MKS-first-samplers"
BASE_DIR="public/sounds-mks-xfade"
SAMPLE_RATE=44100
BITRATE="192k"

TRIM_START=1.0
TRIM_END=23.0
XFADE_DURATION=2.0

NOTES="C3:sa3.wav C3-sharp:re3_komal.wav D3:re3.wav D3-sharp:ga3_komal.wav E3:ga3.wav F3:ma3.wav F3-sharp:ma3_tivra.wav G3:pa3.wav G3-sharp:dha3_komal.wav A3:dha3.wav B3_flat:ni3_komal.wav B3:ni3.wav C4:sa4-high.wav"

for entry in $NOTES; do
  wav="${entry##*:}"
  src="${SOURCE_DIR}/${wav}"
  if [ ! -f "$src" ]; then
    echo "ERROR: No se encontro el archivo fuente: $src"
    exit 1
  fi
done

mkdir -p "$BASE_DIR"

TEMP_DIR=$(mktemp -d)
trap 'rm -rf "$TEMP_DIR"' EXIT

generated=0
skipped=0

REGION_DURATION=$(echo "$TRIM_END - $TRIM_START" | bc -l)
BODY_DURATION=$(echo "$REGION_DURATION - $XFADE_DURATION" | bc -l)
FADE_OUT_ST=$(echo "$BODY_DURATION - $XFADE_DURATION" | bc -l)
TAIL_PAD_DUR=$(echo "$BODY_DURATION - $XFADE_DURATION" | bc -l)

echo "  Region: ${TRIM_START}s - ${TRIM_END}s (${REGION_DURATION}s)"
echo "  Crossfade: ${XFADE_DURATION}s"
echo "  Duracion final por sample: ${BODY_DURATION}s"
echo ""
echo "  Generando samples con crossfade seamless..."

for entry in $NOTES; do
  fileKey="${entry%%:*}"
  wav="${entry##*:}"
  src="${SOURCE_DIR}/${wav}"
  outfile="${BASE_DIR}/${fileKey}.mp3"

  if [ -f "$outfile" ]; then
    echo "    Ya existe: $outfile (omitiendo)"
    skipped=$((skipped + 1))
    continue
  fi

  echo "    Generando: $outfile"

  region_wav="${TEMP_DIR}/${fileKey}_region.wav"
  ffmpeg -y -i "$src" \
    -ss "$TRIM_START" -to "$TRIM_END" \
    -af "loudnorm=I=-14:TP=-1:LRA=7" \
    -ar "$SAMPLE_RATE" -loglevel error \
    "$region_wav"

  # Crossfade: en los primeros XFADE_DURATION s, cola (final del take) con
  # fade-out se suma al cuerpo con fade-in; la cola va seguida de silencio
  # (apad) hasta igualar el largo del cuerpo para que amix no corte la suma
  # a los XFADE_DURATION s (evita click fuerte). Cuerpo con fade-out al final
  # del archivo para cerrar el loop.
  ffmpeg -y -i "$region_wav" -filter_complex \
    "[0]atrim=0:${BODY_DURATION},asetpts=PTS-STARTPTS,afade=t=in:d=${XFADE_DURATION},afade=t=out:st=${FADE_OUT_ST}:d=${XFADE_DURATION}[body_faded]; \
     [0]atrim=${BODY_DURATION}:${REGION_DURATION},asetpts=PTS-STARTPTS,afade=t=out:st=0:d=${XFADE_DURATION}[tail_xf]; \
     [tail_xf]apad=pad_dur=${TAIL_PAD_DUR}[tail_pad]; \
     [body_faded][tail_pad]amix=inputs=2:duration=first:normalize=0[out]" \
    -map "[out]" -b:a "$BITRATE" -ar "$SAMPLE_RATE" -loglevel error \
    "$outfile"

  generated=$((generated + 1))
done

echo ""
echo "Generacion completada: ${generated} samples creados, ${skipped} omitidos."
echo "Samples con crossfade seamless en: ${BASE_DIR}/"
