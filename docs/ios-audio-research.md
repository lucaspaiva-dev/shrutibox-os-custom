# Shruti box digital — Problema de audio en iOS / iPadOS (WebKit)

> **Audiencia:** agentes de investigación en línea (p. ej. Perplexity, chat con búsqueda) que **solo** leerán este documento, **sin** acceso al código fuente del proyecto.  
> **Contenido:** contexto de dominio, stack, arquitectura lógica del motor de audio, código de referencia **embebido**, problemas conocidos en WebKit, impacto en calidad, intentos previos descartados, preguntas abiertas para buscar en la web, y líneas de mejora.  
> **Restricción:** no se citan rutas de carpetas ni nombres de archivos del repositorio; los fragmentos de código son autocontenidos.

---

## 0. Instrucciones para el agente de investigación

1. **Leer el documento completo** antes de lanzar búsquedas; el problema tiene **dos capas** (desbloqueo del contexto vs motor de reproducción).
2. **Objetivo de la investigación:** proponer soluciones contrastadas (con fuentes) para recuperar **calidad** en iOS Safari sin reintroducir **silencio** o inestabilidad.
3. **Formato de salida sugerido:**
  - Resumen ejecutivo (5–10 líneas)  
  - Hallazgos por pregunta (§7) con **enlaces**  
  - Matriz riesgo / esfuerzo / impacto en calidad  
  - Recomendación priorizada y experimentos mínimos reproducibles en navegador
4. **No asumir** acceso a repositorio privado; cualquier afirmación sobre “el código actual” debe basarse **solo** en lo que aparece en este documento.

---

## 1. Contexto del dominio

Un **shruti box** (aquí, réplica de un modelo **Monoj Kumar Sardar, 440 Hz**) es un instrumento de **drone**: el músico selecciona notas dentro de una escala cromática del sistema **Sargam** y mantiene un flujo de aire (fuelle) que hace vibrar **lengüetas metálicas** en cámaras compartidas. El resultado no es un “pad sintético” genérico: importan **ataque y relajación** del aire, **entrada escalonada** de graves antes que agudos, **microvariación** del timbre y **loops** que no suenen “recortados”.

La aplicación es una **SPA** construida con **React 19** y **Vite 7**, pensada para ejecutarse en el navegador; en iPhone/iPad el motor es **Safari / WebKit** (incluido Chrome/Firefox en iOS, que deben usar WebKit).

---

## 2. Stack tecnológico relevante


| Componente              | Versión de referencia | Uso                                 |
| ----------------------- | --------------------- | ----------------------------------- |
| React                   | 19.2.x                | Interfaz                            |
| Vite                    | 7.3.x                 | Empaquetado                         |
| Tone.js (`tone` en npm) | **15.1.22**           | Abstracción sobre **Web Audio API** |
| Zustand                 | 5.0.x                 | Estado de UI / instrumento          |


La capa de audio usa casi exclusivamente **Tone.js**, que a su vez manipula nodos estándar (`AudioContext`, `GainNode`, `AudioBufferSourceNode`, etc.).

### 2.1 Dos primitivas Tone.js centrales en este producto


| Primitiva              | Rol en el producto                                                                                                                                                                                        |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `**Tone.GrainPlayer`** | Reproduce fragmentos (“granos”) del buffer con solapamiento; permite textura orgánica y técnicas de **crossfade entre instancias** controladas por temporizadores en JS.                                  |
| `**Tone.Player`**      | Reproduce el buffer con `**loop` nativo** del nodo fuente; simple y robusto, pero los **fadeIn/fadeOut** integrados suelen aplicarse al **inicio/fin de la nota**, no a **cada vuelta** del loop interno. |


### 2.2 Qué aporta la síntesis granular aquí

En lugar de repetir un archivo largo con un único salto de loop (propenso a **clicks** si los extremos no coinciden en fase/amplitud), el enfoque granular + **dos players alternados** permite **nunca** llegar al punto de discontinuidad: un segundo player entra con fade-in mientras el primero hace fade-out (**dual-player cycling**). Eso exige **scheduling fiable** en el tiempo.

---

