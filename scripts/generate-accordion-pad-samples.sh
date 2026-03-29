#!/bin/bash
set -e

# Genera 13 samples MP3 a partir del sample de acordeon "Accordion pad1.wav"
# de juskiddink (Freesound #120931, CC-BY 4.0).
#
# Usa pitch-shifting con ffmpeg (asetrate + aresample) para derivar cada nota
# desde la frecuencia fuente (130.81 Hz / C3 / Sa).
#
# El sample original es un acorde de C menor con efectos de modulacion de filtro.
# Al hacer pitch-shift, cada nota conserva el caracter timbrico del pad original.
#
# Fuente: https://freesound.org/people/juskiddink/sounds/120931/
# Licencia: Attribution 4.0 (https://creativecommons.org/licenses/by/4.0/)
#
# Estructura de salida (compatible con noteMap.js):
#   public/sounds-accordion-pad/sa.mp3, re_komal.mp3, ..., sa_high.mp3
#
# Requisitos: ffmpeg, bc
# Uso: bash scripts/generate-accordion-pad-samples.sh

echo "=== Generando samples para Acordion Pad FX ==="
echo "    Fuente: juskiddink — Accordion pad1.wav (Freesound #120931)"
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

SOURCE_WAV="public/original-sounds/acordion-pad-c/120931__juskiddink__accordion-pad1.wav"
SOURCE_FREQ=130.81
SAMPLE_RATE=44100
BASE_DIR="public/sounds-accordion-pad"
BITRATE="192k"

if [ ! -f "$SOURCE_WAV" ]; then
  echo "ERROR: No se encontro el archivo fuente: $SOURCE_WAV"
  exit 1
fi

# 13 notas cromaticas con frecuencias de octava 3 (A=440Hz)
# fileKey:frecuencia
NOTES="sa:130.81 re_komal:138.59 re:146.83 ga_komal:155.56 ga:164.81 ma:174.61 ma_tivra:185.00 pa:196.00 dha_komal:207.65 dha:220.00 ni_komal:233.08 ni:246.94 sa_high:261.63"

TEMP_DIR=$(mktemp -d)
NORMALIZED="${TEMP_DIR}/normalized.wav"

echo "  Normalizando audio fuente..."
ffmpeg -y -i "$SOURCE_WAV" \
  -af "silenceremove=start_periods=1:start_silence=0.05:start_threshold=-50dB,loudnorm=I=-14:TP=-1:LRA=7" \
  -ar "$SAMPLE_RATE" -loglevel error \
  "$NORMALIZED"
echo "  Audio normalizado."
echo ""

mkdir -p "$BASE_DIR"

generated=0
skipped=0

for entry in $NOTES; do
  fileKey="${entry%%:*}"
  target_freq="${entry##*:}"
  ratio=$(echo "$target_freq / $SOURCE_FREQ" | bc -l)
  outfile="${BASE_DIR}/${fileKey}.mp3"

  if [ -f "$outfile" ]; then
    echo "  Ya existe: $outfile (omitiendo)"
    skipped=$((skipped + 1))
    continue
  fi

  new_rate=$(echo "$SAMPLE_RATE * $ratio" | bc -l | cut -d. -f1)
  echo "  Generando: $outfile ($(printf '%.2f' "$target_freq") Hz, ratio: $(printf '%.4f' "$ratio"))"

  ffmpeg -y -i "$NORMALIZED" \
    -af "asetrate=${new_rate},aresample=${SAMPLE_RATE}" \
    -b:a "$BITRATE" -loglevel error \
    "$outfile"

  generated=$((generated + 1))
done

rm -rf "$TEMP_DIR"

echo ""
echo "Generacion completada: ${generated} samples creados, ${skipped} omitidos."
echo "Los samples fueron generados por pitch-shifting desde ${SOURCE_WAV}."
echo "Sample original: juskiddink — Freesound #120931 (CC-BY 4.0)"
