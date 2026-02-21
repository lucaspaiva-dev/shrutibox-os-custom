/**
 * @fileoverview Hook de teclado para el Shrutibox.
 *
 * Mapea las teclas A-J a las 7 notas Sargam de la octava activa.
 * La barra espaciadora controla play/stop.
 * En el modelo toggle, cada pulsacion de tecla alterna la seleccion
 * de la nota (no se necesita keyup para desactivar).
 *
 * Teclas:
 * - A=Sa, S=Re, D=Ga, F=Ma, G=Pa, H=Dha, J=Ni
 * - Espacio = Play/Stop
 */

import { useEffect, useRef } from 'react';
import useShrutiStore from '../store/useShrutiStore';
import { KEYBOARD_MAP, getNotesForOctave } from '../audio/noteMap';
import { FEATURE_FLAGS } from '../config/featureFlags';

export default function useKeyboard() {
  const toggleNoteRef = useRef(null);
  const togglePlayRef = useRef(null);
  const octaveRef = useRef(3);

  useEffect(() => {
    toggleNoteRef.current = useShrutiStore.getState().toggleNote;
    togglePlayRef.current = useShrutiStore.getState().togglePlay;

    const unsubscribe = useShrutiStore.subscribe((state) => {
      toggleNoteRef.current = state.toggleNote;
      togglePlayRef.current = state.togglePlay;
      octaveRef.current = state.octave;
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!FEATURE_FLAGS.ENABLE_KEYBOARD) return;

    /** @param {KeyboardEvent} e */
    function handleKeyDown(e) {
      if (e.repeat) return;

      if (e.key === ' ') {
        e.preventDefault();
        togglePlayRef.current?.();
        return;
      }

      const noteIndex = KEYBOARD_MAP[e.key.toLowerCase()];
      if (noteIndex === undefined) return;

      const notes = getNotesForOctave(octaveRef.current);
      const note = notes[noteIndex];
      if (note) {
        toggleNoteRef.current?.(note.id);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);
}
