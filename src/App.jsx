/**
 * @fileoverview Componente raiz del Shrutibox Digital.
 *
 * Renderiza la pantalla de inicio (StartScreen) donde el usuario
 * elige entre 1 o 3 octavas, y luego muestra el instrumento
 * (ShrutiboxApp) con la configuracion seleccionada.
 */

import { useCallback } from 'react';
import useShrutiStore from './store/useShrutiStore';
import useKeyboard from './hooks/useKeyboard';
import Display from './components/Display';
import NoteGrid from './components/NoteGrid';
import Controls from './components/Controls';

/**
 * Pantalla de bienvenida con selector de modo.
 * Ofrece dos opciones: shrutibox de 1 octava o 3 octavas.
 * Al seleccionar, inicializa el audio y carga el instrumento.
 * @param {{ onSelect: (mode: '1oct'|'3oct') => void }} props
 */
function StartScreen({ onSelect }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-950 via-stone-950 to-stone-950 flex items-center justify-center p-6">
      <div className="text-center max-w-md space-y-8">
        <div className="space-y-3">
          <h1 className="text-4xl sm:text-5xl font-bold text-amber-100 tracking-tight">
            Shrutibox Digital
          </h1>
          <p className="text-amber-500/60 text-sm">
            Monoj Kumar Sardar 440Hz
          </p>
        </div>

        <div className="w-24 h-px bg-gradient-to-r from-transparent via-amber-700/50 to-transparent mx-auto" />

        <p className="text-amber-300/50 text-sm leading-relaxed">
          Selecciona el tipo de shrutibox para comenzar.
          Activa las notas y luego presiona Play para reproducir el drone.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => onSelect('1oct')}
            className="px-8 py-4 bg-amber-500 hover:bg-amber-400 text-amber-950 font-bold text-lg rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-lg shadow-amber-500/20"
          >
            <span className="block text-2xl mb-1">1</span>
            <span className="text-sm font-medium">Octava</span>
          </button>

          <button
            onClick={() => onSelect('3oct')}
            className="px-8 py-4 bg-amber-600 hover:bg-amber-500 text-amber-950 font-bold text-lg rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-lg shadow-amber-600/20"
          >
            <span className="block text-2xl mb-1">3</span>
            <span className="text-sm font-medium">Octavas</span>
          </button>
        </div>

        <p className="text-amber-800/40 text-xs">
          Se requiere interaccion para activar el audio del navegador
        </p>
      </div>
    </div>
  );
}

/**
 * Componente principal del instrumento.
 * Renderiza el display, la grilla de notas y los controles.
 */
function ShrutiboxApp() {
  useKeyboard();
  const reset = useShrutiStore((s) => s.reset);

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-950 via-stone-950 to-stone-950 p-4 sm:p-6">
      <div className="max-w-2xl mx-auto space-y-5">
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
            Menú
          </button>
        </div>

        <Display />
        <NoteGrid />
        <Controls />

        <footer className="text-center text-amber-800/30 text-xs pt-2 pb-4">
          Shrutibox Digital &mdash; Monoj Kumar Sardar 440Hz
        </footer>
      </div>
    </div>
  );
}

/**
 * Componente raiz. Muestra StartScreen hasta que el usuario elija modo,
 * luego renderiza el instrumento.
 */
export default function App() {
  const initialized = useShrutiStore((s) => s.initialized);
  const init = useShrutiStore((s) => s.init);

  const handleSelect = useCallback(
    (mode) => {
      init(mode);
    },
    [init],
  );

  if (!initialized) {
    return <StartScreen onSelect={handleSelect} />;
  }

  return <ShrutiboxApp />;
}
