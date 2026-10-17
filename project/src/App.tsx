import { useEffect, useState } from 'react';


import { TopBar } from './components/layout/TopBar';

import { LaunchBanner } from './components/layout/LaunchBanner';
import { EngineOfflineBanner } from './components/layout/EngineOfflineBanner';
import { useEngineConnectionMonitor } from './lib/apiStatus';
import { WorkspaceChrome } from './components/layout/WorkspaceChrome';

import { LaunchSubscriptionModal } from './components/layout/LaunchSubscriptionModal';

import { Sidebar } from './components/layout/Sidebar';

import { MobileBottomNav } from './components/layout/MobileBottomNav';

import { MobileDrawer } from './components/layout/MobileDrawer';

import { HomePage } from './components/HomePage';

import { WorkspaceContainer } from './components/layout/WorkspaceContainer';

import { HistoryPanel } from './components/panels/HistoryPanel';

import { UserRoomPanel } from './components/panels/UserRoomPanel';

import { SettingsPanel } from './components/panels/SettingsPanel';

import { HelpPanel } from './components/panels/HelpPanel';

import { PricingPanel } from './components/panels/PricingPanel';

import { StudentVerifyPanel } from './components/panels/StudentVerifyPanel';

import { InstallPrompt } from './components/pwa/InstallPrompt';

import { SeoCanonical } from './components/SeoCanonical';

import { LandingPage } from './components/landing/LandingPage';

import { PublicLegalShell } from './components/legal/PublicLegalShell';
import { StagingWindow } from './staging/StagingWindow';

import { isPublicLegalPath } from './content/legalContent';

import { useAppStore } from './core/appState';

import { isAuthenticated } from './core/access';

import { APP_PATHS, normalizePath, pathToRoute, pushAppPath } from './core/routes';
import { loadAuthToken } from './lib/authApi';

import { useTrialSync } from './hooks/useTrialSync';

import type { WorkspaceType } from './core/types';
import { PilotOrb } from './components/pilot/PilotOrb';
import { skinForWorkspace } from './core/sectionThemes';



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

function isGuestAppRoute(pathname: string) {
  return normalizePath(pathname) === APP_PATHS.app;
}

function isWelcomeRoute(pathname: string) {
  return normalizePath(pathname) === APP_PATHS.welcome;
}



function AuthSplash() {

  return (

    <div className="sg16-app-shell flex min-h-[100dvh] items-center justify-center">

      <div className="h-10 w-10 animate-pulse rounded-full bg-[#FF168D]/20 shadow-[0_0_24px_rgba(255,22,141,0.35)]" />

    </div>

  );

}



function AppShell() {

  const currentWorkspace = useAppStore((state) => state.currentWorkspace);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const sectionSkin = skinForWorkspace(currentWorkspace);



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

      'user-room': 'My Room — SG16 AI Engine',

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

      case 'user-room':

        return <UserRoomPanel />;

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

  const isHome = currentWorkspace === 'home';
  /** Student Shield has its own internal sidebar/header — hide global chrome. */
  const isStudentShell = currentWorkspace === 'student-shield';
  const hideGlobalChrome = isHome || isStudentShell;
  const chromeAutoHide = !hideGlobalChrome;
  const workspaceChromeLabel =
    currentWorkspace === 'general'
      ? 'SG16 Chatting'
      : `${String(currentWorkspace).replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}`;
  const isChatWorkspace = !(
    ['home', 'user-room', 'history', 'settings', 'help', 'pricing', 'student-verify'] as WorkspaceType[]
  ).includes(currentWorkspace);



  /* AIO Shield Home: full-bleed, no sidebar/topbar chrome */
  if (isHome) {
    return (
      <div
        data-skin={sectionSkin}
        className="sg16-app-shell sg16-home-shell h-[100dvh] max-h-[100dvh] text-white overflow-hidden supports-[height:100dvh]:h-[100dvh]"
      >
        <HomePage />
        {/* Pilot opens from the Shield Home status bar — panel only, no floating launcher */}
        <PilotOrb launcher={false} />
        <LaunchSubscriptionModal />
        <InstallPrompt />
        <EngineOfflineBanner />
      </div>
    );
  }

  return (

    <div
      data-skin={sectionSkin}
      className={`sg16-app-shell sg16-workspace-shell sg16-skin-${sectionSkin} relative flex flex-col h-[100dvh] max-h-[100dvh] text-white overflow-hidden`}
    >
      <div className="sg16-workspace-frame sg16-chrome-auto relative z-[1] flex min-h-0 flex-1 w-full">

      {!hideGlobalChrome && <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />}

      {hideGlobalChrome ? (
        <div className={`sg16-work-panel flex flex-1 flex-col min-w-0 ${!isStudentShell ? 'sg16-work-field' : ''}`}>
          <main
            className={`flex-1 overscroll-contain mobile-scroll-main pb-0 min-h-0 ${
              isChatWorkspace || isStudentShell ? 'overflow-hidden' : 'overflow-auto'
            }`}
          >
            {mainContent()}
          </main>
        </div>
      ) : (
        <WorkspaceChrome
          workspaceKey={currentWorkspace}
          enabled={chromeAutoHide}
          workspaceLabel={workspaceChromeLabel}
          sidebar={({ onNavSelect }) => <Sidebar onNavSelect={onNavSelect} />}
          header={
            <>
              <TopBar onMenuClick={() => setDrawerOpen(true)} />
              <LaunchBanner />
            </>
          }
          mobileHeader={
            <>
              <TopBar onMenuClick={() => setDrawerOpen(true)} />
              <LaunchBanner />
            </>
          }
        >
          <main
            className={`flex-1 overscroll-contain mobile-scroll-main pb-[calc(4rem+env(safe-area-inset-bottom))] lg:pb-0 min-h-0 ${
              isChatWorkspace ? 'overflow-hidden' : 'overflow-auto'
            }`}
          >
            {mainContent()}
          </main>
        </WorkspaceChrome>
      )}

      </div>

      {!hideGlobalChrome && <MobileBottomNav />}

      <PilotOrb />

      <InstallPrompt />

      <LaunchSubscriptionModal />

      <EngineOfflineBanner />

    </div>

  );

}



