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
      <footer className="landing-footer border-t-0 mt-0">
        <div className="landing-shell">
          <p className="mb-4 text-center text-[11px] leading-relaxed text-white/40 max-w-md mx-auto">
            Chat history stays on your device. Messages are processed through SG16 Secure Room — we do not store chat content on our servers.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[12px] text-white/45">
            <a href="/" className="hover:text-[#7CFC00] transition">
              Home
            </a>
            <a href="/help" className="hover:text-[#7CFC00] transition">
              Help
            </a>
            <a href="/privacy" className="hover:text-[#7CFC00] transition">
              Privacy
            </a>
            <a href="/terms" className="hover:text-[#7CFC00] transition">
              Terms
            </a>
            <a href="/contact" className="hover:text-[#7CFC00] transition">
              Contact
            </a>
            <a href={`mailto:${SG16_BRAND.contactEmail}`} className="hover:text-[#7CFC00] transition">
              {SG16_BRAND.contactEmail}
            </a>
          </div>
          <p className="mt-3 text-center text-[11px] text-white/35">
            © {new Date().getFullYear()} {SG16_BRAND.company}. All rights reserved.
          </p>
        </div>
      </footer>
      <GoogleLoginModal />
    </div>
  );
}
