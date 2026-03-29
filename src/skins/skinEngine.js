/**
 * @fileoverview Motor de aplicacion de skins.
 *
 * Aplica las CSS custom properties de un skin sobre :root y actualiza
 * el meta theme-color del navegador.
 */

/**
 * Aplica un skin seteando sus CSS custom properties en :root
 * y actualizando el meta theme-color del documento.
 * @param {object} skin - Objeto de definicion del skin
 */
export function applySkin(skin) {
  const root = document.documentElement;

  Object.entries(skin.cssVars).forEach(([prop, value]) => {
    root.style.setProperty(prop, value);
  });

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta && skin.meta?.themeColor) {
    meta.setAttribute('content', skin.meta.themeColor);
  }
}
