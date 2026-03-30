/**
 * @fileoverview Lengüeta del Shrutibox.
 *
 * Simula una lengüeta de marfil del frente de un shrutibox real.
 * Las notas shuddh cuelgan hacia abajo (tornillo arriba),
 * las komal/tivra se extienden hacia arriba (tornillo abajo).
 * Al activarse, la lengüeta rota lateralmente revelando la ranura.
 */

import { useCallback } from 'react';
import useShrutiStore from '../store/useShrutiStore';

export default function NoteButton({ note }) {
  const selectedNotes = useShrutiStore((s) => s.selectedNotes);
  const toggleNote = useShrutiStore((s) => s.toggleNote);
  const viewMode = useShrutiStore((s) => s.viewMode);

  const isSelected = selectedNotes.includes(note.id);
  const isAltered = note.variant === 'komal' || note.variant === 'tivra';
  const isDidactic = viewMode === 'didactic';

  const handleClick = useCallback(
    (e) => {
      e.preventDefault();
      toggleNote(note.id);
    },
    [note.id, toggleNote],
  );

  const reedStateClass = isSelected ? 'shrutibox-reed-open' : '';

  const directionClass = isAltered ? 'shrutibox-reed-up' : 'shrutibox-reed-down';

  return (
    <div className={`flex flex-col items-center ${isAltered ? 'self-start' : 'self-end'}`}>
      {/* Etiqueta didactica — arriba para lenguetas shuddh */}
      {!isAltered && (
        <div className={`flex flex-col items-center transition-all duration-300 overflow-hidden ${
          isDidactic ? 'opacity-100 max-h-10 mb-0.5' : 'opacity-0 max-h-0'
        }`}>
          <span className="text-[9px] sm:text-[11px] text-sb-text-mid font-semibold leading-none">
            {note.western.replace(/\d+$/, '')}
          </span>
        </div>
      )}

      {/* Contenedor de la lengueta */}
      <button
        onClick={handleClick}
        onContextMenu={(e) => e.preventDefault()}
        className={`relative cursor-pointer select-none touch-none w-7 sm:w-9 ${
          isAltered ? 'h-20 sm:h-24' : 'h-24 sm:h-28'
        }`}
        aria-label={note.western}
      >
        {/* Ranura oscura */}
        <div className="shrutibox-slot absolute inset-x-0.5 inset-y-1" />

        {/* Capsula de la lengueta */}
        <div className={`shrutibox-reed absolute inset-0 z-10 flex justify-center ${directionClass} ${reedStateClass} ${
          isAltered ? 'items-end pb-[20%]' : 'items-start pt-[20%]'
        }`}>
          <div className="shrutibox-screw" />
        </div>
      </button>

      {/* Etiqueta didactica — abajo para lenguetas komal/tivra */}
      {isAltered && (
        <div className={`flex flex-col items-center transition-all duration-300 overflow-hidden ${
          isDidactic ? 'opacity-100 max-h-10 mt-0.5' : 'opacity-0 max-h-0'
        }`}>
          <span className="text-[9px] sm:text-[11px] text-sb-text-mid font-semibold leading-none">
            {note.western.replace(/\d+$/, '')}
          </span>
        </div>
      )}
    </div>
  );
}
