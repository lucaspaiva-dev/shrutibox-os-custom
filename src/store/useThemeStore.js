/**
 * @fileoverview Store global de tema/skin del Shrutibox Digital (Zustand).
 *
 * Gestiona el skin activo con persistencia en localStorage.
 * Al importarse, aplica automaticamente el skin guardado (o el default)
 * antes de que React renderice, evitando flashes de tema incorrecto.
 */

import { create } from 'zustand';
import { SKINS, SKINS_BY_ID, DEFAULT_SKIN_ID } from '../skins';
import { applySkin } from '../skins/skinEngine';

const STORAGE_KEY = 'shrutibox-skin';

function getInitialSkinId() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && SKINS_BY_ID[stored]) return stored;
  return DEFAULT_SKIN_ID;
}

const initialSkinId = getInitialSkinId();
applySkin(SKINS_BY_ID[initialSkinId]);

const useThemeStore = create((set) => ({
  skinId: initialSkinId,

  /**
   * Cambia el skin activo. Aplica las CSS vars inmediatamente
   * y persiste la eleccion en localStorage.
   * @param {string} skinId - ID del skin destino
   */
  setSkin: (skinId) => {
    const skin = SKINS_BY_ID[skinId];
    if (!skin) return;
    applySkin(skin);
    localStorage.setItem(STORAGE_KEY, skinId);
    set({ skinId });
  },

  /**
   * Alterna entre los skins disponibles (ciclo circular).
   * Con 2 skins funciona como toggle; con N skins avanza al siguiente.
   */
  toggleSkin: () => {
    const { skinId } = useThemeStore.getState();
    const currentIndex = SKINS.findIndex((s) => s.id === skinId);
    const nextIndex = (currentIndex + 1) % SKINS.length;
    const nextSkin = SKINS[nextIndex];
    applySkin(nextSkin);
    localStorage.setItem(STORAGE_KEY, nextSkin.id);
    set({ skinId: nextSkin.id });
  },
}));

export default useThemeStore;
