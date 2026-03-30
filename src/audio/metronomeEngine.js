/**
 * @fileoverview Motor de audio del metrónomo — Shrutibox Digital.
 *
 * Genera pulsos de metrónomo usando Tone.js con dos tonos diferenciados:
 * - Acento: tono agudo (1200 Hz) para los beats marcados como fuertes.
 * - Normal: tono medio (800 Hz) para los beats regulares.
 *
 * Usa Tone.Transport para scheduling preciso a nivel de sample.
 * El canal de audio es independiente del drone del shrutibox, lo que
 * permite reproducción simultánea sin interferencias.
 *
 * API: start(), stop(), setBpm(), setPattern(), onBeat(), dispose()
 */

import * as Tone from 'tone';

class MetronomeEngine {
  constructor() {
    /** @type {boolean} Indica si el motor fue inicializado. */
    this.initialized = false;

    /** @type {number} Índice del beat actual (0-based). */
    this._currentBeat = 0;

    /** @type {number} Cantidad total de beats por compás. */
    this._beats = 4;

    /** @type {number[]} Índices de beats acentuados. */
    this._accents = [0];

    /** @type {Function|null} Callback invocado en cada beat con el índice actual. */
    this._onBeatCallback = null;

    /** @type {string|null} ID del evento programado en Transport. */
    this._scheduleId = null;

    /** @type {Tone.Volume|null} Nodo de volumen del metrónomo. */
    this._volume = null;

    /** @type {Tone.Synth|null} Synth para el tick de acento. */
    this._accentSynth = null;

    /** @type {Tone.Synth|null} Synth para el tick normal. */
    this._normalSynth = null;
  }

  /**
   * Inicializa los nodos de audio. Debe llamarse tras una interacción
   * del usuario (el AudioContext ya debe estar activo via Tone.start()).
   */
  _ensureInit() {
    if (this.initialized) return;

    this._volume = new Tone.Volume(-6).toDestination();

    const synthOptions = {
      oscillator: { type: 'sine' },
      envelope: {
        attack: 0.001,
        decay: 0.05,
        sustain: 0,
        release: 0.05,
      },
    };

    this._accentSynth = new Tone.Synth(synthOptions).connect(this._volume);
    this._normalSynth = new Tone.Synth(synthOptions).connect(this._volume);

    this._accentSynth.volume.value = 2;
    this._normalSynth.volume.value = -3;

    this.initialized = true;
  }

  /**
   * Registra un callback que se invoca en cada beat con el índice del beat actual.
   * Útil para actualizar el estado visual desde el store.
   * @param {function(number): void} callback
   */
  onBeat(callback) {
    this._onBeatCallback = callback;
  }

  /**
   * Inicia el metrónomo con los parámetros dados.
   * @param {number} bpm - Pulsos por minuto (20-240)
   * @param {number} beats - Cantidad de beats por compás (1-8)
   * @param {number[]} accents - Índices (0-based) de beats acentuados
   */
  start(bpm, beats, accents) {
    this._ensureInit();
    this.stop();

    this._currentBeat = 0;
    this._beats = beats;
    this._accents = accents;

    Tone.getTransport().bpm.value = bpm;

    this._scheduleId = Tone.getTransport().scheduleRepeat((time) => {
      const beat = this._currentBeat;
      const isAccent = this._accents.includes(beat);

      if (isAccent) {
        this._accentSynth.triggerAttackRelease('C6', '32n', time);
      } else {
        this._normalSynth.triggerAttackRelease('G4', '32n', time);
      }

      const beatSnapshot = beat;
      Tone.getDraw().schedule(() => {
        if (this._onBeatCallback) {
          this._onBeatCallback(beatSnapshot);
        }
      }, time);

      this._currentBeat = (this._currentBeat + 1) % this._beats;
    }, '4n');

    Tone.getTransport().start();
  }

  /**
   * Detiene el metrónomo y resetea el contador de beats.
   */
  stop() {
    if (this._scheduleId !== null) {
      Tone.getTransport().clear(this._scheduleId);
      this._scheduleId = null;
    }
    Tone.getTransport().stop();
    Tone.getTransport().cancel();
    this._currentBeat = 0;

    if (this._onBeatCallback) {
      this._onBeatCallback(-1);
    }
  }

  /**
   * Actualiza el BPM en tiempo real sin detener el metrónomo.
   * @param {number} bpm
   */
  setBpm(bpm) {
    Tone.getTransport().bpm.value = bpm;
  }

  /**
   * Actualiza el patrón de beats y acentos en tiempo real.
   * Si el beat actual supera la nueva cantidad, se resetea a 0.
   * @param {number} beats
   * @param {number[]} accents
   */
  setPattern(beats, accents) {
    this._beats = beats;
    this._accents = accents;
    if (this._currentBeat >= beats) {
      this._currentBeat = 0;
    }
  }

  /**
   * Devuelve el índice del beat actual (0-based).
   * @returns {number}
   */
  getCurrentBeat() {
    return this._currentBeat;
  }

  /**
   * Libera todos los recursos de audio.
   */
  dispose() {
    this.stop();
    this._accentSynth?.dispose();
    this._normalSynth?.dispose();
    this._volume?.dispose();
    this._accentSynth = null;
    this._normalSynth = null;
    this._volume = null;
    this.initialized = false;
  }
}

/** Instancia singleton del motor de metrónomo. */
const metronomeEngine = new MetronomeEngine();
export default metronomeEngine;
