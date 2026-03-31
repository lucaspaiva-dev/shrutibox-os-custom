/**
 * @fileoverview Motor de audio granular para el instrumento Acordion Pad FX.
 *
 * Usa Tone.GrainPlayer con dual player cycling (misma tecnica que
 * GrainAudioManager) pero con parametros calibrados para un sample tipo pad
 * con modulacion de filtro: granos mas largos, overlap mayor y crossfade
 * mas suave para preservar la textura envolvente del acordeon.
 *
 * El sample fuente es "Accordion pad1.wav" de juskiddink (Freesound #120931,
 * CC-BY 4.0) — un acorde de C menor con efectos de modulacion de filtro.
 * Cada nota se genera por pitch-shifting offline (ver generate-accordion-pad-samples.sh).
 *
 * La cadena de senal es:
 *   GrainPlayer → Gain(por nota) → Volume → Chorus → Destination
 *
 * Implementa la misma interfaz publica que los demas motores:
 * init(), playNote(), stopNote(), playNotes(), stopAll(),
 * setVolume(), setSpeed(), setChorusEnabled(), dispose().
 */

import * as Tone from 'tone';
import { NOTES } from './noteMap';

const ACCORDION_PAD_DEFAULTS = {
  grainSize: 0.8,
  overlap: 0.25,
  loopStart: 0.5,
  loopEnd: 20.0,
  crossfadeDuration: 3.0,
  initialFadeIn: 3.5,
  fadeIn: 0.1,
  fadeOut: 0.1,
};

class AccordionPadAudioManager {
  /**
   * @param {string} basePath - Directorio base de los samples (ej: '/sounds-accordion-pad').
   * @param {object} [options] - Overrides para la configuracion granular.
   * @param {number} [options.grainSize] - Tamano del grano en segundos.
   * @param {number} [options.overlap] - Overlap entre granos en segundos.
   * @param {number} [options.loopStart] - Inicio de la region de reproduccion en segundos.
   * @param {number|null} [options.loopEnd] - Fin de la region en segundos. null = duracion completa.
   * @param {number} [options.crossfadeDuration] - Duracion del crossfade entre players en segundos.
   * @param {number} [options.initialFadeIn] - Fade-in suave al iniciar una nota (segundos).
   */
  constructor(basePath = '/sounds-accordion-pad', options = {}) {
    this.basePath = basePath;
    this.grainConfig = { ...ACCORDION_PAD_DEFAULTS, ...options };
    this.initialized = false;
    this.buffers = new Map();
    this.activePlayers = new Map();
    this.fadeInTime = this.grainConfig.fadeIn;
    this.fadeOutTime = this.grainConfig.fadeOut;

    this.chorus = null;
    this.volume = null;
  }

  /** @private */
  _filePath(note) {
    return `${this.basePath}/${note.fileKey}.mp3`;
  }