## 3. Arquitectura lógica del motor de audio (código embebido)

### 3.1 Patrón general

- Un **proxy singleton** expone: `setEngine`, `init`, `playNote`, `stopNote`, `playNotes`, `stopAll`, `setVolume`, `setSpeed`, `setChorusEnabled`, `dispose`.
- Un **registro de instrumentos** elige el motor según la plataforma.
- La UI y el estado **no** deben crear nodos de audio directamente; llaman al proxy tras un **gesto de usuario** válido.

### 3.2 Detección de iOS / iPadOS (incluye iPad con UA de “escritorio”)

```javascript
export default function isIOS() {
  if (typeof navigator === 'undefined') return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
}
```

### 3.3 Registro dual de instrumentos (mismo ID de producto, motor distinto)

```javascript
import SampleAudioManager from './SampleAudioManager';
import RealisticGrainAudioManager from './RealisticGrainAudioManager';
import AccordionPadAudioManager from './AccordionPadAudioManager';
import isIOS from './isIOS';

const mksRealisticManager = new RealisticGrainAudioManager('/sounds-mks');
const accordionPadManager = new AccordionPadAudioManager('/sounds-accordion-pad');

const mksRealisticSampleManager = new SampleAudioManager('/sounds-mks');
const accordionPadSampleManager = new SampleAudioManager('/sounds-accordion-pad');

const runningOnIOS = isIOS();

const INSTRUMENTS_DESKTOP = [
  { id: 'mks-realistic', name: 'MKS Realistic', engine: mksRealisticManager },
  { id: 'accordion-pad', name: 'Acordion Pad FX', engine: accordionPadManager },
];

const INSTRUMENTS_IOS = [
  { id: 'mks-realistic', name: 'MKS Realistic', engine: mksRealisticSampleManager },
  { id: 'accordion-pad', name: 'Acordion Pad FX', engine: accordionPadSampleManager },
];

export const INSTRUMENTS = runningOnIOS ? INSTRUMENTS_IOS : INSTRUMENTS_DESKTOP;
export const DEFAULT_INSTRUMENT_ID = 'mks-realistic';
export const INSTRUMENTS_BY_ID = Object.fromEntries(
  INSTRUMENTS.map((i) => [i.id, i])
);
```

**Lectura clave:** en iOS se sustituye el motor granular (`RealisticGrainAudioManager` / `AccordionPadAudioManager`) por `**SampleAudioManager`** apuntando a los **mismos MP3** servidos como estáticos bajo prefijos URL como `/sounds-mks` y `/sounds-accordion-pad`.

### 3.4 Motor granular “realista” — ciclo dual con crossfade escalonado

Parámetros por defecto relevantes (simplificado del constructor):

```javascript
const GRAIN_DEFAULTS = {
  grainSize: 0.5,
  overlap: 0.15,
  loopStart: 1.0,
  loopEnd: 23.0,
  cycleStart: 5.0,
  crossfadeDuration: 4.0,
  fadeOutDelay: 3.0,
  fadeOutDuration: 2.0,
  initialFadeIn: 2.5,
  fadeIn: 0.08,
  fadeOut: 0.08,
};
```

Creación de pareja player + ganancia por nota:

```javascript
_createPlayerPair(buffer) {
  const gain = new Tone.Gain(0).connect(this.volume);
  const player = new Tone.GrainPlayer({
    url: buffer,
    loop: false,
    grainSize: this.grainConfig.grainSize,
    overlap: this.grainConfig.overlap,
  }).connect(gain);
  return { player, gain };
}
```

**Ciclo** (nuevo grano desde `cycleStart`, subida de ganancia, retardo antes de bajar el anterior — evita “hueco” de volumen):

