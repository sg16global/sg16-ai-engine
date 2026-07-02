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
} from 'lucide-react';
import { SG16_BRAND } from '../../core/branding';
import { SG16_PUBLIC_URL } from '../../core/routes';
import { Sg16Logo } from '../ui/Sg16Logo';
import { LandingGoogleSignIn } from './LandingGoogleSignIn';
import './landingStyles.css';

/** Hero: globe + SG16 + DNA + taglines — from provided reference PNG */
const HERO_BACKGROUND = '/landing/hero-background.png';

const featureCards = [
  { icon: MessageSquare, title: 'AI Chat', desc: 'Smart conversations powered by SG16' },
  { icon: Code2, title: 'AI Coding', desc: 'Generate, debug & optimize code' },
  { icon: ImageIcon, title: 'AI Image', desc: 'Create stunning AI generated images' },
  { icon: Play, title: 'AI Video', desc: 'Generate high quality AI videos' },
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

function HeroBackground() {
  return (
    <section className="landing-hero-wrap px-1 sm:px-2" aria-label="SG16 AI Engine">
      <div className="relative">
        <img
          src={HERO_BACKGROUND}
          alt="SG16 — Most Powerful AI Engine. Powered by SG16 Engine."
          className="landing-hero-img"
          width={1100}
          height={900}
          fetchPriority="high"
          decoding="async"
        />
        <div className="landing-hero-fade" aria-hidden />

        {/* Desktop: 4 feature cards orbit the globe in the hero image */}
        <div className="landing-feature-orbit hidden lg:block">
          <FeatureCard
            icon={featureCards[0].icon}
            title={featureCards[0].title}
            desc={featureCards[0].desc}
            className="landing-feature-tl"
          />
          <FeatureCard
            icon={featureCards[1].icon}
            title={featureCards[1].title}
            desc={featureCards[1].desc}
            className="landing-feature-tr"
          />
          <FeatureCard
            icon={featureCards[2].icon}
            title={featureCards[2].title}
            desc={featureCards[2].desc}
            className="landing-feature-bl"
          />
          <FeatureCard
            icon={featureCards[3].icon}
            title={featureCards[3].title}
            desc={featureCards[3].desc}
            className="landing-feature-br"
          />
        </div>
      </div>

      {/* Shield — HTML/CSS below hero image */}
      <div className="landing-shield-wrap">
        <div className="relative flex h-[92px] w-[92px] items-center justify-center sm:h-[104px] sm:w-[104px]">
          <Shield
            className="landing-shield-glow h-full w-full text-[#00BFFF]"
            strokeWidth={1.1}
            fill="rgba(0,191,255,0.1)"
          />
          <Lock
            className="absolute h-9 w-9 text-[#7CFC00] landing-icon-green sm:h-10 sm:w-10"
            strokeWidth={2}
          />
          <div className="landing-holo-floor" />
        </div>
      </div>

      {/* Mobile / tablet: feature cards below shield */}
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:hidden">
        {featureCards.map((f) => (
          <FeatureCard key={f.title} icon={f.icon} title={f.title} desc={f.desc} />
        ))}
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
      <div className="mt-5 flex w-full flex-1 flex-col justify-center">
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
      <div className="relative z-10 mx-auto max-w-[1200px] px-3 pb-8 pt-2 sm:px-5 lg:px-8">
        <HeroBackground />

        {/* Three bottom glass cards */}
        <section className="mt-6 grid gap-4 lg:mt-8 lg:grid-cols-3 lg:gap-5">
          <WebsiteCard />
          <LoginCard />
          <TwitterCard />
        </section>

        {/* Four trust feature cards */}
        <section className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {trustCards.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="landing-glass landing-glass-green px-4 py-3.5">
              <Icon className="mb-2 h-[18px] w-[18px] text-[#7CFC00] landing-icon-green" strokeWidth={1.75} />
              <p className="text-[13px] font-bold text-white">{title}</p>
              <p className="mt-0.5 text-[11px] font-light text-white/50">{desc}</p>
            </div>
          ))}
        </section>

        {/* Bottom status bar */}
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
