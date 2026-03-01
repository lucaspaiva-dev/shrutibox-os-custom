import { create } from 'zustand';
import { LOCALES_BY_ID, DEFAULT_LOCALE_ID } from './locales';

const STORAGE_KEY = 'shrutibox-language';

function getInitialLocale() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && LOCALES_BY_ID[stored]) return stored;
  } catch {
    /* localStorage unavailable */
  }
  return DEFAULT_LOCALE_ID;
}

const useLanguageStore = create((set) => ({
  locale: getInitialLocale(),

  setLocale: (localeId) => {
    if (!LOCALES_BY_ID[localeId]) return;
    try {
      localStorage.setItem(STORAGE_KEY, localeId);
    } catch {
      /* localStorage unavailable */
    }
    set({ locale: localeId });
  },
}));

export default useLanguageStore;
