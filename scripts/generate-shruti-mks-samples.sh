#!/bin/bash
set -e

# Genera 13 samples MP3 loop-ready a partir de los WAV cromaticos del shrutibox MKS.
#
# Pipeline por archivo (orden):
#   1. Recorte a zona estable (TRIM_START / TRIM_END)
#   2. Limpieza minima: HPF + LPF (DC/rumble, hiss agudo)
#   3. Compresion muy leve + loudnorm con margen de pico
#   4. EQ suave (misma curva en todo el tramo para alinear timbre loop in/out)
#   5. Crossfade final/inicio: cola con fade-out + apad al largo del cuerpo (evita
#      click a XFADE segundos que ocurria si amix cortaba la cola a silencio de golpe)
#
# Salida: public/sounds-shruti-mks/<mismo-nombre-que-wav>.mp3
# Cada ejecucion borra y recrea public/sounds-shruti-mks/ por completo.
#
# Requisitos: ffmpeg, bc
# Uso: bash scripts/generate-shruti-mks-samples.sh

echo "=== Generando samples Shruti MKS (trim + limpieza + nivel + EQ + crossfade) ==="
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
BASE_DIR="public/sounds-shruti-mks"

SAMPLE_RATE=44100
BITRATE="192k"

TRIM_START=1.0
TRIM_END=23.0
XFADE_DURATION=2.0

HPF_HZ=25
LPF_HZ=17000

EQ_LOWMID_HZ=200
EQ_LOWMID_GAIN=-1
EQ_HIGH_HZ=8000
EQ_HIGH_GAIN=-1

COMP_THRESHOLD="-18dB"
COMP_RATIO=2
COMP_ATTACK=20
COMP_RELEASE=250
COMP_MAKEUP=1

LOUDNORM_I=-16
LOUDNORM_TP=-2
LOUDNORM_LRA=7

# Lista fija de 13 WAV (nombre de salida = mismo basename .mp3)
WAVS=(
  "A3.wav"
  "B3.wav"
  "B3_flat.wav"
  "C3.wav"
  "C3-sharp.wav"
  "C4.wav"
  "D3.wav"
  "D3-sharp.wav"
  "E3.wav"
  "F3.wav"
  "F3-sharp.wav"
  "G3.wav"
  "G3-sharp.wav"
)

for wav in "${WAVS[@]}"; do
  src="${SOURCE_DIR}/${wav}"
  if [ ! -f "$src" ]; then
    echo "ERROR: No se encontro el archivo fuente: $src"
    exit 1
  fi
done

echo "  Borrando salida anterior: ${BASE_DIR}/"
rm -rf "$BASE_DIR"
mkdir -p "$BASE_DIR"

TEMP_DIR=$(mktemp -d)
trap 'rm -rf "$TEMP_DIR"' EXIT

REGION_DURATION=$(echo "$TRIM_END - $TRIM_START" | bc -l)
BODY_DURATION=$(echo "$REGION_DURATION - $XFADE_DURATION" | bc -l)
FADE_OUT_ST=$(echo "$BODY_DURATION - $XFADE_DURATION" | bc -l)
# Silencio tras la cola (s) para igualar largo al cuerpo en amix; sin esto, a t=XFADE
# la cola deja de sumarse de golpe y aparece un click muy fuerte.
TAIL_PAD_DUR=$(echo "$BODY_DURATION - $XFADE_DURATION" | bc -l)

echo "  Region: ${TRIM_START}s - ${TRIM_END}s (${REGION_DURATION}s)"
echo "  Crossfade: ${XFADE_DURATION}s"
echo "  Duracion final por sample: ${BODY_DURATION}s"
echo ""
echo "  Procesando ${#WAVS[@]} archivos..."
echo ""

AF_PASS1="highpass=f=${HPF_HZ},lowpass=f=${LPF_HZ},acompressor=threshold=${COMP_THRESHOLD}:ratio=${COMP_RATIO}:attack=${COMP_ATTACK}:release=${COMP_RELEASE}:makeup=${COMP_MAKEUP},equalizer=f=${EQ_LOWMID_HZ}:width_type=h:width=200:g=${EQ_LOWMID_GAIN},equalizer=f=${EQ_HIGH_HZ}:width_type=h:width=2000:g=${EQ_HIGH_GAIN},loudnorm=I=${LOUDNORM_I}:TP=${LOUDNORM_TP}:LRA=${LOUDNORM_LRA}"

generated=0

for wav in "${WAVS[@]}"; do
  src="${SOURCE_DIR}/${wav}"
  base="${wav%.wav}"
  outfile="${BASE_DIR}/${base}.mp3"
  safe_key="${base//[^A-Za-z0-9_-]/_}"

  echo "    Procesando: ${wav} -> ${base}.mp3"

  region_wav="${TEMP_DIR}/${safe_key}_region.wav"

  ffmpeg -y -i "$src" \
    -ss "$TRIM_START" -to "$TRIM_END" \
    -af "$AF_PASS1" \
    -ar "$SAMPLE_RATE" -loglevel error \
    "$region_wav"

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
echo "Generacion completada: ${generated} samples en ${BASE_DIR}/"
