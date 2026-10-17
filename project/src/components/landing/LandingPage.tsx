import {
  ArrowRight,
  ChevronRight,
  Code2,
  Cpu,
  Globe,
  GraduationCap,
  HeartPulse,
  Lock,
  MessageSquare,
  Rocket,
  Shield,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import type { CSSProperties } from 'react';
import { useAppStore } from '../../core/appState';
import type { WorkspaceType } from '../../core/types';
import { Flag, type FlagCode } from './Flag';
import { HeroStage, LandingNeonBackdrop } from './LandingNeonBackdrop';
import { LandingHeader } from './LandingHeader';
import { FinanceCard, GeoMonitorCard } from './LandingNetworkCards';
import { SiteFooter } from './SiteFooter';
import { WorldDotMap } from './WorldDotMap';
import './landingStyles.css';

const SHIELDS_DATA = [
  { id: 'general' as WorkspaceType, icon: MessageSquare, title: 'AI Chat', desc: 'Smart, private and sovereign conversations.' },
  { id: 'coding' as WorkspaceType, icon: Code2, title: 'Coding Hub', desc: 'Build, debug and deploy with AI assistance.' },
  { id: 'health' as WorkspaceType, icon: HeartPulse, title: 'Health', desc: 'Smarter health insights for a better you.' },
  { id: 'student-shield' as WorkspaceType, icon: GraduationCap, title: 'Student', desc: 'Learn, create and grow with AI.' },
  { id: 'market' as WorkspaceType, icon: TrendingUp, title: 'Market', desc: 'Real-time data and financial intelligence.' },
];

const LATEST_ACTIVITIES = [
  { title: 'SG16 Engine', detail: 'New update released', time: '2h ago', icon: ShieldCheck, color: '#38D9A9' },
  { title: 'SG16 Finance', detail: 'Market data refreshed', time: '4h ago', icon: TrendingUp, color: '#FF168D' },
  { title: 'SG16 Children', detail: 'AI model optimized', time: '6h ago', icon: HeartPulse, color: '#FF168D' },
  { title: 'SG16 Student', detail: 'New users registered', time: '8h ago', icon: GraduationCap, color: '#59A7FF' },
];

const PROJECTS = [
  { name: 'SG16 Engine', color: '#FF168D' },
  { name: 'SG16 Finance', color: '#FF168D' },
  { name: 'SG16 Children', color: '#D946EF' },
  { name: 'SG16 Student', color: '#59A7FF' },
  { name: 'SG16 Market', color: '#38D9A9' },
];

const SECURITY = [
  { label: 'Firewall', icon: Shield, level: 88 },
  { label: 'Anti-DDoS', icon: ShieldCheck, level: 92 },
  { label: 'Data Protection', icon: Lock, level: 86 },
  { label: 'AI Monitoring', icon: Cpu, level: 90 },
];

const GLOBAL_REACH: { flag: FlagCode; country: string; share: string }[] = [
  { flag: 'nl', country: 'Netherlands', share: '12.4%' },
  { flag: 'us', country: 'United States', share: '11.8%' },
  { flag: 'gb', country: 'United Kingdom', share: '9.6%' },
  { flag: 'jp', country: 'Japan', share: '6.8%' },
  { flag: 'my', country: 'Malaysia', share: '5.2%' },
  { flag: 'de', country: 'Germany', share: '4.9%' },
];

/** Shown under the hero podium — top of the page, out of respect for the nations we serve. */
const HERO_FLAGS: { code: FlagCode; name: string }[] = [
  { code: 'us', name: 'United States' },
  { code: 'gb', name: 'United Kingdom' },
  { code: 'fr', name: 'France' },
  { code: 'ru', name: 'Russia' },
  { code: 'cn', name: 'China' },
  { code: 'de', name: 'Germany' },
];

const UPTIME = 99.9;
const GAUGE_R = 36;
const GAUGE_C = 2 * Math.PI * GAUGE_R;

export function LandingPage() {
  const enterGuestTour = useAppStore((s) => s.enterGuestTour);
  const openStaging = useAppStore((s) => s.openStaging);
  const setWorkspace = useAppStore((s) => s.setWorkspace);

  const openShield = (id: WorkspaceType) => {
    enterGuestTour();
    setWorkspace(id);
  };

  return (
    <div className="landing-page sg16-app-shell relative min-h-[100dvh] overflow-x-hidden">
      <LandingNeonBackdrop />

      <div className="landing-page__content">
        <LandingHeader />

        <main className="lp-container">
          {/* ── Row 1: Geo Monitor · Hero · SG16 Finance ── */}
          <div className="lp-top">
            <div className="lp-top__side">
              <GeoMonitorCard />
            </div>

            <div className="lp-top__hero">
            <section className="lp-hero" aria-labelledby="lp-hero-title">
              <HeroStage />
              <div className="lp-hero__content">
                <p className="lp-hero__kicker">
                  <b>SG16</b> AI ENGINE
                </p>
                <h1 id="lp-hero-title" className="lp-hero__title">
                  Most Powerful
                </h1>
                <p className="lp-hero__sub">
                  Sovereign Artificial Intelligence. Five distinct shields — chat, code, health, student, and market —
                  built on foundational computing principles.
                </p>
                <div className="lp-hero__cta">
                  <button type="button" onClick={() => enterGuestTour()} className="lp-btn lp-btn--lg lp-btn--primary">
                    <Rocket className="h-5 w-5" />
                    Start Tour
                  </button>
                  <button type="button" onClick={() => openStaging()} className="lp-btn lp-btn--lg lp-btn--outline !px-6 !text-[15px]">
                    <span className="lp-dot" />
                    Staging Lab (24/7 AI)
                  </button>
                </div>
                <p className="lp-hero__note">
                  Engineered for privacy. Built for your control. SG16 AI Engine — your sovereign AI workspace.
                </p>
              </div>
            </section>

            <ul className="lp-flags" aria-label="Countries served">
              {HERO_FLAGS.map((f) => (
                <li key={f.code} title={f.name}>
                  <Flag code={f.code} />
                </li>
              ))}
            </ul>
            </div>

            <div className="lp-top__side">
              <FinanceCard />
            </div>
          </div>

          {/* ── Row 2: Our 5 Shields · Latest Activity ── */}
          <div id="features" className="lp-row2 scroll-mt-24">
            <section className="lp-panel lp-shields" aria-labelledby="lp-shields-title">
              <h2 id="lp-shields-title" className="lp-title">
                <Shield className="h-5 w-5" />
                Our 5 Shields
              </h2>
              <div className="lp-shields__grid">
                {SHIELDS_DATA.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button key={item.id} type="button" className="lp-shield" onClick={() => openShield(item.id)}>
                      <span className="lp-icon-tile">
                        <Icon className="h-6 w-6" />
                      </span>
                      <h3>{item.title}</h3>
                      <p>{item.desc}</p>
                      <span className="lp-link">
                        Enter <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="lp-panel lp-neon lp-activity" aria-labelledby="lp-activity-title">
              <div className="lp-activity__head">
                <h2 id="lp-activity-title" className="lp-title">
                  <span className="lp-activity__dot" />
                  Latest Activity
                </h2>
                <ChevronRight className="h-5 w-5 text-white/80" />
              </div>
              {LATEST_ACTIVITIES.map((act) => {
                const Icon = act.icon;
                return (
                  <div key={act.title} className="lp-activity__row">
                    <span className="lp-activity__icon" style={{ color: act.color } as CSSProperties}>
                      <Icon />
                    </span>
                    <div className="min-w-0">
                      <b>{act.title}</b>
                      <small>{act.detail}</small>
                    </div>
                    <time>{act.time}</time>
                  </div>
                );
              })}
            </section>
          </div>

          {/* ── Lower band: Projects + tagline · Security · Global Reach + footer ── */}
          <footer className="lp-lower">
            <div className="lp-lower__left">
            <section className="lp-panel lp-projects" aria-labelledby="lp-projects-title">
              <div className="flex items-center justify-between">
                <h2 id="lp-projects-title" className="lp-title">
                  <Globe className="h-6 w-6" />
                  Our Projects
                </h2>
                <span className="lp-link">
                  View All <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </div>
              <div className="lp-projects__list">
                {PROJECTS.map((p) => (
                  <span key={p.name}>
                    <i style={{ color: p.color }} />
                    {p.name}
                  </span>
                ))}
              </div>
            </section>

            <div className="lp-panel lp-neon lp-strip">
              <Globe />
              <span>One Platform</span>
              <span className="lp-sep">•</span>
              <span>Multiple Solutions</span>
              <span className="lp-sep">•</span>
              <span>Endless Possibilities</span>
            </div>
            </div>

            <div className="lp-lower__right">
            <section className="lp-panel lp-security" aria-labelledby="lp-security-title">
              <div>
                <h2 id="lp-security-title" className="lp-title !text-[14px]">
                  <ShieldCheck className="h-5 w-5" />
                  System Security
                </h2>
                <div className="lp-security__list">
                  {SECURITY.map((s) => {
                    const Icon = s.icon;
                    return (
                      <div key={s.label} className="lp-security__item">
                        <Icon />
                        <span>{s.label}</span>
                        <span className="lp-bar">
                          <i style={{ width: `${s.level}%` }} />
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="lp-uptime">
                <p>Platform Uptime</p>
                <div className="lp-gauge" role="img" aria-label={`Platform uptime ${UPTIME}%`}>
                  <svg viewBox="0 0 84 84">
                    <circle cx="42" cy="42" r={GAUGE_R} fill="none" stroke="rgba(255,22,141,0.15)" strokeWidth="6" />
                    <circle
                      cx="42"
                      cy="42"
                      r={GAUGE_R}
                      fill="none"
                      stroke="#FF168D"
                      strokeWidth="6"
                      strokeLinecap="round"
                      strokeDasharray={GAUGE_C}
                      strokeDashoffset={GAUGE_C * (1 - UPTIME / 100)}
                    />
                  </svg>
                  <b>{UPTIME}%</b>
                </div>
              </div>
            </section>

            <section className="lp-panel lp-reach" aria-labelledby="lp-reach-title">
              <div className="flex min-w-0 flex-col">
                <h2 id="lp-reach-title" className="lp-title !text-[14px]">
                  Global Reach
                </h2>
                <WorldDotMap className="lp-reach__map mt-2" />
              </div>
              <div className="lp-reach__list">
                {GLOBAL_REACH.map((item) => (
                  <div key={item.country}>
                    <Flag code={item.flag} />
                    <span>{item.country}</span>
                    <span>{item.share}</span>
                  </div>
                ))}
                <span className="lp-link !text-[10.5px] justify-end">
                  + More <ArrowRight className="h-3 w-3" />
                </span>
              </div>
            </section>

            <div className="lp-foot">
              <div className="lp-foot__brand">
                <strong>SG16 Engine</strong>
                <span>Technology</span>
                <span className="lp-sep">•</span>
                <span>Innovation</span>
                <span className="lp-sep">•</span>
                <span>Global Impact</span>
              </div>
            </div>
            </div>
          </footer>
        </main>

        <SiteFooter />
      </div>
    </div>
  );
}
