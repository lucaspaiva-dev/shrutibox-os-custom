/**
 * @fileoverview Deteccion de plataforma iOS / iPad para fallback de audio.
 *
 * ## Por que necesitamos esto
 *
 * Tone.GrainPlayer no produce audio en iOS WebKit aunque el AudioContext
 * este en estado `running`. El motivo documentado (Tone.js issue #572): a
 * diferencia de Tone.Player, GrainPlayer no crea AudioBufferSourceNodes
 * directamente al llamar `.start()`. En su lugar, arranca un reloj interno
 * (Clock) que crea los nodos en sus callbacks. iOS no ejecuta esos callbacks
 * de forma confiable, resultando en silencio total sin errores visibles.
 *
 * La solucion es usar Tone.Player (via SampleAudioManager) en iOS, donde
 * la reproduccion con loop nativo SI funciona de forma fiable.
 *
 * ## Deteccion
 *
 * Dos condiciones cubren todos los casos:
 * 1. User Agent con "iPad", "iPhone" o "iPod" — iOS clasico.
 * 2. platform "MacIntel" con maxTouchPoints > 1 — iPadOS 13+ que reporta
 *    la misma plataforma que un Mac para evitar sites que degradaban la
 *    experiencia en iPad. Sin pantalla tactil, ningun Mac real tiene
 *    maxTouchPoints > 1.
 *
 * @returns {boolean} true si el dispositivo es iOS o iPadOS.
 */
export default function isIOS() {
  if (typeof navigator === 'undefined') return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
}
