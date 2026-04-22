#!/bin/bash
set -e

# Genera 13 samples MP3 para el instrumento Shrutibox MKS a partir de
# grabaciones individuales reales (WAV) del shrutibox Monoj Kumar Sardar.
#
# Convierte cada WAV directamente a MP3 en estructura plana.
# Incluye las 7 notas shuddh + 4 komal + 1 tivra + Sa agudo = 13 notas.
#
# Estructura de salida (compatible con noteMap.js):
#   public/sounds-mks/C3.mp3, D3.mp3, C3-sharp.mp3, ..., C4.mp3
#
# Requisitos: ffmpeg
# Uso: bash scripts/generate-mks-samples.sh

echo "=== Generando samples para Shrutibox MKS ==="
echo ""

if ! command -v ffmpeg &> /dev/null; then
  echo "ERROR: ffmpeg no esta instalado."
  echo "Instalalo con: brew install ffmpeg"
  exit 1
fi

SOURCE_DIR="public/original-sounds/shrutibox-MKS-first-samplers"
BASE_DIR="public/sounds-mks"
SAMPLE_RATE=44100
BITRATE="192k"

# Mapeo: fileKey:archivo_wav (13 notas cromaticas en nomenclatura occidental)
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

generated=0
skipped=0

echo "  Convirtiendo grabaciones originales a MP3..."
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
  ffmpeg -y -i "$src" \
    -af "loudnorm=I=-14:TP=-1:LRA=7" \
    -ar "$SAMPLE_RATE" -b:a "$BITRATE" -loglevel error \
    "$outfile"
  generated=$((generated + 1))
done

echo ""
echo "Generacion completada: ${generated} samples creados, ${skipped} omitidos."
echo "Samples generados desde grabaciones reales del shrutibox MKS en: ${BASE_DIR}/"
