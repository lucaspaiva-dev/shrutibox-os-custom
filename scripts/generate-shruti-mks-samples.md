# `generate-shruti-mks-samples.sh`

Script bash que genera **13 archivos MP3 loop-ready** a partir de los WAV cromáticos del shrutibox MKS, con la misma idea de **crossfade offline** que [generate-mks-xfade-samples.sh](generate-mks-xfade-samples.sh), pero aplicando antes una cadena más completa: recorte a zona estable, limpieza mínima, dinámica suave, EQ fino y luego el cierre de loop.

## Relación con otros assets

| Carpeta / script | Rol |
|------------------|-----|
| `public/original-sounds/shrutibox-MKS-first-samplers/` | WAV fuente (~27 s, nombres tipo `C3.wav`, `C3-sharp.wav`). |
| `public/sounds-mks-xfade/` | MP3 con nombres de nota india (`sa.mp3`, `re_komal.mp3`, …) para el instrumento “MKS Crossfade”. |
| **`public/sounds-shruti-mks/`** | **Salida de este script**: mismos nombres base que el WAV (`C3.wav` → `C3.mp3`). |

Útil cuando el motor o el mapeo esperan **nombres cromáticos** en lugar de `sa` / `re_komal`, o cuando querés iterar parámetros de preparación sin tocar el pipeline de solfeo.

## Requisitos

- `ffmpeg` (con filtros `loudnorm`, `acompressor`, `equalizer`, etc.)
- `bc` (cálculo de duraciones de región y crossfade)

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

- **Borra por completo** `public/sounds-shruti-mks/` al inicio y vuelve a generar **todos** los MP3. Así cada cambio de parámetros en el script produce un conjunto coherente de salidas.
- Lista **fija** de 13 WAV; si falta alguno, el script termina con error indicando la ruta.

## Parámetros configurables (cabecera del script)

Editá las variables al inicio de [generate-shruti-mks-samples.sh](generate-shruti-mks-samples.sh).

| Variable | Default | Qué hace |
|----------|---------|----------|
| `SOURCE_DIR` | `public/original-sounds/shrutibox-MKS-first-samplers` | Carpeta de WAV. |
| `BASE_DIR` | `public/sounds-shruti-mks` | Salida MP3. |
| `SAMPLE_RATE` | `44100` | Frecuencia de muestreo de salida. |
| `BITRATE` | `192k` | Calidad MP3. |
| `TRIM_START` / `TRIM_END` | `1.0` / `23.0` | Ventana estable en segundos desde el WAV original. |
| `XFADE_DURATION` | `2.0` | Duración del solapamiento final↔inicio al cerrar el loop. |
| `HPF_HZ` | `25` | Pasa-altos suave (DC / rumble muy grave). |
| `LPF_HZ` | `17000` | Pasa-bajos suave (hiss agudo). |
| `EQ_LOWMID_HZ` / `EQ_LOWMID_GAIN` | `200` / `-1` | Corte suave en graves medios (dB). |
| `EQ_HIGH_HZ` / `EQ_HIGH_GAIN` | `8000` / `-1` | Corte suave en agudos (reduce brillos que marcan el splice). |
| `COMP_*` | ver script | Compresión muy leve (`acompressor`). |
| `LOUDNORM_I` / `LOUDNORM_TP` / `LOUDNORM_LRA` | `-16` / `-2` / `7` | Integrado, **true peak** y LRA (EBU R128). `TP=-2` deja margen al sumar varias notas o al codificar MP3. |

### Guía rápida de ajuste

- **Loop aún audible**: subir `XFADE_DURATION` un poco (p. ej. 2.5) o afinar `TRIM_*` para centrar mejor la parte estable.
- **Click fuerte justo a los `XFADE_DURATION` segundos**: era el bug del `amix` con cola más corta que el cuerpo; el script actual ya usa cola con fade-out + `apad`. Si aún notás artefacto, probá subir un poco `XFADE_DURATION` o revisar `TRIM_*`.
- **Click residual distinto**: revisar `TRIM_*`; subir levemente `HPF_HZ` solo si no afecta el timbre deseado.
- **Muy bajo / muy alto de nivel**: `LOUDNORM_I` (más alto = más fuerte integrado); no subas `TP` si querés margen anti-clipping.
- **Muy “brillante” en el cruce**: bajar un poco más `EQ_HIGH_GAIN` o bajar `EQ_HIGH_HZ` hacia 6–7 kHz con poco ancho.

## Estrategia por pasos (orden de la cadena)

### 1. Recorte (zona estable)

