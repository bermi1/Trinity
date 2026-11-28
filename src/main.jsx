import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import './styles/global.css';
import './styles/interactions.css';
import './styles/mobile.css';
import './styles/kit.css';
import './styles/calm.css';
import { startFitNumbers } from './lib/fitNumbers';

// The public event registration page (reached by scanning the QR code) needs no account and skips the office system.
const isRegister = /^\/register\/?$/.test(window.location.pathname);
const root = createRoot(document.getElementById('root'));
if (isRegister) import('./event/RegisterPublic').then(m => { const R = m.default; root.render(<StrictMode><ErrorBoundary><R /></ErrorBoundary></StrictMode>); });
else root.render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);

// Offline support and installability (production builds only).
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(err => console.warn('Service worker not registered', err)));
}

// Amounts always fit on one line (millions, billions): their font shrinks when space is short.
if (!isRegister) startFitNumbers(document.getElementById('root'));
