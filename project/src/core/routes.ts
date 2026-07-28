import type { HelpSection, WorkspaceType } from './types';

export const SG16_PUBLIC_URL = 'https://sg16engine.com';

/** Clean URLs for Google, checkout, and footer links. */
export const APP_PATHS = {
  home: '/',
  /** Shield Home — work homepage (guest tour or signed-in app). */
  app: '/app',
  pricing: '/pricing',
  terms: '/terms',
  privacy: '/privacy',
  contact: '/contact',
  settings: '/settings',
  help: '/help',
} as const;

type RouteTarget = {
  workspace: WorkspaceType;
  helpSection?: HelpSection;
};

const PATH_ROUTES: Record<string, RouteTarget> = {
  [APP_PATHS.home]: { workspace: 'home' },
  [APP_PATHS.app]: { workspace: 'home' },
  [APP_PATHS.pricing]: { workspace: 'pricing' },
  [APP_PATHS.terms]: { workspace: 'help', helpSection: 'terms' },
  [APP_PATHS.privacy]: { workspace: 'help', helpSection: 'privacy' },
  [APP_PATHS.contact]: { workspace: 'help', helpSection: 'contact' },
  [APP_PATHS.settings]: { workspace: 'settings' },
  [APP_PATHS.help]: { workspace: 'help', helpSection: 'overview' },
};

export function normalizePath(pathname: string): string {
  const trimmed = pathname.replace(/\/+$/, '');
  return trimmed || APP_PATHS.home;
}

export function pathToRoute(pathname: string): RouteTarget | null {
  return PATH_ROUTES[normalizePath(pathname)] ?? null;
}

export function routeToPath(workspace: WorkspaceType, helpSection?: HelpSection): string | null {
  if (workspace === 'home') return APP_PATHS.app;
  if (workspace === 'pricing') return APP_PATHS.pricing;
  if (workspace === 'settings') return APP_PATHS.settings;
  if (workspace === 'help') {
    if (helpSection === 'terms') return APP_PATHS.terms;
    if (helpSection === 'privacy') return APP_PATHS.privacy;
    if (helpSection === 'contact') return APP_PATHS.contact;
    return APP_PATHS.help;
  }
  return null;
}

export function pushAppPath(path: string, replace = false) {
  if (typeof window === 'undefined') return;
  const normalized = normalizePath(path);
  if (normalizePath(window.location.pathname) === normalized) return;

  const state = { sg16Path: normalized };
  if (replace) {
    window.history.replaceState(state, '', normalized);
  } else {
    window.history.pushState(state, '', normalized);
  }
  window.dispatchEvent(new Event('sg16:navigation'));
}

export function applyRouteFromBrowser() {
  const route = pathToRoute(window.location.pathname);
  if (!route) return false;
  return route;
}
