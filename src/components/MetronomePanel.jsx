/**
 * @fileoverview Controles inline del metrónomo — Shrutibox Digital.
 *
 * Componente compacto diseñado para integrarse dentro del visor de notas
 * sin agregar altura extra al layout. Dos filas ajustadas:
 *
 *   Fila 1 — Beats:  [−]  ①②③④  [+]  ··········  [▶/■]
 *   Fila 2 — Tempo:      ♩  [−]  120  [+]  Allegro
 *
 * Los indicadores de beat se comportan como LEDs circulares:
 * - Toque para alternar acento (beat fuerte).
 * - Durante la reproducción, el beat activo pulsa con un brillo cálido.
 * - Etiqueta de tempo italiana debajo del BPM.
 */

import { useRef, useCallback } from 'react';
import useMetronomeStore from '../store/useMetronomeStore';
import useTranslation from '../i18n/useTranslation';

const REPEAT_DELAY = 400;
const REPEAT_INTERVAL = 80;

const TEMPO_MARKS = [
  [60,  'Largo'],
  [80,  'Adagio'],
  [100, 'Andante'],
  [120, 'Moderato'],
  [140, 'Allegro'],
  [168, 'Vivace'],
  [Infinity, 'Presto'],
];

function getTempoMark(bpm) {
  for (const [threshold, label] of TEMPO_MARKS) {
    if (bpm < threshold) return label;
  }
  return 'Presto';
}

function useRepeatAction(action) {
  const delayRef = useRef(null);
  const intervalRef = useRef(null);

  const start = useCallback(() => {
    action();
    delayRef.current = setTimeout(() => {
      intervalRef.current = setInterval(action, REPEAT_INTERVAL);
    }, REPEAT_DELAY);
  }, [action]);

  const stop = useCallback(() => {
    clearTimeout(delayRef.current);
    clearInterval(intervalRef.current);
  }, []);

  return { onPointerDown: start, onPointerUp: stop, onPointerLeave: stop };
}

function pipSize(beats) {
  if (beats <= 4) return 'w-7 h-7 sm:w-8 sm:h-8 text-[10px] sm:text-xs';
  if (beats <= 6) return 'w-6 h-6 sm:w-7 sm:h-7 text-[9px] sm:text-[10px]';
  return 'w-5 h-5 sm:w-6 sm:h-6 text-[8px] sm:text-[9px]';
}

export default function MetronomePanel() {
  const { t } = useTranslation();

  const playing     = useMetronomeStore((s) => s.playing);
  const bpm         = useMetronomeStore((s) => s.bpm);
  const beats       = useMetronomeStore((s) => s.beats);
  const accents     = useMetronomeStore((s) => s.accents);
  const currentBeat = useMetronomeStore((s) => s.currentBeat);

  const togglePlaying = useMetronomeStore((s) => s.togglePlaying);
  const setBpm        = useMetronomeStore((s) => s.setBpm);
  const setBeats      = useMetronomeStore((s) => s.setBeats);
  const toggleAccent  = useMetronomeStore((s) => s.toggleAccent);

  const bpmUp   = useCallback(() => setBpm(bpm + 1), [bpm, setBpm]);
  const bpmDown = useCallback(() => setBpm(bpm - 1), [bpm, setBpm]);

  const bpmUpProps   = useRepeatAction(bpmUp);
  const bpmDownProps = useRepeatAction(bpmDown);

  const sizeClass = pipSize(beats);

  return (
    <div className="flex flex-col gap-1 sm:gap-1.5 w-full">

      {/* ── Fila 1: indicadores de beat + play ─────────── */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 sm:gap-1.5">
          <button
            onClick={() => setBeats(beats - 1)}
            disabled={beats <= 1}
            className="metronome-ctrl w-5 h-5 sm:w-6 sm:h-6 shrink-0"
            aria-label={`${t('metronome.beats')} −`}
          >
            <svg width="8" height="8" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="2" y1="5" x2="8" y2="5" />
            </svg>
          </button>

          <div className="flex gap-1 sm:gap-1.5">
            {Array.from({ length: beats }, (_, i) => {
              const isAccent = accents.includes(i);
              const isActive = playing && currentBeat === i;

              return (
                <button
                  key={i}
                  onClick={() => toggleAccent(i)}
                  className={[
                    'metronome-pip',
                    sizeClass,
                    isAccent ? 'metronome-pip--accent' : '',
                    isActive ? 'metronome-pip--active' : '',
                  ].filter(Boolean).join(' ')}
                  aria-label={`${t('metronome.accent')} ${i + 1}`}
                  aria-pressed={isAccent}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setBeats(beats + 1)}
            disabled={beats >= 8}
            className="metronome-ctrl w-5 h-5 sm:w-6 sm:h-6 shrink-0"
            aria-label={`${t('metronome.beats')} +`}
          >
            <svg width="8" height="8" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="2" y1="5" x2="8" y2="5" />
              <line x1="5" y1="2" x2="5" y2="8" />
            </svg>
          </button>
        </div>

        <button
          onClick={togglePlaying}
          className={`
            w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shrink-0
            transition-all duration-200 active:scale-90 shadow-md
            ${playing
              ? 'bg-sb-stop shadow-sb-stop/30 scale-105'
              : 'bg-sb-play shadow-sb-play/30'
            }
          `}
          aria-label={playing ? t('metronome.stop') : t('metronome.play')}
        >
          {playing ? (
            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="6" width="12" height="12" rx="2" />
            </svg>
          ) : (
            <svg className="w-3 h-3 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <polygon points="6,4 20,12 6,20" />
            </svg>
          )}
        </button>
      </div>

      {/* ── Fila 2: BPM + etiqueta de tempo ────────────── */}
      <div className="flex items-center justify-center gap-1.5 sm:gap-2">
        <span className="text-xs text-sb-text-faint/40 leading-none select-none" aria-hidden="true">♩</span>

        <button
          {...bpmDownProps}
          disabled={bpm <= 20}
          className="metronome-ctrl w-5 h-5 sm:w-6 sm:h-6 shrink-0"
          aria-label="−BPM"
        >
          <svg width="8" height="8" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="2" y1="5" x2="8" y2="5" />
          </svg>
        </button>

        <div className="flex flex-col items-center min-w-[36px]">
          <span className="text-sb-text font-bold text-sm sm:text-base tabular-nums leading-none">{bpm}</span>
          <span className="text-[6px] sm:text-[7px] text-sb-text-faint/40 uppercase tracking-[0.12em] font-medium mt-0.5 leading-none">
            {getTempoMark(bpm)}
          </span>
        </div>

        <button
          {...bpmUpProps}
          disabled={bpm >= 240}
          className="metronome-ctrl w-5 h-5 sm:w-6 sm:h-6 shrink-0"
          aria-label="+BPM"
        >
          <svg width="8" height="8" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="2" y1="5" x2="8" y2="5" />
            <line x1="5" y1="2" x2="5" y2="8" />
          </svg>
        </button>

        <span className="text-[8px] sm:text-[9px] text-sb-text-faint/40 uppercase tracking-[0.12em] font-semibold select-none">
          {t('metronome.bpm')}
        </span>
      </div>

    </div>
  );
}
