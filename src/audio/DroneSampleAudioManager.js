/**
 * @fileoverview Motor de audio drone con dual player cycling basado en Tone.Player.
 *
 * Porta el patron de dual player cycling de GrainAudioManager a Tone.Player,
 * haciendo viable el efecto drone continuo en iOS/iPad donde Tone.GrainPlayer
 * no produce audio de forma fiable (Tone.js issues #572, #1051).
 *
 * ## Estrategia drone — crossfade secuencial
 *
 * En lugar de usar el loop built-in de Tone.Player (que produce un click audible
 * cada vez que salta de loopEnd a loopStart), este motor cicla manualmente dos
 * Player que se alternan con un crossfade secuencial:
 *
 * ```
 * Player A:  [== loopStart ══════════════════════════ end]──old fade (0.5s)──(dispose)
 *                                                     ↑
 *                                    timer dispara aqui (0.8s antes del end)
 *                                                     │
 * Player B:                   [== cycleStart ══ ...   │ continua...
 *                              │ new gain: 0→1 (0.5s) │
 *                              ├── t=0s: new arranca  │
 *                              ├── t=0.3s: old empieza a bajar (overlapDelay)
 *                              └── t=0.5s: new en pleno volumen
 *                                  t=0.8s: old llega a 0, coincide con fin del buffer
 * ```
 *
 * ## Tres fases del ciclo (por que el orden importa)
 *
 * El crossfade SIMULTANEO (nuevo sube mientras viejo baja en paralelo) produce
 * una subida abrupta de timbre: el player viejo esta al final del buffer (audio
 * decayendo) y el nuevo arranca desde cycleStart (plena energia). El oido percibe
 * el cambio como una "subida de golpe" aunque el gain total sea matematicamente 1.
 *
 * El crossfade SECUENCIAL resuelve esto:
 *   1. Nuevo player arranca y sube a volumen pleno PRIMERO.
 *   2. Solo despues de `cycleOverlapDelay` segundos el viejo empieza a bajar.
 *   3. Durante el solapamiento ambos estan sonando (gain total > 1 brevemente),
 *      lo que produce un "swell" suave — perceptiblemente mucho mejor que el gap.
 *
 * ```
 * Gain total:  1 ──── sube hasta ~1.6 (t≈0.4s) ──── vuelve a 1 ──── sin cortes
 * ```
 *
 * Esta es la misma estrategia de RealisticGrainAudioManager (fadeOutDelay),
 * adaptada a Tone.Player para iOS.
 *
 * ## Parametros del ciclo y su relacion
 *
 * - `cycleFadeIn`:       nuevo player sube 0→1 durante este tiempo (s).
 * - `cycleOverlapDelay`: segundos que el viejo player espera antes de iniciar
 *                        su fade, permitiendo que el nuevo se establezca.
 *                        Debe ser <= cycleFadeIn para que el nuevo este al menos
 *                        en camino cuando el viejo empiece a bajar.
 * - `cycleFadeOut`:      viejo player baja 1→0 durante este tiempo (s).
 *
 * Restriccion de timing:
 *   totalAdvance = cycleOverlapDelay + cycleFadeOut
 *   El timer dispara `totalAdvance` segundos antes del fin del buffer, de modo
 *   que el viejo termina su fade exactamente cuando llega al final del buffer.
 *
 * ## Tres fases de volumen diferenciadas
 *
 * 1. **Inicio** (`playNote`): fade-in largo (`initialFadeIn` 2.5 s) solo la
 *    primera vez que se arranca la nota. Permite una entrada gradual tipo drone.
 *
 * 2. **Ciclo** (`_cyclePlayer`): crossfade secuencial imperceptible.
 *    Nuevo sube en `cycleFadeIn`, viejo baja en `cycleFadeOut` con `cycleOverlapDelay`
 *    de delay. El drone suena continuo sin cortes ni subidas abruptas.
 *
 * 3. **Stop** (`_stopPlayer`): fade-out largo (`fadeOut` 1.5 s) al detener la
 *    nota, para un apagado suave y controlado.
 *
 * ## Cadena de senal
 *
 *   Tone.Player → Tone.Gain (por nota) → Tone.Volume → Destination
 *
 * Implementa la misma interfaz publica que los demas motores:
 * init(), playNote(), stopNote(), playNotes(), stopAll(),
 * setVolume(), setSpeed(), dispose().
 */

import * as Tone from 'tone';
import { NOTES } from './noteMap';

const DRONE_DEFAULTS = {
  loopStart: 0.01,
  loopEnd: null,
  cycleStart: 1.0,
  cycleFadeIn: 0.5,
  cycleOverlapDelay: 0.3,
  cycleFadeOut: 0.5,
  initialFadeIn: 2.5,
  fadeIn: 0.08,
  fadeOut: 1.5,
};

