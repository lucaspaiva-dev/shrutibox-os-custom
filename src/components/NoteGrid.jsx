/**
 * @fileoverview Panel frontal del Shrutibox — layout unificado v2.
 *
 * Unifica en un único panel inspirado en el frente del Shrutibox MKS físico:
 *
 *   ┌──────────────────────────────────────────────────────┐
 *   │  [visor: notas activas + badge "Sonando"]            │
 *   │  ─────────────────────────────────────────────────── │
 *   │  [mango-izq: NOTAS ⏻]  [13 lengüetas]  [▶ + vol |]  │
 *   │  ─────────────────────────────────────────────────── │
 *   └──────────────────────────────────────────────────────┘
 *
 * Mangos laterales:
 *   - Izquierdo: toggle ON/OFF "NOTAS" — activa el modo didáctico (etiquetas
 *     de nombre y equivalente occidental visibles en cada lengüeta).
 *   - Derecho: botón Play/Stop + slider de volumen vertical (fader físico).
 *
 * Los mangos imitan los mangos de fuelle del instrumento acústico real
 * (referencia visual: assets/shrutibox-frontal-mks-709df372-1768-4a8b-b639-4861a3be2ece.png).
 *
 * El visor inlinea la lógica que antes estaba en Display.jsx, eliminando
 * el contenedor separado para lograr una integración visual más compacta.
 */

import NoteButton from './NoteButton';
import { NOTES, NOTES_BY_ID } from '../audio/noteMap';
import useShrutiStore from '../store/useShrutiStore';
import useTranslation from '../i18n/useTranslation';

/** Orden cromático de las notas para ordenar el visor. */
const NOTE_ORDER = Object.fromEntries(NOTES.map((n, i) => [n.id, i]));

