# Mejoras de audio — Clicks en loops de samples

Este documento describe el problema de clicks/pops en la reproduccion de samples grabados con loop, las soluciones implementadas, y opciones alternativas que podrian retomarse a futuro.

---

## El problema

Los samples grabados del shrutibox MKS (~25 segundos cada uno) producen clicks audibles al reproducirse en loop continuo. El click ocurre en el **punto de loop**: cuando `Tone.Player` salta de `loopEnd` a `loopStart`, la forma de onda en ambos puntos no coincide, generando una discontinuidad audible.

Las propiedades `fadeIn` y `fadeOut` de `Tone.Player` solo aplican al inicio y fin de la reproduccion general (`.start()` / `.stop()`), **no** en los puntos de loop. Por lo tanto, cada salto de loop es un corte abrupto.

Este problema no afecta al instrumento sintetizado (Base Sound) porque genera la onda en tiempo real con osciladores continuos, ni al Shrutibox Prototype cuyos samples interpolados tienen mejor coincidencia en los puntos de corte.

---

## Soluciones implementadas

### MKS Crossfade (pre-procesamiento de samples)

**Enfoque**: eliminar la discontinuidad directamente en los archivos de audio.

El script `scripts/generate-mks-xfade-samples.sh` procesa cada grabacion WAV:

1. Extrae la region estable (1.0s a 23.0s, descartando transientes de inicio/fin).
2. Superpone los ultimos 2 segundos (con fade-out) sobre los primeros 2 segundos (con fade-in).
3. Recorta el resultado a 20 segundos, de modo que el final del archivo conecta suavemente con su inicio.

El motor usa `SampleAudioManager` con `loopStart: 0` y `loopEnd: null` (duracion completa del buffer), ya que el crossfade esta "baked-in" en el archivo.

**Ventajas**: sonido fiel a la grabacion original, sin artefactos de procesamiento en tiempo real.

**Desventajas**: requiere re-generar los samples si se cambian los parametros de crossfade.

**Refinamiento aplicado**: la primera version producia un click al iniciar la reproduccion por primera vez. Se corrigio con dos ajustes:
1. El script ahora aplica un fade-in de 50ms al inicio del body (`afade=t=in:d=0.05`) para que el archivo arranque desde silencio.
2. `SampleAudioManager.playNote()` inicia la reproduccion con un offset de 10ms (`player.start(undefined, 0.01)`) cuando `loopStart` es 0, para saltar el padding que el decoder MP3 introduce al inicio del archivo.

### MKS Drone (dual player granular con crossfade)

**Enfoque**: reproduccion granular con ciclo manual de dos players alternados via crossfade programatico.

El motor `GrainAudioManager` usa `Tone.GrainPlayer` con granos de 0.5 segundos y overlap de 0.15 segundos, pero **sin el loop built-in** de GrainPlayer. En su lugar, implementa la tecnica de **dual player cycling**:

```
Player A:  [====1s========~21s]───fade out───(dispose)
                               │
Player B:            [====1s========~21s]───fade out───(dispose)
                     │                   │
                  arranca con          Player C: [====1s====...
                  fade-in              arranca con fade-in
```

1. Un GrainPlayer se crea con `loop: false` y reproduce desde `loopStart` (1s)
2. Un timer se programa para `playDuration - crossfadeDuration` segundos (20s por defecto)
3. Antes de que el player alcance `loopEnd`, se crea un segundo GrainPlayer desde `loopStart`
4. Durante `crossfadeDuration` (2s) el viejo hace fade-out y el nuevo fade-in, usando nodos `Tone.Gain` individuales
5. El player viejo se destruye tras completar el crossfade
6. Se programa el siguiente ciclo con el nuevo player

El audio **nunca alcanza el punto de loop problematico**, eliminando completamente el click.

