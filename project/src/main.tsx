import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AppTitleBar } from './components/layout/AppTitleBar';
import './index.css';

if (import.meta.env.DEV && 'serviceWorker' in navigator) {
  void navigator.serviceWorker.getRegistrations().then((regs) => {
    regs.forEach((reg) => void reg.unregister());
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppTitleBar />
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
