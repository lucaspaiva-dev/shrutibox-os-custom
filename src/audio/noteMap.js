/**
 * @fileoverview Mapa de notas del Shrutibox Digital.
 *
 * Define las 7 notas del sistema Sargam (Sa, Re, Ga, Ma, Pa, Dha, Ni)
 * y las mapea a frecuencias occidentales con afinacion A=440Hz.
 * Las octavas usan notacion cientifica estandar: 3 (Mandra/baja),
 * 4 (Madhya/media), 5 (Tara/alta).
 */

/**
 * Notas base del sistema Sargam con su equivalente occidental y frecuencia
 * fundamental en la octava 4 (Madhya Saptak, octava media).
 * @type {Array<{name: string, western: string, baseFrequency: number}>}
 */
const SARGAM_NOTES = [
  { name: 'Sa', western: 'C', baseFrequency: 261.63 },
  { name: 'Re', western: 'D', baseFrequency: 293.66 },
  { name: 'Ga', western: 'E', baseFrequency: 329.63 },
  { name: 'Ma', western: 'F', baseFrequency: 349.23 },
  { name: 'Pa', western: 'G', baseFrequency: 392.00 },
  { name: 'Dha', western: 'A', baseFrequency: 440.00 },
  { name: 'Ni', western: 'B', baseFrequency: 493.88 },
];

/**
 * Multiplicadores de frecuencia por octava, relativos a la octava 4 (base).
 * - Octava 3 (Mandra): frecuencia base * 0.5
 * - Octava 4 (Madhya): frecuencia base * 1
 * - Octava 5 (Tara):   frecuencia base * 2
 * @type {Record<number, number>}
 */
const OCTAVE_MULTIPLIERS = { 3: 0.5, 4: 1, 5: 2 };

/**
 * Genera el mapa completo de notas para las 3 octavas (3, 4, 5)
 * mas el Sa superior (octava 6) como nota de cierre.
 * @returns {Array<{id: string, name: string, western: string, octave: number, frequency: number, file: string}>}
 */
function buildNoteMap() {
  const notes = [];

  for (const octave of [3, 4, 5]) {
    const multiplier = OCTAVE_MULTIPLIERS[octave];
    for (const note of SARGAM_NOTES) {
      notes.push({
        id: `${note.name.toLowerCase()}_${octave}`,
        name: note.name,
        western: note.western,
        octave,
        frequency: +(note.baseFrequency * multiplier).toFixed(2),
        file: `/sounds/octave_${octave}/${note.name.toLowerCase()}.mp3`,
      });
    }
  }

  notes.push({
    id: 'sa_6',
    name: 'Sa',
    western: 'C',
    octave: 6,
    frequency: +(261.63 * 4).toFixed(2),
    file: '/sounds/octave_5/sa_high.mp3',
  });

  return notes;
}

/** Lista completa de notas del instrumento (21 notas + Sa superior). */
export const NOTES = buildNoteMap();

/** Diccionario de notas indexado por id para busqueda O(1). */
export const NOTES_BY_ID = Object.fromEntries(NOTES.map((n) => [n.id, n]));

/**
 * Mapeo de teclas del teclado fisico a indice de nota dentro de una octava.
 * A=Sa(0), S=Re(1), D=Ga(2), F=Ma(3), G=Pa(4), H=Dha(5), J=Ni(6).
 * @type {Record<string, number>}
 */
export const KEYBOARD_MAP = {
  a: 0,
  s: 1,
  d: 2,
  f: 3,
  g: 4,
  h: 5,
  j: 6,
};

/**
 * Filtra y devuelve las notas correspondientes a una octava especifica.
 * @param {number} octave - Numero de octava (3, 4 o 5)
 * @returns {Array} Notas de esa octava
 */
export function getNotesForOctave(octave) {
  return NOTES.filter((n) => n.octave === octave);
}

export { SARGAM_NOTES, OCTAVE_MULTIPLIERS };
