/**
 * @fileoverview Motor de audio granular "realista" con bellows stagger.
 *
 * Extiende la logica de GrainAudioManager (dual player cycling, crossfade
 * programatico) y anade simulacion del comportamiento fisico del fuelle:
 * al iniciar la reproduccion de multiples notas, las lenguetas graves
 * comienzan a sonar primero y las agudas entran progresivamente, replicando
 * la respuesta mecanica real del aire sobre lenguetas de distinto tamano.
 *
 * El delay de entrada se calcula por distancia en semitonos desde la nota
 * mas grave activa, y el fade-in inicial se escala para que las notas
 * agudas alcancen volumen pleno ligeramente mas tarde.
 *
 * La cadena de senal es:
 *   GrainPlayer → Gain(por nota) → Volume → Chorus → Destination
 *
 * El Chorus añade grosor y calidez simulando la micro-desafinacion natural
 * entre multiples lengüetas del instrumento real. Funciona en bocinas mono.
 * Arranca desactivado (wet: 0); se habilita via setChorusEnabled(true).
 *
 * Implementa la misma interfaz publica que los demas motores:
 * init(), playNote(), stopNote(), playNotes(), stopAll(),
 * setVolume(), setSpeed(), dispose().
 */

import * as Tone from 'tone';
import { NOTES, NOTES_BY_ID } from './noteMap';

const GRAIN_DEFAULTS = {
  grainSize: 0.5,
  overlap: 0.15,
  loopStart: 1.0,
  loopEnd: 23.0,
  cycleStart: 5.0,
  crossfadeDuration: 4.0,
  fadeOutDelay: 3.0,
  fadeOutDuration: 2.0,
  initialFadeIn: 2.5,
  fadeIn: 0.08,
  fadeOut: 0.08,
};

const BELLOWS_DEFAULTS = {
  msPerSemitone: 90,
  fadeInScalePerSemitone: 0.04,
};

/**
 * Indice cromatico de cada nota (0 = Sa grave, 12 = Sa agudo).
 * Se usa para calcular la distancia en semitonos entre notas.
 * @type {Map<string, number>}
 */
const CHROMATIC_INDEX = new Map(NOTES.map((n, i) => [n.id, i]));

class RealisticGrainAudioManager {
  /**
   * @param {string} basePath - Directorio base de los samples (ej: '/sounds-mks').
   * @param {object} [options] - Overrides para la configuracion granular.
   * @param {number} [options.grainSize]
   * @param {number} [options.overlap]
   * @param {number} [options.loopStart]
   * @param {number|null} [options.loopEnd]
   * @param {number} [options.cycleStart] - Posicion en el sample donde arrancan los
   *   ciclos de sostenimiento (zona estable del drone). Default: 5.0.
   * @param {number} [options.crossfadeDuration] - Duracion del fade-in del nuevo
   *   player en cada ciclo (segundos). Default: 4.0.
   * @param {number} [options.fadeOutDelay] - Segundos que el viejo player espera
   *   antes de iniciar su fade-out, permitiendo que el nuevo suba primero. Default: 3.0.
   * @param {number} [options.fadeOutDuration] - Duracion del fade-out del viejo
   *   player una vez iniciado (segundos). Default: 2.0.
   * @param {number} [options.initialFadeIn]
   * @param {object} [options.bellows] - Configuracion del efecto bellows stagger.
   * @param {number} [options.bellows.msPerSemitone] - Delay por semitono de distancia
   *   desde la nota mas grave activa (ms). Default: 90.
   * @param {number} [options.bellows.fadeInScalePerSemitone] - Factor adicional de
   *   initialFadeIn por semitono (ej: 0.04 = +4% por semitono). Default: 0.04.
   */
  constructor(basePath = '/sounds-mks', options = {}) {
    this.basePath = basePath;

    const { bellows, ...grainOptions } = options;
    this.grainConfig = { ...GRAIN_DEFAULTS, ...grainOptions };
    this.bellowsConfig = { ...BELLOWS_DEFAULTS, ...bellows };

    this.initialized = false;
    this.buffers = new Map();
    this.activePlayers = new Map();
    /** @type {Map<string, number>} noteId -> setTimeout ID para arranques pendientes */
    this.pendingStarts = new Map();
    /** @type {Map<string, number>} noteId -> setTimeout ID para paradas pendientes (bellows release) */
    this.pendingStops = new Map();
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
    try {
      // Nota: el desbloqueo del AudioContext (Tone.start + silent buffer trick)
      // ya fue realizado por unlockAudio() desde el gesto del usuario en App.jsx
      // antes de llegar aquí. No llamar Tone.start() de nuevo para evitar
      // condiciones de carrera en iOS con múltiples resume() simultáneos.

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
    } catch (err) {
      this.volume?.dispose();
      this.chorus?.stop();
      this.chorus?.dispose();
      this.volume = null;
      this.chorus = null;
      this.buffers.clear();
      throw err;
    }
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
   * Cicla el player activo de una nota: crea un nuevo player desde cycleStart
   * (zona estable del sample), lo sube a volumen pleno, y solo DESPUES de
   * fadeOutDelay segundos inicia el fade-out del viejo player. Esto garantiza
   * que el viejo no empiece a bajar hasta que el nuevo ya este casi al 100%.
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
    const fadeIn = this.grainConfig.crossfadeDuration;
    const fadeOutDelay = this.grainConfig.fadeOutDelay;
    const fadeOutDur = this.grainConfig.fadeOutDuration;

    const { player: newPlayer, gain: newGain } = this._createPlayerPair(buffer);

    newPlayer.start(undefined, this.grainConfig.cycleStart);
    newGain.gain.rampTo(1, fadeIn);

    setTimeout(() => {
      oldGain.gain.rampTo(0, fadeOutDur);
      this._disposeAfter(oldPlayer, oldGain, fadeOutDur + 0.2);
    }, fadeOutDelay * 1000);

    const playDuration = loopEnd - this.grainConfig.cycleStart;
    const cycleTimer = setTimeout(
      () => this._cyclePlayer(noteId),
      (playDuration - fadeIn) * 1000
    );

    this.activePlayers.set(noteId, { player: newPlayer, gain: newGain, cycleTimer });
  }

