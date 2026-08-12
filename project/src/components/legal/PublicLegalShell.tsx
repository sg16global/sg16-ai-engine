import { useEffect, useState } from 'react';
import { LandingHeader } from '../landing/LandingHeader';
import { GoogleLoginModal } from '../auth/GoogleLoginModal';
import { LegalDocumentView } from './LegalDocumentView';
import { legalSectionByPath, type LegalSection } from '../../content/legalContent';
import { pushAppPath } from '../../core/routes';
import { SiteFooter } from '../landing/SiteFooter';

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
      license: '/license',
    };
    setSection(next);
    pushAppPath(paths[next]);
  };

  return (
    <div className="landing-page min-h-[100dvh] bg-[#030308] text-white">
      <LandingHeader />
      <LegalDocumentView section={section} onSelectSection={selectSection} />
      <SiteFooter />
      <GoogleLoginModal />
    </div>
  );
}
