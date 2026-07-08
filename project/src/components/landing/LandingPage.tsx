import {
  MessageSquare,
  Image as ImageIcon,
  Code2,
  Play,
  Shield,
  Lock,
  Globe,
  Star,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';
import { SG16_BRAND } from '../../core/branding';
import { SG16_PUBLIC_URL } from '../../core/routes';
import { Sg16Logo } from '../ui/Sg16Logo';
import { OptimizedImage } from '../ui/OptimizedImage';
import { LandingGoogleSignIn } from './LandingGoogleSignIn';
import { LandingHeader } from './LandingHeader';
import './landingStyles.css';

const HERO_BACKGROUND = '/landing/hero-background.png';

const featureCards = [
  { icon: MessageSquare, title: 'AI Chat', desc: 'Smart conversations powered by SG16', slot: 'tl' },
  { icon: Code2, title: 'AI Coding', desc: 'Generate, debug & optimize code', slot: 'tr' },
  { icon: ImageIcon, title: 'AI Image', desc: 'Create stunning AI generated images', slot: 'bl' },
  { icon: Play, title: 'AI Video', desc: 'Generate high quality AI videos', slot: 'br' },
] as const;

const trustCards = [
  { icon: Shield, title: 'Trusted Technology', desc: 'Reliable. Secure. Advanced.' },
  { icon: Star, title: 'Verified Platform', desc: 'Official. Verified. Trusted.' },
  { icon: Globe, title: 'Global Standard', desc: 'Built for everyone, everywhere.' },
  { icon: Lock, title: 'Secure Future', desc: 'Protecting your data, empowering tomorrow.' },
] as const;

function FeatureCard({
  icon: Icon,
  title,
  desc,
  compact = false,
  className = '',
}: {
  icon: typeof MessageSquare;
  title: string;
  desc: string;
  compact?: boolean;
  className?: string;
}) {
  return (
    <div className={`landing-glass ${compact ? 'p-2.5 sm:p-3' : 'p-4 sm:p-[18px]'} ${className}`}>
      <div className={`flex items-start ${compact ? 'gap-2' : 'gap-3'}`}>
        <div
          className={`flex shrink-0 items-center justify-center rounded-lg border border-[#00BFFF]/35 bg-[#00BFFF]/8 ${
            compact ? 'h-8 w-8 sm:h-9 sm:w-9' : 'h-11 w-11 rounded-xl'
          }`}
        >
          <Icon className={`landing-icon-blue ${compact ? 'h-3.5 w-3.5 sm:h-4 sm:w-4' : 'h-5 w-5'}`} strokeWidth={1.75} />
        </div>
        <div className="min-w-0 pt-0.5">
          <h3 className={`font-bold text-white leading-tight ${compact ? 'text-[11px] sm:text-xs' : 'text-[15px]'}`}>
            {title}
          </h3>
          <p
            className={`mt-0.5 font-light text-white/55 leading-snug ${
              compact ? 'text-[9px] sm:text-[10px] line-clamp-2' : 'mt-1 text-[12px]'
            }`}
          >
            {desc}
          </p>
        </div>
      </div>
    </div>
  );
}

function HeroBackground() {
  return (
    <section className="landing-hero-wrap px-0 sm:px-1" aria-label="SG16 AI Engine">
      <div className="relative" id="features">
        <OptimizedImage
          src={HERO_BACKGROUND}
          alt="SG16 — Most Powerful AI Engine. Powered by SG16 Engine."
          className="landing-hero-img"
          width={1100}
          height={900}
          fetchPriority="high"
          decoding="async"
        />
        <div className="landing-hero-fade" aria-hidden />

        {/* Desktop feature orbit */}
        <div className="landing-feature-orbit hidden lg:block">
          {featureCards.map((f) => (
            <FeatureCard
              key={f.title}
              icon={f.icon}
              title={f.title}
              desc={f.desc}
              className={`landing-feature-${f.slot}`}
            />
          ))}
        </div>

        {/* Mobile 2×2 feature grid around globe — matches mobile screenshot */}
        <div className="landing-mobile-orbit lg:hidden">
          {featureCards.map((f) => (
            <FeatureCard
              key={f.title}
              icon={f.icon}
              title={f.title}
              desc={f.desc}
              compact
              className={`landing-mobile-${f.slot}`}
            />
          ))}
        </div>
      </div>

      <div className="landing-shield-wrap">
        <div className="relative flex h-[88px] w-[88px] items-center justify-center sm:h-[100px] sm:w-[100px]">
          <Shield
            className="landing-shield-glow h-full w-full text-[#00BFFF]"
            strokeWidth={1.1}
            fill="rgba(0,191,255,0.1)"
          />
          <Lock className="absolute h-8 w-8 text-[#7CFC00] landing-icon-green sm:h-9 sm:w-9" strokeWidth={2} />
          <div className="landing-holo-floor" />
        </div>
      </div>
    </section>
  );
}

function SecurityBlock() {
  return (
    <section className="mx-auto max-w-lg px-2 py-4 text-center sm:py-5">
      <h2 className="text-lg font-bold text-white sm:text-xl">Your Security, Our Priority</h2>
      <p className="mt-2 text-[13px] font-light leading-relaxed text-white/55">
        Built with enterprise-grade security to protect you and your data.
      </p>
      <p className="mt-1 text-[13px] font-semibold text-[#7CFC00]">{SG16_BRAND.company}</p>
    </section>
  );
}

function WebsiteCard() {
  return (
    <div className="landing-glass landing-glass-green flex h-full flex-col p-4 sm:p-5">
      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#7CFC00]">
        <Globe className="h-3.5 w-3.5 landing-icon-green" />
        Our Official Website
      </div>
      <div className="mt-3 flex items-center gap-2 rounded-xl border border-white/10 bg-black/50 px-3 py-2.5 sm:mt-4 sm:py-3">
        <Lock className="h-3.5 w-3.5 shrink-0 text-[#7CFC00] lg:hidden" />
        <span className="flex-1 truncate text-[12px] text-white/85 sm:text-[13px]">{SG16_PUBLIC_URL}/</span>
        <CheckCircle2 className="h-4 w-4 shrink-0 text-[#7CFC00] landing-icon-green" />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3 pt-2 text-[10px] text-white/50 sm:gap-4 sm:text-[11px] lg:mt-auto lg:pt-4">
        <span className="inline-flex items-center gap-1.5">
          <Lock className="h-3.5 w-3.5 text-[#7CFC00]" />
          SSL Secured
        </span>
        <span className="hidden text-white/20 sm:inline">|</span>
        <span className="inline-flex items-center gap-1.5">
          <Shield className="h-3.5 w-3.5 text-[#7CFC00]" />
          Verified &amp; Protected
        </span>
      </div>
    </div>
  );
}

function GoogleLoginCard() {
  return (
    <div className="landing-glass flex flex-col items-center p-4 sm:p-5 lg:hidden">
      <LandingGoogleSignIn compact />
    </div>
  );
}

function TwitterCard() {
  return (
    <div className="landing-glass landing-glass-green flex h-full flex-col p-4 sm:p-5">
      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#7CFC00]">
        <span className="text-sm font-black text-[#7CFC00]">𝕏</span>
        (Twitter) Verified Account
      </div>
      <div className="mt-3 flex items-start gap-3 rounded-xl border border-white/10 bg-black/50 p-3 sm:mt-4">
        <Sg16Logo className="h-10 w-10 shrink-0 rounded-full sm:h-11 sm:w-11" />
        <div className="min-w-0 flex-1 text-left">
          <div className="flex items-center gap-1.5">
            <span className="text-[13px] font-bold text-white sm:text-[14px]">SG16_AIEngine</span>
            <CheckCircle2 className="h-4 w-4 text-[#00BFFF] fill-[#00BFFF]/20" />
          </div>
          <p className="text-[11px] text-white/45">@SG16_AIEngine</p>
          <p className="mt-1 text-[10px] font-light leading-relaxed text-white/55 sm:text-[11px]">
            Most Powerful AI Engine by {SG16_BRAND.company}
          </p>
        </div>
        <ChevronRight className="h-4 w-4 shrink-0 text-white/30 lg:hidden" />
      </div>
    </div>
  );
}

export function LandingPage() {
  return (
    <div className="landing-page relative min-h-[100dvh] overflow-x-hidden">
      <LandingHeader />

      <div className="relative z-10 mx-auto max-w-[1280px] px-3 pb-8 sm:px-5 lg:px-8">
        <HeroBackground />
        <SecurityBlock />

        {/* Desktop: Google login centered below security text */}
        <div className="mx-auto hidden max-w-md pb-2 lg:block">
          <LandingGoogleSignIn compact />
        </div>

        {/* Mobile: Website → Google → Twitter (matches screenshot order) */}
        <section className="mt-4 flex flex-col gap-3 lg:hidden">
          <WebsiteCard />
          <GoogleLoginCard />
          <TwitterCard />
        </section>

        {/* Desktop: Website + Twitter side-by-side */}
        <section className="mt-4 hidden gap-5 lg:grid lg:grid-cols-2 lg:mt-6">
          <WebsiteCard />
          <TwitterCard />
        </section>

        {/* Trust features — 2×2 mobile, 4-col desktop */}
        <section className="landing-trust-grid mt-5 sm:mt-6">
          {trustCards.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="landing-trust-cell landing-glass landing-glass-green px-3 py-3 sm:px-4 sm:py-3.5">
              <Icon className="mb-1.5 h-[16px] w-[16px] text-[#7CFC00] landing-icon-green sm:mb-2 sm:h-[18px] sm:w-[18px]" strokeWidth={1.75} />
              <p className="text-[12px] font-bold text-white sm:text-[13px]">{title}</p>
              <p className="mt-0.5 text-[10px] font-light text-white/50 sm:text-[11px]">{desc}</p>
            </div>
          ))}
        </section>

        <footer className="landing-footer-bar mt-5 border-t border-white/[0.08] pt-3 sm:mt-6 sm:pt-4">
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-[10px] text-[#00BFFF]/80 sm:gap-x-4 sm:text-[11px]">
            <a href="/privacy" className="hover:text-white transition">
              Privacy Policy
            </a>
            <span className="text-white/15">|</span>
            <a href="/terms" className="hover:text-white transition">
              Terms of Service
            </a>
            <span className="text-white/15">|</span>
            <a href="/contact" className="hover:text-white transition">
              Contact
            </a>
            <span className="text-white/15">|</span>
            <a href="mailto:contact@sg16engine.com" className="hover:text-white transition">
              contact@sg16engine.com
            </a>
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-[10px] text-white/40 sm:text-[11px]">
            <span className="inline-flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5" />
              SaifTech Global Limited
            </span>
            <span className="text-white/15">|</span>
            <span className="inline-flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5" />
              Google Sign-In only — we never ask for your password
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}
