/**
 * @fileoverview Componente raiz del Shrutibox Digital.
 *
 * Muestra una pantalla de inicio con boton para activar el audio
 * (requisito del navegador), y luego renderiza el instrumento.
 */

import { useCallback } from 'react';
import useShrutiStore from './store/useShrutiStore';
import useKeyboard from './hooks/useKeyboard';
import useTranslation from './i18n/useTranslation';
import Display from './components/Display';
import NoteGrid from './components/NoteGrid';
import Controls from './components/Controls';
import LanguageSelector from './components/LanguageSelector';

function StartScreen({ onStart }) {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-950 via-stone-950 to-stone-950 flex items-center justify-center p-6">
      <div className="absolute top-4 right-4">
        <LanguageSelector />
      </div>

      <div className="text-center max-w-md space-y-8">
        <div className="space-y-3">
          <h1 className="text-4xl sm:text-5xl font-bold text-amber-100 tracking-tight">
            {t('app.title')}
          </h1>
          <p className="text-amber-500/60 text-sm">
            {t('app.subtitle')}
          </p>
        </div>

        <div className="w-24 h-px bg-gradient-to-r from-transparent via-amber-700/50 to-transparent mx-auto" />

        <p className="text-amber-300/50 text-sm leading-relaxed">
          {t('start.description')}<br />
          {t('start.description2')}
        </p>

        <button
          onClick={onStart}
          className="px-10 py-5 bg-amber-500 hover:bg-amber-400 text-amber-950 font-bold text-lg rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-lg shadow-amber-500/20"
        >
          {t('start.button')}
        </button>

        <p className="text-amber-800/40 text-xs">
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
    <div className="min-h-screen bg-gradient-to-b from-amber-950 via-stone-950 to-stone-950 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <button
            onClick={reset}
            className="flex items-center gap-1.5 text-amber-500/70 hover:text-amber-400 text-sm transition-colors active:scale-95"
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
          <LanguageSelector />
        </div>

        <Display />
        <NoteGrid />
        <Controls />

        <footer className="text-center text-amber-800/30 text-xs pt-2 pb-4">
          {t('footer.text')}
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
