/**
 * @fileoverview Panel de diagnóstico de audio — solo para debugging en iOS/iPad.
 *
 * Muestra el estado interno del AudioContext y del store en tiempo real.
 * Útil para depurar problemas de audio en dispositivos móviles donde no
 * hay acceso directo a las DevTools del navegador.
 *
 * ## Cómo activarlo
 *
 * El panel está oculto por defecto. Para mostrarlo, hacer triple-tap sobre
 * el footer de la app (el área de créditos). Tocar de nuevo lo oculta.
 *
 * ## Alternativa: Safari Remote Inspector
 *
 * Para depuración completa (consola JS, red, errores):
 *   1. iPhone/iPad: Ajustes → Safari → Avanzado → Inspector Web (activar)
 *   2. Conectar el dispositivo al Mac con cable USB
 *   3. Mac: Safari → menú Desarrollar → [nombre del dispositivo] → [página]
 *
 * @see src/audio/IOS_AUDIO_COMPAT.md
 */

import { useState, useEffect, useRef } from 'react';
import * as Tone from 'tone';
import useShrutiStore from '../store/useShrutiStore';

/**
 * Lee el estado del AudioContext en tiempo real.
 * @returns {{ contextState: string, toneState: string }}
 */
function useAudioContextState() {
  const [contextState, setContextState] = useState('unknown');
  const [toneState, setToneState] = useState('unknown');

  useEffect(() => {
    function update() {
      try {
        const rawCtx = Tone.getContext().rawContext;
        setContextState(rawCtx.state);
        setToneState(Tone.getContext().state);
      } catch {
        setContextState('error');
        setToneState('error');
      }
    }

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return { contextState, toneState };
}

function StateTag({ value }) {
  const color =
    value === 'running'
      ? 'text-green-400 bg-green-400/10 border-green-400/30'
      : value === 'suspended'
        ? 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30'
        : 'text-red-400 bg-red-400/10 border-red-400/30';

  return (
    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${color}`}>
      {value}
    </span>
  );
}

/**
 * Panel de diagnóstico de audio. Se muestra como overlay fijo en la
 * parte inferior de la pantalla cuando `visible` es true.
 */
export function AudioDebugPanel() {
  const { contextState, toneState } = useAudioContextState();
  const initialized = useShrutiStore((s) => s.initialized);
  const playing = useShrutiStore((s) => s.playing);
  const instrumentId = useShrutiStore((s) => s.instrumentId);
  const selectedNotes = useShrutiStore((s) => s.selectedNotes);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-3 bg-black/90 border-t border-white/10 text-[11px] font-mono text-white/80 space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-white/40 text-[9px] uppercase tracking-wider">Audio Debug</span>
        <span className="text-white/30 text-[9px]">triple-tap footer para cerrar</span>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        <div className="flex items-center gap-1.5">
          <span className="text-white/50">AudioContext</span>
          <StateTag value={contextState} />
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-white/50">Tone ctx</span>
          <StateTag value={toneState} />
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-white/50">initialized</span>
          <StateTag value={initialized ? 'true' : 'false'} />
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-white/50">playing</span>
          <StateTag value={playing ? 'true' : 'false'} />
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-white/50">instrument</span>
          <span className="text-white/70">{instrumentId ?? '—'}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-white/50">notes</span>
          <span className="text-white/70">{selectedNotes.length}</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Hook que agrega el gesto de triple-tap a un elemento para alternar
 * la visibilidad del panel de debug.
 *
 * @returns {{ debugVisible: boolean, tapHandlers: object }}
 */
export function useAudioDebugTrigger() {
  const [debugVisible, setDebugVisible] = useState(false);
  const tapCount = useRef(0);
  const tapTimer = useRef(null);

  const tapHandlers = {
    onClick: () => {
      tapCount.current += 1;
      clearTimeout(tapTimer.current);
      tapTimer.current = setTimeout(() => {
        if (tapCount.current >= 3) {
          setDebugVisible((v) => !v);
        }
        tapCount.current = 0;
      }, 400);
    },
  };

  return { debugVisible, tapHandlers };
}
