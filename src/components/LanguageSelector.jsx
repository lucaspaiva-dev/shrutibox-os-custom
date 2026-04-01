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
                ? 'bg-sb-accent text-sb-accent-ink shadow-sm'
                : 'bg-sb-chrome/40 text-sb-text-faint hover:bg-sb-border/50 hover:text-sb-text-mid'
            }
          `}
        >
          {loc.label}
        </button>
      ))}
    </div>
  );
}
