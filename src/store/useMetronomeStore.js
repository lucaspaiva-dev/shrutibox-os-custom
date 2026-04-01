/**
 * @fileoverview Store del metrónomo — Shrutibox Digital (Zustand).
 *
 * Gestiona el estado completo del metrónomo:
 * - Visibilidad del panel (enabled)
 * - Estado de reproducción (playing)
 * - Configuración: BPM, cantidad de beats, beats acentuados
 * - Beat actual (para feedback visual en tiempo real)
 *
 * Es independiente de useShrutiStore; el drone y el metrónomo
 * pueden funcionar simultáneamente sin interferencias de estado.
 *
 * Persistencia via localStorage:
 * - shrutibox-metronome-bpm
 * - shrutibox-metronome-beats
 * - shrutibox-metronome-accents
 */

import { create } from 'zustand';
import metronomeEngine from '../audio/metronomeEngine';

/** @param {string} key @param {*} fallback */
function getStored(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw !== null ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

const useMetronomeStore = create((set, get) => ({
  /** @type {boolean} true si el panel del metrónomo está visible. */
  enabled: false,

  /** @type {boolean} true si el metrónomo está sonando. */
  playing: false,

  /** @type {number} Pulsos por minuto (20-240). */
  bpm: getStored('shrutibox-metronome-bpm', 60),

  /** @type {number} Cantidad de beats por compás (1-8). */
  beats: getStored('shrutibox-metronome-beats', 4),

  /** @type {number[]} Índices (0-based) de beats acentuados. */
  accents: getStored('shrutibox-metronome-accents', [0]),

  /** @type {number} Índice del beat que acaba de sonar (-1 = inactivo). */
  currentBeat: -1,

  /**
   * Muestra u oculta el panel del metrónomo.
   * Si se oculta mientras suena, detiene la reproducción.
   */
  toggleEnabled: () => {
    const { enabled, playing } = get();
    if (enabled && playing) {
      metronomeEngine.stop();
      set({ enabled: false, playing: false, currentBeat: -1 });
    } else {
      set({ enabled: !enabled });
    }
  },

  /**
   * Inicia o detiene el metrónomo.
   */
  togglePlaying: () => {
    const { playing, bpm, beats, accents } = get();

    if (playing) {
      metronomeEngine.stop();
      set({ playing: false, currentBeat: -1 });
    } else {
      metronomeEngine.onBeat((beat) => {
        useMetronomeStore.setState({ currentBeat: beat });
      });
      metronomeEngine.start(bpm, beats, accents);
      set({ playing: true });
    }
  },

  /**
   * Actualiza el BPM. Clamp 20-240.
   * Si el metrónomo está sonando, actualiza el tempo en tiempo real.
   * @param {number} value
   */
  setBpm: (value) => {
    const bpm = Math.min(240, Math.max(20, value));
    const { playing } = get();
    if (playing) {
      metronomeEngine.setBpm(bpm);
    }
    localStorage.setItem('shrutibox-metronome-bpm', JSON.stringify(bpm));
    set({ bpm });
  },

  /**
   * Actualiza la cantidad de beats. Clamp 1-8.
   * Elimina los acentos que quedan fuera del nuevo rango.
   * @param {number} value
   */
  setBeats: (value) => {
    const beats = Math.min(8, Math.max(1, value));
    const { playing, accents } = get();
    const newAccents = accents.filter((i) => i < beats);
    const finalAccents = newAccents.length > 0 ? newAccents : [0];

    if (playing) {
      metronomeEngine.setPattern(beats, finalAccents);
    }

    localStorage.setItem('shrutibox-metronome-beats', JSON.stringify(beats));
    localStorage.setItem('shrutibox-metronome-accents', JSON.stringify(finalAccents));
    set({ beats, accents: finalAccents });
  },

  /**
   * Agrega o quita un beat del array de acentos.
   * @param {number} index - Índice del beat (0-based)
   */
  toggleAccent: (index) => {
    const { accents, beats, playing } = get();
    let newAccents;

    if (accents.includes(index)) {
      newAccents = accents.filter((i) => i !== index);
      if (newAccents.length === 0) newAccents = [];
    } else {
      newAccents = [...accents, index].sort((a, b) => a - b);
    }

    if (playing) {
      metronomeEngine.setPattern(beats, newAccents);
    }

    localStorage.setItem('shrutibox-metronome-accents', JSON.stringify(newAccents));
    set({ accents: newAccents });
  },
}));

export default useMetronomeStore;
