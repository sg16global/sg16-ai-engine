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
  ExternalLink,
} from 'lucide-react';
import { SG16_BRAND } from '../../core/branding';
import { SG16_PUBLIC_URL } from '../../core/routes';
import { Sg16Logo } from '../ui/Sg16Logo';
import { LandingGoogleSignIn } from './LandingGoogleSignIn';

/** Optional ChatGPT exports — drop PNGs into project/public/landing/ */
const LANDING_ASSETS = {
  heroGlobe: '/landing/hero-globe.png',
  heroGlobeFallback: '/hero.png',
  heroGlobeSvg: '/hero-globe.svg',
  background: '/landing/background.png',
} as const;

const features = [
  { icon: MessageSquare, title: 'AI Chat', desc: 'Smart conversations powered by SG16' },
  { icon: ImageIcon, title: 'AI Image', desc: 'Create stunning AI generated images' },
  { icon: Code2, title: 'AI Coding', desc: 'Generate, debug & optimize code' },
  { icon: Play, title: 'AI Video', desc: 'Generate high quality AI videos' },
] as const;

const trustBadges = [
  { icon: Shield, title: 'Trusted Technology', desc: 'Reliable. Secure. Advanced.' },
  { icon: Star, title: 'Verified Platform', desc: 'Official. Verified. Trusted.' },
  { icon: Globe, title: 'Global Standard', desc: 'Built for everyone, everywhere.' },
  { icon: Lock, title: 'Secure Future', desc: 'Protecting your data, empowering tomorrow.' },
] as const;

function FeatureCard({
  icon: Icon,
  title,
  desc,
}: {
  icon: typeof MessageSquare;
  title: string;
  desc: string;
}) {
  return (
    <div className="landing-glass-card group p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-cyan-400/40 bg-cyan-500/10 text-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.25)]">
          <Icon className="h-5 w-5" strokeWidth={2} />
        </div>
        <div className="min-w-0">
          <h3 className="text-sm sm:text-base font-bold text-white tracking-wide">{title}</h3>
          <p className="mt-1 text-xs sm:text-sm text-gray-400 leading-relaxed">{desc}</p>
        </div>
      </div>
    </div>
  );
}

function BinaryWave() {
  const binary =
    '0101101010010110100101101001011010010110100101101001011010010110100101101001011010010110100101101001011010';
  return (
    <div className="pointer-events-none absolute inset-x-0 top-[42%] z-[1] -translate-y-1/2 overflow-hidden opacity-50 sm:opacity-70">
      <div className="landing-binary-wave whitespace-nowrap text-[11px] sm:text-sm font-mono text-[#39FF14]/80 tracking-[0.4em]">
        {binary}
      </div>
      <div className="landing-binary-wave-reverse mt-4 whitespace-nowrap text-[11px] sm:text-sm font-mono text-cyan-400/60 tracking-[0.4em]">
        {binary.split('').reverse().join('')}
      </div>
    </div>
  );
}

function StarField() {
  const stars = Array.from({ length: 120 }, (_, i) => ({
    id: i,
    left: `${(i * 17 + 7) % 100}%`,
    top: `${(i * 23 + 11) % 100}%`,
    size: i % 7 === 0 ? 2.5 : i % 3 === 0 ? 1.5 : 1,
    delay: `${(i % 12) * 0.35}s`,
  }));

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {stars.map((star) => (
        <span
          key={star.id}
          className="absolute rounded-full bg-white animate-landing-twinkle"
          style={{
            left: star.left,
            top: star.top,
            width: star.size,
            height: star.size,
            animationDelay: star.delay,
          }}
        />
      ))}
    </div>
  );
}

