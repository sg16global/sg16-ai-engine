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

const features = [
  {
    icon: MessageSquare,
    title: 'AI Chat',
    desc: 'Smart conversations powered by SG16',
    position: 'left-top',
  },
  {
    icon: ImageIcon,
    title: 'AI Image',
    desc: 'Create stunning AI generated images',
    position: 'left-bottom',
  },
  {
    icon: Code2,
    title: 'AI Coding',
    desc: 'Generate, debug & optimize code',
    position: 'right-top',
  },
  {
    icon: Play,
    title: 'AI Video',
    desc: 'Generate high quality AI videos',
    position: 'right-bottom',
  },
] as const;

const trustBadges = [
  {
    icon: Shield,
    title: 'Trusted Technology',
    desc: 'Reliable. Secure. Advanced.',
  },
  {
    icon: Star,
    title: 'Verified Platform',
    desc: 'Official. Verified. Trusted.',
  },
  {
    icon: Globe,
    title: 'Global Standard',
    desc: 'Built for everyone, everywhere.',
  },
  {
    icon: Lock,
    title: 'Secure Future',
    desc: 'Protecting your data, empowering tomorrow.',
  },
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
    <div
      className={`group relative rounded-2xl border border-emerald-500/20 bg-black/30 backdrop-blur-md p-4 sm:p-5 shadow-[0_0_24px_rgba(57,255,20,0.08)] transition hover:border-emerald-400/40 hover:shadow-[0_0_32px_rgba(57,255,20,0.15)] ${className}`}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cyan-400/30 bg-cyan-500/10 text-cyan-300 shadow-[0_0_16px_rgba(34,211,238,0.2)]">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <h3 className="text-sm sm:text-base font-semibold text-white">{title}</h3>
          <p className="mt-1 text-xs sm:text-sm text-gray-400 leading-relaxed">{desc}</p>
        </div>
      </div>
    </div>
  );
}

function BinaryWave() {
  const binary = '0101101010010110100101101001011010010110100101101001011010010110100101101001011010';
  return (
    <div className="pointer-events-none absolute inset-x-0 top-[38%] -translate-y-1/2 overflow-hidden opacity-40 sm:opacity-55">
      <div className="landing-binary-wave whitespace-nowrap text-[10px] sm:text-xs font-mono text-emerald-400/70 tracking-[0.35em]">
        {binary}
      </div>
      <div className="landing-binary-wave-reverse mt-3 whitespace-nowrap text-[10px] sm:text-xs font-mono text-cyan-400/50 tracking-[0.35em]">
        {binary.split('').reverse().join('')}
      </div>
    </div>
  );
}