```javascript
_cyclePlayer(noteId) {
  const entry = this.activePlayers.get(noteId);
  if (!entry) return;

  const { player: oldPlayer, gain: oldGain } = entry;
  const buffer = this.buffers.get(noteId);
  const loopEnd = this.grainConfig.loopEnd != null
    ? Math.min(this.grainConfig.loopEnd, buffer.duration - 0.1)
    : buffer.duration;
  const fadeIn = this.grainConfig.crossfadeDuration;
  const fadeOutDelay = this.grainConfig.fadeOutDelay;
  const fadeOutDur = this.grainConfig.fadeOutDuration;

  const { player: newPlayer, gain: newGain } = this._createPlayerPair(buffer);

  newPlayer.start(undefined, this.grainConfig.cycleStart);
  newGain.gain.rampTo(1, fadeIn);

  setTimeout(() => {
    oldGain.gain.rampTo(0, fadeOutDur);
    this._disposeAfter(oldPlayer, oldGain, fadeOutDur + 0.2);
  }, fadeOutDelay * 1000);

  const playDuration = loopEnd - this.grainConfig.cycleStart;
  const cycleTimer = setTimeout(
    () => this._cyclePlayer(noteId),
    (playDuration - fadeIn) * 1000
  );

  this.activePlayers.set(noteId, { player: newPlayer, gain: newGain, cycleTimer });
}
```

**Bellows stagger** (onset físico aproximado: grave primero, agudo después) — orden por índice cromático y `setTimeout` por semitono de separación:

```javascript
playNotes(noteIds) {
  if (!noteIds.length) return;

  this._cancelAllPendingStops();

  const sorted = [...noteIds].sort((a, b) => {
    const idxA = CHROMATIC_INDEX.get(a) ?? 0;
    const idxB = CHROMATIC_INDEX.get(b) ?? 0;
    return idxA - idxB;
  });

  const lowestIdx = CHROMATIC_INDEX.get(sorted[0]) ?? 0;

  for (const noteId of sorted) {
    const semitoneDistance = (CHROMATIC_INDEX.get(noteId) ?? 0) - lowestIdx;
    const delayMs = semitoneDistance * this.bellowsConfig.msPerSemitone;

    if (delayMs === 0) {
      this.playNote(noteId);
    } else {
      const timerId = setTimeout(() => {
        this.pendingStarts.delete(noteId);
        this.playNote(noteId);
      }, delayMs);
      this.pendingStarts.set(noteId, timerId);
    }
  }
}
```

**Cadena de señal desktop (motor realista):**  
`GrainPlayer → Gain (por nota) → Volume → Chorus → destino`  
El chorus usa parámetros conservadores (`spread: 0` para mono); se activa con `setChorusEnabled` mutando `wet`.

### 3.5 Motor de fallback iOS — `Tone.Player` con loop integrado

Valores por defecto del loop en el manager de samples:

```javascript
const LOOP_DEFAULTS = {
  loopStart: 1.0,
  loopEnd: 5.0,
  fadeIn: 0.08,
  fadeOut: 0.08,
};
```

Arranque de nota (creación de player por nota, loop true):

```javascript
playNote(noteId) {
  if (!this.initialized) return;

  const buffer = this.buffers.get(noteId);
  if (!buffer) return;

  if (this.activePlayers.has(noteId)) {
    this._stopPlayer(noteId);
  }

  const loopEnd = this.loopConfig.loopEnd != null
    ? Math.min(this.loopConfig.loopEnd, buffer.duration - 0.1)
    : buffer.duration;

  const player = new Tone.Player({
    url: buffer,
    loop: true,
    loopStart: this.loopConfig.loopStart,
    loopEnd,
    fadeIn: this.fadeInTime,
    fadeOut: this.fadeOutTime,
  }).connect(this.volume);

  const startOffset = this.loopConfig.loopStart || 0.01;
  player.start(undefined, startOffset);
  this.activePlayers.set(noteId, player);
}
```

**Observación para investigación:** con `loopStart = 1.0` y `loopEnd = 5.0`, la ventana de loop es **~4 s**; cualquier discontinuidad en el MP3 se **repite con alta frecuencia**, generando **clicks** audibles. Además, `**setChorusEnabled` no existe** en esta clase: el proxy usa llamadas opcionales (`?.`), por lo que el interruptor de FX en UI **no modifica el audio** en iOS.

---

## 4. Problemas en iOS WebKit (autocontenidos)

### 4.A — `AudioContext` suspendido y política de autoplay

