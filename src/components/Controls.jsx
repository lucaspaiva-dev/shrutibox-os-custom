/**
 * @fileoverview Barra compacta de selección de instrumento.
 *
 * Desde la refactorización UI v2 (layout unificado mobile-first), este
 * componente contiene únicamente el selector de instrumento. Los controles
 * de Play/Stop y Volumen fueron movidos al panel principal en NoteGrid.jsx,
 * dentro de los mangos laterales inspirados en el instrumento físico MKS.
 *
 * Se renderiza debajo del panel principal como una barra horizontal compacta.
 */

import useShrutiStore from '../store/useShrutiStore';
import { FEATURE_FLAGS } from '../config/featureFlags';
import { INSTRUMENTS } from '../audio/instruments';
import useTranslation from '../i18n/useTranslation';

export default function Controls() {
  const instrumentId  = useShrutiStore((s) => s.instrumentId);
  const setInstrument = useShrutiStore((s) => s.setInstrument);
  const { t } = useTranslation();

  if (!FEATURE_FLAGS.ENABLE_INSTRUMENT_SELECTOR) return null;

  return (
    <div className="bg-sb-bg/50 backdrop-blur-sm rounded-xl border border-sb-border/30 px-4 py-2.5 flex items-center gap-3">
      <span className="text-[10px] text-sb-text-faint uppercase tracking-wider font-medium shrink-0">
        {t('controls.instrument')}
      </span>
      <div className="flex gap-2 flex-1">
        {INSTRUMENTS.map((inst) => (
          <button
            key={inst.id}
            onClick={() => setInstrument(inst.id)}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all active:scale-95 ${
              inst.id === instrumentId
                ? 'bg-sb-accent text-sb-accent-ink shadow-sm'
                : 'bg-sb-chrome/40 text-sb-text-faint hover:bg-sb-border/50 hover:text-sb-text-mid'
            }`}
          >
            {inst.name}
          </button>
        ))}
      </div>
    </div>
  );
}