function StarField() {
  const stars = Array.from({ length: 80 }, (_, i) => ({
    id: i,
    left: `${(i * 17 + 7) % 100}%`,
    top: `${(i * 23 + 11) % 100}%`,
    size: i % 5 === 0 ? 2 : 1,
    delay: `${(i % 10) * 0.4}s`,
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

export function LandingPage() {
  return (
    <div className="relative min-h-[100dvh] overflow-x-hidden bg-[#030308] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.12),transparent_55%),radial-gradient(ellipse_at_bottom,rgba(59,130,246,0.08),transparent_50%),radial-gradient(ellipse_at_center,rgba(57,255,20,0.04),transparent_70%)]" />
      <StarField />
      <BinaryWave />

      <div className="relative z-10 mx-auto flex min-h-[100dvh] max-w-7xl flex-col px-4 pb-8 pt-6 sm:px-6 lg:px-8">
        {/* Hero */}
        <section className="flex flex-col items-center text-center">
          <div className="relative mb-4 animate-landing-float">
            <div className="absolute inset-0 scale-150 rounded-full bg-emerald-500/20 blur-3xl animate-landing-pulse-glow" />
            <img
              src="/hero-globe.svg"
              alt=""
              className="relative mx-auto h-28 w-28 sm:h-36 sm:w-36 object-contain opacity-90"
              aria-hidden
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <Sg16Logo className="h-16 w-16 sm:h-20 sm:w-20 drop-shadow-[0_0_24px_rgba(57,255,20,0.8)]" glow />
            </div>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-emerald-300 via-emerald-400 to-emerald-600 drop-shadow-[0_0_20px_rgba(57,255,20,0.5)]">
            SG16
          </h1>
          <p className="mt-2 text-lg sm:text-xl font-semibold bg-gradient-to-r from-white via-emerald-100 to-emerald-300 bg-clip-text text-transparent">
            Most Powerful AI Engine
          </p>
          <p className="mt-1 text-sm sm:text-base text-emerald-400/90 tracking-wide">
            —Powered by SG16 Engine—
          </p>
          <p className="mt-2 text-sm text-emerald-300/80">尊重与未来</p>

          <div className="relative mt-5 mb-2">
            <div className="absolute inset-0 scale-125 rounded-full bg-cyan-400/20 blur-2xl" />
            <div className="relative flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-2xl border border-cyan-400/40 bg-cyan-500/10 shadow-[0_0_30px_rgba(34,211,238,0.35)]">
              <Shield className="h-10 w-10 sm:h-12 sm:w-12 text-cyan-300" strokeWidth={1.5} />
              <Lock className="absolute h-5 w-5 sm:h-6 sm:w-6 text-emerald-400 drop-shadow-[0_0_8px_rgba(57,255,20,0.8)]" />
            </div>
          </div>
        </section>

        {/* Feature grid + center content */}
        <section className="mt-6 grid flex-1 gap-4 lg:grid-cols-[1fr_minmax(0,32rem)_1fr] lg:items-start lg:gap-6">
          <div className="hidden lg:flex flex-col gap-4 pt-8">
            <FeatureCard icon={features[0].icon} title={features[0].title} desc={features[0].desc} />
            <FeatureCard icon={features[1].icon} title={features[1].title} desc={features[1].desc} />
          </div>

          <div className="flex flex-col items-center gap-6">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:hidden w-full max-w-xl">
              {features.map((f) => (
                <FeatureCard key={f.title} icon={f.icon} title={f.title} desc={f.desc} />
              ))}
            </div>

            <div className="w-full text-center space-y-2 px-2">
              <h2 className="text-lg sm:text-xl font-bold text-white">Your Security, Our Priority</h2>
              <p className="text-sm text-gray-400 max-w-md mx-auto leading-relaxed">
                Built with enterprise-grade security to protect you and your data.
              </p>
              <p className="text-sm font-medium text-emerald-400">{SG16_BRAND.company}</p>
            </div>

            <LandingGoogleSignIn />
          </div>

          <div className="hidden lg:flex flex-col gap-4 pt-8">
            <FeatureCard icon={features[2].icon} title={features[2].title} desc={features[2].desc} />
            <FeatureCard icon={features[3].icon} title={features[3].title} desc={features[3].desc} />
          </div>
        </section>

        {/* Info cards */}
        <section className="mt-8 grid gap-4 sm:grid-cols-2 max-w-4xl mx-auto w-full">
          <div className="rounded-2xl border border-emerald-500/20 bg-black/35 backdrop-blur-md p-4 sm:p-5 shadow-[0_0_20px_rgba(57,255,20,0.06)]">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400/90">
              <Globe className="h-4 w-4" />
              Our Official Website
            </div>
            <div className="mt-3 flex items-center gap-2 rounded-xl border border-white/10 bg-black/40 px-3 py-2.5">
              <span className="flex-1 truncate text-sm text-gray-300">{SG16_PUBLIC_URL}/</span>
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
            </div>
            <div className="mt-3 flex flex-wrap gap-3 text-xs text-gray-400">
              <span className="inline-flex items-center gap-1">
                <Lock className="h-3.5 w-3.5 text-emerald-400" />
                SSL Secured
              </span>
              <span className="inline-flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                Verified &amp; Protected
              </span>
            </div>
            <a
              href={SG16_PUBLIC_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 transition"
            >
              Visit site
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          <div className="rounded-2xl border border-emerald-500/20 bg-black/35 backdrop-blur-md p-4 sm:p-5 shadow-[0_0_20px_rgba(57,255,20,0.06)]">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400/90">
              <span className="font-bold text-white">𝕏</span>
              (Twitter) Verified Account
            </div>
            <div className="mt-3 flex items-start gap-3 rounded-xl border border-white/10 bg-black/40 p-3">
              <Sg16Logo className="h-10 w-10 shrink-0 rounded-full" />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-semibold text-sm text-white">SG16_AIEngine</span>
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
              className="mt-3 inline-flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 transition"
            >
              View on X
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </section>

        {/* Trust badges */}
        <section className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto w-full">
          {trustBadges.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="rounded-xl border border-white/10 bg-black/25 backdrop-blur-sm px-4 py-3 text-center sm:text-left"
            >
              <Icon className="mx-auto sm:mx-0 h-5 w-5 text-emerald-400 mb-2" />
              <p className="text-sm font-semibold text-white">{title}</p>
              <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
            </div>
          ))}
        </section>

        {/* Footer */}
        <footer className="mt-8 pt-4 border-t border-white/10">
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-gray-500">
            <span className="inline-flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-emerald-500/70" />
              Trusted by users worldwide
            </span>
            <span className="hidden sm:inline text-white/20">|</span>
            <span className="inline-flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5 text-emerald-500/70" />
              100% Secure
            </span>
            <span className="hidden sm:inline text-white/20">|</span>
            <span className="inline-flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-emerald-500/70" />
              Privacy First
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}
