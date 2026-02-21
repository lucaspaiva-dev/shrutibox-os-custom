/**
 * @fileoverview Feature flags para habilitar/deshabilitar funcionalidades.
 *
 * Permite activar o desactivar secciones de la UI y comportamientos
 * sin modificar el codigo de los componentes.
 */

/** @type {Record<string, boolean>} */
export const FEATURE_FLAGS = {
  /** Habilita el control del instrumento mediante teclado fisico (A-J, espacio). */
  ENABLE_KEYBOARD: true,

  /** Muestra el selector de octava activa para el teclado en el panel de controles. */
  ENABLE_OCTAVE_SELECTOR: true,

  /** Muestra el control deslizante de velocidad (attack/release). */
  ENABLE_SPEED_CONTROL: true,

  /** Habilita el layout optimizado para dispositivos moviles. */
  ENABLE_MOBILE_LAYOUT: true,
};
