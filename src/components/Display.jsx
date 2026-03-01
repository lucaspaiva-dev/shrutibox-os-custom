/**
 * @fileoverview Display informativo del Shrutibox.
 *
 * Muestra hasta 3 notas activas (nombre Sargam con variante),
 * indicador de estado de reproduccion y contador de notas activas.
 */

import useShrutiStore from '../store/useShrutiStore';
import { NOTES, NOTES_BY_ID } from '../audio/noteMap';
import useTranslation from '../i18n/useTranslation';

const NOTE_ORDER = Object.fromEntries(NOTES.map((n, i) => [n.id, i]));

export default function Display() {
  const selectedNotes = useShrutiStore((s) => s.selectedNotes);
  const playing = useShrutiStore((s) => s.playing);
  const { t } = useTranslation();

  const displayNotes = [...selectedNotes]
    .sort((a, b) => NOTE_ORDER[a] - NOTE_ORDER[b])
    .slice(0, 3)
    .map((id) => NOTES_BY_ID[id]);

  return (
    <div className="bg-amber-950/60 backdrop-blur-sm rounded-2xl border border-amber-800/40 px-4 sm:px-6 py-4 sm:py-5 text-center">
      <div className="flex items-center justify-center gap-3 mb-3">
        <span className="text-amber-400/60 text-xs uppercase tracking-widest font-medium">
          {t('app.title')}
        </span>
        {playing && (
          <span className="flex items-center gap-1.5 text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            {t('display.playing')}
          </span>
        )}
      </div>

      <div className="h-[72px] flex flex-col items-center justify-center">
        {displayNotes.length > 0 ? (
          <div className="text-3xl sm:text-4xl font-bold text-amber-100">
            {displayNotes.map((note, i) => (
              <span key={note.id}>
                {i > 0 && (
                  <span className="text-xl sm:text-2xl text-amber-500/50 mx-1 sm:mx-2">-</span>
                )}
                <span>{note.name}</span>
                {(note.variant === 'komal' || note.variant === 'tivra') && (
                  <span className="text-lg sm:text-xl text-amber-400/70">
                    {note.variant === 'komal' ? '♭' : '♯'}
                  </span>
                )}
              </span>
            ))}
          </div>
        ) : (
          <div className="text-amber-600/50 text-sm sm:text-lg italic">
            {t('display.selectNote')}
          </div>
        )}
      </div>

      {selectedNotes.length > 0 && (
        <div className="mt-2 text-amber-500/50 text-xs">
          {selectedNotes.length} {selectedNotes.length === 1 ? t('display.noteActive') : t('display.notesActive')}
        </div>
      )}
    </div>
  );
}
