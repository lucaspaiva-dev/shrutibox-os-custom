# Arquitectura — Shrutibox Digital

Replica digital de un shrutibox Monoj Kumar Sardar 440Hz. Construida con React 19, Vite, Tone.js y Zustand.

---

## Stack tecnologico

| Paquete     | Version | Proposito            |
| ----------- | ------- | -------------------- |
| React       | 19.2.0  | Framework de UI      |
| React-DOM   | 19.2.0  | Renderizado DOM      |
| Tone.js     | 15.1.22 | Sintesis y samples   |
| Zustand     | 5.0.11  | Gestion de estado    |
| Tailwind CSS| 4.2.0   | Estilos              |
| Vite        | 7.3.1   | Bundler / dev server |

---

## Estructura de archivos

```
src/
├── main.jsx                      # Punto de entrada (monta <App />)
├── App.jsx                       # Componente raiz (StartScreen / ShrutiboxApp + footer)
├── index.css                     # Tailwind CSS + estilos del shrutibox (incluyendo .volume-slider-vertical)
│
├── audio/
│   ├── audioEngine.js            # Proxy mutable: delega al motor de audio activo
│   ├── instruments.js            # Registro de instrumentos disponibles (MKS Drone, MKS Realistic, Acordion Pad FX)
│   ├── metronomeEngine.js        # Motor de audio del metrónomo (Tone.Synth + Transport)
│   ├── AudioManager.js           # Motor de sintesis (PolySynth fatsine) — oculto
│   ├── SampleAudioManager.js     # Motor de samples (Tone.Player con loop) — oculto
│   ├── GrainAudioManager.js      # Motor granular (dual player cycling con crossfade) — MKS Drone
│   ├── RealisticGrainAudioManager.js  # GrainAudioManager + bellows stagger — MKS Realistic
│   ├── AccordionPadAudioManager.js    # Motor granular para pad de acordeon — Acordion Pad FX
│   └── noteMap.js                # 13 notas cromaticas (Sargam + komal/tivra)
│
├── store/
│   ├── useShrutiStore.js         # Store global del instrumento (Zustand)
│   ├── useMetronomeStore.js      # Store del metrónomo (Zustand, BPM/beats/accents persistidos)
│   └── useThemeStore.js          # Store de tema/skin (Zustand, persistido en localStorage)
│
├── skins/
│   ├── index.js                  # Registro central: SKINS[], SKINS_BY_ID, DEFAULT_SKIN_ID
│   ├── skinEngine.js             # Motor: aplica CSS custom properties en :root
│   ├── darkWood.js               # Skin "Madera Oscura" (palisandro/sheesham)
│   └── lightWood.js              # Skin "Madera Clara" (arce/abedul)
│
├── components/
│   ├── Display.jsx               # [DEPRECADO v2] — lógica migrada a NoteGrid.jsx
│   ├── NoteGrid.jsx              # Panel principal unificado (visor + lengüetas + mangos + metrónomo toggle)
│   ├── NoteButton.jsx            # Lengüeta individual (toggle switch)
│   ├── MetronomePanel.jsx        # Panel de controles del metrónomo (beats, BPM, play/stop)
│   ├── Controls.jsx              # Barra compacta: solo selector de instrumento
│   └── SkinSelector.jsx          # Toggle de tema sol/luna
│
├── hooks/
│   └── useKeyboard.js            # Mapeo de teclado fisico (estilo piano, 13 notas)
│
└── config/
    └── featureFlags.js           # Feature flags (teclado, velocidad, instrumentos, version)
```

---

## Arquitectura de 3 capas

La aplicacion sigue una separacion clara en tres capas:

