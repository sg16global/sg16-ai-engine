import { useState } from 'react';
import { Lock, Menu, Rocket, X } from 'lucide-react';
import { useAppStore } from '../../core/appState';
import { pushAppPath } from '../../core/routes';

const NAV_LINKS = [
  { id: 'home', label: 'Home', href: '/' },
  { id: 'features', label: 'Features', href: '#features' },
  { id: 'use-cases', label: 'Use Cases', href: '#features' },
  { id: 'pricing', label: 'Pricing', href: '/pricing' },
  { id: 'docs', label: 'Docs', href: '/help' },
  { id: 'api', label: 'API', href: '/help' },
  { id: 'blog', label: 'Blog', href: '/help' },
  { id: 'about', label: 'About', href: '/help' },
] as const;

function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`text-center ${compact ? '' : 'lg:text-left'}`}>
      <div className="text-[22px] font-black leading-none tracking-wide text-[#7CFC00] landing-brand-glow sm:text-2xl lg:text-[26px]">
        SG16
      </div>
      <div className="mt-0.5 text-[9px] font-semibold tracking-[0.28em] text-white/90 sm:text-[10px]">
        AI ENGINE
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
    <header className="landing-header sticky top-0 z-50 border-b border-white/[0.06] bg-black/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-[1280px] items-center justify-between gap-3 px-3 sm:h-16 sm:px-5 lg:px-8">
        {/* Mobile menu */}
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-lg text-white/90 hover:bg-white/10 lg:hidden"
          onClick={() => setMenuOpen(true)}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Desktop logo */}
        <button type="button" onClick={() => onNav('/')} className="hidden shrink-0 lg:block">
          <BrandMark />
        </button>

        {/* Mobile center logo */}
        <button type="button" onClick={() => onNav('/')} className="lg:hidden">
          <BrandMark compact />
        </button>

        {/* Desktop nav */}
        <nav className="hidden flex-1 items-center justify-center gap-5 xl:gap-7 lg:flex">
          {NAV_LINKS.map((link) => (
            <button
              key={link.id}
              type="button"
              onClick={() => onNav(link.href)}
              className={`landing-nav-link text-[13px] font-medium transition ${
                link.id === 'home' ? 'landing-nav-active text-[#7CFC00]' : 'text-white/65 hover:text-white'
              }`}
            >
              {link.label}
            </button>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => openLoginModal()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#7CFC00]/45 px-2.5 py-1.5 text-[11px] font-semibold text-[#7CFC00] transition hover:bg-[#7CFC00]/10 sm:px-3 sm:text-xs lg:rounded-xl lg:px-4 lg:py-2 lg:text-[13px]"
          >
            <Lock className="h-3.5 w-3.5" />
            Login
          </button>
          <button
            type="button"
            onClick={() => openLoginModal()}
            className="hidden items-center gap-1.5 rounded-xl bg-[#7CFC00] px-4 py-2 text-[13px] font-bold text-black transition hover:bg-[#8dff20] sm:inline-flex"
          >
            <Rocket className="h-4 w-4" />
            Get Started
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-[300] lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
            aria-label="Close menu"
          />
          <div className="absolute left-0 top-0 h-full w-[min(88vw,320px)] border-r border-white/10 bg-[#0a0a0a] p-5 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <BrandMark />
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="rounded-lg p-2 hover:bg-white/10"
                aria-label="Close"
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
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#7CFC00] py-3 text-sm font-bold text-black"
            >
              <Rocket className="h-4 w-4" />
              Get Started
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
