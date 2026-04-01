# Shrutibox Digital

Replica digital de un shrutibox acustico **Monoj Kumar Sardar 440Hz**, construida como aplicacion web con multiples motores de audio: sintesis en tiempo real y reproduccion de samples pregrabados.

El instrumento simula la experiencia de un shrutibox real: 13 lengüetas cromaticas en una sola octava, con variantes komal (bemol) y tivra (sostenido). Primero se seleccionan las notas (como abrir las lengüetas del instrumento), luego se activa la reproduccion (como bombear el fuelle) para generar el drone continuo.

## Caracteristicas

- **13 notas cromaticas**: Sa, Re♭, Re, Ga♭, Ga, Ma, Ma♯, Pa, Dha♭, Dha, Ni♭, Ni, Sa (agudo)
- **Selector de instrumentos**: elige entre MKS Drone y MKS Realistic
- **UI tipo shrutibox**: panel frontal con 13 lengüetas/switches dispuestas horizontalmente
- **Sistema Sargam**: notacion india con variantes shuddh, komal y tivra
- **Toggle + Play/Stop**: selecciona notas con click, luego activa el drone con Play
- **Modificacion en tiempo real**: agrega o quita notas mientras el drone suena
- **Control de volumen**: ajuste de 0% a 100%
- **Teclado fisico**: mapeo estilo piano para las 13 notas + barra espaciadora para Play/Stop
- **Multi-idioma (i18n)**: interfaz disponible en español (Argentina), portugués (Brasil) e inglés (USA), con selector en la esquina superior derecha y persistencia del idioma seleccionado en localStorage

## Stack tecnologico


| Tecnologia   | Version | Uso                              |
| ------------ | ------- | -------------------------------- |
| React        | 19.2.0  | UI con componentes funcionales   |
| Vite         | 7.3.1   | Bundler y servidor de desarrollo |
| Tone.js      | 15.1.22 | Sintesis y reproduccion de audio |
| Zustand      | 5.0.11  | Estado global reactivo           |
| Tailwind CSS | 4.2.0   | Estilos utility-first            |


## Estructura del proyecto

```
shrutibox-os-custom/
├── public/
│   ├── original-sounds/        # Audio fuente para generar samples
│   │   ├── 95345__iluppai__shruti-box.wav
│   │   └── shrutibox-MKS-first-samplers/  # Grabaciones reales del shrutibox MKS
│   ├── sounds/                 # Samples interpolados - Shrutibox Prototype (gitignored)
│   ├── sounds-mks/             # Samples reales - Shrutibox MKS y MKS Grain (gitignored)
│   └── sounds-mks-xfade/       # Samples con crossfade baked-in - MKS Crossfade (gitignored)
├── scripts/
│   ├── generate-samples.sh     # Genera 13 samples MP3 por pitch-shifting (Prototype)
│   ├── generate-mks-samples.sh # Convierte 13 WAV a MP3 (MKS)
│   ├── generate-mks-xfade-samples.sh # Genera MP3 con crossfade baked-in (MKS Crossfade)
│   ├── generate-tones.sh       # Genera tonos sinusoidales placeholder
│   └── install.sh              # Script de instalacion automatizada
├── docs/
│   ├── architecture.md         # Documentacion completa de la arquitectura
│   └── getting-started.md      # Guia de inicio rapido
├── src/
│   ├── main.jsx                # Punto de entrada de React
│   ├── App.jsx                 # Componente raiz (StartScreen + ShrutiboxApp)
│   ├── index.css               # Tailwind CSS + estilos del shrutibox
│   ├── audio/
│   │   ├── audioEngine.js      # Proxy mutable: delega al motor de audio activo
│   │   ├── instruments.js      # Registro de instrumentos disponibles
│   │   ├── AudioManager.js     # Motor de sintesis (PolySynth fatsine)
│   │   ├── SampleAudioManager.js # Motor de samples (Tone.Player con loop)
│   │   ├── GrainAudioManager.js  # Motor granular con dual player cycling
│   │   └── noteMap.js          # 13 notas cromaticas (Sargam + komal/tivra)
│   ├── store/
│   │   └── useShrutiStore.js   # Store Zustand (estado + acciones)
│   ├── components/
│   │   ├── Display.jsx         # Panel informativo (nota activa, estado)
│   │   ├── NoteGrid.jsx        # Panel frontal del shrutibox (13 lengüetas)
│   │   ├── NoteButton.jsx      # Lengüeta individual (toggle switch)
│   │   ├── Controls.jsx        # Instrumento, Play/Stop, volumen, velocidad
│   │   └── LanguageSelector.jsx # Selector de idioma (esquina superior derecha)
│   ├── i18n/
│   │   ├── locales/
│   │   │   ├── es-AR.js        # Español de Argentina
│   │   │   ├── pt-BR.js        # Portugués de Brasil
│   │   │   ├── en-US.js        # Inglés de USA
│   │   │   └── index.js        # Registro modular de locales
│   │   ├── useLanguageStore.js  # Store Zustand con persistencia en localStorage
│   │   └── useTranslation.js   # Hook useTranslation con t(key)
│   ├── hooks/
│   │   └── useKeyboard.js      # Mapeo de teclado fisico (estilo piano)
│   └── config/
│       └── featureFlags.js     # Flags para habilitar/deshabilitar funciones
├── index.html                  # HTML base (punto de montaje)
├── vite.config.js              # Configuracion de Vite
├── eslint.config.js            # Configuracion de ESLint
└── package.json                # Dependencias y scripts
```

