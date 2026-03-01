import useLanguageStore from '../i18n/useLanguageStore';
import { LOCALES } from '../i18n/locales';

export default function LanguageSelector() {
  const locale = useLanguageStore((s) => s.locale);
  const setLocale = useLanguageStore((s) => s.setLocale);

  return (
    <div className="flex gap-1">
      {LOCALES.map((loc) => (
        <button
          key={loc.id}
          onClick={() => setLocale(loc.id)}
          title={loc.name}
          className={`
            px-2 py-1 rounded text-xs font-bold transition-all
            ${
              loc.id === locale
                ? 'bg-amber-500 text-amber-950 shadow-sm'
                : 'bg-amber-900/40 text-amber-500/60 hover:bg-amber-800/50 hover:text-amber-400'
            }
          `}
        >
          {loc.label}
        </button>
      ))}
    </div>
  );
}
