# Metrónomo — Shrutibox Digital

Funcionalidad secundaria del Shrutibox Digital que genera pulsos de tiempo constantes para ayudar a los músicos a mantener el tempo durante la práctica.

---

## ¿Qué es un metrónomo?

Un metrónomo es un aparato que produce un golpe constante para ayudar a los músicos a tocar en el tiempo correcto. El tempo se mide en BPM (beats por minuto). Una marcación de 60 BPM equivale a un golpe por segundo; 120 BPM equivale a dos golpes por segundo.

---

## Cómo usarlo

1. Abrí la app y tocá **Iniciar** para activar el audio.
2. En el **visor de notas** (parte superior del panel), tocá el **ícono de metrónomo** en la esquina derecha para mostrar el panel de controles.
3. Configurá los beats, los acentos y el BPM según tu necesidad.
4. Tocá el botón **Play** para iniciar el metrónomo.
5. El metrónomo puede sonar **simultáneamente** con el drone del shrutibox.

---

## Controles

### Panel del metrónomo

```
┌──────────────────────────────────────────────────┐
│                                                  │
│   [-]  [●] [○] [○] [○]  [+]       [▶ Play]      │
│                                                  │
│          ♩ = [-]  60  [+]                        │
│                                                  │
└──────────────────────────────────────────────────┘
```

| Control | Función |
|---------|---------|
| Ícono metrónomo (visor) | Muestra u oculta el panel de controles |
| `[-]` / `[+]` (izquierda) | Reducir / aumentar cantidad de beats (1-8) |
| Casilleros de beats | Tocar un casillero alterna si ese beat es **fuerte (acento)** o normal |
| `[▶]` / `[■]` | Iniciar / detener el metrónomo |
| `[-]` / `[+]` (BPM) | Reducir / aumentar BPM (20-240); mantener presionado para cambio rápido |
| Valor numérico central | Muestra el BPM actual |

### Casilleros de beats

Cada casillero representa un pulso dentro del compás:
- **Casillero relleno** (con punto central): beat **acentuado** — suena con tono agudo y más fuerte.
- **Casillero vacío**: beat normal — suena con tono más suave.
- Durante la reproducción, el casillero del beat actual se resalta visualmente.

**Ejemplo**: con 4 beats y el primero marcado como acento (configuración por defecto), se obtiene un compás de 4/4 clásico donde el primer golpe es el fuerte.

**Ejemplo**: con 8 beats y los beats 1, 4 y 6 marcados como acento, se pueden crear patrones rítmicos complejos.

---

## Valores y límites

| Parámetro | Mínimo | Máximo | Default |
|-----------|--------|--------|---------|
| Beats por compás | 1 | 8 | 4 |
| BPM | 20 | 240 | 60 |
| Beats acentuados | 0 | todos | beat 1 (índice 0) |

---

## Persistencia

Los siguientes parámetros se guardan automáticamente en `localStorage` y se restauran al abrir la app:

| Parámetro | Clave localStorage |
|-----------|-------------------|
| BPM | `shrutibox-metronome-bpm` |
| Cantidad de beats | `shrutibox-metronome-beats` |
| Beats acentuados | `shrutibox-metronome-accents` |

---

## Arquitectura técnica

### Capas

El metrónomo sigue la misma arquitectura de 3 capas del proyecto:

```
UI (MetronomePanel + NoteGrid)
        ↕ toggleEnabled / togglePlaying / setBpm / setBeats / toggleAccent
Estado (useMetronomeStore — Zustand)
        ↕ start / stop / setBpm / setPattern / onBeat
Audio (metronomeEngine — Tone.js)
        ↕
Tone.Transport → Tone.Synth → Tone.Volume → Speaker
```

### Motor de audio (`src/audio/metronomeEngine.js`)

- **Scheduling**: `Tone.Transport.scheduleRepeat()` con quantización `'4n'` (negra) para precisión de tiempo a nivel de sample.
- **Dos tonos diferenciados**:
  - Acento: `C6` (1047 Hz), `Tone.Synth`, volumen +2 dBFS
  - Normal: `G4` (392 Hz), `Tone.Synth`, volumen -3 dBFS
- **Envelope**: attack 1ms, decay 50ms, sustain 0, release 50ms — bip limpio y corto.
- **Feedback visual**: `Tone.getDraw().schedule()` sincroniza la actualización del beat activo con el frame de render, evitando inconsistencias visuales.
- **Canal independiente**: `Tone.Volume` propio separado del drone, permitiendo reproducción simultánea sin interferencias de volumen.

### Store (`src/store/useMetronomeStore.js`)

Store Zustand independiente de `useShrutiStore`. No comparte estado con el drone.

| Estado | Tipo | Default | Persistencia |
|--------|------|---------|-------------|
| `enabled` | `boolean` | `false` | — |
| `playing` | `boolean` | `false` | — |
| `bpm` | `number` | `60` | `localStorage` |
| `beats` | `number` | `4` | `localStorage` |
| `accents` | `number[]` | `[0]` | `localStorage` |
| `currentBeat` | `number` | `-1` | — |

### Componentes UI

- **`NoteGrid.jsx`**: agrega el botón de toggle del metrónomo (ícono SVG de pirámide con péndulo) en la esquina derecha del visor de notas. Renderiza condicionalmente `MetronomePanel` con animación de slide (`max-height` transition).
- **`MetronomePanel.jsx`**: panel compacto con casilleros de beats interactivos, controles de BPM con repetición al mantener presionado, y botón play/stop.

---

## Claves i18n

| Clave | EN | ES | PT |
|-------|----|----|-----|
| `metronome.label` | Metronome | Metrónomo | Metrônomo |
| `metronome.title` | Metronome | Metrónomo | Metrônomo |
| `metronome.beats` | Beats | Tiempos | Tempos |
| `metronome.bpm` | BPM | BPM | BPM |
| `metronome.play` | Start metronome | Iniciar metrónomo | Iniciar metrônomo |
| `metronome.stop` | Stop metronome | Detener metrónomo | Parar metrônomo |
| `metronome.accent` | Accent beat | Tiempo fuerte | Tempo forte |