function HeroGlobe() {
  return (
    <div className="relative mx-auto w-[min(92vw,560px)]">
      <div className="absolute inset-0 scale-110 rounded-full bg-emerald-500/15 blur-[80px] animate-landing-pulse-glow" />
      <div className="absolute inset-0 scale-90 rounded-full bg-cyan-500/10 blur-[60px]" />

      <div className="relative aspect-square animate-landing-float">
        <picture>
          <source srcSet={LANDING_ASSETS.heroGlobe} type="image/png" />
          <source srcSet={LANDING_ASSETS.heroGlobeFallback} type="image/png" />
          <img
            src={LANDING_ASSETS.heroGlobeSvg}
            alt=""
            className="absolute inset-0 h-full w-full object-contain drop-shadow-[0_0_60px_rgba(57,255,20,0.35)]"
            aria-hidden
          />
        </picture>

        <div className="absolute inset-0 flex flex-col items-center justify-center pt-6 sm:pt-10">
          <h1 className="landing-neon-title text-5xl sm:text-7xl lg:text-8xl font-black tracking-[0.08em] text-[#39FF14]">
            SG16
          </h1>
        </div>
      </div>
    </div>
  );
}

function WebsiteCard() {
  return (
    <div className="landing-glass-card p-4 sm:p-5 h-full">
      <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-400">
        <Globe className="h-4 w-4" />
        Our Official Website
      </div>
      <div className="mt-3 flex items-center gap-2 rounded-xl border border-white/10 bg-black/50 px-3 py-3">
        <span className="flex-1 truncate text-sm text-gray-200">{SG16_PUBLIC_URL}/</span>
        <CheckCircle2 className="h-4 w-4 shrink-0 text-[#39FF14]" />
      </div>
      <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-400">
        <span className="inline-flex items-center gap-1.5">
          <Lock className="h-3.5 w-3.5 text-emerald-400" />
          SSL Secured
        </span>
        <span className="inline-flex items-center gap-1.5">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
          Verified &amp; Protected
        </span>
      </div>
      <a
        href={SG16_PUBLIC_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 inline-flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 transition"
      >
        Visit site
        <ExternalLink className="h-3 w-3" />
      </a>
    </div>
  );
}

function TwitterCard() {
  return (
    <div className="landing-glass-card p-4 sm:p-5 h-full">
      <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-400">
        <span className="text-base font-black text-white">𝕏</span>
        (Twitter) Verified Account
      </div>
      <div className="mt-3 flex items-start gap-3 rounded-xl border border-white/10 bg-black/50 p-3">
        <Sg16Logo className="h-11 w-11 shrink-0 rounded-full" />
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-bold text-sm text-white">SG16_AIEngine</span>
            <CheckCircle2 className="h-4 w-4 text-sky-400 fill-sky-400/20" />
          </div>
          <p className="text-xs text-gray-500">@SG16_AIEngine</p>
          <p className="mt-1 text-xs text-gray-400 leading-relaxed">
            Most Powerful AI Engine by {SG16_BRAND.company}
          </p>
        </div>
      </div>
      <a
        href="https://x.com/SG16_AIEngine"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 inline-flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 transition"
      >
        View on X
        <ExternalLink className="h-3 w-3" />
      </a>
    </div>
  );
}

export function LandingPage() {
  return (
    <div className="relative min-h-[100dvh] overflow-x-hidden bg-black text-white">
      <img
        src={LANDING_ASSETS.background}
        alt=""
        className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-40"
        aria-hidden
        onError={(e) => {
          e.currentTarget.style.display = 'none';
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(57,255,20,0.14),transparent_50%),radial-gradient(ellipse_at_center,rgba(6,182,212,0.08),transparent_55%)]" />
      <StarField />
      <BinaryWave />

      <div className="relative z-10 mx-auto flex min-h-[100dvh] max-w-[1400px] flex-col px-4 pb-10 pt-5 sm:px-6 lg:px-10">
        {/* Hero */}
        <section className="flex flex-col items-center text-center">
          <HeroGlobe />

          <p className="mt-2 text-xl sm:text-2xl font-bold text-white">Most Powerful AI Engine</p>
          <p className="mt-1 text-sm sm:text-base font-medium text-[#39FF14] tracking-[0.12em]">
            —Powered by SG16 Engine—
          </p>
          <span className="mt-3 inline-flex rounded-full border border-[#39FF14]/50 bg-[#39FF14]/10 px-5 py-1.5 text-sm text-[#39FF14] shadow-[0_0_20px_rgba(57,255,20,0.25)]">
            尊重与未来
          </span>

          <div className="relative mt-6 mb-2">
            <div className="absolute inset-0 scale-150 rounded-full bg-cyan-400/25 blur-3xl" />
            <div className="relative flex h-24 w-24 sm:h-28 sm:w-28 items-center justify-center">
              <Shield
                className="h-full w-full text-cyan-300 drop-shadow-[0_0_30px_rgba(34,211,238,0.7)]"
                strokeWidth={1.2}
                fill="rgba(6,182,212,0.12)"
              />
              <Lock className="absolute h-8 w-8 sm:h-9 sm:w-9 text-[#39FF14] drop-shadow-[0_0_12px_rgba(57,255,20,0.9)]" />
            </div>
          </div>
        </section>

        {/* Features + login — desktop side layout like ChatGPT design */}
        <section className="relative mt-2 lg:mt-0 lg:grid lg:grid-cols-[minmax(0,300px)_minmax(0,1fr)_minmax(0,300px)] lg:items-center lg:gap-8 xl:gap-12">
          <div className="hidden lg:flex flex-col gap-5 xl:gap-8">
            <FeatureCard icon={features[0].icon} title={features[0].title} desc={features[0].desc} />
            <FeatureCard icon={features[1].icon} title={features[1].title} desc={features[1].desc} />
          </div>

          <div className="flex flex-col items-center gap-6 py-4 lg:py-8">
            <div className="grid w-full max-w-xl grid-cols-1 gap-3 sm:grid-cols-2 lg:hidden">
              {features.map((f) => (
                <FeatureCard key={f.title} icon={f.icon} title={f.title} desc={f.desc} />
              ))}
            </div>

            <div className="w-full max-w-lg space-y-2 px-2 text-center">
              <h2 className="text-xl sm:text-2xl font-bold text-white">Your Security, Our Priority</h2>
              <p className="text-sm sm:text-base text-gray-400 leading-relaxed">
                Built with enterprise-grade security to protect you and your data.
              </p>
              <p className="text-sm font-semibold text-[#39FF14]">{SG16_BRAND.company}</p>
            </div>

            <LandingGoogleSignIn />
          </div>

          <div className="hidden lg:flex flex-col gap-5 xl:gap-8">
            <FeatureCard icon={features[2].icon} title={features[2].title} desc={features[2].desc} />
            <FeatureCard icon={features[3].icon} title={features[3].title} desc={features[3].desc} />
          </div>
        </section>

        {/* Bottom info cards — 3 columns like design */}
        <section className="mt-6 grid gap-4 lg:grid-cols-3 lg:gap-6 lg:mt-10">
          <WebsiteCard />
          <div className="hidden lg:block" aria-hidden />
          <TwitterCard />
        </section>

        <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:mt-8">
          {trustBadges.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="landing-glass-card px-4 py-4 text-center sm:text-left">
              <Icon className="mx-auto sm:mx-0 mb-2 h-5 w-5 text-[#39FF14]" />
              <p className="text-sm font-bold text-white">{title}</p>
              <p className="mt-0.5 text-xs text-gray-500">{desc}</p>
            </div>
          ))}
        </section>

        <footer className="mt-8 border-t border-white/10 pt-5">
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-gray-500">
            <span className="inline-flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-emerald-500/80" />
              Trusted by users worldwide
            </span>
            <span className="hidden sm:inline text-white/15">|</span>
            <span className="inline-flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5 text-emerald-500/80" />
              100% Secure
            </span>
            <span className="hidden sm:inline text-white/15">|</span>
            <span className="inline-flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-emerald-500/80" />
              Privacy First
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}
