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

import { LandingPage } from './components/landing/LandingPage';

import { useAppStore } from './core/appState';

import { isAuthenticated } from './core/access';

import { APP_PATHS, normalizePath, pathToRoute } from './core/routes';

import { useTrialSync } from './hooks/useTrialSync';

import type { WorkspaceType } from './core/types';



function applyBrowserRoute() {

  const route = pathToRoute(window.location.pathname);

  if (route) {

    useAppStore.setState({

      currentWorkspace: route.workspace,

      helpSection: route.helpSection ?? useAppStore.getState().helpSection,

      error: null,

    });

    return true;

  }

  return false;

}



function isLandingRoute(pathname: string) {

  return normalizePath(pathname) === APP_PATHS.home;

}



function AuthSplash() {

  return (

    <div className="flex min-h-[100dvh] items-center justify-center bg-[#030308]">

      <div className="h-10 w-10 animate-pulse rounded-full bg-emerald-500/20 shadow-[0_0_24px_rgba(57,255,20,0.3)]" />

    </div>

  );

}



function AppShell() {

  const currentWorkspace = useAppStore((state) => state.currentWorkspace);

  const [drawerOpen, setDrawerOpen] = useState(false);



  useTrialSync();



  useEffect(() => {

    setDrawerOpen(false);

  }, [currentWorkspace]);



  useEffect(() => {

    if (!applyBrowserRoute()) {

      const params = new URLSearchParams(window.location.search);

      const ws = params.get('workspace');

      if (ws) {

        useAppStore.getState().setWorkspace(ws as WorkspaceType);

        window.history.replaceState({}, '', window.location.pathname);

      }

    }



    const onPopState = () => {

      applyBrowserRoute();

    };

    window.addEventListener('popstate', onPopState);

    return () => window.removeEventListener('popstate', onPopState);

  }, []);



  useEffect(() => {

    const titles: Partial<Record<WorkspaceType, string>> = {

      home: 'SG16 AI Engine',

      pricing: 'Pricing — SG16 AI Engine',

      help: 'Help — SG16 AI Engine',

      settings: 'Settings — SG16 AI Engine',

    };

    document.title = titles[currentWorkspace] ?? 'SG16 AI Engine';

  }, [currentWorkspace]);



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



function App() {

  const authUser = useAppStore((state) => state.authUser);

  const restoreAuthSession = useAppStore((state) => state.restoreAuthSession);

  const [authHydrated, setAuthHydrated] = useState(false);

  const [pathname, setPathname] = useState(() =>

    typeof window !== 'undefined' ? window.location.pathname : APP_PATHS.home,

  );



  useEffect(() => {

    void restoreAuthSession().finally(() => setAuthHydrated(true));

  }, [restoreAuthSession]);



  useEffect(() => {
    const syncPath = () => setPathname(window.location.pathname);
    syncPath();
    window.addEventListener('popstate', syncPath);
    window.addEventListener('sg16:navigation', syncPath);
    return () => {
      window.removeEventListener('popstate', syncPath);
      window.removeEventListener('sg16:navigation', syncPath);
    };
  }, []);



  const showLanding = authHydrated && !isAuthenticated(authUser) && isLandingRoute(pathname);



  useEffect(() => {

    if (showLanding) {

      document.title = 'SG16 AI Engine — Most Powerful AI Engine';

    }

  }, [showLanding]);



  if (!authHydrated && isLandingRoute(pathname)) {

    return <AuthSplash />;

  }



  if (showLanding) {

    return <LandingPage />;

  }



  return <AppShell />;

}



export default App;


