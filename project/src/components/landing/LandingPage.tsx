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
  Zap,
} from 'lucide-react';
import { SG16_BRAND } from '../../core/branding';
import { SG16_PUBLIC_URL } from '../../core/routes';
import { Sg16Logo } from '../ui/Sg16Logo';
import { LandingGoogleSignIn } from './LandingGoogleSignIn';
import './landingStyles.css';

const LANDING_ASSETS = {
  heroGlobe: '/landing/hero-globe.png',
  heroGlobeFallback: '/hero.png',
  background: '/landing/background.png',
} as const;

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

function DnaHelixWaves() {
  return (
    <div className="landing-dna-wave" aria-hidden>
      <svg viewBox="0 0 1440 120" className="w-[200%] max-w-none" preserveAspectRatio="none">
        <defs>
          <linearGradient id="dnaBlue" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#00BFFF" stopOpacity="0" />
            <stop offset="20%" stopColor="#00BFFF" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#00BFFF" stopOpacity="1" />
            <stop offset="80%" stopColor="#00BFFF" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#00BFFF" stopOpacity="0" />
          </linearGradient>
          <filter id="dnaGlow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <path
          d="M0,60 Q180,20 360,60 T720,60 T1080,60 T1440,60"
          fill="none"
          stroke="url(#dnaBlue)"
          strokeWidth="2"
          filter="url(#dnaGlow)"
        />
        <path
          d="M0,60 Q180,100 360,60 T720,60 T1080,60 T1440,60"
          fill="none"
          stroke="url(#dnaBlue)"
          strokeWidth="2"
          opacity="0.75"
          filter="url(#dnaGlow)"
        />
      </svg>
    </div>
  );
}

function StarField() {
  const stars = Array.from({ length: 200 }, (_, i) => ({
    id: i,
    left: `${(i * 13.7 + 5) % 100}%`,
    top: `${(i * 19.3 + 3) % 100}%`,
    size: i % 11 === 0 ? 2 : i % 4 === 0 ? 1.5 : 1,
    opacity: 0.3 + (i % 7) * 0.1,
    delay: `${(i % 15) * 0.25}s`,
  }));

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {stars.map((s) => (
        <span
          key={s.id}
          className="absolute rounded-full bg-white animate-landing-twinkle"
          style={{
            left: s.left,
            top: s.top,
            width: s.size,
            height: s.size,
            opacity: s.opacity,
            animationDelay: s.delay,
          }}
        />
      ))}
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  desc,
  className = '',
}: {
  icon: typeof MessageSquare;
  title: string;
  desc: string;
  className?: string;
}) {
  return (
    <div className={`landing-glass p-4 sm:p-[18px] ${className}`}>
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#00BFFF]/35 bg-[#00BFFF]/8">
          <Icon className="h-5 w-5 landing-icon-blue" strokeWidth={1.75} />
        </div>
        <div className="min-w-0 pt-0.5">
          <h3 className="text-[15px] font-bold text-white leading-tight">{title}</h3>
          <p className="mt-1 text-[12px] font-light text-white/55 leading-snug">{desc}</p>
        </div>
      </div>
    </div>
  );
}