export default function NoteGrid() {
  const { t } = useTranslation();

  const viewMode      = useShrutiStore((s) => s.viewMode);
  const toggleViewMode = useShrutiStore((s) => s.toggleViewMode);
  const chorusEnabled  = useShrutiStore((s) => s.chorusEnabled);
  const toggleChorus   = useShrutiStore((s) => s.toggleChorus);
  const selectedNotes = useShrutiStore((s) => s.selectedNotes);
  const playing       = useShrutiStore((s) => s.playing);
  const togglePlay    = useShrutiStore((s) => s.togglePlay);
  const volume        = useShrutiStore((s) => s.volume);
  const setVolume     = useShrutiStore((s) => s.setVolume);

  const isDidactic = viewMode === 'didactic';

  /** Hasta 3 notas activas ordenadas cromáticamente para el visor. */
  const displayNotes = [...selectedNotes]
    .sort((a, b) => NOTE_ORDER[a] - NOTE_ORDER[b])
    .slice(0, 3)
    .map((id) => NOTES_BY_ID[id]);

  return (
    <div className="shrutibox-body rounded-2xl border-2 border-sb-chrome/60 overflow-hidden">

      {/* ── Visor de notas — altura fija para evitar saltos de layout ──────── */}
      <div className="px-3 sm:px-4 pt-3 pb-2">
        <div className="h-[72px] sm:h-[80px] flex flex-col items-center justify-center gap-1">

          {/* Fila 1 — notas activas o placeholder */}
          <div className="h-8 sm:h-9 flex items-center justify-center">
            {displayNotes.length > 0 ? (
              <div className="text-2xl sm:text-3xl font-bold text-sb-text leading-none">
                {displayNotes.map((note, i) => (
                  <span key={note.id}>
                    {i > 0 && (
                      <span className="text-base sm:text-xl text-sb-text-faint/50 mx-1">·</span>
                    )}
                    <span>{note.name}</span>
                    {(note.variant === 'komal' || note.variant === 'tivra') && (
                      <span className="text-sm sm:text-base text-sb-text-mid/80">
                        {note.variant === 'komal' ? '♭' : '♯'}
                      </span>
                    )}
                  </span>
                ))}
              </div>
            ) : (
              <div className="text-sb-text-faint/70 text-xs sm:text-sm italic tracking-wide">
                {t('display.selectNote')}
              </div>
            )}
          </div>

          {/* Fila 2 — contador de notas (siempre reserva espacio) */}
          <div className="h-[14px] flex items-center justify-center">
            {selectedNotes.length > 0 && (
              <span className="text-sb-text-faint/70 text-[10px]">
                {selectedNotes.length}{' '}
                {selectedNotes.length === 1
                  ? t('display.noteActive')
                  : t('display.notesActive')}
              </span>
            )}
          </div>

          {/* Fila 3 — indicador "Tocando" (siempre reserva espacio) */}
          <div className="h-[14px] flex items-center justify-center">
            {playing && (
              <span className="flex items-center gap-1 text-[9px] text-sb-playing">
                <span className="w-1 h-1 bg-sb-playing rounded-full animate-pulse" />
                {t('display.playing')}
              </span>
            )}
          </div>

        </div>
      </div>

      {/* Separador sutil */}
      <div className="mx-3 sm:mx-4 h-px bg-sb-border/30" />

      {/* ── Fila central: mango-izq | lengüetas | mango-der ──────────────── */}
      <div className="flex items-stretch px-2 sm:px-3 py-3 sm:py-4 gap-1.5 sm:gap-2">

        {/* Mango izquierdo — Toggle NOTAS + Toggle FX */}
        <div className="flex flex-col items-center justify-start gap-2 w-10 sm:w-12 shrink-0 rounded-lg bg-sb-chrome/25 border border-sb-border/20 py-2 pt-2.5">
          <span className={`text-[7px] sm:text-[8px] uppercase tracking-widest font-semibold leading-none transition-colors duration-300 ${
            isDidactic ? 'text-sb-accent' : 'text-sb-text-faint'
          }`}>
            {t('viewMode.title')}
          </span>

          <button
            onClick={toggleViewMode}
            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all duration-300 active:scale-90 ${
              isDidactic
                ? 'bg-sb-accent/20 text-sb-accent border border-sb-accent/40 shadow-sm shadow-sb-accent/10'
                : 'bg-sb-neutral/60 text-sb-text-faint/80 border border-sb-neutral/40'
            }`}
            aria-label={t('viewMode.label')}
            aria-pressed={isDidactic}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-3.5 h-3.5 sm:w-4 sm:h-4"
            >
              <path d="M12 2v6" />
              <path d="M4.93 4.93a10 10 0 1 0 14.14 0" />
            </svg>
          </button>

          {/* Separador */}
          <div className="w-5 h-px bg-sb-border/30" />

          {/* Toggle FX (Chorus) */}
          <span className={`text-[7px] sm:text-[8px] uppercase tracking-widest font-semibold leading-none transition-colors duration-300 ${
            chorusEnabled ? 'text-sb-accent' : 'text-sb-text-faint'
          }`}>
            {t('chorus.title')}
          </span>

          <button
            onClick={toggleChorus}
            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all duration-300 active:scale-90 ${
              chorusEnabled
                ? 'bg-sb-accent/20 text-sb-accent border border-sb-accent/40 shadow-sm shadow-sb-accent/10'
                : 'bg-sb-neutral/60 text-sb-text-faint/80 border border-sb-neutral/40'
            }`}
            aria-label={t('chorus.label')}
            aria-pressed={chorusEnabled}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-3.5 h-3.5 sm:w-4 sm:h-4"
            >
              <path d="M9 18V6" />
              <path d="M5 16v-4" />
              <path d="M13 18V4" />
              <path d="M17 16v-4" />
              <path d="M21 16V8" />
            </svg>
          </button>
        </div>

        {/* Área de lengüetas — 13 notas cromáticas */}
        <div className="flex items-end justify-center gap-0.5 sm:gap-1 flex-1 h-36 sm:h-44 overflow-x-auto pb-1">
          {NOTES.map((note) => (
            <NoteButton key={note.id} note={note} />
          ))}
        </div>

        {/* Mango derecho — Play/Stop + Volumen vertical */}
        <div className="flex flex-col items-center justify-start gap-2 w-10 sm:w-12 shrink-0 rounded-lg bg-sb-chrome/25 border border-sb-border/20 py-2 pt-2.5">

          {/* Botón Play / Stop */}
          <button
            onClick={togglePlay}
            className={`
              w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center
              transition-all duration-200 shadow-md active:scale-90 shrink-0
              ${playing
                ? 'bg-sb-stop shadow-sb-stop/30 scale-105'
                : 'bg-sb-play shadow-sb-play/30'
              }
            `}
            aria-label={playing ? t('controls.playing') : t('controls.play')}
          >
            {playing ? (
              <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                <polygon points="6,4 20,12 6,20" />
              </svg>
            )}
          </button>

          {/* Slider de volumen vertical — fader físico */}
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="volume-slider-vertical"
            aria-label={t('controls.volume')}
          />
        </div>
      </div>

      {/* Separador decorativo inferior */}
      <div className="mx-3 sm:mx-4 mb-3 h-1 rounded-full bg-gradient-to-r from-sb-border/20 via-sb-border/40 to-sb-border/20" />
    </div>
  );
}
