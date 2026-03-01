/**
 * @fileoverview Panel frontal del Shrutibox.
 *
 * Renderiza las 13 notas cromaticas como lengüetas dispuestas
 * en patron alternado (shuddh abajo, komal/tivra arriba),
 * simulando el frente de un shrutibox acustico real.
 * Incluye un interruptor de modo minimalista/didactico.
 */

import NoteButton from './NoteButton';
import { NOTES } from '../audio/noteMap';
import useShrutiStore from '../store/useShrutiStore';
import useTranslation from '../i18n/useTranslation';

export default function NoteGrid() {
  const { t } = useTranslation();
  const viewMode = useShrutiStore((s) => s.viewMode);
  const toggleViewMode = useShrutiStore((s) => s.toggleViewMode);

  return (
    <div className="shrutibox-body rounded-2xl border-2 border-amber-900/60 p-4 sm:p-6">
      <div className="text-center mb-4">
        <span className="text-[10px] sm:text-xs text-amber-600/40 uppercase tracking-[0.2em] font-medium">
          {t('noteGrid.label')}
        </span>
      </div>

      <div className="flex items-center gap-3 sm:gap-5">
        {/* Interruptor de modo */}
        <div className="flex flex-col items-center gap-1.5 shrink-0">
          <span className={`text-[7px] sm:text-[9px] uppercase tracking-wider font-medium transition-colors duration-300 leading-tight text-center ${
            viewMode === 'didactic' ? 'text-amber-400' : 'text-amber-700/40'
          }`}>
            {t('viewMode.didactic')}
          </span>

          <button
            onClick={toggleViewMode}
            className="relative w-5 h-10 sm:w-6 sm:h-12 rounded-full bg-stone-900/80 border border-stone-700/50 cursor-pointer shadow-inner"
            aria-label={t('viewMode.label')}
          >
            <div className={`
              absolute inset-x-0.5 h-4 sm:h-5 rounded-full
              bg-gradient-to-b from-amber-400 to-amber-600
              shadow-md shadow-amber-500/20
              transition-all duration-300 ease-out
              ${viewMode === 'minimalist' ? 'bottom-0.5' : 'top-0.5'}
            `} />
          </button>

          <span className={`text-[7px] sm:text-[9px] uppercase tracking-wider font-medium transition-colors duration-300 leading-tight text-center ${
            viewMode === 'minimalist' ? 'text-amber-400' : 'text-amber-700/40'
          }`}>
            {t('viewMode.minimalist')}
          </span>
        </div>

        {/* Panel de lenguetas */}
        <div className="flex items-end justify-center gap-0.5 sm:gap-1 h-36 sm:h-44 flex-1 overflow-x-auto pb-1">
          {NOTES.map((note) => (
            <NoteButton key={note.id} note={note} />
          ))}
        </div>
      </div>

      <div className="mt-4 h-1 rounded-full bg-gradient-to-r from-amber-900/20 via-amber-800/40 to-amber-900/20" />
    </div>
  );
}