function HeroSection() {
  return (
    <section className="relative mx-auto w-full max-w-[1100px] px-2 pt-4 sm:pt-6">
      <DnaHelixWaves />

      {/* Desktop: feature cards orbit the globe */}
      <div className="relative z-[2] mx-auto min-h-[420px] sm:min-h-[480px] lg:min-h-[520px]">
        <div className="hidden lg:block">
          <FeatureCard
            icon={featureCards[0].icon}
            title={featureCards[0].title}
            desc={featureCards[0].desc}
            className="absolute left-0 top-[8%] w-[240px] xl:w-[260px]"
          />
          <FeatureCard
            icon={featureCards[1].icon}
            title={featureCards[1].title}
            desc={featureCards[1].desc}
            className="absolute right-0 top-[8%] w-[240px] xl:w-[260px]"
          />
          <FeatureCard
            icon={featureCards[2].icon}
            title={featureCards[2].title}
            desc={featureCards[2].desc}
            className="absolute left-0 bottom-[12%] w-[240px] xl:w-[260px]"
          />
          <FeatureCard
            icon={featureCards[3].icon}
            title={featureCards[3].title}
            desc={featureCards[3].desc}
            className="absolute right-0 bottom-[12%] w-[240px] xl:w-[260px]"
          />
        </div>

        {/* Globe + logo */}
        <div className="relative mx-auto flex w-[min(88vw,420px)] flex-col items-center sm:w-[min(72vw,480px)]">
          <div className="relative w-full animate-landing-float">
            <div className="absolute inset-0 rounded-full bg-[#00BFFF]/20 blur-[70px] landing-globe-rim" />
            <div className="relative aspect-square w-full">
              <img
                src={LANDING_ASSETS.heroGlobe}
                alt=""
                className="absolute inset-0 h-full w-full object-contain"
                onError={(e) => {
                  const img = e.currentTarget;
                  if (img.src.includes('hero-globe.png')) {
                    img.src = LANDING_ASSETS.heroGlobeFallback;
                  } else if (!img.src.includes('hero-globe.svg')) {
                    img.src = '/hero-globe.svg';
                  }
                }}
                aria-hidden
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="landing-logo-text text-[clamp(3.5rem,14vw,5.5rem)]">SG16</span>
              </div>
            </div>
          </div>

          <p className="mt-3 text-center text-lg font-bold landing-neon-green sm:text-xl">
            Most Powerful AI Engine
          </p>
          <p className="mt-1 text-center text-sm font-medium landing-neon-green sm:text-base">
            —Powered by SG16 Engine—
          </p>
          <span className="mt-3 inline-flex rounded-full border border-[#7CFC00]/50 bg-[#7CFC00]/10 px-5 py-1.5 text-sm font-medium text-[#7CFC00] shadow-[0_0_18px_rgba(124,252,0,0.25)]">
            尊重与未来
          </span>

          {/* Shield + holographic floor */}
          <div className="relative mt-6 mb-2">
            <div className="relative flex h-[88px] w-[88px] items-center justify-center sm:h-[100px] sm:w-[100px]">
              <Shield
                className="h-full w-full text-[#00BFFF]/90"
                strokeWidth={1.1}
                fill="rgba(0,191,255,0.08)"
                style={{ filter: 'drop-shadow(0 0 24px rgba(0,191,255,0.7))' }}
              />
              <Lock className="absolute h-9 w-9 text-[#7CFC00] landing-icon-green sm:h-10 sm:w-10" strokeWidth={2} />
            </div>
            <div className="landing-holo-floor" />
          </div>
        </div>

        {/* Mobile / tablet feature grid */}
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:hidden">
          {featureCards.map((f) => (
            <FeatureCard key={f.title} icon={f.icon} title={f.title} desc={f.desc} />
          ))}
        </div>
      </div>
    </section>
  );
}

function WebsiteCard() {
  return (
    <div className="landing-glass landing-glass-green flex h-full flex-col p-5">
      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#7CFC00]">
        <Globe className="h-3.5 w-3.5 landing-icon-green" />
        Our Official Website
      </div>
      <div className="mt-4 flex items-center gap-2 rounded-xl border border-white/10 bg-black/50 px-3 py-3">
        <span className="flex-1 truncate text-[13px] text-white/85">{SG16_PUBLIC_URL}/</span>
        <CheckCircle2 className="h-4 w-4 shrink-0 text-[#7CFC00] landing-icon-green" />
      </div>
      <div className="mt-auto flex flex-wrap gap-4 pt-4 text-[11px] text-white/50">
        <span className="inline-flex items-center gap-1.5">
          <Lock className="h-3.5 w-3.5 text-[#7CFC00]" />
          SSL Secured
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Shield className="h-3.5 w-3.5 text-[#7CFC00]" />
          Verified &amp; Protected
        </span>
      </div>
    </div>
  );
}

