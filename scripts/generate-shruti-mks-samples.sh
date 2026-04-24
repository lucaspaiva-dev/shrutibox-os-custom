#!/bin/bash
set -e

# Genera 13 samples MP3 a partir de los WAV cromaticos del shrutibox MKS.
#
# Pipeline por archivo (orden):
#   1. Recorte a zona estable: TRIM_START hasta TRIM_START + OUTPUT_DURATION
#   2. Limpieza minima: HPF + LPF (DC/rumble, hiss agudo)
#   3. Compresion muy leve + loudnorm con margen de pico
#   4. EQ suave (misma curva en todo el tramo)
#
# Sin fades ni crossfade offline. El fade-in, fade-out y crossfade entre
# ciclos son responsabilidad del AudioManager en runtime
# (ver src/audio/DroneSampleAudioManager.js).
#
# Salida: public/sounds-shruti-mks/<mismo-nombre-que-wav>.mp3
# Cada ejecucion borra y recrea public/sounds-shruti-mks/ por completo.
#
# Requisitos: ffmpeg
# Uso: bash scripts/generate-shruti-mks-samples.sh

echo "=== Generando samples Shruti MKS (trim + limpieza + nivel + EQ) ==="
echo ""

if ! command -v ffmpeg &> /dev/null; then
  echo "ERROR: ffmpeg no esta instalado."
  echo "Instalalo con: brew install ffmpeg"
  exit 1
fi

SOURCE_DIR="public/original-sounds/shrutibox-MKS-first-samplers"
BASE_DIR="public/sounds-shruti-mks"

SAMPLE_RATE=44100
BITRATE="192k"

TRIM_START=1.0
OUTPUT_DURATION=20.0

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

echo "  Region: ${TRIM_START}s + ${OUTPUT_DURATION}s"
echo "  Duracion final por sample: ${OUTPUT_DURATION}s"
echo ""
echo "  Procesando ${#WAVS[@]} archivos..."
echo ""

AF_CHAIN="highpass=f=${HPF_HZ},lowpass=f=${LPF_HZ},acompressor=threshold=${COMP_THRESHOLD}:ratio=${COMP_RATIO}:attack=${COMP_ATTACK}:release=${COMP_RELEASE}:makeup=${COMP_MAKEUP},equalizer=f=${EQ_LOWMID_HZ}:width_type=h:width=200:g=${EQ_LOWMID_GAIN},equalizer=f=${EQ_HIGH_HZ}:width_type=h:width=2000:g=${EQ_HIGH_GAIN},loudnorm=I=${LOUDNORM_I}:TP=${LOUDNORM_TP}:LRA=${LOUDNORM_LRA}"

generated=0

for wav in "${WAVS[@]}"; do
  src="${SOURCE_DIR}/${wav}"
  base="${wav%.wav}"
  outfile="${BASE_DIR}/${base}.mp3"

  echo "    Procesando: ${wav} -> ${base}.mp3"

  ffmpeg -y -i "$src" \
    -ss "$TRIM_START" -t "$OUTPUT_DURATION" \
    -af "$AF_CHAIN" \
    -b:a "$BITRATE" -ar "$SAMPLE_RATE" -loglevel error \
    "$outfile"

  generated=$((generated + 1))
done

echo ""
echo "Generacion completada: ${generated} samples en ${BASE_DIR}/"
