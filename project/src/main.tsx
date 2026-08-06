import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

if (import.meta.env.DEV && 'serviceWorker' in navigator) {
  void navigator.serviceWorker.getRegistrations().then((regs) => {
    regs.forEach((reg) => void reg.unregister());
  });
}

/** Bump when public landing must break old phone/PWA cache. */
const SG16_CACHE_EPOCH = '20260806-bossss-hud-v5';

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  const epochKey = 'sg16-cache-epoch';
  if (localStorage.getItem(epochKey) !== SG16_CACHE_EPOCH) {
    localStorage.setItem(epochKey, SG16_CACHE_EPOCH);
    void navigator.serviceWorker.getRegistrations().then((regs) => {
      if (regs.length === 0) return;
      void Promise.all(regs.map((reg) => reg.unregister())).then(() => {
        window.location.reload();
      });
    });
  }
}

if (import.meta.env.PROD) {
  const updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      void updateSW(true);
      window.location.reload();
    },
    onRegistered(registration) {
      if (registration) {
        void registration.update();
      }
    },
    onRegisterError(error) {
      console.warn('SG16 PWA registration failed:', error);
    },
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
