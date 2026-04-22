/**
 * @fileoverview Mapa de notas cromaticas del Shrutibox Digital.
 *
 * Define las 13 notas de una octava completa en nomenclatura occidental:
 * 7 naturales + 4 alteradas con sostenido + 1 con bemol + Do agudo.
 * Frecuencias basadas en afinacion A=440Hz, octava 3.
 */

/**
 * Las 13 notas cromaticas en orden ascendente.
 * @type {Array<{id: string, variant: string, western: string, frequency: number, fileKey: string}>}
 */
const CHROMATIC_NOTES = [
  { id: 'C3',       variant: 'shuddh', western: 'C3',  frequency: 130.81, fileKey: 'C3'       },
  { id: 'C3-sharp', variant: 'komal',  western: 'C#3', frequency: 138.59, fileKey: 'C3-sharp' },
  { id: 'D3',       variant: 'shuddh', western: 'D3',  frequency: 146.83, fileKey: 'D3'       },
  { id: 'D3-sharp', variant: 'komal',  western: 'D#3', frequency: 155.56, fileKey: 'D3-sharp' },
  { id: 'E3',       variant: 'shuddh', western: 'E3',  frequency: 164.81, fileKey: 'E3'       },
  { id: 'F3',       variant: 'shuddh', western: 'F3',  frequency: 174.61, fileKey: 'F3'       },
  { id: 'F3-sharp', variant: 'tivra',  western: 'F#3', frequency: 185.00, fileKey: 'F3-sharp' },
  { id: 'G3',       variant: 'shuddh', western: 'G3',  frequency: 196.00, fileKey: 'G3'       },
  { id: 'G3-sharp', variant: 'komal',  western: 'G#3', frequency: 207.65, fileKey: 'G3-sharp' },
  { id: 'A3',       variant: 'shuddh', western: 'A3',  frequency: 220.00, fileKey: 'A3'       },
  { id: 'B3_flat',  variant: 'komal',  western: 'Bb3', frequency: 233.08, fileKey: 'B3_flat'  },
  { id: 'B3',       variant: 'shuddh', western: 'B3',  frequency: 246.94, fileKey: 'B3'       },
  { id: 'C4',       variant: 'shuddh', western: 'C4',  frequency: 261.63, fileKey: 'C4'       },
];

/** Lista completa de notas del instrumento (13 notas cromaticas). */
export const NOTES = CHROMATIC_NOTES;

/** Diccionario de notas indexado por id para busqueda O(1). */
export const NOTES_BY_ID = Object.fromEntries(NOTES.map((n) => [n.id, n]));

/**
 * Mapeo de teclas del teclado fisico a id de nota, estilo piano:
 * - Fila inferior (naturales): A S D F G H J K
 * - Fila superior (alteradas): W E T Y U
 * @type {Record<string, string>}
 */
export const KEYBOARD_MAP = {
  a: 'C3',
  w: 'C3-sharp',
  s: 'D3',
  e: 'D3-sharp',
  d: 'E3',
  f: 'F3',
  t: 'F3-sharp',
  g: 'G3',
  y: 'G3-sharp',
  h: 'A3',
  u: 'B3_flat',
  j: 'B3',
  k: 'C4',
};

/**
 * Mapeo inverso: de noteId a tecla, para mostrar labels en la UI.
 * @type {Record<string, string>}
 */
export const KEY_LABELS = Object.fromEntries(
  Object.entries(KEYBOARD_MAP).map(([key, noteId]) => [noteId, key.toUpperCase()])
);

export { CHROMATIC_NOTES };