  /**
   * Calcula el initialFadeIn escalado para una nota segun su posicion cromatica.
   * Notas mas agudas reciben un fade-in ligeramente mas largo.
   * @param {string} noteId
   * @returns {number} Duracion del fade-in en segundos.
   * @private
   */
  _scaledFadeIn(noteId) {
    const idx = CHROMATIC_INDEX.get(noteId) ?? 0;
    const scale = 1 + idx * this.bellowsConfig.fadeInScalePerSemitone;
    return this.grainConfig.initialFadeIn * scale;
  }

  /**
   * Calcula el fadeOut escalado para una nota segun su posicion cromatica.
   * Espejo inverso de _scaledFadeIn: las notas graves reciben un fade-out mas
   * largo, replicando la mayor inercia mecanica de las lenguetas grandes.
   * @param {string} noteId
   * @returns {number} Duracion del fade-out en segundos.
   * @private
   */
  _scaledFadeOut(noteId) {
    const idx = CHROMATIC_INDEX.get(noteId) ?? 0;
    const invertedIdx = 12 - idx;
    const scale = 1 + invertedIdx * this.bellowsConfig.fadeInScalePerSemitone;
    return this.grainConfig.initialFadeIn * scale;
  }

  /**
   * Detiene un player con fade-out gradual escalado por pitch (para el bellows
   * release). A diferencia de _stopPlayer(), usa _scaledFadeOut() en lugar del
   * fadeOutTime rapido de 80ms.
   * @param {string} noteId
   * @private
   */
  _stopPlayerGradual(noteId) {
    const entry = this.activePlayers.get(noteId);
    if (!entry) return;

    const { player, gain, cycleTimer } = entry;
    this.activePlayers.delete(noteId);
    clearTimeout(cycleTimer);

    const fadeOut = this._scaledFadeOut(noteId);
    gain.gain.rampTo(0, fadeOut);
    this._disposeAfter(player, gain, fadeOut + 0.2);
  }

  /**
   * Cancela el timeout de parada pendiente de una nota, si existe.
   * @param {string} noteId
   * @private
   */
  _cancelPendingStop(noteId) {
    const timerId = this.pendingStops.get(noteId);
    if (timerId != null) {
      clearTimeout(timerId);
      this.pendingStops.delete(noteId);
    }
  }

  /**
   * Cancela todos los timeouts de parada pendientes del bellows release.
   * @private
   */
  _cancelAllPendingStops() {
    for (const timerId of this.pendingStops.values()) {
      clearTimeout(timerId);
    }
    this.pendingStops.clear();
  }

  /**
   * Inicia la reproduccion granular de una nota con dual player cycling.
   * El fade-in inicial se escala segun la posicion cromatica de la nota:
   * notas mas agudas alcanzan volumen pleno un poco mas tarde.
   * @param {string} noteId - Identificador de la nota
   */
  playNote(noteId) {
    if (!this.initialized) return;

    const buffer = this.buffers.get(noteId);
    if (!buffer) return;

    if (this.activePlayers.has(noteId)) {
      this._stopPlayer(noteId);
    }

    this._cancelPendingStart(noteId);
    this._cancelPendingStop(noteId);

    const loopEnd = this.grainConfig.loopEnd != null
      ? Math.min(this.grainConfig.loopEnd, buffer.duration - 0.1)
      : buffer.duration;

    const { player, gain } = this._createPlayerPair(buffer);
    const fadeIn = this._scaledFadeIn(noteId);

    gain.gain.value = 0;
    player.start(undefined, this.grainConfig.loopStart);
    gain.gain.rampTo(1, fadeIn);

    const playDuration = loopEnd - this.grainConfig.loopStart;
    const xfade = this.grainConfig.crossfadeDuration;
    const cycleTimer = setTimeout(
      () => this._cyclePlayer(noteId),
      (playDuration - xfade) * 1000
    );

    this.activePlayers.set(noteId, { player, gain, cycleTimer });
  }

