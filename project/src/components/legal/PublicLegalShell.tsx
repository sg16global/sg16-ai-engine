import { useEffect, useState } from 'react';
import { LandingHeader } from '../landing/LandingHeader';
import { GoogleLoginModal } from '../auth/GoogleLoginModal';
import { LegalDocumentView } from './LegalDocumentView';
import { legalSectionByPath, type LegalSection } from '../../content/legalContent';
import { pushAppPath } from '../../core/routes';
import { SG16_BRAND } from '../../core/branding';

export function PublicLegalShell() {
  const [section, setSection] = useState<LegalSection>(() => legalSectionByPath(window.location.pathname) ?? 'privacy');

  useEffect(() => {
    const sync = () => {
      const next = legalSectionByPath(window.location.pathname);
      if (next) setSection(next);
    };
    sync();
    window.addEventListener('popstate', sync);
    window.addEventListener('sg16:navigation', sync);
    return () => {
      window.removeEventListener('popstate', sync);
      window.removeEventListener('sg16:navigation', sync);
    };
  }, []);

  const selectSection = (next: LegalSection) => {
    const paths: Record<LegalSection, string> = {
      overview: '/help',
      privacy: '/privacy',
      terms: '/terms',
      contact: '/contact',
    };
    setSection(next);
    pushAppPath(paths[next]);
  };

  return (
    <div className="landing-page min-h-[100dvh] bg-[#030308] text-white">
      <LandingHeader />
      <LegalDocumentView section={section} onSelectSection={selectSection} />
      <footer className="border-t border-white/[0.08] px-4 py-6 text-center">
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[11px] text-[#00BFFF]/80">
          <a href="/" className="hover:text-white transition">
            Home
          </a>
          <a href="/privacy" className="hover:text-white transition">
            Privacy Policy
          </a>
          <a href="/terms" className="hover:text-white transition">
            Terms of Service
          </a>
          <a href="/contact" className="hover:text-white transition">
            Contact
          </a>
          <a href={`mailto:${SG16_BRAND.contactEmail}`} className="hover:text-white transition">
            {SG16_BRAND.contactEmail}
          </a>
        </div>
        <p className="mt-3 text-[10px] text-white/40">
          © {new Date().getFullYear()} {SG16_BRAND.company}
        </p>
      </footer>
      <GoogleLoginModal />
    </div>
  );
}