```
┌─────────────────────────────────────────────────────────────────────┐
│                    CAPA DE PRESENTACION (React)                     │
│                                                                     │
│   NoteGrid ◄──────────────────────────── Controls                  │
│   (visor + 13 NoteButton + play + vol)   (selector instrumento)    │
│                      │                         │                    │
└──────────────────────┼─────────────────────────┼────────────────────┘
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
         playNote()     │ playNotes()│         setVolume()
         stopNote()     │ stopAll()  │         setSpeed()
                        ▼            ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                    CAPA DE AUDIO (Tone.js)                                    │
│                    audioEngine.js (Proxy mutable)                             │
│                    instruments.js (Registro: MKS Drone, MKS Realistic,       │
│                                    Acordion Pad FX)                          │
│                                                                              │
│   ┌─────────────────────────────┐ ┌──────────────────────────────────┐       │
│   │   GrainAudioManager         │ │   RealisticGrainAudioManager      │       │
│   │   (MKS Drone — activo)      │ │   (MKS Realistic — activo)        │       │
│   │   /sounds-mks/              │ │   /sounds-mks/                    │       │
│   │   Tone.GrainPlayer          │ │   Tone.GrainPlayer                │       │
│   │   dual player cycling       │ │   dual player cycling             │       │
│   │   crossfade 2.0s            │ │   + bellows stagger (90ms/semi)   │       │
│   └──────────────┬──────────────┘ └──────────────────┬───────────────┘       │
│                  └─────────────────────┬──────────────┘                       │
│                                        │                                      │
│   ┌────────────────────────────────────┴──────────────────────────────┐       │
│   │   AccordionPadAudioManager (Acordion Pad FX — activo)             │       │
│   │   /sounds-accordion-pad/  (pitch-shifted desde WAV unico)         │       │
│   │   Tone.GrainPlayer, dual player cycling, granos 0.8s             │       │
│   └──────────────────────────────┬────────────────────────────────────┘       │
│                                  │                                            │
│                                        ▼                                      │
│                                 Tone.Volume (-6dB)                            │
│                                        ▼                                      │
│                   Tone.Chorus (wet:0.3 si activo / wet:0 si inactivo)         │
│                                        ▼                                      │
│                                     Speaker                                   │
│                                                                              │
│   noteMap.js: 13 notas cromaticas (Sa..Ni + komal/tivra + Sa↑)               │
│                                                                              │
│   Ocultos en instruments.js: AudioManager (Base Sound),                      │
│   SampleAudioManager (Shrutibox Prototype, Shrutibox MKS, MKS Crossfade)     │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 1. Presentacion (React)

Componentes que renderizan la UI y capturan interacciones:

- **NoteGrid** — panel principal unificado (v2). Contiene tres zonas:
  - *Visor*: muestra hasta 3 notas activas (nombre Sargam + ♭/♯) y badge "Sonando" animado.
  - *Mango izquierdo*: dos toggles apilados verticalmente separados por una línea sutil:
    - **NOTAS** (`⏻`) — activa el modo didáctico (etiquetas visibles en lengüetas).
    - **FX** (ícono barras de audio) — activa/desactiva el efecto Chorus. Persiste en `localStorage`.
  - *Área de lengüetas*: 13 NoteButton en disposición cromática alternada sobre fondo de madera.
  - *Mango derecho*: botón Play/Stop circular + slider de volumen vertical (fader físico).
  - Los mangos imitan los mangos de fuelle del instrumento acústico real MKS.
- **NoteButton** — lengüeta toggle con estados visual: cerrada (no seleccionada) y abierta/rotada (seleccionada). En modo didáctico muestra nombre Sargam y equivalente occidental.
- **Controls** — barra compacta con selector de instrumento (MKS Drone / MKS Realistic / Acordion Pad FX). Play/Stop y Volumen fueron movidos a NoteGrid en v2.
- **Display** — [DEPRECADO v2] su lógica fue inlinada en NoteGrid.jsx.

### 2. Estado (Zustand)

Dos stores centralizados con estado reactivo:

**useShrutiStore** — estado del instrumento:

| Estado          | Tipo       | Persistencia       | Descripcion                          |
| --------------- | ---------- | ------------------ | ------------------------------------ |
| `initialized`   | `boolean`  | —                  | Audio context listo                  |
| `instrumentId`  | `string`   | —                  | ID del instrumento activo            |
| `selectedNotes` | `string[]` | —                  | IDs de notas activas                 |
| `playing`       | `boolean`  | —                  | Drone activo                         |
| `volume`        | `number`   | —                  | Volumen maestro (0-1)                |
| `speed`         | `number`   | —                  | Multiplicador de envelope (0.25-3)   |
| `viewMode`      | `string`   | `localStorage`     | Modo visual: `minimalist` / `didactic` |
| `chorusEnabled` | `boolean`  | `localStorage`     | Efecto Chorus activo/inactivo        |

Acciones principales: `init()`, `setInstrument(id)`, `toggleNote(noteId)`, `togglePlay()`, `setVolume()`, `setSpeed()`, `toggleViewMode()`, `toggleChorus()`, `reset()`.

**useThemeStore** — estado del tema visual:

| Estado   | Tipo     | Persistencia   | Descripcion              |
| -------- | -------- | -------------- | ------------------------ |
| `skinId` | `string` | `localStorage` | ID del skin activo       |

Acciones: `setSkin(id)`, `toggleSkin()`. Al importar el modulo se aplica automaticamente el skin guardado (o el default) antes del primer render.

### 3. Audio (Tone.js)

La capa de audio ofrece tres motores activos e intercambiables a traves del proxy mutable `audioEngine.js`:

**MKS Drone** (`GrainAudioManager` — dual player granular con crossfade):
- Motor activo por defecto (ID: `mks-grain`).
- Usa `Tone.GrainPlayer` con la tecnica de **dual player cycling**.
- NO usa el loop built-in de GrainPlayer (que produce clicks). En su lugar, cicla manualmente dos GrainPlayers que se alternan con crossfade programatico de 2s. El audio nunca alcanza el punto de corte.
- Reproduce el audio en "granos" pequenos (0.5s) con overlap (0.15s) para un timbre difuso y envolvente.
- Cada player se conecta a un nodo `Tone.Gain` individual para control de crossfade y fade-out.
- Al iniciar una nota aplica un fade-in suave de 2.5s. Usa los samples originales MKS sin pre-procesamiento.

**MKS Realistic** (`RealisticGrainAudioManager` — dual player granular + bellows stagger):
- Motor activo (ID: `mks-realistic`). Extiende `GrainAudioManager`.
- Simula el comportamiento fisico del fuelle: al activar multiples notas, las graves suenan primero y las agudas entran con delay progresivo (90ms/semitono), replicando como el aire del fuelle tarda mas en hacer vibrar lengüetas mas pequenas.
- Fade-in escalado: las notas agudas tardan ligeramente mas en alcanzar volumen pleno (+4%/semitono).
- Ciclos de sostenimiento con `cycleStart: 5.0s` (zona estable del drone) y crossfade asimetrico de 4.0s.
- Bellows release: al detener el drone, las notas agudas se apagan primero.
- Ver [`docs/realistic-engine.md`](realistic-engine.md) para documentacion detallada.

**Acordion Pad FX** (`AccordionPadAudioManager` — dual player granular optimizado para pad):
- Motor activo (ID: `accordion-pad`).
- Usa la misma tecnica de dual player cycling que MKS Drone, pero con parametros calibrados para un sample tipo pad con modulacion de filtro.
- Los 13 samples se generan por pitch-shifting offline desde un unico WAV fuente: "Accordion pad1.wav" de juskiddink ([Freesound #120931](https://freesound.org/people/juskiddink/sounds/120931/), CC-BY 4.0).
- Granos mas largos (`grainSize: 0.8s` vs 0.5s) y mayor overlap (`0.25` vs `0.15`) para preservar la textura del pad.
- Region de reproduccion: `loopStart: 0.5s`, `loopEnd: 20.0s` (aprovecha el ataque musical del acordeon).
- Crossfade de 3.0s y fade-in inicial de 3.5s para un efecto "swell" mas pronunciado.
- Las instancias se crean en `instruments.js` con `basePath='/sounds-accordion-pad'`.

Todos los motores activos:
- Exponen la misma interfaz publica: `init()`, `playNote()`, `stopNote()`, `playNotes()`, `stopAll()`, `setVolume()`, `setSpeed()`, `setChorusEnabled(bool)`, `dispose()`.
- Se enrutan a un nodo `Tone.Volume` maestro (-6dB) seguido de un `Tone.Chorus` (ver abajo).
- Las instancias se crean en `instruments.js` con su respectivo `basePath`.

**Efecto Chorus** (todos los motores granulares):
- Nodo `Tone.Chorus` insertado entre `Volume` y `Destination`: `Volume → Chorus → Destination`.
- Parametros: `frequency: 0.4 Hz`, `delayTime: 2.5ms`, `depth: 0.15`, `spread: 0`.
- Arranca **desactivado** (`wet: 0`). Se activa via `setChorusEnabled(true)` que sube `wet` a `0.3`.
- Usar `wet: 0 / 0.3` en lugar de re-rutear nodos evita clicks al hacer toggle en vivo.
- El estado persiste en `localStorage` (`shrutibox-chorusEnabled`) y se restaura al iniciar o cambiar instrumento.
- `spread: 0` evita problemas de cancelacion de fase en bocinas mono (telefonos, parlantes portatiles).
- El LFO del chorus arranca en `init()` con `chorus.start()` y se libera en `dispose()`.

**Motores ocultos** (disponibles en codigo, no registrados en la UI):
- `AudioManager` (Base Sound): sintesis PolySynth fatsine, sin samples.
- `SampleAudioManager` con `/sounds/`: Shrutibox Prototype, samples interpolados.
- `SampleAudioManager` con `/sounds-mks/`: Shrutibox MKS, loop directo con click audible.
- `SampleAudioManager` con `/sounds-mks-xfade/`: MKS Crossfade, samples con crossfade baked-in.

**Registro de instrumentos** (`instruments.js`): define la lista de instrumentos activos, cada uno con un `id`, `name` y referencia a su `engine`. Instrumentos inactivos estan comentados en el mismo archivo.

**Proxy mutable** (`audioEngine.js`): envuelve el motor activo y delega todas las llamadas. El store llama `audioEngine.setEngine()` al cambiar de instrumento. Usa `?.` en `setChorusEnabled()` para no fallar con motores que no implementan el efecto (ej: `AudioManager`).

---

---

## Sistema de Skins

La aplicacion soporta multiples skins (temas visuales) mediante CSS custom properties. Cada skin es un objeto autocontenido que define ~34 variables CSS que controlan todos los colores de la interfaz.

### Arquitectura

```
src/skins/
  darkWood.js         Skin "Madera Oscura" (default)
  lightWood.js        Skin "Madera Clara"
  index.js            Registro: SKINS[], SKINS_BY_ID, DEFAULT_SKIN_ID
  skinEngine.js       applySkin(): setea vars en :root + meta theme-color