  /**
   * Detiene la reproduccion de una nota y cancela su arranque pendiente.
   * @param {string} noteId
   */
  stopNote(noteId) {
    if (!this.initialized) return;
    this._cancelPendingStart(noteId);
    this._stopPlayer(noteId);
  }

  /**
   * Detiene multiples notas con bellows release: espejo del bellows stagger del
   * onset. Ordena las notas de agudo a grave y aplica un delay progresivo desde
   * la nota mas aguda, replicando el vaciado natural del fuelle donde las
   * lenguetas pequenas (agudas) dejan de vibrar primero al bajar la presion.
   *
   * Cada nota recibe un fade-out gradual escalado por pitch (_scaledFadeOut),
   * de modo que las lenguetas graves, con mayor inercia, se apagan mas
   * lentamente.
   *
   * @param {string[]} noteIds
   */
  stopNotes(noteIds) {
    if (!noteIds.length) return;

    this._cancelAllPendingStarts();

    const sorted = [...noteIds].sort((a, b) => {
      const idxA = CHROMATIC_INDEX.get(a) ?? 0;
      const idxB = CHROMATIC_INDEX.get(b) ?? 0;
      return idxB - idxA;
    });

    const highestIdx = CHROMATIC_INDEX.get(sorted[0]) ?? 0;

    for (const noteId of sorted) {
      const semitoneDistance = highestIdx - (CHROMATIC_INDEX.get(noteId) ?? 0);
      const delayMs = semitoneDistance * this.bellowsConfig.msPerSemitone;

      if (delayMs === 0) {
        this._stopPlayerGradual(noteId);
      } else {
        const timerId = setTimeout(() => {
          this.pendingStops.delete(noteId);
          this._stopPlayerGradual(noteId);
        }, delayMs);
        this.pendingStops.set(noteId, timerId);
      }
    }
  }

  /**
   * Inicia la reproduccion de multiples notas con bellows stagger:
   * ordena las notas de grave a agudo y aplica un delay progresivo
   * basado en la distancia en semitonos desde la nota mas grave.
   *
   * Simula el comportamiento fisico del fuelle: las lenguetas graves
   * requieren menos presion de aire y vibran primero.
   *
   * @param {string[]} noteIds
   */
  playNotes(noteIds) {
    if (!noteIds.length) return;

    this._cancelAllPendingStops();

    const sorted = [...noteIds].sort((a, b) => {
      const idxA = CHROMATIC_INDEX.get(a) ?? 0;
      const idxB = CHROMATIC_INDEX.get(b) ?? 0;
      return idxA - idxB;
    });

    const lowestIdx = CHROMATIC_INDEX.get(sorted[0]) ?? 0;

    for (const noteId of sorted) {
      const semitoneDistance = (CHROMATIC_INDEX.get(noteId) ?? 0) - lowestIdx;
      const delayMs = semitoneDistance * this.bellowsConfig.msPerSemitone;

      if (delayMs === 0) {
        this.playNote(noteId);
      } else {
        const timerId = setTimeout(() => {
          this.pendingStarts.delete(noteId);
          this.playNote(noteId);
        }, delayMs);
        this.pendingStarts.set(noteId, timerId);
      }
    }
  }

  /**
   * Detiene y libera todos los players activos con bellows release escalonado
   * (agudo a grave). Cancela tambien cualquier arranque pendiente.
   */
  stopAll() {
    this._cancelAllPendingStarts();
    const activeNoteIds = [...this.activePlayers.keys()];
    if (activeNoteIds.length > 0) {
      this.stopNotes(activeNoteIds);
    }
  }

  /**
   * Cancela el timeout de arranque pendiente de una nota, si existe.
   * @param {string} noteId
   * @private
   */
  _cancelPendingStart(noteId) {
    const timerId = this.pendingStarts.get(noteId);
    if (timerId != null) {
      clearTimeout(timerId);
      this.pendingStarts.delete(noteId);
    }
  }

  /**
   * Cancela todos los arranques pendientes del bellows stagger.
   * @private
   */
  _cancelAllPendingStarts() {
    for (const timerId of this.pendingStarts.values()) {
      clearTimeout(timerId);
    }
    this.pendingStarts.clear();
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
   * Usar wet:0/0.3 en lugar de desconectar nodos evita clicks al hacer toggle en vivo.
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
    this._cancelAllPendingStops();
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

export default RealisticGrainAudioManager;
