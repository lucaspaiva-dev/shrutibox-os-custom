/**
 * @fileoverview Motor de audio del Shrutibox Digital.
 *
 * Envuelve la libreria Tone.js para sintetizar notas en tiempo real.
 * Usa PolySynth con oscilador 'fatsine' para emular el timbre de un
 * shrutibox acustico. Exporta una instancia singleton compartida por
 * toda la aplicacion.
 */

import * as Tone from 'tone';
import { NOTES_BY_ID } from './noteMap';

class AudioManager {
  constructor() {
    /** @type {boolean} Indica si el contexto de audio fue iniciado. */
    this.initialized = false;

    /** @type {Map<string, Tone.PolySynth>} Synths activos indexados por noteId. */
    this.activeSynths = new Map();

    /** @type {Tone.Volume|null} Nodo de volumen maestro conectado a la salida. */
    this.volume = null;

    /** @type {number} Tiempo de ataque del envelope en segundos. */
    this.attackTime = 0.08;

    /** @type {number} Tiempo de release del envelope en segundos. */
    this.releaseTime = 0.8;
  }

  /**
   * Inicia el contexto de audio de Tone.js.
   * Debe llamarse tras una interaccion del usuario (requisito del navegador).
   */
  async init() {
    if (this.initialized) return;
    // Nota: el desbloqueo del AudioContext (Tone.start + silent buffer trick)
    // ya fue realizado por unlockAudio() desde el gesto del usuario en App.jsx
    // antes de llegar aquí. No llamar Tone.start() de nuevo para evitar
    // condiciones de carrera en iOS con múltiples resume() simultáneos.
    this.volume = new Tone.Volume(-6).toDestination();
    this.initialized = true;
  }

  /**
   * Crea un nuevo PolySynth con oscilador 'fatsine' y envelope configurado.
   * @returns {Tone.PolySynth} Synth conectado al nodo de volumen maestro.
   * @private
   */
  _createSynth() {
    return new Tone.PolySynth(Tone.Synth, {
      oscillator: {
        type: 'fatsine',
        spread: 12,
        count: 3,
      },
      envelope: {
        attack: this.attackTime,
        decay: 0.3,
        sustain: 0.9,
        release: this.releaseTime,
      },
    }).connect(this.volume);
  }

  /**
   * Inicia la reproduccion de una nota individual.
   * Si la nota ya esta sonando, la detiene y reinicia.
   * @param {string} noteId - Identificador de la nota (ej: 'sa_3')
   */
  playNote(noteId) {
    if (!this.initialized) return;

    const note = NOTES_BY_ID[noteId];
    if (!note) return;

    if (this.activeSynths.has(noteId)) {
      this._releaseNote(noteId);
    }

    const synth = this._createSynth();
    synth.triggerAttack(note.frequency);
    this.activeSynths.set(noteId, synth);
  }

  /**
   * Detiene la reproduccion de una nota individual.
   * @param {string} noteId - Identificador de la nota
   */
  stopNote(noteId) {
    if (!this.initialized) return;
    this._releaseNote(noteId);
  }

  /**
   * Inicia la reproduccion de multiples notas simultaneamente.
   * Util para activar el drone con todas las notas seleccionadas.
   * @param {string[]} noteIds - Array de identificadores de notas
   */
  playNotes(noteIds) {
    for (const noteId of noteIds) {
      this.playNote(noteId);
    }
  }

  /**
   * Detiene y libera todos los synths activos.
   * Las notas dejan de sonar inmediatamente (tras el release).
   */
  stopAll() {
    for (const noteId of [...this.activeSynths.keys()]) {
      this._releaseNote(noteId);
    }
  }

  /**
   * Libera un synth: dispara releaseAll, programa dispose, y limpia el Map.
   * @param {string} noteId - Identificador de la nota
   * @private
   */
  _releaseNote(noteId) {
    const synth = this.activeSynths.get(noteId);
    if (!synth) return;

    synth.releaseAll();
    setTimeout(() => synth.dispose(), (this.releaseTime + 0.5) * 1000);
    this.activeSynths.delete(noteId);
  }

  /**
   * Ajusta el volumen maestro.
   * @param {number} value - Valor entre 0 (silencio) y 1 (maximo)
   */
  setVolume(value) {
    const db = value === 0 ? -Infinity : Tone.gainToDb(value);
    this.volume.volume.value = db;
  }

  /**
   * Ajusta la velocidad del envelope modificando attack y release.
   * @param {number} speed - Multiplicador de velocidad (ej: 0.5 = lento, 2 = rapido)
   */
  setSpeed(speed) {
    this.attackTime = 0.08 / speed;
    this.releaseTime = 0.8 / speed;
  }

  /**
   * Libera todos los recursos de audio. Detiene notas, limpia synths
   * y desconecta el nodo de volumen.
   */
  dispose() {
    this.stopAll();
    this.activeSynths.clear();
    this.volume?.dispose();
    this.volume = null;
    this.initialized = false;
  }
}

/** Instancia singleton del motor de audio. */
const audioManager = new AudioManager();
export default audioManager;
