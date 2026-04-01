/**
 * @fileoverview Registro central de skins del Shrutibox Digital.
 *
 * Para agregar un nuevo skin:
 * 1. Crear archivo en src/skins/ (ej: vintageWood.js)
 * 2. Importarlo aqui y agregarlo al array SKINS
 */

import darkWood from './darkWood';
import lightWood from './lightWood';

export const SKINS = [darkWood, lightWood];

export const SKINS_BY_ID = Object.fromEntries(
  SKINS.map((skin) => [skin.id, skin]),
);

export const DEFAULT_SKIN_ID = 'dark-wood';
