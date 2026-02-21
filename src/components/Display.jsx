/**
 * @fileoverview Display informativo del Shrutibox.
 *
 * Muestra:
 * - La ultima nota seleccionada (nombre Sargam, notacion occidental, frecuencia)
 * - Indicador de estado de reproduccion (playing/stopped)
 * - Indicadores de octava activa para el teclado
 * - Contador de notas seleccionadas
 */

import useShrutiStore from '../store/useShrutiStore';
import { NOTES_BY_ID } from '../audio/noteMap';

export default function Display() {
  const selectedNotes = useShrutiStore((s) => s.selectedNotes);
  const octave = useShrutiStore((s) => s.octave);
  const playing = useShrutiStore((s) => s.playing);
  const mode = useShrutiStore((s) => s.mode);

  const lastNoteId = selectedNotes[selectedNotes.length - 1];
  const lastNote = lastNoteId ? NOTES_BY_ID[lastNoteId] : null;

  const octaveIndicators = mode === '1oct' ? [3] : [3, 4, 5];

  return (
    <div className="bg-amber-950/60 backdrop-blur-sm rounded-2xl border border-amber-800/40 px-6 py-5 text-center">
      <div className="flex items-center justify-center gap-3 mb-3">
        <span className="text-amber-400/60 text-xs uppercase tracking-widest font-medium">
          Shrutibox Digital
        </span>
        {playing && (
          <span className="flex items-center gap-1.5 text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            Sonando
          </span>
        )}
      </div>

      <div className="min-h-[72px] flex flex-col items-center justify-center">
        {lastNote ? (
          <>
            <div
              className={`text-5xl font-bold text-amber-100 ${playing ? 'animate-pulse' : ''}`}
            >
              {lastNote.name}
            </div>
            <div className="flex items-center gap-3 mt-2 text-amber-300/70 text-sm">
              <span>
                {lastNote.western}
                {lastNote.octave}
              </span>
              <span className="w-1 h-1 rounded-full bg-amber-500/50" />
              <span>{lastNote.frequency} Hz</span>
            </div>
          </>
        ) : (
          <div className="text-amber-600/50 text-lg italic">
            Selecciona una nota...
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center justify-center gap-2">
        <span className="text-amber-500/50 text-xs">Octava</span>
        {octaveIndicators.map((o) => (
          <span
            key={o}
            className={`w-6 h-6 rounded-full text-xs flex items-center justify-center font-bold transition-all ${
              o === octave
                ? 'bg-amber-500 text-amber-950'
                : 'bg-amber-900/40 text-amber-600/50'
            }`}
          >
            {o}
          </span>
        ))}
        {selectedNotes.length > 0 && (
          <>
            <span className="w-1 h-1 rounded-full bg-amber-500/30 mx-1" />
            <span className="text-amber-500/50 text-xs">
              {selectedNotes.length} {selectedNotes.length === 1 ? 'nota' : 'notas'}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
