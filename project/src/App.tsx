import { useEffect, useState } from 'react';
import { GoogleLoginModal } from './components/auth/GoogleLoginModal';
import { TopBar } from './components/layout/TopBar';
import { Sidebar } from './components/layout/Sidebar';
import { MobileBottomNav } from './components/layout/MobileBottomNav';
import { MobileDrawer } from './components/layout/MobileDrawer';
import { HomePage } from './components/HomePage';
import { WorkspaceContainer } from './components/layout/WorkspaceContainer';
import { HistoryPanel } from './components/panels/HistoryPanel';
import { SettingsPanel } from './components/panels/SettingsPanel';
import { HelpPanel } from './components/panels/HelpPanel';
import { PricingPanel } from './components/panels/PricingPanel';
import { StudentVerifyPanel } from './components/panels/StudentVerifyPanel';
import { InstallPrompt } from './components/pwa/InstallPrompt';
import { useAppStore } from './core/appState';
import { useTrialSync } from './hooks/useTrialSync';
import type { WorkspaceType } from './core/types';

function App() {
  const currentWorkspace = useAppStore((state) => state.currentWorkspace);
  const restoreAuthSession = useAppStore((state) => state.restoreAuthSession);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    restoreAuthSession();
  }, [restoreAuthSession]);

  useTrialSync();

  useEffect(() => {
    setDrawerOpen(false);
  }, [currentWorkspace]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ws = params.get('workspace');
    if (ws) {
      useAppStore.getState().setWorkspace(ws as WorkspaceType);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches;
    document.documentElement.classList.toggle('standalone', standalone);
    const onChange = (e: MediaQueryListEvent) => {
      document.documentElement.classList.toggle('standalone', e.matches);
    };
    window.matchMedia('(display-mode: standalone)').addEventListener('change', onChange);
    return () => window.matchMedia('(display-mode: standalone)').removeEventListener('change', onChange);
  }, []);

  const mainContent = () => {
    switch (currentWorkspace) {
      case 'home':
        return <HomePage />;
      case 'history':
        return <HistoryPanel />;
      case 'settings':
        return <SettingsPanel />;
      case 'help':
        return <HelpPanel />;
      case 'pricing':
        return <PricingPanel />;
      case 'student-verify':
        return <StudentVerifyPanel />;
      default:
        return <WorkspaceContainer />;
    }
  };

  return (
    <div className="flex h-[100dvh] bg-[#050507] text-white overflow-hidden">
      <Sidebar />

      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        <TopBar onMenuClick={() => setDrawerOpen(true)} />
        <main className="flex-1 overflow-auto overscroll-contain pb-[calc(4rem+env(safe-area-inset-bottom))] lg:pb-0">
          {mainContent()}
        </main>
      </div>

      <MobileBottomNav />
      <InstallPrompt />
      <GoogleLoginModal />
    </div>
  );
}

export default App;