- Los contextos creados antes del gesto del usuario nacen en `suspended`.
- En WebKit, cadenas **async** largas entre el `click` y el `resume()` pueden invalidar la “user activation”.
- Tras **bloqueo de pantalla** o **background**, iOS suele volver a suspender el contexto.

**Implementación de desbloqueo usada en el producto (listing completo):**

```javascript
import * as Tone from 'tone';

export default async function unlockAudio() {
  await Tone.start();

  const rawCtx = Tone.getContext().rawContext;

  try {
    const silentBuffer = rawCtx.createBuffer(1, 1, rawCtx.sampleRate);
    const src = rawCtx.createBufferSource();
    src.buffer = silentBuffer;
    src.connect(rawCtx.destination);
    src.start(0);
  } catch {
    // continuar
  }

  if (rawCtx.state !== 'running') {
    await rawCtx.resume();
  }

  if (rawCtx.state !== 'running') {
    throw new Error(
      `AudioContext no pudo desbloquearse (estado: ${rawCtx.state}). ` +
      'Asegúrate de tocar el botón directamente.'
    );
  }
}
```

**Silent buffer trick:** un buffer de **un sample** en silencio reproducido en el **contexto nativo** fuerza el registro de “audio real” en WebKit y suele acompañar mejor a `resume()` que este solo.

