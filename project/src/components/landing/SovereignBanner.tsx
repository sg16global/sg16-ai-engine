import { Cpu, ShieldCheck, Lock, Globe } from 'lucide-react';
import { SG16_BRAND } from '../../core/branding';
import { CompanyDetailsCard } from '../company/CompanyDetailsCard';

const items = [
  {
    icon: Cpu,
    title: 'SG16 AI Engine',
    desc: 'Proprietary multi-shield AI architecture running on SG16 infrastructure with zero public data sharing.',
  },
  {
    icon: ShieldCheck,
    title: 'Officially Registered Entity',
    desc: `${SG16_BRAND.company} — Registered with the State of New Mexico (Filing #${SG16_BRAND.businessId}).`,
  },
  {
    icon: Lock,
    title: 'Zero-Data Trace',
    desc: 'Messages processed live — your prompts and chats stay on your local device.',
  },
  {
    icon: Globe,
    title: 'Global Edge Security',
    desc: 'Protected by Cloudflare enterprise DNS, WAF, and edge caching for sub-millisecond global delivery.',
  },
] as const;

export function SovereignBanner() {
  return (
    <section className="landing-section landing-section-tight" aria-label="SG16 AI Engine Credentials">
      <div className="landing-shell landing-section-head">
        <h2 className="landing-section-title">SG16 AI ENGINE</h2>
        <p className="landing-section-sub">
          Engineered and operated by {SG16_BRAND.company} — built for privacy, defense-in-depth, and enterprise
          reliability. Official Domestic LLC registered with the State of New Mexico Office of the Secretary of State.
        </p>
      </div>

      {/* Official Company Details & Certificate Access */}
      <div className="landing-shell max-w-3xl mb-8">
        <CompanyDetailsCard />
      </div>

      <div className="landing-shell landing-sovereign-grid">
        {items.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="landing-sovereign-card">
            <Icon className="mb-2 h-4 w-4 text-[#FF168D]" strokeWidth={1.75} />
            <p className="text-[13px] font-semibold text-white">{title}</p>
            <p className="mt-1 text-[12px] font-light leading-relaxed text-white/50">{desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
