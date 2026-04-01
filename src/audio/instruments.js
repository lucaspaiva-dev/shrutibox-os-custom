/**
 * @fileoverview Registro de instrumentos disponibles en el Shrutibox Digital.
 *
 * Cada instrumento asocia un identificador unico, un nombre visible en la UI,
 * y una instancia de motor de audio que implementa la interfaz estandar
 * (init, playNote, stopNote, playNotes, stopAll, setVolume, setSpeed, dispose).
 *
 * ## Fallback automatico para iOS / iPad
 *
 * Tone.GrainPlayer no produce audio en iOS WebKit aunque el AudioContext este
 * en estado `running` (Tone.js issue #572). El reloj interno de GrainPlayer no
 * ejecuta sus callbacks de forma confiable en iOS, resultando en silencio total.
 *
 * Solucion: en iOS/iPad se usan instancias de SampleAudioManager (Tone.Player
 * con loop nativo) apuntando a los mismos archivos MP3. Tone.Player SI funciona
 * en iOS porque crea AudioBufferSourceNodes directamente.
 *
 * En desktop/Android el comportamiento granular es el esperado (GrainPlayer
 * donde aplica).
 *
 * ## Instrumentos visibles en la UI
 * - MKS Realistic   (id: mks-realistic) — desktop: RealisticGrainAudioManager;
 *   iOS: SampleAudioManager /sounds-mks
 * - Acordion Pad FX (id: accordion-pad) — desktop: AccordionPadAudioManager;
 *   iOS: SampleAudioManager /sounds-accordion-pad
 *
 * Para agregar un nuevo instrumento basta con importar su motor y anadir
 * una entrada a los arrays de instrumentos desktop e iOS.
 */

import SampleAudioManager from './SampleAudioManager';
import RealisticGrainAudioManager from './RealisticGrainAudioManager';
import AccordionPadAudioManager from './AccordionPadAudioManager';
import isIOS from './isIOS';

// ---------------------------------------------------------------------------
// Instancias de motores de audio
// ---------------------------------------------------------------------------

const mksRealisticManager  = new RealisticGrainAudioManager('/sounds-mks');
const accordionPadManager  = new AccordionPadAudioManager('/sounds-accordion-pad');

const mksRealisticSampleManager  = new SampleAudioManager('/sounds-mks');
const accordionPadSampleManager  = new SampleAudioManager('/sounds-accordion-pad');

// ---------------------------------------------------------------------------
// Deteccion de plataforma
// ---------------------------------------------------------------------------

const runningOnIOS = isIOS();

// ---------------------------------------------------------------------------
// Arrays de instrumentos por plataforma
// ---------------------------------------------------------------------------

/**
 * Instrumentos para desktop y Android.
 * MKS Realistic y Acordion Pad FX usan motores granulares.
 */
const INSTRUMENTS_DESKTOP = [
  { id: 'mks-realistic', name: 'MKS Realistic',    engine: mksRealisticManager },
  { id: 'accordion-pad', name: 'Acordion Pad FX',  engine: accordionPadManager },
];

/**
 * Instrumentos para iOS / iPad.
 * SampleAudioManager (Tone.Player) porque GrainPlayer falla en iOS WebKit.
 * Los nombres en pantalla coinciden con desktop; el fallback se indica en el panel de debug (triple-tap footer).
 */
const INSTRUMENTS_IOS = [
  { id: 'mks-realistic', name: 'MKS Realistic',    engine: mksRealisticSampleManager },
  { id: 'accordion-pad', name: 'Acordion Pad FX',  engine: accordionPadSampleManager },
];

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

/**
 * Lista ordenada de instrumentos disponibles para la plataforma actual.
 * El orden determina como aparecen en el selector de la UI.
 * @type {Array<{id: string, name: string, engine: object}>}
 */
export const INSTRUMENTS = runningOnIOS ? INSTRUMENTS_IOS : INSTRUMENTS_DESKTOP;

/**
 * ID del instrumento por defecto al iniciar la aplicacion.
 * `mks-realistic` esta disponible en desktop (GrainPlayer) e iOS (Tone.Player).
 */
export const DEFAULT_INSTRUMENT_ID = 'mks-realistic';

/** Diccionario de instrumentos indexado por id para busqueda O(1). */
export const INSTRUMENTS_BY_ID = Object.fromEntries(
  INSTRUMENTS.map((i) => [i.id, i])
);
