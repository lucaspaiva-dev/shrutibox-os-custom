/**
 * @fileoverview Motor de audio basado en samples pregrabados.
 *
 * Alternativa al AudioManager sintetico: reproduce samples de audio reales
 * (archivos MP3) con loop continuo para generar el drone del shrutibox.
 * Cada nota carga su propio buffer desde una ruta construida a partir del
 * basePath configurado en el constructor.
 *
 * Usa Tone.Player con loop seamless (loopStart/loopEnd + fadeIn/fadeOut).
 * Exporta la clase para permitir multiples instancias con distintos conjuntos
 * de samples y configuraciones de loop.
 *
 * Instancias actuales:
 * - basePath='/sounds'          → samples interpolados (Shrutibox Prototype)
 * - basePath='/sounds-mks'      → grabaciones reales (Shrutibox MKS)
 * - basePath='/sounds-mks-xfade'→ grabaciones con crossfade baked-in (MKS Crossfade)
 */

import * as Tone from 'tone';
import { NOTES } from './noteMap';

const LOOP_DEFAULTS = {
  loopStart: 1.0,
  loopEnd: 5.0,
  fadeIn: 0.08,
  fadeOut: 0.08,
};

class SampleAudioManager {
  /**
   * @param {string} basePath - Directorio base de los samples (ej: '/sounds', '/sounds-mks').
   *   La estructura esperada es: basePath/fileKey.mp3
   * @param {object} [options] - Overrides para la configuracion de loop.
   * @param {number} [options.loopStart] - Inicio del loop en segundos.
   * @param {number|null} [options.loopEnd] - Fin del loop en segundos. null = duracion completa del buffer.
   * @param {number} [options.fadeIn] - Fade-in al iniciar reproduccion.
   * @param {number} [options.fadeOut] - Fade-out al detener reproduccion.
   */
  constructor(basePath = '/sounds', options = {}) {
    this.basePath = basePath;
    this.loopConfig = { ...LOOP_DEFAULTS, ...options };
    this.initialized = false;
    this.buffers = new Map();
    this.activePlayers = new Map();
    this.volume = null;
    this.fadeInTime = this.loopConfig.fadeIn;
    this.fadeOutTime = this.loopConfig.fadeOut;
  }

  /**
   * Construye la ruta del archivo MP3 para una nota.
   * @param {object} note - Objeto de nota de noteMap.js
   * @returns {string} Ruta al archivo MP3
   * @private
   */
  _filePath(note) {
    return `${this.basePath}/${note.fileKey}.mp3`;
  }

  /**
   * Inicia el contexto de audio y precarga todos los buffers de samples.
   * Debe llamarse tras una interaccion del usuario (requisito del navegador).
   * @returns {Promise<void>} Se resuelve cuando todos los buffers estan cargados.
   */
  async init() {
    if (this.initialized) return;
    // Nota: el desbloqueo del AudioContext (Tone.start + silent buffer trick)
    // ya fue realizado por unlockAudio() desde el gesto del usuario en App.jsx
    // antes de llegar aquí. No llamar Tone.start() de nuevo para evitar
    // condiciones de carrera en iOS con múltiples resume() simultáneos.
    this.volume = new Tone.Volume(-6).toDestination();

    const loadPromises = NOTES.map(
      (note) =>
        new Promise((resolve, reject) => {
          const buffer = new Tone.ToneAudioBuffer(
            this._filePath(note),
            () => {
              this.buffers.set(note.id, buffer);
              resolve();
            },
            reject
          );
        })
    );

    await Promise.all(loadPromises);
    this.initialized = true;
  }

  /**
   * Inicia la reproduccion de una nota individual con loop continuo.
   * Si la nota ya esta sonando, la detiene y reinicia.
   * @param {string} noteId - Identificador de la nota (ej: 'sa_3')
   */
  playNote(noteId) {
    if (!this.initialized) return;

    const buffer = this.buffers.get(noteId);
    if (!buffer) return;

    if (this.activePlayers.has(noteId)) {
      this._stopPlayer(noteId);
    }

    const loopEnd = this.loopConfig.loopEnd != null
      ? Math.min(this.loopConfig.loopEnd, buffer.duration - 0.1)
      : buffer.duration;

    const player = new Tone.Player({
      url: buffer,
      loop: true,
      loopStart: this.loopConfig.loopStart,
      loopEnd,
      fadeIn: this.fadeInTime,
      fadeOut: this.fadeOutTime,
    }).connect(this.volume);

    const startOffset = this.loopConfig.loopStart || 0.01;
    player.start(undefined, startOffset);
    this.activePlayers.set(noteId, player);
  }

  /**
   * Detiene la reproduccion de una nota individual.
   * @param {string} noteId - Identificador de la nota
   */
  stopNote(noteId) {
    if (!this.initialized) return;
    this._stopPlayer(noteId);
  }

  /**
   * Inicia la reproduccion de multiples notas simultaneamente.
   * @param {string[]} noteIds - Array de identificadores de notas
   */
  playNotes(noteIds) {
    for (const noteId of noteIds) {
      this.playNote(noteId);
    }
  }

  /**
   * Detiene y libera todos los players activos.
   */
  stopAll() {
    for (const noteId of [...this.activePlayers.keys()]) {
      this._stopPlayer(noteId);
    }
  }

  /**
   * Detiene un player, programa su dispose tras el fade-out, y lo elimina del Map.
   * @param {string} noteId - Identificador de la nota
   * @private
   */
  _stopPlayer(noteId) {
    const player = this.activePlayers.get(noteId);
    if (!player) return;

    player.stop();
    setTimeout(() => player.dispose(), (this.fadeOutTime + 0.5) * 1000);
    this.activePlayers.delete(noteId);
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
   * Ajusta la velocidad de ataque/release modificando fadeIn y fadeOut.
   * Funciona como equivalente del setSpeed del AudioManager sintetico.
   * @param {number} speed - Multiplicador de velocidad (ej: 0.5 = lento, 2 = rapido)
   */
  setSpeed(speed) {
    this.fadeInTime = this.loopConfig.fadeIn / speed;
    this.fadeOutTime = this.loopConfig.fadeOut / speed;
  }

  /**
   * Libera todos los recursos de audio: detiene players, limpia buffers
   * y desconecta el nodo de volumen.
   */
  dispose() {
    this.stopAll();
    this.activePlayers.clear();
    for (const buffer of this.buffers.values()) {
      buffer.dispose();
    }
    this.buffers.clear();
    this.volume?.dispose();
    this.volume = null;
    this.initialized = false;
  }
}

export default SampleAudioManager;
