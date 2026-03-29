/**
 * @fileoverview Registro de instrumentos disponibles en el Shrutibox Digital.
 *
 * Cada instrumento asocia un identificador unico, un nombre visible en la UI,
 * y una instancia de motor de audio que implementa la interfaz estandar
 * (init, playNote, stopNote, playNotes, stopAll, setVolume, setSpeed, dispose).
 *
 * Instrumentos activos:
 * - MKS Drone      (id: mks-grain)     — GrainAudioManager, dual player cycling con crossfade 2s
 * - MKS Realistic  (id: mks-realistic) — RealisticGrainAudioManager, bellows stagger 90ms/semitono
 * - Acordion Pad FX (id: accordion-pad) — AccordionPadAudioManager, granos largos para timbre pad
 *
 * Para agregar un nuevo instrumento basta con importar su motor y anadir
 * una entrada al array INSTRUMENTS.
 */

import audioManager from './AudioManager';
import SampleAudioManager from './SampleAudioManager';
import GrainAudioManager from './GrainAudioManager';
import RealisticGrainAudioManager from './RealisticGrainAudioManager';
import AccordionPadAudioManager from './AccordionPadAudioManager';

/*
 * Instrumentos ocultos — listos para futuras implementacion o deprecacion.
 *
 * const baseSoundManager = audioManager;           // Base Sound (sintesis PolySynth fatsine)
 * const sampleAudioManager = new SampleAudioManager('/sounds');  // Shrutibox Prototype (samples interpolados)
 * const mksSampleAudioManager = new SampleAudioManager('/sounds-mks');  // Shrutibox MKS (Tone.Player loop)
 * const mksCrossfadeManager = new SampleAudioManager('/sounds-mks-xfade', {
 *   loopStart: 0,
 *   loopEnd: null,
 * });  // MKS Crossfade (samples con crossfade baked-in)
 */

const mksGrainManager = new GrainAudioManager('/sounds-mks');
const mksRealisticManager = new RealisticGrainAudioManager('/sounds-mks');
const accordionPadManager = new AccordionPadAudioManager('/sounds-accordion-pad');

/**
 * Lista ordenada de instrumentos disponibles.
 * El orden determina como aparecen en el selector de la UI.
 * @type {Array<{id: string, name: string, engine: object}>}
 */
export const INSTRUMENTS = [
  { id: 'mks-grain', name: 'MKS Drone', engine: mksGrainManager },
  { id: 'mks-realistic', name: 'MKS Realistic', engine: mksRealisticManager },
  { id: 'accordion-pad', name: 'Acordion Pad FX', engine: accordionPadManager },
];

/** ID del instrumento por defecto al iniciar la aplicacion. */
export const DEFAULT_INSTRUMENT_ID = 'mks-grain';

/** Diccionario de instrumentos indexado por id para busqueda O(1). */
export const INSTRUMENTS_BY_ID = Object.fromEntries(
  INSTRUMENTS.map((i) => [i.id, i])
);