Al iniciar una nota, se aplica un fade-in suave de 2.5 segundos (`initialFadeIn`) para una entrada gradual tipo drone. Los ciclos posteriores usan su propio crossfade sin este fade-in adicional.

Usa los mismos samples originales MKS sin pre-procesamiento. Esta tecnica es la base de los dos instrumentos activos: **MKS Drone** (`GrainAudioManager`) y **MKS Realistic** (`RealisticGrainAudioManager`), que la extiende con bellows stagger.

**Ventajas**: no requiere archivos procesados, loop absolutamente transparente, sonido fiel al original, parametros ajustables.

**Desventajas**: caracter sonoro ligeramente textural/difuso por la granulacion, mayor uso de CPU.

**Historial de refinamientos**:

1. **Click al apagar notas** (resuelto): `Tone.GrainPlayer.stop()` cortaba los granos abruptamente. Se intercalo un nodo `Tone.Gain` individual por cada player. Al detener una nota, el gain se rampa a 0 durante `fadeOutTime` antes de stop/dispose.

2. **Click en el punto de loop** (resuelto): con `loop: true`, GrainPlayer saltaba abruptamente de `loopEnd` a `loopStart` cada ~22 segundos. Se evaluo usar samples crossfadeados y parametros de grano agresivos, pero ambas estrategias empeoraron el resultado. La solucion definitiva fue reemplazar el loop built-in por el ciclo manual de dual players con crossfade descrito arriba.

---

## Efecto Chorus opcional — Enriquecimiento del timbre para bocinas pequeñas

Este apartado documenta el efecto Chorus agregado para mejorar la percepcion del drone en bocinas de telefono, bocinas de escritorio y parlantes portatiles (ej: JBL Go 4).

### Motivacion

Un drone de shruti box reproducido directamente desde sample suena plano en bocinas pequeñas, principalmente porque:
- No hay variacion natural del timbre (sin movimiento).
- En bocinas mono no hay separacion espacial.
- No replica la micro-desafinacion natural entre multiples lengüetas del instrumento real.

El Chorus simula exactamente ese caracter de "multiples lengüetas ligeramente desafinadas" y funciona en bocinas mono sin producir cancelaciones de fase.

### Implementacion

**Cadena de senal:**
```
GrainPlayer → Gain(por nota) → Volume → Chorus → Destination
```

**Parametros** (`GrainAudioManager` y `RealisticGrainAudioManager`):

```javascript
new Tone.Chorus({
  frequency: 0.4,    // LFO muy lento (~2.5s por ciclo) — movimiento imperceptible como efecto
  delayTime: 2.5,    // delay en ms entre señal original y copia modulada
  depth: 0.15,       // profundidad baja — grosor sutil, sin wobble de afinacion
  spread: 0,         // sin separacion estereo — evita cancelacion de fase en mono
  wet: 0,            // arranca desactivado; sube a 0.3 cuando el usuario lo activa
})
```

> **Por que `depth: 0.15` y no mayor**: con profundidades altas (≥ 0.5), el chorus modula el pitch de cada grano del GrainPlayer de forma perceptible, creando un efecto de "wobble" o "sonido sucio". A 0.15, el efecto es grosor y calidez, no modulacion de pitch.

> **Por que `spread: 0`**: el spread por defecto de Tone.js Chorus es 180°, que crea maxima separacion estereo. En bocinas mono (la mayoria de los dispositivos objetivo), las dos señales se suman fuera de fase y producen cancelaciones que suenan como "suciedad". Con `spread: 0`, el chorus opera identicamente en ambos canales.

**Activacion/desactivacion en vivo:**

Se usa `chorus.wet.value` en lugar de desconectar/reconectar nodos para evitar clicks durante el toggle:

```javascript
setChorusEnabled(enabled) {
  this.chorus.wet.value = enabled ? 0.3 : 0;
}
```

### Control de usuario — Toggle FX