class DroneSampleAudioManager {
  /**
   * @param {string} basePath - Directorio base de los samples (ej: '/sounds-shruti-mks').
   *   La estructura esperada es: basePath/fileKey.mp3
   * @param {object} [options] - Overrides para la configuracion del drone.
   * @param {number} [options.loopStart] - Offset de inicio de la primera reproduccion en segundos.
   *   Usar 0.01 para saltarse el padding que los decoders MP3 introducen al inicio.
   * @param {number|null} [options.loopEnd] - Fin de la region de reproduccion en segundos.
   *   null = duracion completa del buffer.
   * @param {number} [options.cycleStart] - Posicion en el sample donde arrancan los ciclos
   *   de sostenimiento (zona estable del drone). Default: 1.0.
   * @param {number} [options.cycleFadeIn] - Duracion del fade-in del nuevo player en cada
   *   ciclo (segundos). El nuevo sube de 0 a 1 durante este tiempo. Default: 0.5.
   * @param {number} [options.cycleOverlapDelay] - Segundos que el viejo player espera antes
   *   de iniciar su fade-out, contados desde el arranque del nuevo. Permite que el nuevo se
   *   establezca antes de que el viejo empiece a bajar. Debe ser <= cycleFadeIn. Default: 0.3.
   * @param {number} [options.cycleFadeOut] - Duracion del fade-out del viejo player en cada
   *   ciclo (segundos). El viejo baja de 1 a 0 durante este tiempo. Default: 0.5.
   *   NOTA: totalAdvance = cycleOverlapDelay + cycleFadeOut determina cuanto antes del
   *   final del buffer se dispara el timer de ciclo. Con buffers de ~20s, 0.8s es seguro.
   * @param {number} [options.initialFadeIn] - Duracion del fade-in suave solo al arrancar la
   *   nota por primera vez (segundos). Default: 2.5.
   * @param {number} [options.fadeIn] - Fade-in base, escalable con setSpeed. Default: 0.08.
   * @param {number} [options.fadeOut] - Duracion del fade-out al detener la nota.
   *   Determina la suavidad del apagado del drone (segundos). Default: 1.5.
   */
  constructor(basePath = '/sounds-shruti-mks', options = {}) {
    this.basePath = basePath;
    this.droneConfig = { ...DRONE_DEFAULTS, ...options };
    this.initialized = false;
    this.buffers = new Map();
    this.activePlayers = new Map();
    this.fadeInTime = this.droneConfig.fadeIn;
    this.fadeOutTime = this.droneConfig.fadeOut;

    this.volume = null;
  }

  /** @private */
  _filePath(note) {
    return `${this.basePath}/${note.fileKey}.mp3`;
  }

  /**
   * Inicia el contexto de audio y precarga todos los buffers de samples.
   * Debe llamarse tras una interaccion del usuario (requisito del navegador).
   * El desbloqueo del AudioContext (unlockAudio) ya fue realizado antes de
   * llegar aqui; no llamar Tone.start() de nuevo.
   * @returns {Promise<void>} Se resuelve cuando todos los buffers estan cargados.
   */
  async init() {
    if (this.initialized) return;
    try {
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
    } catch (err) {
      this.volume?.dispose();
      this.volume = null;
      this.buffers.clear();
      throw err;
    }
  }

  /**
   * Crea un par Player + Gain listo para conectar al volumen maestro.
   * El Player se configura con loop:false para que el ciclo manual controle
   * la continuidad, evitando el click del loop built-in.
   * El Gain arranca en 0 para que el fade-in sea controlado externamente.
   * @param {Tone.ToneAudioBuffer} buffer
   * @returns {{ player: Tone.Player, gain: Tone.Gain }}
   * @private
   */
  _createPlayerPair(buffer) {
    const gain = new Tone.Gain(0).connect(this.volume);
    const player = new Tone.Player({
      url: buffer,
      loop: false,
    }).connect(gain);

    return { player, gain };
  }

