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
 * En desktop/Android el comportamiento es identico al original (GrainPlayer).
 *
 * ## Instrumentos activos en desktop
 * - MKS Drone       (id: mks-grain)     — GrainAudioManager, dual player cycling
 * - MKS Realistic   (id: mks-realistic) — RealisticGrainAudioManager, bellows stagger
 * - Accordion Pad   (id: accordion-pad) — AccordionPadAudioManager, granos largos
 * - MKS Player      (id: mks-player)    — SampleAudioManager, Tone.Player loop directo
 *
 * ## Instrumentos en iOS/iPad (fallback automatico)
 * - MKS Drone       (id: mks-grain)     — SampleAudioManager /sounds-mks
 * - MKS Realistic   (id: mks-realistic) — SampleAudioManager /sounds-mks
 * - Accordion Pad   (id: accordion-pad) — SampleAudioManager /sounds-accordion-pad
 * - MKS Player      (id: mks-player)    — SampleAudioManager /sounds-mks (igual que desktop)
 *
 * Para agregar un nuevo instrumento basta con importar su motor y anadir
 * una entrada a los arrays de instrumentos desktop e iOS.
 */

import SampleAudioManager from './SampleAudioManager';
import GrainAudioManager from './GrainAudioManager';
import RealisticGrainAudioManager from './RealisticGrainAudioManager';
import AccordionPadAudioManager from './AccordionPadAudioManager';
import isIOS from './isIOS';

// ---------------------------------------------------------------------------
// Instancias de motores de audio
// ---------------------------------------------------------------------------

// Instrumentos granulares — solo se usan en desktop/Android.
const mksGrainManager      = new GrainAudioManager('/sounds-mks');
const mksRealisticManager  = new RealisticGrainAudioManager('/sounds-mks');
const accordionPadManager  = new AccordionPadAudioManager('/sounds-accordion-pad');

// Instrumentos basados en Tone.Player — funcionan en todos los dispositivos,
// incluyendo iOS/iPad donde GrainPlayer falla silenciosamente.
const mksSampleManager           = new SampleAudioManager('/sounds-mks');
const mksRealisticSampleManager  = new SampleAudioManager('/sounds-mks');
const accordionPadSampleManager  = new SampleAudioManager('/sounds-accordion-pad');
const mksPlayerManager           = new SampleAudioManager('/sounds-mks');

// ---------------------------------------------------------------------------
// Deteccion de plataforma
// ---------------------------------------------------------------------------

const runningOnIOS = isIOS();

// ---------------------------------------------------------------------------
// Arrays de instrumentos por plataforma
// ---------------------------------------------------------------------------

/**
 * Instrumentos para desktop y Android.
 * Usan GrainPlayer para el timbre granular completo.
 */
const INSTRUMENTS_DESKTOP = [
  { id: 'mks-grain',     name: 'MKS Drone',       engine: mksGrainManager },
  { id: 'mks-realistic', name: 'MKS Realistic',    engine: mksRealisticManager },
  { id: 'accordion-pad', name: 'Acordion Pad FX',  engine: accordionPadManager },
  { id: 'mks-player',    name: 'MKS Player',        engine: mksPlayerManager },
];

/**
 * Instrumentos para iOS / iPad.
 * Todos usan SampleAudioManager (Tone.Player) porque GrainPlayer falla en
 * iOS WebKit. Los nombres incluyen "(iOS)" para indicar el modo fallback.
 */
const INSTRUMENTS_IOS = [
  { id: 'mks-grain',     name: 'MKS Drone (iOS)',      engine: mksSampleManager },
  { id: 'mks-realistic', name: 'MKS Realistic (iOS)',  engine: mksRealisticSampleManager },
  { id: 'accordion-pad', name: 'Acordion Pad (iOS)',    engine: accordionPadSampleManager },
  { id: 'mks-player',    name: 'MKS Player',            engine: mksPlayerManager },
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
 * En iOS se selecciona 'mks-player' (Tone.Player directo) como default
 * para garantizar audio funcional desde el primer uso.
 * En desktop se mantiene 'mks-grain' (GrainPlayer).
 */
export const DEFAULT_INSTRUMENT_ID = runningOnIOS ? 'mks-player' : 'mks-grain';

/** Diccionario de instrumentos indexado por id para busqueda O(1). */
export const INSTRUMENTS_BY_ID = Object.fromEntries(
  INSTRUMENTS.map((i) => [i.id, i])
);
