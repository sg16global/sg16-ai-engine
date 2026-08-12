import {
  MessageSquare,
  Code2,
  HeartPulse,
  GraduationCap,
  TrendingUp,
  Shield,
  Lock,
  Globe,
  Star,
  CheckCircle2,
} from 'lucide-react';
import { SG16_BRAND } from '../../core/branding';
import { SG16_PUBLIC_URL } from '../../core/routes';
import { Sg16Logo } from '../ui/Sg16Logo';
import { useAppStore } from '../../core/appState';
import { LandingHeader } from './LandingHeader';
import { LandingVideoBg } from './LandingVideoBg';
import { LandingBrandLogo } from './LandingBrandLogo';
import { LandingNetworkCards } from './LandingNetworkCards';
import { SovereignBanner } from './SovereignBanner';
import { SiteFooter } from './SiteFooter';
import './landingStyles.css';

const features = [
  { icon: MessageSquare, title: 'AI Chat Shield', desc: 'Free conversations after Google sign-in — your main SG16 workspace.' },
  { icon: Code2, title: 'Coding Hub Shield', desc: 'Generate, debug, and score code in a dedicated hub.' },
  { icon: HeartPulse, title: 'Health Shield', desc: 'General wellness guidance — separate from other shields.' },
  { icon: GraduationCap, title: 'Student Shield', desc: 'Educational topics in their own protected workspace.' },
  { icon: TrendingUp, title: 'Market Shield', desc: 'Market and finance questions without mixing other data.' },
] as const;

const trustItems = [
  { icon: Shield, title: 'SG16 Secure Room', desc: 'Messages go to sg16engine.com first — we process and return the answer.' },
  { icon: Lock, title: 'Google Sign-In only', desc: 'We never ask for your Google password on this site.' },
  { icon: Globe, title: 'Five separate shields', desc: 'AI Chat, Coding, Health, Student, and Market — each its own workspace.' },
  { icon: Star, title: 'Device-local chat', desc: 'Chat history stays in your browser on this device, not our cloud archive.' },
] as const;

const publicReviews = [
  {
    stars: 5,
    quote: 'Each shield feels like its own app — Coding Hub and Health are not mixed together.',
    author: 'Preview user',
    tag: 'Shield separation',
  },
  {
    stars: 5,
    quote: 'I like that my chats stay on my device. SG16 feels more private than other AI tools.',
    author: 'Early tester',
    tag: 'Privacy-first',
  },
  {
    stars: 5,
    quote: 'Coding Hub gives a clear project score — then I can ask for fixes in the same shield.',
    author: 'Developer preview',
    tag: 'Coding Hub',
  },
  {
    stars: 5,
    quote: 'Google login, no password on the site, and everything runs through sg16engine.com — feels official.',
    author: 'SG16 guest',
    tag: 'Trust & security',
  },
] as const;

function StarRow({ count }: { count: number }) {
  return (
    <div className="landing-review-stars" aria-label={`${count} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${i < count ? 'text-[#7CFC00] fill-[#7CFC00]' : 'text-white/20'}`}
          strokeWidth={1.5}
        />
      ))}
    </div>
  );
}

