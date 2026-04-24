# `generate-shruti-mks-samples.sh`

Script bash que genera **13 archivos MP3 de 20 s** a partir de los WAV cromáticos del shrutibox MKS. Aplica recorte a la zona estable del take, limpieza mínima, dinámica suave y EQ fino. **No aplica fades ni crossfade offline**: el fade-in inicial, el fade-out al detener y el crossfade entre ciclos son responsabilidad del AudioManager en runtime (ver [`src/audio/DroneSampleAudioManager.js`](../src/audio/DroneSampleAudioManager.js)).

## Relación con otros assets

| Carpeta / script | Rol |
|------------------|-----|
| `public/original-sounds/shrutibox-MKS-first-samplers/` | WAV fuente (~27 s, nombres tipo `C3.wav`, `C3-sharp.wav`). |
| `public/sounds-mks-xfade/` | MP3 con crossfade baked-in para el instrumento "MKS Crossfade" (pipeline diferente, ver [`generate-mks-xfade-samples.sh`](generate-mks-xfade-samples.sh)). |
| **`public/sounds-shruti-mks/`** | **Salida de este script**: mismos nombres base que el WAV (`C3.wav` → `C3.mp3`), sin fades. |

## Requisitos

- `ffmpeg` (con filtros `loudnorm`, `acompressor`, `equalizer`, etc.)

En macOS: `brew install ffmpeg` (normalmente incluye lo necesario).

## Uso

Desde la raíz del repo:

```bash
bash scripts/generate-shruti-mks-samples.sh
```

O, si el bit ejecutable está activo:

```bash
./scripts/generate-shruti-mks-samples.sh
```

### Comportamiento importante

- **Borra por completo** `public/sounds-shruti-mks/` al inicio y vuelve a generar **todos** los MP3. Así cada cambio de parámetros produce un conjunto coherente de salidas.
- Lista **fija** de 13 WAV; si falta alguno, el script termina con error indicando la ruta.

## Parámetros configurables (cabecera del script)

Editá las variables al inicio de [generate-shruti-mks-samples.sh](generate-shruti-mks-samples.sh).

| Variable | Default | Qué hace |
|----------|---------|----------|
| `SOURCE_DIR` | `public/original-sounds/shrutibox-MKS-first-samplers` | Carpeta de WAV. |
| `BASE_DIR` | `public/sounds-shruti-mks` | Salida MP3. |
| `SAMPLE_RATE` | `44100` | Frecuencia de muestreo de salida. |
| `BITRATE` | `192k` | Calidad MP3. |
| `TRIM_START` | `1.0` | Offset de inicio en el WAV original (descarta el ataque). |
| `OUTPUT_DURATION` | `20.0` | Duración del segmento de salida en segundos. |
| `HPF_HZ` | `25` | Pasa-altos suave (DC / rumble muy grave). |
| `LPF_HZ` | `17000` | Pasa-bajos suave (hiss agudo). |
| `EQ_LOWMID_HZ` / `EQ_LOWMID_GAIN` | `200` / `-1` | Corte suave en graves medios (dB). |
| `EQ_HIGH_HZ` / `EQ_HIGH_GAIN` | `8000` / `-1` | Corte suave en agudos. |
| `COMP_*` | ver script | Compresión muy leve (`acompressor`). |
| `LOUDNORM_I` / `LOUDNORM_TP` / `LOUDNORM_LRA` | `-16` / `-2` / `7` | Integrado, **true peak** y LRA (EBU R128). `TP=-2` deja margen al sumar varias notas o al codificar MP3. |

### Guía rápida de ajuste

- **Nivel muy bajo / muy alto**: ajustar `LOUDNORM_I` (más alto = más fuerte integrado); no subir `TP` si se quiere margen anti-clipping.
- **Demasiado brillante**: bajar `EQ_HIGH_GAIN` o reducir `EQ_HIGH_HZ` hacia 6–7 kHz.
- **Ruido de fondo audible**: subir levemente `HPF_HZ` (con cuidado para no afectar graves útiles).

## Estrategia por pasos (orden de la cadena)

### 1. Recorte (zona estable)

Se descarta el ataque inicial del take con `-ss TRIM_START` y se limita la duración con `-t OUTPUT_DURATION`. Por defecto toma los segundos **1.0 s – 21.0 s** del WAV.

### 2. Limpieza mínima

- **Pasa-altos** en `HPF_HZ`: reduce offset/DC y rumble sin tocar armónicos útiles de las notas graves.
- **Pasa-bajos** en `LPF_HZ`: atenúa ruido muy agudo / hiss que no aporta al bucle.

No se aplica de-clicking agresivo ni reducción de ruido fuerte, para no "lavar" el timbre del shrutibox.

### 3. Nivel y dinámica

- **`acompressor`**: ratio bajo, ataque/release conservadores, makeup pequeño — solo aplana un poco picos locales antes del normalizador.
- **`loudnorm`**: nivela integrado y limita **true peak** según `LOUDNORM_TP`, con margen respecto a 0 dBFS para mezclas y decodificación MP3.

### 4. EQ suave

Dos campanas `equalizer` muy suaves (−1 dB en ~200 Hz y ~8 kHz) para un color espectral homogéneo a lo largo del segmento.

> **Sin fades ni crossfade**: a diferencia del pipeline de `generate-mks-xfade-samples.sh`, este script no aplica `afade`, `apad` ni `amix`. El sample empieza y termina abruptamente en el nivel estable. El fade-in inicial (2.5 s), el crossfade entre ciclos (3 s) y el fade-out al parar (1.5 s) los maneja `DroneSampleAudioManager` en runtime.

## Entradas y salidas esperadas

Entrada (13 archivos en `SOURCE_DIR`):

`A3.wav`, `B3.wav`, `B3_flat.wav`, `C3.wav`, `C3-sharp.wav`, `C4.wav`, `D3.wav`, `D3-sharp.wav`, `E3.wav`, `F3.wav`, `F3-sharp.wav`, `G3.wav`, `G3-sharp.wav`

Salida en `BASE_DIR` (mismo nombre base, extensión `.mp3`, duración ~20 s):

`A3.mp3`, `B3.mp3`, `B3_flat.mp3`, `C3.mp3`, `C3-sharp.mp3`, `C4.mp3`, `D3.mp3`, `D3-sharp.mp3`, `E3.mp3`, `F3.mp3`, `F3-sharp.mp3`, `G3.mp3`, `G3-sharp.mp3`

## Verificación

Medir duración de los archivos generados:

```bash
for f in public/sounds-shruti-mks/*.mp3; do
  printf "%s " "$f"
  ffprobe -v error -show_entries format=duration \
    -of default=noprint_wrappers=1:nokey=1 "$f"
done
```

Todos deben mostrar `20.000000`. Medir pico aproximado:

```bash
ffmpeg -nostats -i public/sounds-shruti-mks/C3.mp3 -af volumedetect -f null - 2>&1 | grep max_volume
```

`max_volume` muy cercano a `0.0 dB` indicaría poco margen; con `LOUDNORM_TP=-2` suele quedar holgado respecto a clipping digital.

## Implementación técnica (resumen)

Pasada única por archivo: trim (`-ss` / `-t`) + cadena `-af` (HPF, LPF, compresor, EQ, loudnorm) → MP3 final. Sin archivos temporales, sin segundo pase.
