import { useState } from 'react';
import { ArrowUpRight, Building2, FileCheck, Globe, Mail, MapPin, ShieldCheck } from 'lucide-react';
import { LandingBrandLogo } from './LandingBrandLogo';
import { SG16_BRAND } from '../../core/branding';
import { useAppStore } from '../../core/appState';
import { pushAppPath } from '../../core/routes';
import { CompanyCertificateModal } from '../company/CompanyCertificateModal';

type FooterLink = { label: string; href?: string; action?: 'tour' | 'staging' };

const PRODUCT_LINKS: FooterLink[] = [
  { label: 'Start Tour', action: 'tour' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Staging Lab (24/7 AI)', action: 'staging' },
  { label: 'Help Center', href: '/help' },
];

const COMPANY_LINKS: FooterLink[] = [
  { label: 'Entity License', href: '/license' },
  { label: 'Contact', href: '/contact' },
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Terms of Service', href: '/terms' },
];

/** Public footer — brand, navigation, and official contact details. */
export function SiteFooter() {
  const [certModalOpen, setCertModalOpen] = useState(false);
  const enterGuestTour = useAppStore((s) => s.enterGuestTour);
  const openStaging = useAppStore((s) => s.openStaging);

  const follow = (link: FooterLink) => {
    if (link.action === 'tour') enterGuestTour();
    else if (link.action === 'staging') openStaging();
    else if (link.href) {
      pushAppPath(link.href);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const renderLinks = (links: FooterLink[]) => (
    <ul className="lp-sitefoot__links">
      {links.map((link) => (
        <li key={link.label}>
          <button type="button" onClick={() => follow(link)}>
            {link.label}
          </button>
        </li>
      ))}
    </ul>
  );

  return (
    <footer className="lp-sitefoot" id="contact">
      <div className="lp-container">
        <div className="lp-sitefoot__grid">
          <div className="lp-sitefoot__brand">
            <LandingBrandLogo />
            <p>
              Sovereign Artificial Intelligence — five shields for chat, code, health, study and markets, in one
              private workspace.
            </p>
            <button type="button" onClick={() => setCertModalOpen(true)} className="lp-sitefoot__cert">
              <ShieldCheck className="h-4 w-4 text-[#38D9A9]" />
              <FileCheck className="h-4 w-4" />
              Certificate of Organization · Verified
            </button>
          </div>

          <nav aria-label="Product">
            <h3 className="lp-sitefoot__title">Product</h3>
            {renderLinks(PRODUCT_LINKS)}
          </nav>

          <nav aria-label="Company">
            <h3 className="lp-sitefoot__title">Company</h3>
            {renderLinks(COMPANY_LINKS)}
          </nav>

          <address className="lp-sitefoot__contact">
            <h3 className="lp-sitefoot__title">Contact</h3>
            <a href={`mailto:${SG16_BRAND.contactEmail}`}>
              <Mail />
              <span>{SG16_BRAND.contactEmail}</span>
            </a>
            <a href={SG16_BRAND.companyUrl} target="_blank" rel="noopener noreferrer">
              <Globe />
              <span>
                {SG16_BRAND.companyUrl.replace('https://', '')}
                <ArrowUpRight className="ml-1 inline h-3 w-3" />
              </span>
            </a>
            <p>
              <Building2 />
              <span>
                {SG16_BRAND.company}
                <small>
                  Filing ID #{SG16_BRAND.businessId} · {SG16_BRAND.jurisdiction}
                </small>
              </span>
            </p>
            <p>
              <MapPin />
              <span>{SG16_BRAND.registeredAddress}</span>
            </p>
          </address>
        </div>

        <div className="lp-sitefoot__bar">
          <span>
            © {new Date().getFullYear()} {SG16_BRAND.company}. All rights reserved.
          </span>
          <span>Zero-Data Trace — chat history stays on your device.</span>
        </div>
      </div>

      <CompanyCertificateModal isOpen={certModalOpen} onClose={() => setCertModalOpen(false)} />
    </footer>
  );
}