```

```
   ┌──────────────────┐     ┌───────────────────┐
   │ darkWood.js      │     │ lightWood.js       │
   │ { cssVars: ... } │     │ { cssVars: ... }   │
   └───────┬──────────┘     └────────┬───────────┘
           └──────────┬──────────────┘
                      ▼
             ┌────────────────┐
             │ skinEngine.js  │
             │ applySkin()    │
             └───────┬────────┘
                     ▼
             :root { --sb-* }
                     │
         ┌───────────┴───────────┐
         ▼                       ▼
   @theme (Tailwind v4)     index.css
   --color-sb-* = var()     .shrutibox-body
   → bg-sb-*, text-sb-*    .shrutibox-reed, etc.
```

### Categorias de variables CSS

| Prefijo | Uso | Ejemplo |
|---------|-----|---------|
| `--sb-bg-*` | Fondos de la app | `--sb-bg`, `--sb-bg-deep` |
| `--sb-text-*` | Colores de texto | `--sb-text`, `--sb-text-mid` |
| `--sb-accent-*` | Acentos y CTAs | `--sb-accent`, `--sb-accent-hover` |
| `--sb-body-*` | Panel de madera | `--sb-body-1`, `--sb-body-shine` |
| `--sb-reed-*` | Lenguetas marfil | `--sb-reed-1` a `--sb-reed-5` |
| `--sb-screw-*` | Tornillos metalicos | `--sb-screw-1` a `--sb-screw-4` |
| `--sb-slot-*` | Ranuras | `--sb-slot-start`, `--sb-slot-end` |
| `--sb-chrome/border/muted` | Elementos UI | Bordes, handles, separadores |
| `--sb-play/stop/playing` | Estados de audio | Play, Stop, indicador |

### Agregar un nuevo skin

1. Crear archivo en `src/skins/` (ej: `vintageWood.js`) exportando un objeto con `id`, `name`, `preview`, `meta` y `cssVars`
2. Importar y agregar al array `SKINS` en `src/skins/index.js`

El `SkinSelector` se adapta automaticamente al numero de skins disponibles.

---

## UI Layout v2 — Mobile-First Minimalista

### Motivación

El rediseño v2 unifica los 3 contenedores originales (`Display` + `NoteGrid` + `Controls`) en un único panel principal, priorizando el uso en dispositivos móviles. La referencia visual es el frente del Shrutibox MKS físico (Monoj Kumar Sardar): panel de madera oscura con lengüetas de marfil y mangos de fuelle laterales como únicos elementos visibles.

Imagen de referencia: `assets/shrutibox-frontal-mks-709df372-1768-4a8b-b639-4861a3be2ece.png`

### Layout

```
┌──────────────────────────────────────────────────┐
│  ← Inicio                    ☾/☀  ES  PT  EN    │  header + skin toggle
├──────────────────────────────────────────────────┤
│ ┌────────────────────────────────────────────┐   │
│ │  [visor: Sa · Re♭ · Ma  ●Sonando]          │   │  visor integrado
│ │  ·············································   │  separador
│ │  [NOTAS]  [l][l][l][l][l][l][l][l][l][l]  [▶] │  mangos + lengüetas
│ │   [⏻]                                     [|]  │  toggle NOTAS / volumen
│ │  ────── ·                                      │  separador interno mango-izq
│ │  [ FX ]                                        │  toggle Chorus (ON/OFF)
│ │  ·············································   │  separador dec.
│ └────────────────────────────────────────────┘   │
├──────────────────────────────────────────────────┤
│  Instrumento: [MKS Drone] [MKS Realistic] [Pad FX]│  barra compacta
├──────────────────────────────────────────────────┤
│            créditos / footer                     │
└──────────────────────────────────────────────────┘
```

### Decisiones de diseño

| Decisión | Justificación |
|---|---|
| Visor integrado sin borde propio | Reduce el número de contenedores visibles; el visor pertenece al instrumento |
| Mangos laterales | Inspirados en los mangos de fuelle del MKS físico; agrupan controles sin romper la estética |
| Toggle NOTAS con ícono power | Semántica ON/OFF clara y universal; más compacto que el slider físico anterior |
| Volumen vertical (`writing-mode: vertical-lr`) | Imita un fader físico; conserva espacio horizontal crítico en mobile |
| Play/Stop en mango derecho | Co-ubicación lógica con el volumen; acceso con pulgar en mobile |
| Controls como barra compacta | El selector de instrumento es secundario; queda disponible sin ocupar espacio del panel |

### Clases CSS nuevas

| Clase | Archivo | Descripción |
|---|---|---|
| `.volume-slider-vertical` | `index.css` | `writing-mode: vertical-lr; direction: rtl` — slider de volumen vertical, min abajo / max arriba |

### Claves i18n nuevas

| Clave | ES | PT | EN |
|---|---|---|---|
| `viewMode.title` | Notas | Notas | Notes |
| `chorus.title` | FX | FX | FX |
| `chorus.label` | Activar efecto de coro | Ativar efeito chorus | Enable chorus effect |
| `theme.toggle` | Cambiar tema | Alternar tema | Toggle theme |
| `theme.dark` | Tema oscuro | Tema escuro | Dark theme |
| `theme.light` | Tema claro | Tema claro | Light theme |

---

## Mapa de notas (sistema Sargam cromatico)

```
┌──┬───┬──┬───┬──┬──┬───┬──┬───┬───┬───┬──┬──┐
│Sa│Re♭│Re│Ga♭│Ga│Ma│Ma♯│Pa│Dha♭│Dha│Ni♭│Ni│Sa│
│C3│Db3│D3│Eb3│E3│F3│F#3│G3│Ab3 │A3 │Bb3│B3│C4│
└──┴───┴──┴───┴──┴──┴───┴──┴───┴───┴───┴──┴──┘
```

13 notas cromaticas: 7 shuddh (naturales) + 4 komal (bemol) + 1 tivra (sostenido) + Sa agudo.

---

## Mapeo de teclado (estilo piano)

El hook `useKeyboard` conecta el teclado fisico con la app:

**Fila inferior (shuddh):**

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

**Fila superior (komal/tivra):**

| Tecla | Nota       |
| ----- | ---------- |
| W     | Re komal   |
| E     | Ga komal   |
| T     | Ma tivra   |
| Y     | Dha komal  |
| U     | Ni komal   |

| Tecla   | Accion    |
| ------- | --------- |
| Espacio | Play/Stop |

---

## Feature flags

`config/featureFlags.js` permite activar/desactivar funcionalidades sin modificar los componentes:

| Flag                     | Default | Descripcion                                                        |
| ------------------------ | ------- | ------------------------------------------------------------------ |
| `ENABLE_KEYBOARD`        | on      | Soporte de teclado fisico                                          |
| `ENABLE_SPEED_CONTROL`   | off     | Control de velocidad del envelope (desactivado por defecto)        |
| `ENABLE_MOBILE_LAYOUT`   | on      | Layout optimizado para movil                                       |
| `ENABLE_INSTRUMENT_SELECTOR` | on  | Selector de instrumento en la UI                                   |
| `SHOW_VERSION`           | off     | Muestra la version del release en el footer (placeholder hasta v1.0.0) |

---

## Patrones clave

- **Toggle-then-play**: las notas se seleccionan antes de reproducir; el drone suena con todas las notas seleccionadas simultaneamente.
- **Modificacion en tiempo real**: se pueden agregar o quitar notas durante la reproduccion sin interrumpir el drone.
- **Instrumentos intercambiables**: `audioEngine.js` actua como proxy mutable, delegando al motor del instrumento seleccionado por el usuario.
- **Instancias de audio**: `AudioManager` exporta un singleton. `SampleAudioManager`, `GrainAudioManager` y `AccordionPadAudioManager` exportan clases para permitir multiples instancias con distintos `basePath` y opciones. Las instancias se crean en `instruments.js`. El proxy `audioEngine` es singleton.
- **Inicializacion por interaccion**: el navegador requiere un gesto del usuario para iniciar el `AudioContext`; el `StartScreen` cumple este requisito.
- **Zustand reactivo**: los componentes se suscriben solo a las porciones del store que necesitan, evitando re-renders innecesarios.

---

---

## Metrónomo

El metrónomo es una funcionalidad secundaria que sigue la misma arquitectura de 3 capas del proyecto, con módulos independientes que no interfieren con el drone del shrutibox.

Ver [docs/metronome.md](metronome.md) para documentación completa.

### Componentes del metrónomo

| Archivo | Rol |
|---------|-----|
| `src/audio/metronomeEngine.js` | Motor de audio: `Tone.Synth` + `Tone.Transport`, dos tonos (acento/normal), scheduling preciso, callback `onBeat()` |
| `src/store/useMetronomeStore.js` | Store Zustand: `enabled`, `playing`, `bpm`, `beats`, `accents`, `currentBeat`; BPM/beats/accents persistidos en `localStorage` |
| `src/components/MetronomePanel.jsx` | Panel expandible: casilleros de beats con toggle de acento, control BPM con repetición al mantener presionado, botón play/stop |
| `src/components/NoteGrid.jsx` | Integra el ícono de toggle del metrónomo en el visor de notas y el render condicional de `MetronomePanel` |

### Flujo

```
NoteGrid (ícono toggle)
    ↓ toggleEnabled()
