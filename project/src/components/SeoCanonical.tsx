import { useEffect } from 'react';
import { APP_PATHS, SG16_PUBLIC_URL, normalizePath } from '../core/routes';

/** Public indexable paths — self-referencing canonical for Google. */
const PUBLIC_CANONICAL = new Set<string>([
  APP_PATHS.home,
  APP_PATHS.pricing,
  APP_PATHS.terms,
  APP_PATHS.privacy,
  APP_PATHS.contact,
  APP_PATHS.license,
  APP_PATHS.help,
]);

/** Per-page search snippet, so Google does not show the home description on every page. */
const PAGE_DESCRIPTIONS: Record<string, string> = {
  [APP_PATHS.home]:
    'SG16 AI Engine — five shields in one secure app. AI Chat, Coding, Health, Student, and Market. No account needed. Chat stays on your device.',
  [APP_PATHS.pricing]: 'SG16 AI Engine plans and pricing — free during launch, with Student and Pro plans for the five shields.',
  [APP_PATHS.terms]: 'Terms of Service for SG16 AI Engine by Saif Tech Global LLC.',
  [APP_PATHS.privacy]:
    'How SG16 AI Engine handles your data — no account needed, and chat history stays on your device.',
  [APP_PATHS.contact]: 'Contact Saif Tech Global LLC, the company behind SG16 AI Engine.',
  [APP_PATHS.license]: 'SG16 AI Engine entity license and company verification for Saif Tech Global LLC.',
  [APP_PATHS.help]:
    'Help for SG16 AI Engine — how to start, use the five shields (AI Chat, Coding, Health, Student, Market), and get support.',
};

function ensureDescriptionMeta(): HTMLMetaElement {
  let meta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', 'description');
    document.head.appendChild(meta);
  }
  return meta;
}

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

/** Keeps <link rel="canonical"> and the meta description in sync with the current public route. */
export function SeoCanonical() {
  useEffect(() => {
    const sync = () => {
      const href = canonicalHrefForPath(window.location.pathname);
      if (!href) return;
      ensureCanonicalLink().setAttribute('href', href);
      const description = PAGE_DESCRIPTIONS[normalizePath(window.location.pathname)];
      if (description) ensureDescriptionMeta().setAttribute('content', description);
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