  /**
   * Inicia el contexto de audio y precarga todos los buffers.
   * @returns {Promise<void>}
   */
  async init() {
    if (this.initialized) return;
    await Tone.start();

    this.chorus = new Tone.Chorus({
      frequency: 0.4,
      delayTime: 2.5,
      depth: 0.15,
      spread: 0,
      wet: 0,
    }).toDestination();
    this.chorus.start();
    this.volume = new Tone.Volume(-6).connect(this.chorus);

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
   * Crea un GrainPlayer conectado a un Gain individual.
   * @param {Tone.ToneAudioBuffer} buffer
   * @returns {{ player: Tone.GrainPlayer, gain: Tone.Gain }}
   * @private
   */
  _createPlayerPair(buffer) {
    const gain = new Tone.Gain(0).connect(this.volume);
    const player = new Tone.GrainPlayer({
      url: buffer,
      loop: false,
      grainSize: this.grainConfig.grainSize,
      overlap: this.grainConfig.overlap,
    }).connect(gain);

    return { player, gain };
  }

  /**
   * Programa el dispose de un player+gain tras un delay.
   * @private
   */
  _disposeAfter(player, gain, delaySec) {
    setTimeout(() => {
      player.stop();
      player.dispose();
      gain.dispose();
    }, delaySec * 1000);
  }

  /**
   * Cicla el player activo de una nota: crea un nuevo player desde loopStart,
   * crossfadea con el anterior, y programa el siguiente ciclo.
   * @param {string} noteId
   * @private
   */
  _cyclePlayer(noteId) {
    const entry = this.activePlayers.get(noteId);
    if (!entry) return;

    const { player: oldPlayer, gain: oldGain } = entry;
    const buffer = this.buffers.get(noteId);
    const loopEnd = this.grainConfig.loopEnd != null
      ? Math.min(this.grainConfig.loopEnd, buffer.duration - 0.1)
      : buffer.duration;
    const xfade = this.grainConfig.crossfadeDuration;

    const { player: newPlayer, gain: newGain } = this._createPlayerPair(buffer);

    newPlayer.start(undefined, this.grainConfig.loopStart);
    newGain.gain.rampTo(1, xfade);

    oldGain.gain.rampTo(0, xfade);
    this._disposeAfter(oldPlayer, oldGain, xfade + 0.2);

    const playDuration = loopEnd - this.grainConfig.loopStart;
    const cycleTimer = setTimeout(
      () => this._cyclePlayer(noteId),
      (playDuration - xfade) * 1000
    );

    this.activePlayers.set(noteId, { player: newPlayer, gain: newGain, cycleTimer });
  }

  /**
   * Inicia la reproduccion granular de una nota con dual player cycling.
   * Aplica un fade-in suave (initialFadeIn) solo al arrancar la nota.
   * @param {string} noteId - Identificador de la nota
   */
  playNote(noteId) {
    if (!this.initialized) return;

    const buffer = this.buffers.get(noteId);
    if (!buffer) return;

    if (this.activePlayers.has(noteId)) {
      this._stopPlayer(noteId);
    }

    const loopEnd = this.grainConfig.loopEnd != null
      ? Math.min(this.grainConfig.loopEnd, buffer.duration - 0.1)
      : buffer.duration;

    const { player, gain } = this._createPlayerPair(buffer);

    gain.gain.value = 0;
    player.start(undefined, this.grainConfig.loopStart);
    gain.gain.rampTo(1, this.grainConfig.initialFadeIn);

    const playDuration = loopEnd - this.grainConfig.loopStart;
    const xfade = this.grainConfig.crossfadeDuration;
    const cycleTimer = setTimeout(
      () => this._cyclePlayer(noteId),
      (playDuration - xfade) * 1000
    );

    this.activePlayers.set(noteId, { player, gain, cycleTimer });
  }

  /**
   * Detiene la reproduccion de una nota.
   * @param {string} noteId
   */
  stopNote(noteId) {
    if (!this.initialized) return;
    this._stopPlayer(noteId);
  }

  /**
   * Inicia la reproduccion de multiples notas simultaneamente.
   * @param {string[]} noteIds
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

  /** @private */
  _stopPlayer(noteId) {
    const entry = this.activePlayers.get(noteId);
    if (!entry) return;

    const { player, gain, cycleTimer } = entry;
    this.activePlayers.delete(noteId);

    clearTimeout(cycleTimer);

    gain.gain.rampTo(0, this.fadeOutTime);
    this._disposeAfter(player, gain, this.fadeOutTime + 0.2);
  }

  /**
   * Activa o desactiva el efecto Chorus ajustando su wet mix.
   * @param {boolean} enabled
   */
  setChorusEnabled(enabled) {
    this.chorus.wet.value = enabled ? 0.3 : 0;
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
   * Ajusta la velocidad modificando fadeIn y fadeOut.
   * @param {number} speed - Multiplicador de velocidad
   */
  setSpeed(speed) {
    this.fadeInTime = this.grainConfig.fadeIn / speed;
    this.fadeOutTime = this.grainConfig.fadeOut / speed;
  }

  /**
   * Libera todos los recursos de audio.
   */
  dispose() {
    this.stopAll();
    for (const { player, gain, cycleTimer } of this.activePlayers.values()) {
      clearTimeout(cycleTimer);
      player.dispose();
      gain.dispose();
    }
    this.activePlayers.clear();
    for (const buffer of this.buffers.values()) {
      buffer.dispose();
    }
    this.buffers.clear();
    this.volume?.dispose();
    this.chorus?.stop();
    this.chorus?.dispose();
    this.volume = null;
    this.chorus = null;
    this.initialized = false;
  }
}

export default AccordionPadAudioManager;
