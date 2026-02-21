/**
 * @fileoverview Grilla de notas del Shrutibox.
 *
 * Renderiza las notas organizadas por octava segun el modo seleccionado:
 * - Modo 1 octava (1oct): muestra solo la octava 3 (Mandra, C3)
 * - Modo 3 octavas (3oct): muestra octavas 3, 4, 5 + Sa superior
 *
 * Cada octava se presenta como una seccion con label y una grilla
 * de 7 columnas (una por nota Sargam).
 */

import NoteButton from './NoteButton';
import { NOTES } from '../audio/noteMap';
import useShrutiStore from '../store/useShrutiStore';

/** Configuracion de las 3 octavas disponibles con su label descriptivo. */
const OCTAVE_CONFIG = [
  { label: 'Octava 3 (Mandra)', num: 3 },
  { label: 'Octava 4 (Madhya)', num: 4 },
  { label: 'Octava 5 (Tara)', num: 5 },
];

export default function NoteGrid() {
  const currentOctave = useShrutiStore((s) => s.octave);
  const mode = useShrutiStore((s) => s.mode);

  const visibleOctaves =
    mode === '1oct'
      ? OCTAVE_CONFIG.filter((o) => o.num === 3)
      : OCTAVE_CONFIG;

  const upperSa = mode === '3oct' ? NOTES.filter((n) => n.id === 'sa_6') : [];

  return (
    <div className="space-y-4">
      {visibleOctaves.map((oct) => {
        const notes = NOTES.filter((n) => n.octave === oct.num);
        return (
          <div key={oct.num}>
            <div className="flex items-center gap-2 mb-2">
              <span
                className={`text-xs font-medium tracking-wide ${
                  oct.num === currentOctave
                    ? 'text-amber-400'
                    : 'text-amber-700/50'
                }`}
              >
                {oct.label}
              </span>
              {oct.num === currentOctave && (
                <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">
                  teclado activo
                </span>
              )}
            </div>
            <div className="grid grid-cols-7 gap-2">
              {notes.map((note, i) => (
                <NoteButton
                  key={note.id}
                  note={note}
                  index={i}
                  isCurrentOctave={oct.num === currentOctave}
                />
              ))}
            </div>
          </div>
        );
      })}

      {upperSa.length > 0 && (
        <div>
          <div className="text-xs font-medium tracking-wide text-amber-700/50 mb-2">
            Sa Superior
          </div>
          <div className="grid grid-cols-7 gap-2">
            <NoteButton note={upperSa[0]} index={7} isCurrentOctave={false} />
          </div>
        </div>
      )}
    </div>
  );
}
