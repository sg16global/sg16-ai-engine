import {
  MessageSquare,
  Image as ImageIcon,
  Code2,
  FileText,
  Shield,
  Lock,
  Globe,
  Star,
  CheckCircle2,
} from 'lucide-react';
import { SG16_BRAND } from '../../core/branding';
import { SG16_PUBLIC_URL } from '../../core/routes';
import { Sg16Logo } from '../ui/Sg16Logo';
import { OptimizedImage } from '../ui/OptimizedImage';
import { useAppStore } from '../../core/appState';
import { LandingGoogleSignIn } from './LandingGoogleSignIn';
import { LandingHeader } from './LandingHeader';
import './landingStyles.css';

const HERO_BACKGROUND = '/landing/hero-background.png';

const features = [
  { icon: MessageSquare, title: 'AI Chat', desc: 'Fast, clear conversations across every workspace.' },
  { icon: Code2, title: 'Coding Hub', desc: 'Generate, debug, and ship code with SG16.' },
  { icon: ImageIcon, title: 'Image Studio', desc: 'Create and edit visuals in one place.' },
  { icon: FileText, title: 'Document Lab', desc: 'Summarize, rewrite, and work through files.' },
] as const;

const trustItems = [
  { icon: Shield, title: 'Trusted technology', desc: 'Reliable. Secure. Advanced.' },
  { icon: Star, title: 'Verified platform', desc: 'Official. Protected. Ready.' },
  { icon: Globe, title: 'Global standard', desc: 'Built for users worldwide.' },
  { icon: Lock, title: 'Private by design', desc: 'Google Sign-In. No password asks.' },
] as const;

export function LandingPage() {
  const openLoginModal = useAppStore((s) => s.openLoginModal);
  const enterLocalPreview = useAppStore((s) => s.enterLocalPreview);

  return (
    <div className="landing-page relative min-h-[100dvh] overflow-x-hidden">
      <LandingHeader />

      {/* Hero — one composition: brand signal + headline + line + CTA + visual */}
      <section className="landing-hero-section">
        <div className="landing-shell landing-hero-copy">
          <p className="landing-kicker">{SG16_BRAND.company}</p>
          <h1 className="landing-hero-title">
            Most Powerful
            <br />
            <span className="text-[#7CFC00]">AI Engine</span>
          </h1>
          <p className="landing-hero-sub">
            One application. Unlimited intelligence — chat, code, docs, and images in a single secure workspace.
          </p>
          <div className="landing-hero-cta">
            <button type="button" onClick={() => openLoginModal()} className="landing-btn-primary">
              Get Started
            </button>
            <a href="#features" className="landing-btn-ghost">
              See features
            </a>
          </div>
          <button
            type="button"
            onClick={() => enterLocalPreview()}
            className="mt-3 text-xs uppercase tracking-wider text-white/45 hover:text-[#7CFC00] transition"
          >
            Enter app without Google →
          </button>
          <div className="landing-hero-signin">
            <LandingGoogleSignIn compact />
          </div>
        </div>

        <div className="landing-hero-visual" aria-label="SG16 AI Engine">
          <OptimizedImage
            src={HERO_BACKGROUND}
            alt="SG16 AI Engine"
            className="landing-hero-img"
            width={1240}
            height={720}
            fetchPriority="high"
            decoding="async"
          />
          <div className="landing-hero-fade" aria-hidden />
        </div>
      </section>

      {/* Features */}
      <section id="features" className="landing-section">
        <div className="landing-shell landing-section-head">
          <h2 className="landing-section-title">Everything in one engine</h2>
          <p className="landing-section-sub">
            Clean workspaces for real work — not a pile of separate AI tabs.
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

      <footer className="landing-footer">
        <div className="landing-shell">
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[12px] text-white/45">
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
    </div>
  );
}