**Enlace WebKit (gestos / `resume`):**  
[https://bugs.webkit.org/show_bug.cgi?id=248265](https://bugs.webkit.org/show_bug.cgi?id=248265)

### 4.B — `Tone.GrainPlayer` silencioso o no fiable pese a `running`

**Hipótesis operativa del producto:** `GrainPlayer` depende de un **reloj / scheduling interno** (p. ej. basado en temporizadores y callbacks) para crear y superponer granos. En iOS WebKit ese scheduling **no dispara de forma fiable**, resultando en **silencio** sin error de consola claro. `Tone.Player`, al programar directamente `**AudioBufferSourceNode`**, **sí** produce audio.

**Issues Tone.js (enlaces directos):**

- [https://github.com/Tonejs/Tone.js/issues/572](https://github.com/Tonejs/Tone.js/issues/572)  
- [https://github.com/Tonejs/Tone.js/issues/1051](https://github.com/Tonejs/Tone.js/issues/1051)  
- [https://github.com/Tonejs/Tone.js/issues/1225](https://github.com/Tonejs/Tone.js/issues/1225) (LFO / Chorus distinto en WebKit; afecta a motores con chorus)

**Mitigación en store (reanudación en play):** antes de `playNotes`, se comprueba `rawContext.state` y se llama `resume()` si no está `running`.

---

## 5. Impacto en calidad percibida (qué se pierde al cambiar de motor)


| Dimensión                    | Escritorio / Android (motor granular)                                           | iOS (motor `Tone.Player`)                                                          |
| ---------------------------- | ------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Textura                      | Grano 0.5 s, overlap 0.15 — timbre “vivo”                                       | Loop de audio “plano”                                                              |
| Cruces de loop               | Dual-player + crossfade largo (p. ej. 4 s) + retardo antes de bajar el anterior | Loop nativo; **clicks** si la ventana es corta y el material no está phase-aligned |
| Onset al pulsar varias notas | Retardos por semitono (**bellows stagger**)                                     | Arranque simultáneo (más “sintético”)                                              |
| Apagado                      | **Bellows release** (agudo→grave)                                               | Parada más uniforme / corta                                                        |
| FX “chorus”                  | Implementado vía `setChorusEnabled`                                             | **Sin implementación** → toggle inerte                                             |
| CPU                          | Mayor (múltiples nodos y temporizadores)                                        | Menor, a cambio de fidelidad                                                       |


**Síntesis para investigación:** el problema no es solo “MP3 vs WAV”, sino **pérdida de algoritmos de alto nivel** (crossfade asimétrico, stagger, chorus) al sustituir el motor.

---

## 6. Intentos y decisiones ya documentadas (evitar repropuestas ciegas)


| Tema                                                         | Resultado                                                                                  |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| Varios `Tone.start()` concurrentes en `init()` de cada motor | **Condiciones de carrera** en iOS; se centralizó el desbloqueo.                            |
| `loop: true` directo en `GrainPlayer`                        | **Clicks** en el punto de loop; se migró a **ciclo manual** sin loop built-in del grano.   |
| `MediaElementAudioSourceNode` como base                      | **Regresiones** reportadas en iOS 17.x temprano para ciertos nodos de elemento multimedia. |
| Polyfill del reloj interno de Tone                           | Considerado **invasivo / frágil**.                                                         |


---

## 7. Preguntas abiertas para buscar en la web (checklist de investigación)

1. **¿`Tone.GrainPlayer` funciona correctamente en iOS 17 / 18 con Tone.js 15.x?** ¿Hay reportes recientes que cierren o matizen el issue **#572**?
2. **¿Existen patrones recomendados en 2024–2026** para granular synthesis **solo con Web Audio API** (sin Tone) que funcionen en Safari iOS?
3. **¿`AudioWorklet`** es una solución estable para el **scheduling** de granos o crossfades en iOS, frente a `setTimeout` en el hilo principal? ¿Limitaciones específicas de Safari?
4. **¿Qué librerías alternativas** (o capas sobre `AudioWorklet`) ofrecen **grain playback** con mejor soporte WebKit que Tone.js?
5. **Comparativa de soporte `AudioWorklet` Safari iOS vs Chrome Android** — ¿diferencias que expliquen clicks o jitter?
6. **Técnicas de loop seamless** para `AudioBufferSourceNode`: doble buffer, **convolution crossfade**, “jump scheduling” en tiempo de audio, **offline preprocessing** (archivos con crossfade ya incrustado). ¿Cuáles son más robustas en iOS?
7. **Interruptor de silencio del iPhone** — ¿afecta a Web Audio API en iOS reciente igual que a `<audio>` HTML? (Contrastar fuentes oficiales y reportes empíricos.)
8. **¿Cómo replicar bellows stagger** usando solo `Tone.Player` o nodos nativos (múltiples fuentes con `start(when, offset)`)?

---

## 8. Líneas de mejora (sin acoplar a un repo)

### A — Bajo esfuerzo / bajo riesgo

- Añadir **chorus** al motor de `Tone.Player` y exponer el mismo contrato `setChorusEnabled` que en el motor granular (ajuste de `wet`, sin reconectar nodos en caliente).
- **Alargar** `loopEnd` o usar **toda la duración** del buffer para reducir la frecuencia de discontinuidades.
- Portar **bellows stagger** al motor de player con temporizadores y orden cromático (como en el listing §3.4).

### B — Mejora fuerte de loop sin volver a granularidad

- Usar **materiales preprocessados** donde el crossfade esté **incrustado** en el archivo (loop de archivo corto seamless) y configurar el player con `loopStart: 0`, `loopEnd: null` (toda la duración). En este producto ya existen recursos bajo un prefijo tipo `/sounds-mks-xfade` generados por script de audio offline; la integración sería **cambiar el prefijo de carga** en la variante iOS del registro de instrumentos.

### C — Investigación profunda

- Re-evaluar `GrainPlayer` con **feature flag** y prueba en dispositivos físicos.  
- Prototipo **AudioWorklet** que genere ventanas de reproducción y mezcla (crossfade) en el hilo de audio.  
- Análisis **zero-crossing** / alineación de fase para elegir `loopStart` / `loopEnd` automáticamente.

### D — Desaconsejado

- Reescritura total del scheduler interno de Tone.js.  
- Pipeline basado principalmente en elementos `<audio>` HTML para el drone.

---

## 9. Metadatos mínimos para citar este documento

- **Proyecto:** réplica web de shruti box MKS 440 Hz (“Shrutibox OS Custom”).  
- **Stack:** React 19, Vite 7, Tone.js 15.1.22, Zustand 5.  
- **Problema:** compatibilidad iOS vía fallback `GrainPlayer` → `Player`, con **regresión de calidad** y posibles **clicks de loop**.  
- **Documentación complementaria:** si el lector tiene acceso al repositorio del proyecto, suele existir además una spec interna con rutas de código y guía de cambios; este documento **no** la sustituye.

---

*Fin del documento autocontenido para investigación externa.*