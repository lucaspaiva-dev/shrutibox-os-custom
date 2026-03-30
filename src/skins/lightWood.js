/**
 * @fileoverview Skin "Madera Clara" — tema claro del Shrutibox Digital.
 *
 * Inspirado en la madera de arce/abedul (maple/birch), evocando un
 * shrutibox de acabado natural con tonos miel y crema calido.
 * Texto oscuro sobre fondos claros, con acentos ambar profundos.
 *
 * Paleta basada en armonía analoga calida (hue 28-40°) con escalera de
 * luminosidad invertida para fondo claro, cumpliendo WCAG AA:
 *   - text (L~6%): 13:1 sobre bg
 *   - text-mid (L~22%): 7:1
 *   - text-faint (L~34%): 5.2:1
 *   - accent (L~13%): 5.4:1
 */

export default {
  id: 'light-wood',
  name: 'Madera Clara',
  preview: '#e8d5b8',
  meta: {
    themeColor: '#c4956a',
  },
  cssVars: {
    '--sb-bg': '#f5e6cc',
    '--sb-bg-deep': '#d4c09a',

    '--sb-text': '#2c1810',
    '--sb-text-mid': '#5c3315',
    '--sb-text-faint': '#6b5540',

    '--sb-accent': '#9a4408',
    '--sb-accent-hover': '#7c3607',
    '--sb-accent-ink': '#ffffff',

    '--sb-chrome': '#b8946a',
    '--sb-border': '#9a7a50',
    '--sb-muted': '#7a5530',
    '--sb-neutral': '#ddd0bc',

    '--sb-play': '#059669',
    '--sb-stop': '#dc2626',
    '--sb-playing': '#16a34a',

    '--sb-body-1': 'hsl(35, 40%, 72%)',
    '--sb-body-2': 'hsl(33, 38%, 68%)',
    '--sb-body-3': 'hsl(30, 35%, 64%)',
    '--sb-body-shine': 'rgba(255, 245, 220, 0.3)',
    '--sb-body-highlight': 'rgba(255, 250, 235, 0.25)',
    '--sb-body-shadow-inset': 'rgba(0, 0, 0, 0.1)',
    '--sb-body-shadow-outer': 'rgba(0, 0, 0, 0.12)',

    '--sb-slot-start': '#1a1208',
    '--sb-slot-end': '#2a1e12',

    '--sb-reed-1': '#faf4e8',
    '--sb-reed-2': '#f4ecdc',
    '--sb-reed-3': '#eee4d0',
    '--sb-reed-4': '#e8dcc5',
    '--sb-reed-5': '#e2d4ba',
    '--sb-reed-border': 'rgba(165, 145, 115, 0.45)',

    '--sb-screw-1': '#d0cab8',
    '--sb-screw-2': '#b0a898',
    '--sb-screw-3': '#959080',
    '--sb-screw-4': '#807870',

    '--sb-slider-accent': '#9a4408',

    '--sb-focus-ring': '#9a4408',
  },
};
