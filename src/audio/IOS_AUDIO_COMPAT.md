# Compatibilidad de Audio en iOS / iPad

## Contexto

iOS Safari (y todos los navegadores en iOS, que obligatoriamente usan WebKit)
aplica la política de autoplay más estricta de todos los navegadores modernos.
Este documento explica las restricciones, los bugs conocidos con Tone.js, y las
soluciones implementadas en este proyecto.

---

## El problema: AudioContext bloqueado en iOS

### Comportamiento de WebKit

En iOS, un `AudioContext` creado fuera de un evento de gesto del usuario nace
en estado **`suspended`** y **no produce audio**. Para pasar a estado `running`
se necesita:

1. Que el usuario interactúe con la página (tap, click, etc.)
2. Que **dentro de ese evento** se llame a `AudioContext.resume()` (o su
   equivalente en Tone.js: `Tone.start()`).

La restricción crítica es que el `resume()` debe ejecutarse **directamente** en
el handler del evento, o en las primeras microtareas/Promises que deriven del
mismo. Cuantas más capas de indirección async hay antes de `resume()`, más
probable es que iOS rechace la activación.

### Tipos de eventos que cuentan como "user activation" en WebKit

- `touchend` ✓
- `pointerup` ✓
- `click` ✓
- `keydown` ✓ (excepto Escape)
- `touchstart` ✗ — NO siempre cuenta en WebKit para audio
- `mousemove`, `scroll`, etc. ✗

### Comportamiento adicional de iOS

- Al pasar la app a background o apagar la pantalla, iOS **suspende** el
  AudioContext automáticamente. Al volver, se requiere un nuevo `resume()`.
- El interruptor de silencio físico del iPhone NO afecta al Web Audio API
  (a diferencia de `<audio>` HTML), pero el dispositivo puede ignorar audio
  si no se registró una "activación de audio" real.

---

## Bugs conocidos con Tone.js en iOS

### Issue #572 — GrainPlayer sin audio en Safari/iOS
Cuando el AudioContext no estaba verdaderamente desbloqueado (solo `resume()`
sin silent buffer trick), `GrainPlayer` producía silencio. `Tone.Player`
normal sí funcionaba. Ref: https://github.com/Tonejs/Tone.js/issues/572

### Issue #1051 — GrainPlayer no reanuda el contexto en ciertos flujos
Relacionado con el flujo de unlock en Safari. Confirmado en iOS Safari.
Ref: https://github.com/Tonejs/Tone.js/issues/1051

### Issue #1225 — LFO/Chorus con poco efecto en iOS vs desktop
El LFO interno del Chorus de Tone.js puede comportarse diferente en WebKit.
Ref: https://github.com/Tonejs/Tone.js/issues/1225

### Issues iOS 17/18
- Regresiones documentadas con `MediaElementAudioSourceNode` en iOS 17.x
  tempranos (corregidas en parches posteriores del ciclo 17).
- Bugs de WebKit con `touchend` y `context.resume()` en versiones específicas.
  Ref: https://bugs.webkit.org/show_bug.cgi?id=248265

---

## Solución implementada

### 1. `unlockAudio()` — `src/audio/unlockAudio.js`

Función centralizada que aplica el desbloqueo más robusto conocido:

```js
// 1. Tone.start() — API oficial de Tone.js
await Tone.start();

// 2. Silent buffer trick — registro de activación real en WebKit
const silentBuffer = rawCtx.createBuffer(1, 1, rawCtx.sampleRate);
const src = rawCtx.createBufferSource();
src.buffer = silentBuffer;
src.connect(rawCtx.destination);
src.start(0);

// 3. Verificación y reintento
if (rawCtx.state !== 'running') {
  await rawCtx.resume();
}
```

El **silent buffer trick** consiste en reproducir 1 sample de silencio (valor 0)
directamente sobre el `AudioContext` nativo. Esto crea una "activación de audio"
registrada por WebKit que es más confiable que un simple `resume()`, y es
completamente inaudible.

### 2. `handleStart` en `App.jsx`

```js
const handleStart = useCallback(async () => {
  await unlockAudio();  // primera operación — dentro del gesto del usuario
  await init();
}, [init, loading]);
```

`unlockAudio()` es la primera `await` en el handler del click, garantizando
que opera con la activación transitoria del gesto activa.

### 3. Guard en `togglePlay` — `useShrutiStore.js`

```js
togglePlay: async () => {
  // Recuperar contexto si iOS lo suspendió (background, pantalla apagada)
  const rawCtx = Tone.getContext().rawContext;
  if (rawCtx.state !== 'running') {
    await rawCtx.resume();
  }
  // ...
}
```

Maneja la reactivación tras volver de background sin requerir reiniciar la app.

### 4. Centralización del desbloqueo

Los engines individuales (`GrainAudioManager`, `RealisticGrainAudioManager`,
`AccordionPadAudioManager`, `AudioManager`, `SampleAudioManager`) **ya no
llaman `Tone.start()`** en sus métodos `init()`. El desbloqueo es
responsabilidad exclusiva de `unlockAudio()`. Múltiples `resume()` simultáneos
en iOS pueden tener comportamientos inesperados.

---

## Cómo depurar audio en iOS sin cable

### Opción 1: Panel de debug in-app

La app incluye un panel de diagnóstico activable por **triple-tap en el footer**
(el área de créditos). Muestra:

- `AudioContext.state` — el estado del contexto nativo
- `Tone context state` — el estado según Tone.js
- `initialized` — si el engine completó su `init()`
- `playing` / `instrument` / notas activas

### Opción 2: Safari Remote Inspector (recomendado para debugging completo)

1. **En el iPhone/iPad:** Ajustes → Safari → Avanzado → Inspector Web (activar)
2. **Conectar el dispositivo al Mac con cable USB**
3. **En Safari del Mac:** menú Desarrollar → [nombre del dispositivo] → [página]
4. Tendrás consola JS, red, errores, todos los paneles de DevTools

### Opción 3: Eruda (sin cable)

Agregar el bookmarklet de [Eruda](https://eruda.liriliri.io/) en Safari del
dispositivo para tener una consola JS portátil sin necesidad de Mac.

---

## Historial de cambios

| Versión | Cambio |
|---------|--------|
| Primera iteración | Mover creación de nodos Tone de constructores a `init()` para evitar AudioContext antes de gesto |
| Segunda iteración | Agregar `Tone.start()` directo en `handleStart` como fire-and-forget |
| Tercera iteración (actual) | Refactorizar a `unlockAudio()` con silent buffer trick; centralizar desbloqueo; guard en `togglePlay`; panel de debug |