El efecto se controla con un toggle **FX** en el mango izquierdo del panel principal (`NoteGrid.jsx`), debajo del toggle NOTAS. El estado persiste en `localStorage` (`shrutibox-chorusEnabled`) y se restaura al iniciar la app o al cambiar de instrumento.

- **Default**: desactivado. El sonido sale sin modificar por defecto; el usuario activa el efecto si lo necesita para su dispositivo.
- **Flujo de datos**: `NoteGrid → toggleChorus() (store) → audioEngine.setChorusEnabled() → motor.chorus.wet.value`.
- El proxy `audioEngine.js` usa `?.` en la delegacion para que motores sin chorus (ej: `AudioManager`) no fallen.

---

### DroneSampleAudioManager (dual player cycling con Tone.Player) — iOS/iPad

**Enfoque**: portar el patron de dual player cycling de `GrainAudioManager` a `Tone.Player`, haciendo viable el efecto drone continuo en iOS/iPad.

**Motivacion**: `SampleAudioManager` usaba `Tone.Player` con `loop: true`. El problema es doble:

1. Los parametros `fadeIn`/`fadeOut` del `Tone.Player` solo aplican al inicio/fin del playback general (`.start()` / `.stop()`), no en cada iteracion del loop. Cada salto de `loopEnd → loopStart` es un corte abrupto.
2. El loop era muy corto (~4 s en la config por defecto), haciendo el click muy frecuente.

Ademas, el efecto drone (fade-in gradual al inicio, sonido continuo sin oscilaciones, fade-out controlado al stop) no era reproducible con `loop: true` porque no hay forma de interponer un `Gain` individual por nota en ese flujo.

**Implementacion**: `DroneSampleAudioManager` (motor activo para Shrutibox RC en todas las plataformas).

#### Crossfade secuencial (estrategia actual)

La v1 usaba un crossfade **simultaneo**: viejo baja mientras nuevo sube en paralelo (0.2 s). Aunque la suma de gains es matematicamente 1.0, el oido percibe una subida abrupta porque el player viejo esta en la posicion final del buffer (energia baja) mientras el nuevo arranca desde `cycleStart` (energia plena).

La v2 usa un crossfade **secuencial** (misma estrategia de `RealisticGrainAudioManager`):

```
t=0s:    nuevo player arranca @ cycleStart  → newGain: 0 → 1 (0.5s)  │  oldGain: 1 (sin cambio)
t=0.3s:  viejo empieza a bajar                                         │  oldGain: 1 → 0 (0.5s)
t=0.5s:  newGain = 1 (pleno volumen)                                   │  oldGain: 0.6
t=0.8s:  oldGain = 0 (silencio) → dispose                             │  newGain: 1

Gain total:  1 ──── sube hasta ~1.6 (t≈0.4s) ──── vuelve a 1 ──── sin gap ni subida abrupta
```

El viejo NO empieza a bajar hasta que el nuevo ya esta establecido. Hay un breve solapamiento donde ambos suenan (gain total > 1), lo que produce un "swell" suave — perceptiblemente mucho mejor que el gap o la subida abrupta del crossfade simultaneo.

```
Player A (loop:false):  [=== loopStart ════════════════════════ end]──old fade (0.5s)──(dispose)
                                                                  ↑
                                             timer dispara aqui (0.8s antes del end)
                                                                  │
Player B (loop:false):              [=== cycleStart ══════════   │  continua...
                                    │ new gain: 0→1 (0.5s)       │
                                    ├── t=0s: new arranca
                                    ├── t=0.3s: old empieza a bajar (overlapDelay)
                                    └── t=0.5s: new en pleno volumen
                                        t=0.8s: old llega a 0, coincide con fin buffer
```

Al parar: `clearTimeout(cycleTimer)`, `gain.rampTo(0, fadeOut)` (1.5 s), dispose delayed.

