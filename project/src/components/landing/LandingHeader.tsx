import { useState } from 'react';
import { Lock, Menu, Rocket, X } from 'lucide-react';
import { SG16_BRAND } from '../../core/branding';
import { useAppStore } from '../../core/appState';
import { pushAppPath } from '../../core/routes';
import { Sg16Logo } from '../ui/Sg16Logo';

const NAV_LINKS = [
  { id: 'home', label: 'الرئيسية', href: '/' },
  { id: 'features', label: 'الميزات', href: '#features' },
  { id: 'pricing', label: 'الأسعار', href: '/pricing' },
  { id: 'help', label: 'المساعدة', href: '/help' },
  { id: 'about', label: 'من نحن', href: '/contact' },
] as const;

function BrandMark({ showCompany = true }: { showCompany?: boolean }) {
  return (
    <div className="landing-header-brand">
      <Sg16Logo className="landing-header-brand-logo" glow />
      <div className="landing-header-brand-text">
        <div className="landing-header-brand-title landing-brand-glow">SG16</div>
        <div className="landing-header-brand-sub">AI ENGINE</div>
        {showCompany ? (
          <div className="landing-header-brand-company">{SG16_BRAND.company}</div>
        ) : null}
      </div>
    </div>
  );
}

export function LandingHeader() {
  const openLoginModal = useAppStore((s) => s.openLoginModal);
  const [menuOpen, setMenuOpen] = useState(false);

  const onNav = (href: string) => {
    setMenuOpen(false);
    if (href.startsWith('#')) {
      document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    if (href === '/') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    pushAppPath(href);
  };

  return (
    <header className="landing-header sticky top-0 z-50 min-h-[70px] border-b border-white/[0.06] bg-black/85 backdrop-blur-2xl backdrop-saturate-150">
      <div className="mx-auto flex min-h-[70px] max-w-[1240px] items-center justify-between gap-4 px-4 sm:px-5 lg:px-6">
        <button type="button" onClick={() => onNav('/')} className="shrink-0">
          <BrandMark />
        </button>

        <nav className="hidden flex-1 items-center justify-center gap-8 lg:flex">
          {NAV_LINKS.map((link) => (
            <button
              key={link.id}
              type="button"
              onClick={() => onNav(link.href)}
              className={`text-[14px] font-medium transition ${
                link.id === 'home' ? 'text-[#7CFC00]' : 'text-white/60 hover:text-white'
              }`}
            >
              {link.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => openLoginModal()}
            className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.06] px-3 py-2 text-[13px] font-medium text-white/90 transition hover:bg-white/10"
          >
            <Lock className="h-3.5 w-3.5 text-[#7CFC00]" />
            تسجيل الدخول
          </button>
          <button
            type="button"
            onClick={() => openLoginModal()}
            className="hidden items-center gap-1.5 rounded-md bg-[#7CFC00] px-4 py-[9px] text-[13px] font-semibold text-black transition hover:bg-[#8dff20] sm:inline-flex"
          >
            <Rocket className="h-4 w-4" />
            ابدأ الآن
          </button>
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-md text-white/90 hover:bg-white/10 lg:hidden"
            onClick={() => setMenuOpen(true)}
            aria-label="فتح القائمة"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="fixed inset-0 z-[300] lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
            aria-label="إغلاق"
          />
          <div className="absolute right-0 top-0 h-full w-[min(88vw,320px)] border-l border-white/10 bg-[#050505] p-5 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <BrandMark showCompany={false} />
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="rounded-lg p-2 hover:bg-white/10"
                aria-label="إغلاق"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex flex-col gap-1">
              {NAV_LINKS.map((link) => (
                <button
                  key={link.id}
                  type="button"
                  onClick={() => onNav(link.href)}
                  className={`rounded-xl px-3 py-2.5 text-left text-sm font-medium ${
                    link.id === 'home' ? 'bg-[#7CFC00]/10 text-[#7CFC00]' : 'text-white/75 hover:bg-white/5'
                  }`}
                >
                  {link.label}
                </button>
              ))}
            </nav>
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                openLoginModal();
              }}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-md bg-[#7CFC00] py-3 text-sm font-bold text-black"
            >
              <Rocket className="h-4 w-4" />
              ابدأ الآن
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