## Arquitectura

La aplicacion sigue una arquitectura de **3 capas** con separacion clara de responsabilidades:

```
┌─────────────────────────────────────────────────────────────────────┐
│                    CAPA DE PRESENTACION (React)                     │
│                                                                     │
│   Display ◄──────── NoteGrid ◄──────── Controls                    │
│   (estado)      (13 NoteButton)     (Instr/Play/Vol)               │
│                      │                     │                        │
└──────────────────────┼─────────────────────┼────────────────────────┘
                       │ toggleNote()        │ togglePlay()
                       │                     │ setVolume()
                       ▼                     ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    CAPA DE ESTADO (Zustand)                         │
│                    useShrutiStore.js                                 │
│                                                                     │
│   ┌────────────┬──────────────┬─────────┬─────────┐                │
│   │initialized │ selectedNotes│ playing │ volume  │                │
│   │instrumentId│   string[]   │  bool   │  0-1    │                │
│   │            │              │         │  speed  │                │
│   └────────────┴──────┬───────┴────┬────┴─────────┘                │
│                       │            │                                │
└───────────────────────┼────────────┼────────────────────────────────┘
                        │            │
                        ▼            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    CAPA DE AUDIO (Tone.js)                          │
│                    audioEngine.js (Fachada)                         │
│                                                                     │
│   ┌─────────────────────────┐ ┌──────────────────────────────┐    │
│   │   GrainAudioManager     │ │  RealisticGrainAudioManager   │    │
│   │   (MKS Drone)           │ │  (MKS Realistic)              │    │
│   │   /sounds-mks/          │ │  /sounds-mks/                 │    │
│   │   dual player cycling   │ │  dual player + bellows stagger│    │
│   └──────────┬──────────────┘ └───────────────┬──────────────┘    │
│              └──────────────────┬──────────────┘                   │
│                                 ▼                                   │
│                          Tone.Volume   →   Speaker                  │
│                                                                     │
│   noteMap.js: 13 notas cromaticas (Sa..Ni + komal/tivra + Sa↑)     │
└─────────────────────────────────────────────────────────────────────┘
```

> Para documentacion detallada de la arquitectura, ver `[docs/architecture.md](docs/architecture.md)`.

## Instrumentos virtuales

La aplicacion incluye dos instrumentos activos y cuatro ocultos (deprecados o experimentales). Todos comparten la misma interfaz publica (`init`, `playNote`, `stopNote`, `playNotes`, `stopAll`, `setVolume`, `setSpeed`, `dispose`) y usan los mismos 13 samples MP3 grabados del shrutibox real Monoj Kumar Sardar.

### Activos

#### MKS Drone


|                 |                                            |
| --------------- | ------------------------------------------ |
| ID              | `mks-grain`                                |
| Motor           | `GrainAudioManager`                        |
| Fuente de audio | 13 grabaciones reales MP3 (`/sounds-mks/`) |
| Clase Tone.js   | `Tone.GrainPlayer` con dual player cycling |


Estrategia de reproduccion: usa `Tone.GrainPlayer` que descompone el audio en "granos" de 0.5s con overlap de 0.15s, produciendo un timbre difuso y envolvente. Para evitar el click de loop, **no usa el loop built-in**. En su lugar, implementa **dual player cycling**: antes de que el player activo llegue al final de la region (`loopEnd: 23.0s`), arranca un segundo player desde el inicio (`loopStart: 1.0s`) y ejecuta un crossfade programatico de 2.0s entre ambos. El viejo hace fade-out mientras el nuevo hace fade-in. Cuando el viejo termina, se destruye, y el ciclo se repite indefinidamente. El audio nunca alcanza el punto de corte, eliminando completamente el click.