  /**
   * Programa el dispose de un par player+gain tras un delay.
   * @param {Tone.Player} player
   * @param {Tone.Gain} gain
   * @param {number} delaySec - Segundos de espera antes de liberar los nodos.
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
   * Cicla el player activo de una nota con crossfade secuencial:
   *   1. Nuevo player arranca desde cycleStart y sube a 1 en cycleFadeIn.
   *   2. Tras cycleOverlapDelay segundos, el viejo empieza a bajar en cycleFadeOut.
   *   3. El viejo player termina su fade exactamente cuando alcanza el fin del buffer.
   *
   * El timer del siguiente ciclo usa `cycleStart` para el calculo porque los
   * ciclos sucesivos arrancan desde esa posicion.
   * @param {string} noteId
   * @private
   */
  _cyclePlayer(noteId) {
    const entry = this.activePlayers.get(noteId);
    if (!entry) return;

    const { player: oldPlayer, gain: oldGain } = entry;
    const buffer = this.buffers.get(noteId);
    const effectiveEnd = this.droneConfig.loopEnd != null
      ? Math.min(this.droneConfig.loopEnd, buffer.duration - 0.1)
      : buffer.duration;

    const fadeIn = this.droneConfig.cycleFadeIn;
    const overlapDelay = this.droneConfig.cycleOverlapDelay;
    const fadeOut = this.droneConfig.cycleFadeOut;

    const { player: newPlayer, gain: newGain } = this._createPlayerPair(buffer);

    // Paso 1: nuevo arranca y sube a volumen pleno.
    newPlayer.start(undefined, this.droneConfig.cycleStart);
    newGain.gain.rampTo(1, fadeIn);

    // Paso 2: viejo baja SOLO DESPUÉS del delay, una vez que el nuevo está establecido.
    setTimeout(() => {
      oldGain.gain.rampTo(0, fadeOut);
      this._disposeAfter(oldPlayer, oldGain, fadeOut + 0.2);
    }, overlapDelay * 1000);

    // Timer para el siguiente ciclo.
    // totalAdvance = overlapDelay + fadeOut garantiza que el viejo termina
    // su fade exactamente cuando alcanza el fin del buffer.
    const totalAdvance = overlapDelay + fadeOut;
    const playDuration = effectiveEnd - this.droneConfig.cycleStart;
    const cycleTimer = setTimeout(
      () => this._cyclePlayer(noteId),
      (playDuration - totalAdvance) * 1000
    );

    this.activePlayers.set(noteId, { player: newPlayer, gain: newGain, cycleTimer });
  }

  /**
   * Inicia la reproduccion drone de una nota con dual player cycling.
   * Aplica un fade-in largo (initialFadeIn) solo al arrancar la nota por primera
   * vez. Los ciclos posteriores usan el crossfade secuencial.
   * Si la nota ya esta sonando, la detiene y reinicia.
   *
   * El timer del primer ciclo usa `loopStart` (no `cycleStart`) porque el primer
   * Player arranca desde esa posicion.
   * @param {string} noteId - Identificador de la nota (ej: 'sa_3')
   */
  playNote(noteId) {
    if (!this.initialized) return;

    const buffer = this.buffers.get(noteId);
    if (!buffer) return;

    if (this.activePlayers.has(noteId)) {
      this._stopPlayer(noteId);
    }

    const effectiveEnd = this.droneConfig.loopEnd != null
      ? Math.min(this.droneConfig.loopEnd, buffer.duration - 0.1)
      : buffer.duration;

    const { player, gain } = this._createPlayerPair(buffer);

    gain.gain.value = 0;
    player.start(undefined, this.droneConfig.loopStart);
    gain.gain.rampTo(1, this.droneConfig.initialFadeIn);

    // Timer basado en loopStart + totalAdvance porque el primer player arranca desde ahi.
    const totalAdvance = this.droneConfig.cycleOverlapDelay + this.droneConfig.cycleFadeOut;
    const firstCycleDuration = effectiveEnd - this.droneConfig.loopStart;
    const cycleTimer = setTimeout(
      () => this._cyclePlayer(noteId),
      (firstCycleDuration - totalAdvance) * 1000
    );

    this.activePlayers.set(noteId, { player, gain, cycleTimer });
  }

  /**
   * Detiene la reproduccion de una nota con fade-out controlado.
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
   * Detiene un player: cancela su cycleTimer, baja el gain suavemente con
   * un fade-out largo y programa el dispose tras el fade-out.
   * @param {string} noteId
   * @private
   */
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
   * Ajusta el volumen maestro.
   * @param {number} value - Valor entre 0 (silencio) y 1 (maximo)
   */
  setVolume(value) {
    const db = value === 0 ? -Infinity : Tone.gainToDb(value);
    this.volume.volume.value = db;
  }

  /**
   * Ajusta la velocidad de ataque/release modificando fadeIn y fadeOut.
   * @param {number} speed - Multiplicador de velocidad (ej: 0.5 = lento, 2 = rapido)
   */
  setSpeed(speed) {
    this.fadeInTime = this.droneConfig.fadeIn / speed;
    this.fadeOutTime = this.droneConfig.fadeOut / speed;
  }

  /**
   * Libera todos los recursos de audio: cancela timers, detiene players,
   * limpia buffers y desconecta el nodo de volumen.
   */
  dispose() {
    for (const noteId of [...this.activePlayers.keys()]) {
      const { player, gain, cycleTimer } = this.activePlayers.get(noteId);
      clearTimeout(cycleTimer);
      player.stop();
      player.dispose();
      gain.dispose();
    }
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

export default DroneSampleAudioManager;
