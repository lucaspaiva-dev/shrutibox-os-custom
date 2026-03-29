/**
 * @fileoverview Componente raiz del Shrutibox Digital.
 *
 * Muestra una pantalla de inicio con boton para activar el audio
 * (requisito del navegador), y luego renderiza el instrumento completo.
 *
 * El footer del instrumento muestra el credito de Monoj Kumar Sardar,
 * el link al perfil del autor (Lucas Paiva) y, si SHOW_VERSION esta activo
 * en featureFlags.js, la version actual del release.
 */

import { useCallback } from 'react';
import useShrutiStore from './store/useShrutiStore';
import useKeyboard from './hooks/useKeyboard';
import useTranslation from './i18n/useTranslation';
import { FEATURE_FLAGS } from './config/featureFlags';
import NoteGrid from './components/NoteGrid';
import Controls from './components/Controls';
import LanguageSelector from './components/LanguageSelector';
import SkinSelector from './components/SkinSelector';

function StartScreen({ onStart }) {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gradient-to-b from-sb-bg via-sb-bg-deep to-sb-bg-deep flex items-center justify-center p-6">
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <SkinSelector />
        <LanguageSelector />
      </div>

      <div className="text-center max-w-md space-y-8">
        <div className="space-y-3">
          <h1 className="text-4xl sm:text-5xl font-bold text-sb-text tracking-tight">
            {t('app.title')}
          </h1>
          <p className="text-sb-text-faint text-sm">
            {t('app.subtitle')}
          </p>
        </div>

        <div className="w-24 h-px bg-gradient-to-r from-transparent via-sb-text-faint/30 to-transparent mx-auto" />

        <p className="text-sb-text-mid/80 text-sm leading-relaxed">
          {t('start.description')}<br />
          {t('start.description2')}
        </p>

        <button
          onClick={onStart}
          className="px-10 py-5 bg-sb-accent hover:bg-sb-accent-hover text-sb-accent-ink font-bold text-lg rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-lg shadow-sb-accent/20"
        >
          {t('start.button')}
        </button>

        <p className="text-sb-text-faint/70 text-xs">
          {t('start.audioNote')}
        </p>
      </div>
    </div>
  );
}

function ShrutiboxApp() {
  useKeyboard();
  const { t } = useTranslation();
  const reset = useShrutiStore((s) => s.reset);

  return (
    <div className="min-h-screen bg-gradient-to-b from-sb-bg via-sb-bg-deep to-sb-bg-deep p-4 sm:p-6">
      <div className="max-w-4xl mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <button
            onClick={reset}
            className="flex items-center gap-1.5 text-sb-accent/80 hover:text-sb-accent-hover text-sm transition-colors active:scale-95"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-4 h-4"
            >
              <path
                fillRule="evenodd"
                d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10Z"
                clipRule="evenodd"
              />
            </svg>
            {t('nav.home')}
          </button>
          <div className="flex items-center gap-2">
            <SkinSelector />
            <LanguageSelector />
          </div>
        </div>

        <NoteGrid />
        <Controls />

        <footer className="text-center text-sb-text-faint/70 text-xs pt-2 pb-4 space-y-0.5">
          <div>{t('footer.text')}</div>
          <div>
            {t('footer.author')}{' '}
            <a
              href="https://github.com/lucaspaiva-dev"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-sb-text-faint transition-colors underline underline-offset-2"
            >
              Lucas Paiva
            </a>
            {FEATURE_FLAGS.SHOW_VERSION && (
              <span> · v{__APP_VERSION__}</span>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
}

export default function App() {
  const initialized = useShrutiStore((s) => s.initialized);
  const init = useShrutiStore((s) => s.init);

  const handleStart = useCallback(() => {
    init();
  }, [init]);

  if (!initialized) {
    return <StartScreen onStart={handleStart} />;
  }

  return <ShrutiboxApp />;
}
