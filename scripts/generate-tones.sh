#!/bin/bash
set -e

echo "=== Generando tonos placeholder para Shrutibox Digital ==="
echo ""

if ! command -v ffmpeg &> /dev/null; then
  echo "ERROR: ffmpeg no está instalado."
  echo "Instálalo con: brew install ffmpeg"
  exit 1
fi

DURATION=3
SAMPLE_RATE=44100
BASE_DIR="public/sounds"

declare -A NOTES
NOTES=(
  [sa]=261.63
  [re]=293.66
  [ga]=329.63
  [ma]=349.23
  [pa]=392.00
  [dha]=440.00
  [ni]=493.88
)

declare -A OCTAVE_MULT
OCTAVE_MULT=( [1]=0.5 [2]=1.0 [3]=2.0 )

for octave in 1 2 3; do
  dir="${BASE_DIR}/octave_${octave}"
  mkdir -p "$dir"

  mult=${OCTAVE_MULT[$octave]}

  for note in sa re ga ma pa dha ni; do
    base_freq=${NOTES[$note]}
    freq=$(echo "$base_freq * $mult" | bc -l)
    outfile="${dir}/${note}.mp3"

    if [ -f "$outfile" ]; then
      echo "  Ya existe: $outfile (omitiendo)"
      continue
    fi

    echo "  Generando: $outfile (${freq} Hz)"
    ffmpeg -y -f lavfi \
      -i "sine=frequency=${freq}:duration=${DURATION}:sample_rate=${SAMPLE_RATE}" \
      -af "afade=t=in:ss=0:d=0.1,afade=t=out:st=$((DURATION-1)):d=1" \
      -b:a 128k -loglevel error \
      "$outfile"
  done
done

# Sa superior (octava 4)
sa_high_freq=$(echo "261.63 * 4" | bc -l)
outfile="${BASE_DIR}/octave_3/sa_high.mp3"
if [ ! -f "$outfile" ]; then
  echo "  Generando: $outfile (${sa_high_freq} Hz)"
  ffmpeg -y -f lavfi \
    -i "sine=frequency=${sa_high_freq}:duration=${DURATION}:sample_rate=${SAMPLE_RATE}" \
    -af "afade=t=in:ss=0:d=0.1,afade=t=out:st=$((DURATION-1)):d=1" \
    -b:a 128k -loglevel error \
    "$outfile"
fi

echo ""
echo "Tonos placeholder generados correctamente."
echo "Estos son tonos sinusoidales simples para desarrollo."
echo "Reemplázalos con grabaciones reales del shrutibox para producción."
