/**
 * @fileoverview Skin "Madera Oscura" — tema oscuro del Shrutibox Digital.
 *
 * Inspirado en la madera de palisandro/sheesham del Shrutibox MKS original.
 * Fondos profundos ambar/piedra, texto claro, lenguetas marfil sobre
 * un panel de madera oscura. Es el skin por defecto.
 *
 * Paleta basada en armonía analoga calida (hue 25-42°) con escalera de
 * luminosidad diseñada para cumplir WCAG AA en todos los niveles de texto:
 *   - text (L~91%): 16:1 sobre bg-deep
 *   - text-mid (L~66%): 7.5:1
 *   - text-faint (L~52%): 6:1
 *   - accent (L~61%): 7.5:1
 */

export default {
  id: 'dark-wood',
  name: 'Madera Oscura',
  preview: '#1c1410',
  meta: {
    themeColor: '#78350f',
  },
  cssVars: {
    '--sb-bg': '#451a03',
    '--sb-bg-deep': '#0c0a09',

    '--sb-text': '#f5e6d0',
    '--sb-text-mid': '#d4a860',
    '--sb-text-faint': '#a08868',

    '--sb-accent': '#e8930a',
    '--sb-accent-hover': '#f5a623',
    '--sb-accent-ink': '#1c0f05',

    '--sb-chrome': '#5c3310',
    '--sb-border': '#7a4a1a',
    '--sb-muted': '#c47a30',
    '--sb-neutral': '#2a1f15',

    '--sb-play': '#10b981',
    '--sb-stop': '#ef4444',
    '--sb-playing': '#34d399',

    '--sb-body-1': 'hsl(30, 40%, 14%)',
    '--sb-body-2': 'hsl(28, 35%, 12%)',
    '--sb-body-3': 'hsl(25, 30%, 10%)',
    '--sb-body-shine': 'rgba(120, 80, 40, 0.15)',
    '--sb-body-highlight': 'rgba(200, 150, 80, 0.08)',
    '--sb-body-shadow-inset': 'rgba(0, 0, 0, 0.3)',
    '--sb-body-shadow-outer': 'rgba(0, 0, 0, 0.4)',

    '--sb-slot-start': '#050302',
    '--sb-slot-end': '#150e08',

    '--sb-reed-1': '#f0e8db',
    '--sb-reed-2': '#ebe3d4',
    '--sb-reed-3': '#e5dccc',
    '--sb-reed-4': '#dfd5c3',
    '--sb-reed-5': '#d9cfba',
    '--sb-reed-border': 'rgba(180, 165, 140, 0.4)',

    '--sb-screw-1': '#ccc5b5',
    '--sb-screw-2': '#a8a090',
    '--sb-screw-3': '#908878',
    '--sb-screw-4': '#787068',

    '--sb-slider-accent': '#e8930a',
  },
};