Al iniciar una nota aplica un fade-in suave de 2.5s. Cada player se conecta a su propio nodo `Tone.Gain` individual para controlar los crossfades de forma independiente. Es el instrumento por defecto.

#### MKS Realistic


|                 |                                                              |
| --------------- | ------------------------------------------------------------ |
| ID              | `mks-realistic`                                              |
| Motor           | `RealisticGrainAudioManager`                                 |
| Fuente de audio | Mismos samples MKS (`/sounds-mks/`)                          |
| Clase Tone.js   | `Tone.GrainPlayer` con dual player cycling + bellows stagger |


Estrategia de reproduccion: extiende la logica de MKS Drone (dual player cycling, crossfade programatico) y anade simulacion del comportamiento fisico del fuelle del shrutibox real. Cuando se activan multiples notas simultaneamente, las lenguetas graves comienzan a sonar primero y las agudas entran progresivamente, replicando como el aire tarda mas en hacer vibrar lenguetas mas pequenas.

Diferencias tecnicas respecto a MKS Drone:

- **Bellows stagger**: al reproducir multiples notas, las ordena de grave a agudo y aplica un delay de 90ms por semitono de distancia desde la nota mas grave
- **Fade-in escalado**: el fade-in inicial (2.5s base) crece un +4% por cada semitono, asi las notas agudas alcanzan volumen pleno ligeramente mas tarde
- **Ciclo asimetrico**: los ciclos de sostenimiento arrancan desde `cycleStart: 5.0s` (zona estable del drone), con un crossfade mas largo (4.0s). El viejo player espera 3.0s antes de iniciar su fade-out de 2.0s, garantizando que el nuevo ya este casi al 100% antes de que el viejo baje
- **Bellows release**: al detener el drone, las notas agudas se apagan primero y las graves con retraso progresivo, replicando el vaciado natural del fuelle

### Ocultos (deprecados / experimentales)

Estos instrumentos estan comentados en `instruments.js` y no aparecen en la UI, pero el codigo de sus motores sigue disponible:


| Instrumento         | Motor                                       | Descripcion                                                                                                                                                    |
| ------------------- | ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Base Sound          | `AudioManager`                              | Sintesis en tiempo real con `PolySynth` (oscilador `fatsine`, 3 voces con spread de 12). No usa samples, genera el sonido matematicamente.                     |
| Shrutibox Prototype | `SampleAudioManager` (`/sounds/`)           | Samples generados por pitch-shifting de un unico WAV fuente. Calidad inferior a las grabaciones reales.                                                        |
| Shrutibox MKS       | `SampleAudioManager` (`/sounds-mks/`)       | Reproduccion directa de samples reales con `Tone.Player` en loop. Motor mas liviano, pero puede producir clicks en los puntos de loop.                         |
| MKS Crossfade       | `SampleAudioManager` (`/sounds-mks-xfade/`) | Samples MKS con crossfade baked-in directamente en el archivo de audio (la cola se mezcla con el inicio). Usa loop completo (`loopStart: 0`, `loopEnd: null`). |


## Requisitos previos

