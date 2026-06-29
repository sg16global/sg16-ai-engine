import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import './index.css';

if (import.meta.env.DEV && 'serviceWorker' in navigator) {
  void navigator.serviceWorker.getRegistrations().then((regs) => {
    regs.forEach((reg) => void reg.unregister());
  });
}

if (import.meta.env.PROD) {
  registerSW({
    immediate: true,
    onRegistered(registration) {
      if (registration) {
        console.log('SG16 PWA service worker registered');
      }
    },
    onRegisterError(error) {
      console.warn('SG16 PWA registration failed:', error);
    },
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
