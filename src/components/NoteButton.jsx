/**
 * @fileoverview Boton individual de nota del Shrutibox.
 *
 * Cada boton representa una nota Sargam y funciona como toggle:
 * - Click para seleccionar (activar) la nota
 * - Click de nuevo para deseleccionarla
 *
 * Estados visuales:
 * - No seleccionada: fondo oscuro (amber-900)
 * - Seleccionada + sin sonar: fondo medio con borde (amber-600)
 * - Seleccionada + sonando (playing): fondo brillante (amber-400)
 *
 * @param {{ note: object, index: number, isCurrentOctave: boolean }} props
 * @param {object} props.note - Objeto nota con id, name, western, octave, frequency
 * @param {number} props.index - Indice de la nota dentro de su octava (0-6)
 * @param {boolean} props.isCurrentOctave - Si la nota pertenece a la octava activa del teclado
 */

import { useCallback } from 'react';
import useShrutiStore from '../store/useShrutiStore';

const KEYBOARD_LABELS = ['A', 'S', 'D', 'F', 'G', 'H', 'J'];

export default function NoteButton({ note, index, isCurrentOctave }) {
  const selectedNotes = useShrutiStore((s) => s.selectedNotes);
  const playing = useShrutiStore((s) => s.playing);
  const toggleNote = useShrutiStore((s) => s.toggleNote);

  const isSelected = selectedNotes.includes(note.id);
  const isSounding = isSelected && playing;

  const handleClick = useCallback(
    (e) => {
      e.preventDefault();
      toggleNote(note.id);
    },
    [note.id, toggleNote],
  );

  return (
    <button
      onClick={handleClick}
      onContextMenu={(e) => e.preventDefault()}
      className={`
        relative select-none touch-none
        rounded-xl border-2 transition-all duration-150 ease-out
        flex flex-col items-center justify-center
        min-h-[64px] sm:min-h-[72px]
        cursor-pointer active:scale-95
        ${
          isSounding
            ? 'bg-amber-400 border-amber-300 text-amber-950 shadow-lg shadow-amber-400/30 scale-[1.03] animate-pulse'
            : isSelected
              ? 'bg-amber-600/70 border-amber-500/60 text-amber-100 shadow-md shadow-amber-600/20 scale-[1.01]'
              : 'bg-amber-900/50 border-amber-800/40 text-amber-200 hover:bg-amber-800/60 hover:border-amber-700/50'
        }
      `}
    >
      <span className="text-lg sm:text-xl font-bold leading-none">
        {note.name}
      </span>
      <span
        className={`text-[10px] mt-1 ${
          isSounding
            ? 'text-amber-800'
            : isSelected
              ? 'text-amber-300/70'
              : 'text-amber-500/60'
        }`}
      >
        {note.western}
        {note.octave}
      </span>
      {isCurrentOctave && index < 7 && (
        <span
          className={`absolute -bottom-0.5 text-[9px] font-mono ${
            isSounding
              ? 'text-amber-700'
              : isSelected
                ? 'text-amber-300/50'
                : 'text-amber-700/40'
          }`}
        >
          {KEYBOARD_LABELS[index]}
        </span>
      )}
    </button>
  );
}
