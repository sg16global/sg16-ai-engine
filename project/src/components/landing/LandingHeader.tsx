import { useState } from 'react';
import {
  Menu,
  Rocket,
  X,
  Home,
  Sparkles,
  CreditCard,
  ShieldCheck,
  HelpCircle,
  Mail,
  Award,
  UserRound,
  FlaskConical,
} from 'lucide-react';
import { useAppStore } from '../../core/appState';
import { pushAppPath } from '../../core/routes';
import { LandingBrandLogo } from './LandingBrandLogo';

const NAV_LINKS = [
  { id: 'home', label: 'Home', href: '/', icon: Home },
  { id: 'features', label: 'Features', href: '#features', icon: Sparkles },
  { id: 'pricing', label: 'Pricing', href: '/pricing', icon: CreditCard },
  { id: 'certificate', label: 'Entity License', href: '/license', icon: ShieldCheck },
  { id: 'help', label: 'Help', href: '/help', icon: HelpCircle },
  { id: 'about', label: 'Contact', href: '/contact', icon: Mail },
] as const;

function BrandMark() {
  return <LandingBrandLogo compact />;
}

interface LandingHeaderProps {
  onOpenMemorial?: () => void;
}

export function LandingHeader({ onOpenMemorial }: LandingHeaderProps) {
  const startSession = useAppStore((s) => s.startSession);
  const goToHome = useAppStore((s) => s.goToHome);
  const enterGuestTour = useAppStore((s) => s.enterGuestTour);
  const openStaging = useAppStore((s) => s.openStaging);
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
    <header className="lp-header">
      <div className="lp-container lp-header__row">
        <button type="button" onClick={() => onNav('/')} className="shrink-0 transition-opacity hover:opacity-90">
          <BrandMark />
        </button>

        <nav className="lp-nav hidden min-[1440px]:flex" aria-label="Primary">
          {NAV_LINKS.map((link) => {
            const Icon = link.icon;
            const isHome = link.id === 'home';
            return (
              <button
                key={link.id}
                type="button"
                onClick={() => onNav(link.href)}
                className={`lp-nav__item ${isHome ? 'lp-nav__item--active' : ''}`}
                aria-current={isHome ? 'page' : undefined}
              >
                <Icon />
                <span>{link.label}</span>
              </button>
            );
          })}
          {onOpenMemorial && (
            <button
              type="button"
              onClick={onOpenMemorial}
              className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#FF5CB8] hover:text-white transition px-2.5 py-1 rounded-lg bg-[#FF168D]/10 border border-[#FF168D]/30 hover:bg-[#FF168D]/20"
            >
              <Award className="w-3.5 h-3.5 text-[#FF168D]" />
              <span>AI Pioneers</span>
            </button>
          )}
        </nav>

        <div className="flex items-center gap-2.5 sm:gap-4">
          <span className="lp-dot hidden lg:block" aria-hidden />
          <button
            type="button"
            onClick={() => openStaging()}
            className="lp-btn lp-btn--sm lp-btn--outline hidden lg:inline-flex"
            title="Open Next-Gen Staging & 24/7 AI Support"
          >
            <FlaskConical className="h-4 w-4 text-[#FF168D]" />
            <span>Staging Lab</span>
            <span className="lp-btn__tag">24/7 AI</span>
          </button>
          <button type="button" onClick={() => startSession(goToHome)} className="lp-btn lp-btn--sm lp-btn--ghost">
            <UserRound className="h-4 w-4" />
            <span>Enter</span>
          </button>
          <button
            type="button"
            onClick={() => enterGuestTour()}
            className="lp-btn lp-btn--sm lp-btn--primary hidden sm:inline-flex !px-5"
          >
            <Rocket className="h-4 w-4" />
            <span>Start Tour</span>
          </button>
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#29202F] bg-[#0A0A12] text-white/90 hover:border-[#60304F] hover:bg-[#12121D] min-[1440px]:hidden"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="fixed inset-0 z-[300] min-[1440px]:hidden">
          <div
            className="fixed inset-0 bg-black/85 backdrop-blur-md"
            onClick={() => setMenuOpen(false)}
            aria-hidden
          />
          <div className="fixed top-0 right-0 bottom-0 w-full max-w-xs border-l border-[#29202F] bg-[#050509] p-6 shadow-2xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#29202F]">
                <BrandMark />
                <button
                  type="button"
                  onClick={() => setMenuOpen(false)}
                  className="p-2 text-white/70 hover:text-white"
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-2">
                {NAV_LINKS.map((link) => {
                  const Icon = link.icon;
                  const isHome = link.id === 'home';
                  return (
                    <button
                      key={link.id}
                      type="button"
                      onClick={() => onNav(link.href)}
                      className={`flex w-full items-center gap-3 py-2.5 px-3 rounded-lg text-sm font-medium transition ${
                        isHome
                          ? 'bg-[#191321] text-[#FF168D] border border-[#FF168D]/40'
                          : 'text-white/80 hover:text-white hover:bg-[#0A0A12]'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isHome ? 'text-[#FF168D]' : 'text-white/50'}`} />
                      <span>{link.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-6 border-t border-[#29202F] space-y-3">
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  openStaging();
                }}
                className="lp-btn lp-btn--outline w-full py-2.5 text-sm lg:hidden"
              >
                <span className="lp-dot" />
                <span>Staging Lab</span>
                <span className="lp-btn__tag">24/7 AI</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  enterGuestTour();
                }}
                className="lp-btn lp-btn--primary w-full py-3 text-sm"
              >
                <Rocket className="w-4 h-4" />
                <span>Start Tour</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  startSession(goToHome);
                }}
                className="w-full flex items-center justify-center gap-2 rounded-lg border border-[#29202F] bg-[#0A0A12] py-2.5 text-sm font-medium text-white hover:border-[#60304F]"
              >
                <UserRound className="w-4 h-4 text-[#FF168D]" />
                <span>Enter</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
