/**
 * @fileoverview Store global del Shrutibox Digital (Zustand).
 *
 * Gestiona el estado completo de la aplicacion:
 * - Inicializacion del audio
 * - Instrumento activo (seleccion de motor de audio)
 * - Notas seleccionadas (toggle on/off)
 * - Estado de reproduccion (playing/stopped)
 * - Controles de audio (volumen, velocidad)
 *
 * Flujo principal:
 * 1. Usuario inicia el audio (requerido por el navegador)
 * 2. Selecciona notas con toggleNote() (sin sonido aun)
 * 3. Activa reproduccion con togglePlay()
 * 4. Mientras suena, puede agregar/quitar notas en tiempo real
 * 5. togglePlay() de nuevo detiene el sonido (notas quedan seleccionadas)
 */

import { create } from 'zustand';
import * as Tone from 'tone';
import audioEngine from '../audio/audioEngine';
import { INSTRUMENTS_BY_ID, DEFAULT_INSTRUMENT_ID } from '../audio/instruments';

const useShrutiStore = create((set, get) => ({
  /** @type {boolean} true una vez que el audio esta inicializado. */
  initialized: false,

  /** @type {string} ID del instrumento activo. */
  instrumentId: DEFAULT_INSTRUMENT_ID,

  /** @type {string[]} IDs de notas seleccionadas (toggled on). */
  selectedNotes: [],

  /** @type {boolean} true si el drone esta reproduciendose. */
  playing: false,

  /** @type {number} Volumen maestro entre 0 y 1. */
  volume: 0.7,

  /** @type {number} Multiplicador de velocidad del envelope. */
  speed: 1.0,

  /** @type {'minimalist'|'didactic'} Modo de visualizacion de las lenguetas. */
  viewMode: localStorage.getItem('shrutibox-viewMode') || 'minimalist',

  /** @type {boolean} true si el efecto Chorus esta habilitado. */
  chorusEnabled: localStorage.getItem('shrutibox-chorusEnabled') === 'true',

  /**
   * Inicializa el motor de audio del instrumento activo.
   * Debe llamarse tras una interaccion del usuario (requisito del navegador).
   */
  init: async () => {
    const { instrumentId, volume, chorusEnabled } = get();
    const instrument = INSTRUMENTS_BY_ID[instrumentId];
    await instrument.engine.init();
    audioEngine.setEngine(instrument.engine);
    audioEngine.setVolume(volume);
    audioEngine.setChorusEnabled(chorusEnabled);
    set({ initialized: true });
  },

  /**
   * Cambia el instrumento activo en runtime.
   * Si el drone esta sonando, detiene el motor anterior, inicializa el nuevo,
   * restaura los ajustes de audio y re-reproduce las notas seleccionadas.
   * @param {string} instrumentId - ID del instrumento destino
   */
  setInstrument: async (instrumentId) => {
    const { playing, selectedNotes, volume, speed, chorusEnabled } = get();
    const instrument = INSTRUMENTS_BY_ID[instrumentId];
    if (!instrument) return;

    if (playing) {
      audioEngine.stopAll();
    }

    await instrument.engine.init();
    audioEngine.setEngine(instrument.engine);
    audioEngine.setVolume(volume);
    audioEngine.setSpeed(speed);
    audioEngine.setChorusEnabled(chorusEnabled);

    if (playing && selectedNotes.length > 0) {
      audioEngine.playNotes(selectedNotes);
    }

    set({ instrumentId });
  },

  /**
   * Alterna la seleccion de una nota (toggle on/off).
   * Si el drone esta activo, tambien inicia o detiene el sonido en tiempo real.
   * @param {string} noteId - ID de la nota (ej: 'sa', 're_komal')
   */
  toggleNote: (noteId) => {
    const { selectedNotes, playing } = get();
    const isSelected = selectedNotes.includes(noteId);

    if (isSelected) {
      if (playing) {
        audioEngine.stopNote(noteId);
      }
      set({ selectedNotes: selectedNotes.filter((id) => id !== noteId) });
    } else {
      if (playing) {
        audioEngine.playNote(noteId);
      }
      set({ selectedNotes: [...selectedNotes, noteId] });
    }
  },

  /**
   * Alterna la reproduccion del drone (play/stop).
   * - Play: reproduce todas las notas seleccionadas simultaneamente.
   * - Stop: detiene todo el audio; las notas quedan seleccionadas.
   *
   * Nota iOS: el AudioContext puede pasar a estado `suspended` cuando la app
   * va a background o la pantalla se apaga. Al reanudar, intentamos `resume()`
   * antes de reproducir para evitar silencio sin error visible.
   */
  togglePlay: async () => {
    const { playing, selectedNotes } = get();

    if (playing) {
      audioEngine.stopAll();
      set({ playing: false });
    } else {
      // Recuperar el contexto si fue interrumpido (iOS suspende al ir a background).
      try {
        const rawCtx = Tone.getContext().rawContext;
        if (rawCtx.state !== 'running') {
          await rawCtx.resume();
        }
      } catch {
        // Si resume() falla, intentamos reproducir de todas formas.
      }
      if (selectedNotes.length > 0) {
        audioEngine.playNotes(selectedNotes);
      }
      set({ playing: true });
    }
  },

  /**
   * Ajusta el volumen maestro.
   * @param {number} value - Valor entre 0 y 1
   */
  setVolume: (value) => {
    audioEngine.setVolume(value);
    set({ volume: value });
  },

  /**
   * Ajusta la velocidad del envelope (attack/release).
   * @param {number} speed - Multiplicador (0.25 a 3)
   */
  setSpeed: (speed) => {
    audioEngine.setSpeed(speed);
    set({ speed });
  },

  /**
   * Alterna el modo de visualizacion entre minimalista y didactico.
   */
  toggleViewMode: () => {
    const { viewMode } = get();
    const next = viewMode === 'minimalist' ? 'didactic' : 'minimalist';
    localStorage.setItem('shrutibox-viewMode', next);
    set({ viewMode: next });
  },

  /**
   * Activa o desactiva el efecto Chorus y persiste la preferencia.
   */
  toggleChorus: () => {
    const { chorusEnabled } = get();
    const next = !chorusEnabled;
    audioEngine.setChorusEnabled(next);
    localStorage.setItem('shrutibox-chorusEnabled', String(next));
    set({ chorusEnabled: next });
  },

  /**
   * Detiene el audio y vuelve a la pantalla de inicio.
   */
  reset: () => {
    const { playing } = get();
    if (playing) {
      audioEngine.stopAll();
    }
    set({
      initialized: false,
      instrumentId: DEFAULT_INSTRUMENT_ID,
      selectedNotes: [],
      playing: false,
      speed: 1.0,
    });
  },
}));

export default useShrutiStore;