useMetronomeStore
    ↓ start(bpm, beats, accents)
metronomeEngine
    ↓ Tone.Transport.scheduleRepeat('4n')
Tone.Synth → Tone.Volume → Speaker
    ↓ onBeat(index) → Tone.getDraw()
useMetronomeStore.currentBeat → MetronomePanel (feedback visual)
```

### Notas de implementación

- El `Tone.Transport` del metrónomo no interfiere con los motores de drone porque estos usan scheduling manual propio (dual player cycling), no Transport.
- El canal de audio del metrónomo (`Tone.Volume` propio) es independiente del nodo maestro del drone, permitiendo reproducción simultánea.
- `Tone.getDraw().schedule()` sincroniza la actualización visual del beat activo con el frame de render de React, evitando desincronía entre audio y UI.

---

## Mejoras de audio

Ver [docs/audio-improvements.md](audio-improvements.md) para el historial completo:

- Solucion al click en puntos de loop (dual player cycling, crossfade baked-in).
- Efecto Chorus opcional con toggle ON/OFF en la UI, optimizado para bocinas de telefono, escritorio y parlantes portatiles.

---

## Autor

Desarrollado por [Lucas Paiva](https://github.com/lucaspaiva-dev).

Basado en el instrumento fisico Monoj Kumar Sardar 440Hz.