export function LandingPage() {
  const enterGuestTour = useAppStore((s) => s.enterGuestTour);

  return (
    <div className="landing-page relative min-h-[100dvh] overflow-x-hidden">
      <LandingVideoBg />

      <div className="landing-page__content relative z-[1]">
      <LandingHeader />

      {/* Hero — video full background; logo + copy on top */}
      <section className="landing-hero-section">
        <div className="landing-shell landing-hero-copy">
          <div className="landing-hero-stack">
            <p className="landing-hero-brand">
              <span className="landing-hero-brand-box">{SG16_BRAND.name}</span>
            </p>
            <h1 className="landing-hero-title">
              <span className="landing-hero-title-row">
                <span className="landing-hero-word-box">Most</span>
                <span className="landing-hero-word-box">Powerful</span>
              </span>
              <span className="landing-hero-word-box landing-hero-word-box--green">AI Engine</span>
            </h1>
            <p className="landing-hero-sub">
              One application. Five shields — chat, code, health, student, and market in one secure engine.
            </p>
          </div>
          <div className="landing-hero-cta">
            <button type="button" onClick={() => enterGuestTour()} className="landing-btn-primary">
              Start Tour
            </button>
            <a href="#features" className="landing-btn-ghost">
              See features
            </a>
          </div>
          <p className="mt-4 text-xs text-white/40">
            Explore Shield Home free — sign in with Google only when you open a workspace.
          </p>
        </div>
        <LandingNetworkCards />
      </section>

      {/* Features */}
      <section id="features" className="landing-section">
        <div className="landing-shell landing-section-head">
          <h2 className="landing-section-title">Five shields, one engine</h2>
          <p className="landing-section-sub">
            Each shield is a separate workspace — built for real work, not a pile of mixed AI tabs.
          </p>
        </div>
        <div className="landing-shell landing-feature-grid">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="landing-feature-row">
              <div className="landing-feature-icon">
                <Icon className="h-5 w-5 text-[#7CFC00]" strokeWidth={1.75} />
              </div>
              <div>
                <h3 className="text-[16px] font-semibold text-white">{title}</h3>
                <p className="mt-1 text-[14px] font-light leading-relaxed text-white/55">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Security + proof */}
      <section className="landing-section landing-section-tight">
        <div className="landing-shell landing-section-head">
          <h2 className="landing-section-title">Your security, our priority</h2>
          <p className="landing-section-sub">
            Built for trusted access. Sign in with Google — we never ask for your password.
          </p>
        </div>
        <div className="landing-shell landing-proof-grid">
          <div className="landing-proof">
            <div className="landing-proof-label">
              <Globe className="h-3.5 w-3.5 text-[#7CFC00]" />
              Official website
            </div>
            <div className="landing-proof-url">
              <Lock className="h-3.5 w-3.5 shrink-0 text-[#7CFC00]" />
              <span className="truncate">{SG16_PUBLIC_URL}</span>
              <CheckCircle2 className="h-4 w-4 shrink-0 text-[#7CFC00]" />
            </div>
          </div>
          <a
            href="https://x.com/SG16_AIEngine"
            target="_blank"
            rel="noopener noreferrer"
            className="landing-proof landing-proof-link"
          >
            <div className="landing-proof-label">
              <span className="text-[#7CFC00]">𝕏</span>
              Official account
            </div>
            <div className="flex items-center gap-3">
              <Sg16Logo className="h-10 w-10 rounded-full" />
              <div className="min-w-0 text-left">
                <div className="flex items-center gap-1.5">
                  <span className="text-[14px] font-semibold text-white">SG16_AIEngine</span>
                  <CheckCircle2 className="h-4 w-4 text-[#7CFC00]" />
                </div>
                <p className="text-[12px] text-white/45">@SG16_AIEngine</p>
              </div>
            </div>
          </a>
        </div>
      </section>

      {/* Public reviews */}
      <section id="reviews" className="landing-section">
        <div className="landing-shell landing-section-head">
          <h2 className="landing-section-title">What users are saying</h2>
          <p className="landing-section-sub">
            Early feedback on SG16 AI Engine — separate shields, device privacy, and SG16 Secure Room processing.
          </p>
        </div>
        <div className="landing-shell landing-review-grid">
          {publicReviews.map((review) => (
            <article key={review.tag} className="landing-review-card">
              <StarRow count={review.stars} />
              <p className="landing-review-quote">&ldquo;{review.quote}&rdquo;</p>
              <div className="landing-review-meta">
                <span className="landing-review-author">{review.author}</span>
                <span className="landing-review-tag">{review.tag}</span>
              </div>
            </article>
          ))}
        </div>
        <p className="landing-shell landing-review-note">
          Preview feedback from SG16 early access. See our{' '}
          <a href="/privacy" className="text-[#7CFC00]/80 hover:text-[#7CFC00] transition">
            Privacy Policy
          </a>{' '}
          for how we handle your data.
        </p>
      </section>

      {/* Trust strip */}
      <section className="landing-section">
        <div className="landing-shell landing-trust-strip">
          {trustItems.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="landing-trust-item">
              <Icon className="mb-2 h-4 w-4 text-[#7CFC00]" strokeWidth={1.75} />
              <p className="text-[13px] font-semibold text-white">{title}</p>
              <p className="mt-1 text-[12px] font-light text-white/50">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <SovereignBanner />

      <SiteFooter />
      </div>
    </div>
  );
}
