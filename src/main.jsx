/**
 * @fileoverview Punto de entrada de la aplicacion Shrutibox Digital.
 * Monta el componente raiz App en el elemento #root del DOM.
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import './store/useThemeStore';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