Se descartan el ataque inicial y la cola final del take largo con `-ss` / `-to` sobre el WAV. Por defecto **1.0 s – 23.0 s** (22 s de región), igual en espíritu al script de xfade que ya usabas en el proyecto.

### 2. Limpieza mínima

- **Pasa-altos** en `HPF_HZ`: reduce offset/DC y rumble sin tocar armónicos útiles de las notas graves típicas.
- **Pasa-bajos** en `LPF_HZ`: atenúa ruido muy agudo / hiss que no aporta al bucle.

No se aplica de-clicking agresivo ni reducción de ruido fuerte, para no “lavar” el timbre del shrutibox.

### 3. Nivel y dinámica

- **`acompressor`**: ratio bajo, ataque/release conservadores, makeup pequeño — solo aplana un poco picos locales antes del normalizador.
- **`loudnorm`**: nivela integrado y limita **true peak** según `LOUDNORM_TP`, con margen respecto a 0 dBFS para mezclas y decodificación MP3.

### 4. EQ suave (timbre homogéneo en el loop)

Dos campanas `equalizer` muy suaves (p. ej. −1 dB en ~200 Hz y ~8 kHz). La curva es **constante en el tiempo** sobre toda la región: el inicio y el final del tramo que se va a unir tienen el **mismo** color espectral, lo que ayuda a que el crossfade no “salte” de timbre.

### 5. Cerrar el loop (crossfade)

- **Cuerpo**: `[0, REGION − XFADE]` con **fade-in** en los primeros `XFADE_DURATION` s y **fade-out** en los últimos `XFADE_DURATION` s (así el final del MP3 encaja con el inicio al loopear).
- **Cola**: los últimos `XFADE_DURATION` s de la región (el “final del take” antes del corte) con **fade-out** de fuerte a silencio en esa ventana, de modo que al sumarse al cuerpo la energía del final **baja** mientras el cuerpo **sube** (complementarios en el cruce).
- **`apad`**: tras la cola se rellena con silencio hasta igualar la duración del cuerpo. Sin esto, `amix` con `duration=longest` hace que la cola (solo unos pocos segundos) pase de golpe a “silencio implícito” cuando termina, mientras el cuerpo sigue: la suma salta en **t = XFADE_DURATION** y se oye un **click muy fuerte** (a menudo alrededor del segundo 2 si `XFADE_DURATION=2`).

Se mezcla cuerpo y cola rellenada con `amix=normalize=0` y `duration=first` (ambas pistas del mismo largo).

La duración final de cada MP3 es **`REGION_DURATION − XFADE_DURATION`** (por defecto **20 s**).

## Entradas y salidas esperadas

Entrada (13 archivos en `SOURCE_DIR`):

`A3.wav`, `B3.wav`, `B3_flat.wav`, `C3.wav`, `C3-sharp.wav`, `C4.wav`, `D3.wav`, `D3-sharp.wav`, `E3.wav`, `F3.wav`, `F3-sharp.wav`, `G3.wav`, `G3-sharp.wav`

Salida en `BASE_DIR` (mismo nombre base, extensión `.mp3`):

`A3.mp3`, `B3.mp3`, `B3_flat.mp3`, `C3.mp3`, `C3-sharp.mp3`, `C4.mp3`, `D3.mp3`, `D3-sharp.mp3`, `E3.mp3`, `F3.mp3`, `F3-sharp.mp3`, `G3.mp3`, `G3-sharp.mp3`

## Verificación auditiva

1. Reproducir un MP3 en loop (QuickTime, `ffplay -loop 0 archivo.mp3`, o el propio `Tone.Player` con `loop: true`).
2. Escuchar varias vueltas: no debería haber **clicks** ni **saltos** claros de brillo en el punto de cierre.
3. Opcional — medir pico aproximado en el archivo decodificado:

   ```bash
   ffmpeg -nostats -i public/sounds-shruti-mks/C3.mp3 -af volumedetect -f null - 2>&1 | grep max_volume
   ```

   `max_volume` muy cercano a `0.0 dB` indicaría poco margen; con `LOUDNORM_TP=-2` suele quedar holgado respecto a clipping digital.

## Implementación técnica (resumen)

- **Pasada 1**: trim + cadena `-af` (HPF, LPF, compresor, EQ, loudnorm) → WAV intermedio en directorio temporal.
- **Pasada 2**: `filter_complex` con `atrim`, `afade` (in/out coherentes), `apad`, `amix` → MP3 final.

Los intermedios se borran al salir del script (`mktemp` + `trap`).