function App() {

  const authUser = useAppStore((state) => state.authUser);

  const restoreAuthSession = useAppStore((state) => state.restoreAuthSession);

  const [authHydrated, setAuthHydrated] = useState(false);

  useEngineConnectionMonitor();

  const [pathname, setPathname] = useState(() =>

    typeof window !== 'undefined' ? window.location.pathname : APP_PATHS.home,

  );



  useEffect(() => {

    const hydrate = restoreAuthSession().finally(() => setAuthHydrated(true));
    const safety = window.setTimeout(() => setAuthHydrated(true), 15_000);
    void hydrate.finally(() => window.clearTimeout(safety));

  }, [restoreAuthSession]);

  const stagingOpen = useAppStore((state) => state.stagingOpen);
  const closeStaging = useAppStore((state) => state.closeStaging);
  const openStaging = useAppStore((state) => state.openStaging);

  // Staging Window query trigger: ?staging=1 or #staging
  useEffect(() => {
    const checkStaging = () => {
      const params = new URLSearchParams(window.location.search);
      if (params.get('staging') === '1' || params.get('staging') === 'true' || window.location.hash === '#staging') {
        openStaging();
      }
    };
    checkStaging();
    window.addEventListener('hashchange', checkStaging);
    return () => window.removeEventListener('hashchange', checkStaging);
  }, [openStaging]);

  // Direct preview: http://localhost:5173/?preview=1
  useEffect(() => {
    if (!authHydrated) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('preview') === '1' && !isAuthenticated(useAppStore.getState().authUser)) {
      void useAppStore.getState().startSession();
      params.delete('preview');
      const next = `${window.location.pathname}${params.toString() ? `?${params}` : ''}`;
      window.history.replaceState({}, '', next);
    }
  }, [authHydrated]);



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



  const showLanding = !isAuthenticated(authUser) && (isLandingRoute(pathname) || isWelcomeRoute(pathname));
  const showGuestApp = !isAuthenticated(authUser) && isGuestAppRoute(pathname);
  const showPublicLegal = !isAuthenticated(authUser) && isPublicLegalPath(pathname);
  const restoringSession =
    !authHydrated &&
    Boolean(loadAuthToken()) &&
    (isGuestAppRoute(pathname) || isLandingRoute(pathname));

  useEffect(() => {
    if (!authHydrated) return;
    if (isAuthenticated(authUser) && isLandingRoute(pathname)) {
      pushAppPath(APP_PATHS.app, true);
    }
  }, [authHydrated, authUser, pathname]);



  useEffect(() => {

    if (showLanding) {

      document.title = 'SG16 AI Engine — Most Powerful AI Engine';

    }

  }, [showLanding]);



  useEffect(() => {

    if (!showPublicLegal) return;

    const titles: Record<string, string> = {

      '/privacy': 'Privacy Policy — SG16 AI Engine',

      '/terms': 'Terms of Service — SG16 AI Engine',

      '/contact': 'Contact — SG16 AI Engine',
      '/license': 'License & Entity Verification — SG16 AI Engine',
      '/help': 'Help — SG16 AI Engine',

    };

    const key = pathname.replace(/\/+$/, '') || '/';

    document.title = titles[key] ?? 'SG16 AI Engine';

  }, [showPublicLegal, pathname]);



  if (restoringSession) {
    return (
      <>
        <SeoCanonical />
        <AuthSplash />
      </>
    );
  }

  if (!authHydrated && !isLandingRoute(pathname) && !isGuestAppRoute(pathname) && !isPublicLegalPath(pathname) && !isWelcomeRoute(pathname)) {
    return (
      <>
        <SeoCanonical />
        <AuthSplash />
      </>
    );
  }

  if (showPublicLegal) {
    return (
      <>
        <SeoCanonical />
        <PublicLegalShell />
        <StagingWindow isOpen={stagingOpen} onClose={closeStaging} />
      </>
    );
  }

  if (showLanding) {
    return (
      <>
        <SeoCanonical />
        <LandingPage />
        <InstallPrompt />
        <StagingWindow isOpen={stagingOpen} onClose={closeStaging} />
      </>
    );
  }

  if (showGuestApp) {
    return (
      <>
        <SeoCanonical />
        <AppShell />
        <StagingWindow isOpen={stagingOpen} onClose={closeStaging} />
      </>
    );
  }

  return (
    <>
      <SeoCanonical />
      <AppShell />
      <StagingWindow isOpen={stagingOpen} onClose={closeStaging} />
    </>
  );
}



export default App;


