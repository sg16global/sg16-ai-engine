import { LandingBrandLogo } from './LandingBrandLogo';
import { SG16_BRAND } from '../../core/branding';

export function SiteFooter() {
  return (
    <footer className="landing-footer">
      <div className="landing-shell">
        <LandingBrandLogo compact className="landing-footer-logo mx-auto mb-4 opacity-90" />
        <p className="landing-footer-sovereign mx-auto mb-3 max-w-lg text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-[#7CFC00]/90">
          Sovereign brain · {SG16_BRAND.sovereignBrain} · {SG16_BRAND.sovereignLicense}
        </p>
        <p className="mx-auto mb-4 max-w-md text-center text-[11px] leading-relaxed text-white/40">
          Zero-Data Trace: chat content is processed in real time and not stored on our servers. History stays on
          your device. SG16 Secure Room on {SG16_BRAND.publicUrl.replace('https://', '')}.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[12px] text-white/45">
          <a href="/help" className="hover:text-[#7CFC00] transition">
            Help
          </a>
          <a href="/license" className="hover:text-[#7CFC00] transition">
            License
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
  );
}