- [Node.js](https://nodejs.org/) v18 o superior (incluye npm)
- [ffmpeg](https://ffmpeg.org/) (solo si quieres usar los instrumentos basados en samples)

En macOS con Homebrew:

```bash
brew install node    # si no tienes Node.js
brew install ffmpeg  # opcional, para generar samples
```

## Instalacion (primera vez)

1. Abre una terminal en la carpeta raiz del proyecto (`shrutibox-os-custom/`).
2. Instala las dependencias:

```bash
npm install
```

Esto descarga los paquetes necesarios en `node_modules/`. Solo necesitas hacerlo una vez, salvo que clones el proyecto de nuevo, alguien agregue una dependencia a `package.json`, o borres `node_modules/`.

1. (Opcional) Genera los samples de audio para los instrumentos basados en samples. Requiere **ffmpeg**:

```bash
bash scripts/generate-samples.sh            # Shrutibox Prototype (13 samples interpolados)
bash scripts/generate-mks-samples.sh        # Shrutibox MKS (13 grabaciones reales)
bash scripts/generate-mks-xfade-samples.sh  # MKS Crossfade (13 samples con loop suave)
```

Sin este paso solo funciona **Base Sound** (sintesis, instrumento oculto). Los instrumentos activos **MKS Drone** y **MKS Realistic** usan los samples generados por `generate-mks-samples.sh`.

1. Inicia el servidor de desarrollo:

```bash
npm run dev
```

1. Abre **[http://localhost:5173](http://localhost:5173)** en el navegador. La app deberia estar funcionando.

## Uso recurrente

Cada vez que quieras usar o trabajar en el proyecto, solo ejecuta:

```bash
npm run dev
```

No hace falta reinstalar dependencias. Cuando termines, presiona **Ctrl + C** en la terminal para detener el servidor.

## Build de produccion

```bash
npm run build
```

## Generar samples de audio

Los instrumentos basados en samples requieren generar archivos MP3 antes de usarlos. Ambos scripts necesitan **ffmpeg** instalado.

### Shrutibox Prototype (samples interpolados)

```bash
bash scripts/generate-samples.sh
```

Toma `public/original-sounds/95345__iluppai__shruti-box.wav` y genera las 13 notas cromaticas por pitch-shifting. Los archivos se crean en `public/sounds/`.

### Shrutibox MKS (samples reales)

```bash
bash scripts/generate-mks-samples.sh
```

Toma las 13 grabaciones individuales de `public/original-sounds/shrutibox-MKS-first-samplers/` (7 shuddh + 4 komal + 1 tivra + Sa agudo) y las convierte a MP3. Los archivos se crean en `public/sounds-mks/`.

### MKS Crossfade (samples con crossfade baked-in)

```bash
bash scripts/generate-mks-xfade-samples.sh
```

Toma los samples MKS y genera versiones con crossfade integrado en el audio: la cola del sample se mezcla con el inicio para que el loop sea suave. Los archivos se crean en `public/sounds-mks-xfade/`.

> Los archivos generados estan en `.gitignore` porque son reproducibles con los scripts. Los WAV fuente si se versionan.

## Otros comandos


| Comando           | Descripcion                             |
| ----------------- | --------------------------------------- |
| `npm run build`   | Crea un build optimizado en `dist/`     |
| `npm run preview` | Sirve el build de produccion localmente |
| `npm run lint`    | Verifica calidad de codigo con ESLint   |


## Uso del instrumento

1. **Iniciar**: al abrir la app, presiona "Iniciar" para activar el audio
2. **Elegir instrumento**: selecciona el sonido deseado (MKS Drone o MKS Realistic)
3. **Activar notas**: haz click en las lengüetas que deseas escuchar (se marcan como seleccionadas)
4. **Reproducir**: presiona el boton Play (o barra espaciadora) para iniciar el drone
5. **Modificar en vivo**: mientras suena, puedes cambiar instrumento, activar o desactivar notas
6. **Detener**: presiona Stop (o barra espaciadora) para silenciar (las notas quedan seleccionadas)

### Atajos de teclado (estilo piano)

**Fila inferior (notas shuddh / naturales):**


| Tecla | Nota      |
| ----- | --------- |
| A     | Sa        |
| S     | Re        |
| D     | Ga        |
| F     | Ma        |
| G     | Pa        |
| H     | Dha       |
| J     | Ni        |
| K     | Sa (alto) |


**Fila superior (notas komal / tivra):**


| Tecla | Nota      |
| ----- | --------- |
| W     | Re komal  |
| E     | Ga komal  |
| T     | Ma tivra  |
| Y     | Dha komal |
| U     | Ni komal  |



| Tecla   | Accion    |
| ------- | --------- |
| Espacio | Play/Stop |


## Mapa de notas (sistema Sargam cromatico)

```
┌──┬───┬──┬───┬──┬──┬───┬──┬───┬───┬───┬──┬──┐
│Sa│Re♭│Re│Ga♭│Ga│Ma│Ma♯│Pa│Dha♭│Dha│Ni♭│Ni│Sa│
│C3│Db3│D3│Eb3│E3│F3│F#3│G3│Ab3 │A3 │Bb3│B3│C4│
└──┴───┴──┴───┴──┴──┴───┴──┴───┴───┴───┴──┴──┘
 S    K   S    K   S   S    T   S    K    S    K   S   S
```

S = shuddh (natural), K = komal (bemol), T = tivra (sostenido)

## Multi-idioma (i18n)

La interfaz soporta multiples idiomas con un sistema modular y liviano integrado con Zustand:


| Idioma    | Codigo | Referencia     |
| --------- | ------ | -------------- |
| Español   | es-AR  | Argentina      |
| Portugués | pt-BR  | Brasil         |
| Inglés    | en-US  | Estados Unidos |


El selector de idioma aparece en la esquina superior derecha, tanto en la pantalla de inicio como en el instrumento. El idioma seleccionado se guarda en `localStorage` y se restaura automaticamente en la proxima visita.

### Agregar un nuevo idioma

1. Crear un archivo en `src/i18n/locales/` (ej: `fr-FR.js`) exportando un objeto con `id`, `label`, `name` y `translations` (usar cualquier locale existente como referencia)
2. Importar y agregar el nuevo locale al array `LOCALES` en `src/i18n/locales/index.js`

### Quitar un idioma

1. Eliminar el archivo del locale en `src/i18n/locales/`
2. Remover el import y la entrada del array `LOCALES` en `src/i18n/locales/index.js`

## Feature flags

`src/config/featureFlags.js` permite activar/desactivar funcionalidades sin modificar los componentes:


| Flag                         | Default | Descripcion                                                            |
| ---------------------------- | ------- | ---------------------------------------------------------------------- |
| `ENABLE_KEYBOARD`            | on      | Soporte de teclado fisico                                              |
| `ENABLE_SPEED_CONTROL`       | off     | Control de velocidad del envelope (desactivado por defecto)            |
| `ENABLE_MOBILE_LAYOUT`       | on      | Layout optimizado para movil                                           |
| `ENABLE_INSTRUMENT_SELECTOR` | on      | Selector de instrumento en la UI                                       |
| `SHOW_VERSION`               | off     | Muestra la version del release en el footer (placeholder hasta v1.0.0) |


## Estrategia de audio para loop continuo

Al reproducir samples pregrabados en loop, se produce un **click audible** en el punto donde el loop salta del final al inicio, porque la forma de onda tiene una discontinuidad abrupta en ese corte.

### El problema: single player con loop built-in

```
               click!
                 │
Player:  [=======▼=======]──loop──►[=======▼=======]──loop──►...
         ^               ^         ^
         loopStart      loopEnd    loopStart (salto abrupto)
```

El player reproduce de `loopStart` a `loopEnd` y salta al inicio. En ese salto, la forma de onda se corta abruptamente, generando un click audible cada vez que el loop reinicia.

### La solucion: dual player con crossfade

```
Player A:  [====1s========~21s]───fade out───(dispose)
                               │
Player B:            [====1s========~21s]───fade out───(dispose)
                     │                   │
                  arranca con          Player C: [====1s====...
                  fade-in              arranca con fade-in
```

En lugar de usar el loop built-in, se ejecutan **dos players que se alternan**:

1. **Player A** arranca desde `loopStart` y reproduce sin loop
2. Antes de que A llegue a `loopEnd`, se crea **Player B** desde `loopStart`
3. Durante `crossfadeDuration` segundos, A hace fade-out y B hace fade-in
4. Cuando A termina el fade, se destruye
5. Antes de que B llegue a `loopEnd`, se crea **Player C** y se repite

El audio nunca alcanza el punto de corte, eliminando completamente el click de loop.

Esta tecnica esta implementada en `GrainAudioManager.js` para el instrumento **MKS Drone**, y extendida en `RealisticGrainAudioManager.js` para **MKS Realistic**.

> Para documentacion detallada de las mejoras de audio, ver `[docs/audio-improvements.md](docs/audio-improvements.md)`.

## Documentacion


| Documento                                                                                                      | Descripcion                                      |
| -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| `[docs/getting-started.md](docs/getting-started.md)`                                                           | Guia de inicio rapido paso a paso                |
| `[docs/architecture.md](docs/architecture.md)`                                                                 | Arquitectura detallada con diagramas y flujos    |
| `[docs/audio-improvements.md](docs/audio-improvements.md)`                                                     | Mejoras de audio: clicks, crossfade, dual player |
| `[docs/realistic-engine.md](docs/realistic-engine.md)`                                                         | Motor MKS Realistic: bellows stagger y release   |
| `[docs/shrutibox-details-buildiing-and-how-to-works.md](docs/shrutibox-details-buildiing-and-how-to-works.md)` | Analisis fisico y acustico del shruti box MKS    |


## Autor

Desarrollado por [Lucas Paiva](https://github.com/lucaspaiva-dev).

Basado en el instrumento fisico Monoj Kumar Sardar 440Hz..