**Diferencia con GrainAudioManager**: usa `Tone.Player` en lugar de `Tone.GrainPlayer`. Sin granularidad ni overlap de granos; el timbre es el del sample sin procesamiento. La logica de ciclo, crossfade secuencial y control de gain es identica. Esto lo hace compatible con iOS/iPad donde GrainPlayer falla.

**Parametros por defecto**:

```javascript
{
  loopStart: 0.01,          // offset inicial (evita padding del decoder MP3)
  loopEnd: null,            // duracion completa del buffer
  cycleStart: 1.0,          // zona estable del drone (ciclos de sostenimiento)
  cycleFadeIn: 0.5,         // nuevo player sube 0→1 durante este tiempo (s)
  cycleOverlapDelay: 0.3,   // segundos que el viejo espera antes de iniciar su fade;
                            // permite que el nuevo se establezca primero.
                            // Debe ser <= cycleFadeIn para evitar un gap.
  cycleFadeOut: 0.5,        // viejo player baja 1→0 durante este tiempo (s).
                            // totalAdvance = cycleOverlapDelay + cycleFadeOut = 0.8 s
                            // (el timer dispara 0.8 s antes del fin del buffer)
  initialFadeIn: 2.5,       // fade-in suave solo al arrancar la nota (s)
  fadeIn: 0.08,             // fade base escalable con setSpeed
  fadeOut: 1.5,             // fade-out controlado al stop (s)
}
```

**Assets de audio** (`public/sounds-shruti-mks/`): generados con `scripts/generate-shruti-mks-samples.sh`. Son trims limpios de 20 s (1.0 s – 21.0 s del WAV original) con HPF/LPF, compresion leve, EQ suave y loudnorm. **No contienen fades ni crossfade offline**: el fade-in inicial (2.5 s), el crossfade secuencial entre ciclos y el fade-out al parar (1.5 s) los maneja `DroneSampleAudioManager` en runtime mediante nodos `Tone.Gain` individuales.

**Instrumento de prueba**: Shrutibox RC (`shruti-rc`) en todas las plataformas. Los motores de MKS Realistic y Acordion Pad FX en iOS siguen usando `SampleAudioManager` como fallback; `SampleAudioManager` queda deprecado para nuevos instrumentos.

**Ventajas**: sin clicks posibles (no se usa loop built-in); crossfade secuencial sin subidas abruptas ni gaps; fade-in y fade-out completamente controlados; compatible con iOS (Tone.Player es fiable en WebKit); mismo patron que los motores granulares de desktop.

**Desventajas**: sin textura granular (timbre mas plano que GrainPlayer); dos Players por nota durante la ventana de solapamiento (~0.8 s cada ciclo).

---

## Soluciones no implementadas (futuras)

Las siguientes opciones fueron evaluadas pero no implementadas. Se documentan para referencia en caso de querer explorarlas.

### Zero-crossing detection

**Concepto**: analizar la forma de onda de cada sample para encontrar puntos donde la amplitud cruza por cero (zero-crossings) y usarlos como `loopStart` y `loopEnd`. Si la onda esta en cero en ambos extremos del loop, la transicion es suave.

**Implementacion estimada**:
- Agregar un paso de analisis en el script de generacion (o en el init del motor) que recorra el buffer buscando zero-crossings cercanos a los puntos de loop deseados.
- Ajustar `loopStart` y `loopEnd` al zero-crossing mas cercano.
- Opcionalmente, buscar pares de zero-crossings donde la pendiente (derivada) tambien coincida para mayor suavidad.

**Ventajas**: no requiere procesamiento del archivo ni cambio en la tecnica de reproduccion.

**Desventajas**: no garantiza un loop seamless (la envolvente de amplitud puede diferir aunque la onda pase por cero), funciona mejor con ondas simples que con grabaciones complejas, requiere analisis adicional por sample.

**Cuando considerarla**: como optimizacion complementaria a las otras tecnicas, para afinar los puntos de loop del `SampleAudioManager` original.