function LoginCard() {
  return (
    <div className="landing-glass flex h-full flex-col items-center p-5 text-center">
      <h2 className="text-lg font-bold text-white sm:text-xl">Your Security, Our Priority</h2>
      <p className="mt-2 max-w-sm text-[13px] font-light leading-relaxed text-white/55">
        Built with enterprise-grade security to protect you and your data.
      </p>
      <p className="mt-1 text-[13px] font-semibold text-[#7CFC00]">{SG16_BRAND.company}</p>
      <div className="mt-5 w-full flex-1 flex flex-col justify-center">
        <LandingGoogleSignIn compact />
      </div>
    </div>
  );
}

function TwitterCard() {
  return (
    <div className="landing-glass landing-glass-green flex h-full flex-col p-5">
      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#7CFC00]">
        <span className="text-sm font-black text-[#7CFC00]">𝕏</span>
        (Twitter) Verified Account
      </div>
      <div className="mt-4 flex items-start gap-3 rounded-xl border border-white/10 bg-black/50 p-3">
        <Sg16Logo className="h-11 w-11 shrink-0 rounded-full" />
        <div className="min-w-0 text-left">
          <div className="flex items-center gap-1.5">
            <span className="text-[14px] font-bold text-white">SG16_AIEngine</span>
            <CheckCircle2 className="h-4 w-4 text-[#00BFFF] fill-[#00BFFF]/20" />
          </div>
          <p className="text-[11px] text-white/45">@SG16_AIEngine</p>
          <p className="mt-1 text-[11px] font-light leading-relaxed text-white/55">
            Most Powerful AI Engine by {SG16_BRAND.company}
          </p>
        </div>
      </div>
    </div>
  );
}

export function LandingPage() {
  return (
    <div className="landing-page relative min-h-[100dvh] overflow-x-hidden">
      <img
        src={LANDING_ASSETS.background}
        alt=""
        className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-35"
        aria-hidden
        onError={(e) => {
          e.currentTarget.style.display = 'none';
        }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 50% 35%, rgba(0,191,255,0.08) 0%, transparent 55%), radial-gradient(ellipse 60% 40% at 50% 80%, rgba(124,252,0,0.04) 0%, transparent 50%)',
        }}
      />
      <StarField />

      <div className="relative z-10 mx-auto max-w-[1200px] px-4 pb-8 pt-3 sm:px-6 lg:px-8">
        <HeroSection />

        {/* Three bottom glass cards — Website | Login | Twitter */}
        <section className="mt-8 grid gap-4 lg:mt-10 lg:grid-cols-3 lg:gap-5">
          <WebsiteCard />
          <LoginCard />
          <TwitterCard />
        </section>

        {/* Four slim trust cards */}
        <section className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {trustCards.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="landing-glass landing-glass-green px-4 py-3.5">
              <Icon className="mb-2 h-[18px] w-[18px] text-[#7CFC00] landing-icon-green" strokeWidth={1.75} />
              <p className="text-[13px] font-bold text-white">{title}</p>
              <p className="mt-0.5 text-[11px] font-light text-white/50">{desc}</p>
            </div>
          ))}
        </section>

        {/* Slim footer status bar */}
        <footer className="mt-6 border-t border-white/[0.08] pt-4">
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[11px] text-white/45">
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-[#00BFFF]" />
              Trusted by users worldwide
            </span>
            <span className="hidden text-white/15 sm:inline">|</span>
            <span className="inline-flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5 text-[#00BFFF]" />
              100% Secure
            </span>
            <span className="hidden text-white/15 sm:inline">|</span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-[#00BFFF]" />
              Privacy First
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}
