/**
 * @fileoverview Desbloqueo robusto del AudioContext para iOS/iPad.
 *
 * ## Por qué existe este módulo
 *
 * iOS Safari (y todos los navegadores en iOS que usan WebKit) aplica la política
 * de autoplay más estricta de todos los navegadores modernos. El flujo de bloqueo
 * es el siguiente:
 *
 *   1. Cualquier `AudioContext` creado fuera de un gesto del usuario nace en
 *      estado `suspended`.
 *   2. Llamar a `AudioContext.resume()` desde dentro de un handler de click/touch
 *      suele ser suficiente en escritorio, pero en iOS WebKit el estado puede
 *      permanecer `suspended` si:
 *        - `resume()` se llama desde dentro de una función `async` o una cadena
 *          de Promises (incluso si la cadena se originó en el evento).
 *        - El dispositivo tiene el interruptor de silencio activado y no se
 *          registró ningún "silent buffer trick" previo.
 *        - El contexto fue creado implícitamente por Tone.js al importar nodos,
 *          antes del primer gesto del usuario.
 *
 * ## Silent buffer trick
 *
 * El método más confiable para desbloquear iOS desde versiones anteriores hasta
 * iOS 17/18 es crear y reproducir un buffer de audio de 1 sample con valor 0
 * directamente sobre el `AudioContext` nativo (no sobre la capa de Tone.js).
 * Esta operación:
 *   - Crea una "activación de audio" real registrada por WebKit.
 *   - Fuerza la transición del contexto a `running` independientemente del
 *     interruptor de silencio para Web Audio (a diferencia de `<audio>` HTML).
 *   - Es completamente inaudible (un sample de silencio a nivel 0).
 *
 * Referencia: Tone.js issues #572, #1051 — GrainPlayer sin audio en Safari/iOS
 * cuando el contexto no estaba verdaderamente desbloqueado.
 *
 * ## Uso
 *
 * Llamar `await unlockAudio()` como primera instrucción en el handler de click
 * del usuario (directamente en el evento, antes de cualquier lógica async).
 * Después de que resuelva, el contexto está garantizado en `running`.
 *
 * @example
 * button.addEventListener('click', async () => {
 *   await unlockAudio();
 *   await myEngine.init();
 * });
 */

import * as Tone from 'tone';

/**
 * Desbloquea el AudioContext de Tone.js de forma compatible con iOS/iPad.
 *
 * Flujo interno:
 *   1. Llama `Tone.start()` para intentar resumir el contexto via la API de Tone.
 *   2. Aplica el silent buffer trick sobre el `AudioContext` nativo para forzar
 *      la activación real en WebKit.
 *   3. Verifica el estado resultante; si sigue `suspended`, reintenta `resume()`.
 *   4. Lanza un error descriptivo si el contexto no pudo pasar a `running`, de
 *      forma que la UI pueda mostrar feedback al usuario.
 *
 * @returns {Promise<void>} Resuelve cuando el contexto está en estado `running`.
 * @throws {Error} Si el AudioContext no puede desbloquearse.
 */
export default async function unlockAudio() {
  // Paso 1: API de Tone.js — resume el contexto si está suspended.
  await Tone.start();

  const rawCtx = Tone.getContext().rawContext;

  // Paso 2: Silent buffer trick — el método más compatible con iOS WebKit.
  // Reproducir 1 sample de silencio registra una "activación de audio" real
  // en WebKit, distinta de un simple resume().
  try {
    const silentBuffer = rawCtx.createBuffer(1, 1, rawCtx.sampleRate);
    const src = rawCtx.createBufferSource();
    src.buffer = silentBuffer;
    src.connect(rawCtx.destination);
    src.start(0);
  } catch {
    // El silent buffer trick puede fallar en contextos muy restringidos;
    // continuamos de todas formas e intentamos resume() directamente.
  }

  // Paso 3: Si el contexto sigue suspended tras el trick, reintentamos resume().
  if (rawCtx.state !== 'running') {
    await rawCtx.resume();
  }

  // Paso 4: Verificación final. Si llegamos aquí con estado !== 'running',
  // el dispositivo está bloqueando el audio de forma irrecuperable en este gesto.
  if (rawCtx.state !== 'running') {
    throw new Error(
      `AudioContext no pudo desbloquearse (estado: ${rawCtx.state}). ` +
      'Asegúrate de tocar el botón directamente.'
    );
  }
}
