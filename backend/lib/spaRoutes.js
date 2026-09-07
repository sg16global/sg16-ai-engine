/**
 * Client-side paths that must receive the React shell with 200.
 * Keep in sync with project/src/core/routes.ts APP_PATHS.
 */
export const SPA_PATHS = new Set([
  '/',
  '/app',
  '/welcome',
  '/pricing',
  '/terms',
  '/privacy',
  '/contact',
  '/license',
  '/room',
  '/settings',
  '/help',
]);

export function normaliseSpaPath(pathname) {
  if (!pathname) return '/';
  const trimmed = String(pathname).replace(/\/+$/, '');
  return trimmed || '/';
}

export function isSpaPath(pathname) {
  return SPA_PATHS.has(normaliseSpaPath(pathname));
}
