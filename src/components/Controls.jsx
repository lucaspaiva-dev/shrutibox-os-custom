/**
 * @fileoverview Panel de controles del Shrutibox.
 *
 * Incluye:
 * - Boton Play/Stop: activa/desactiva la reproduccion del drone
 * - Volumen: control deslizante de 0 a 100%
 * - Selector de octava: elige la octava activa para el teclado (3, 4, 5)
 * - Velocidad: ajusta la velocidad del envelope (attack/release)
 *
 * Los controles de octava y velocidad estan condicionados por feature flags.
 */

import useShrutiStore from '../store/useShrutiStore';
import { FEATURE_FLAGS } from '../config/featureFlags';

export default function Controls() {
  const volume = useShrutiStore((s) => s.volume);
  const setVolume = useShrutiStore((s) => s.setVolume);
  const octave = useShrutiStore((s) => s.octave);
  const setOctave = useShrutiStore((s) => s.setOctave);
  const speed = useShrutiStore((s) => s.speed);
  const setSpeed = useShrutiStore((s) => s.setSpeed);
  const playing = useShrutiStore((s) => s.playing);
  const togglePlay = useShrutiStore((s) => s.togglePlay);
  const selectedNotes = useShrutiStore((s) => s.selectedNotes);
  const mode = useShrutiStore((s) => s.mode);

  const octaveOptions = mode === '1oct' ? [3] : [3, 4, 5];

  return (
    <div className="bg-amber-950/60 backdrop-blur-sm rounded-2xl border border-amber-800/40 p-5 space-y-5">
      {/* Play / Stop */}
      <div className="flex flex-col items-center gap-3">
        <button
          onClick={togglePlay}
          className={`
            w-20 h-20 rounded-full flex items-center justify-center
            transition-all duration-200 shadow-lg
            ${
              playing
                ? 'bg-red-500 hover:bg-red-400 shadow-red-500/30 scale-105'
                : 'bg-emerald-500 hover:bg-emerald-400 shadow-emerald-500/30'
            }
            active:scale-95
          `}
        >
          {playing ? (
            <svg
              className="w-8 h-8 text-white"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <rect x="6" y="6" width="12" height="12" rx="2" />
            </svg>
          ) : (
            <svg
              className="w-8 h-8 text-white ml-1"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <polygon points="6,4 20,12 6,20" />
            </svg>
          )}
        </button>
        <span className="text-xs text-amber-400/70 uppercase tracking-wider font-medium">
          {playing ? 'Reproduciendo' : 'Play'}
          {!playing && selectedNotes.length > 0 && (
            <span className="text-amber-500/50 normal-case">
              {' '}
              ({selectedNotes.length} {selectedNotes.length === 1 ? 'nota' : 'notas'})
            </span>
          )}
        </span>
      </div>

      <div className="w-full h-px bg-amber-800/30" />

      {/* Volumen */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label className="text-xs text-amber-400/70 uppercase tracking-wider font-medium">
            Volumen
          </label>
          <span className="text-xs text-amber-500 font-mono">
            {Math.round(volume * 100)}%
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={(e) => setVolume(parseFloat(e.target.value))}
          className="w-full h-2 rounded-full appearance-none bg-amber-900/60 accent-amber-500 cursor-pointer"
        />
      </div>

      {/* Selector de octava para teclado */}
      {FEATURE_FLAGS.ENABLE_OCTAVE_SELECTOR && octaveOptions.length > 1 && (
        <div className="space-y-2">
          <label className="text-xs text-amber-400/70 uppercase tracking-wider font-medium block">
            Octava (teclado)
          </label>
          <div className="flex gap-2">
            {octaveOptions.map((o) => (
              <button
                key={o}
                onClick={() => setOctave(o)}
                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                  o === octave
                    ? 'bg-amber-500 text-amber-950 shadow-md'
                    : 'bg-amber-900/40 text-amber-500/60 hover:bg-amber-800/50'
                }`}
              >
                {o}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Velocidad */}
      {FEATURE_FLAGS.ENABLE_SPEED_CONTROL && (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-xs text-amber-400/70 uppercase tracking-wider font-medium">
              Velocidad
            </label>
            <span className="text-xs text-amber-500 font-mono">
              {speed.toFixed(1)}x
            </span>
          </div>
          <input
            type="range"
            min="0.25"
            max="3"
            step="0.25"
            value={speed}
            onChange={(e) => setSpeed(parseFloat(e.target.value))}
            className="w-full h-2 rounded-full appearance-none bg-amber-900/60 accent-amber-500 cursor-pointer"
          />
        </div>
      )}
    </div>
  );
}
