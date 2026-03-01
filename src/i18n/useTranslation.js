import { useCallback } from 'react';
import useLanguageStore from './useLanguageStore';
import { LOCALES_BY_ID } from './locales';

export default function useTranslation() {
  const locale = useLanguageStore((s) => s.locale);
  const translations = LOCALES_BY_ID[locale]?.translations ?? {};

  const t = useCallback(
    (key) => translations[key] ?? key,
    [translations],
  );

  return { t, locale };
}
