import { useEffect } from 'react';
import { APP_PATHS, SG16_PUBLIC_URL, normalizePath } from '../core/routes';

/** Public indexable paths — self-referencing canonical for Google. */
const PUBLIC_CANONICAL = new Set<string>([
  APP_PATHS.home,
  APP_PATHS.pricing,
  APP_PATHS.terms,
  APP_PATHS.privacy,
  APP_PATHS.contact,
  APP_PATHS.help,
]);

function ensureCanonicalLink(): HTMLLinkElement {
  let link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  return link;
}

function canonicalHrefForPath(pathname: string): string | null {
  const path = normalizePath(pathname);
  if (!PUBLIC_CANONICAL.has(path)) return null;
  if (path === APP_PATHS.home) return `${SG16_PUBLIC_URL}/`;
  return `${SG16_PUBLIC_URL}${path}`;
}

/** Keeps <link rel="canonical"> in sync with the current public route. */
export function SeoCanonical() {
  useEffect(() => {
    const sync = () => {
      const href = canonicalHrefForPath(window.location.pathname);
      if (!href) return;
      ensureCanonicalLink().setAttribute('href', href);
    };

    sync();
    window.addEventListener('popstate', sync);
    window.addEventListener('sg16:navigation', sync);
    return () => {
      window.removeEventListener('popstate', sync);
      window.removeEventListener('sg16:navigation', sync);
    };
  }, []);

  return null;
}
