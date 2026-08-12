import { Cpu, ShieldCheck, Lock } from 'lucide-react';
import { SG16_BRAND } from '../../core/branding';

const items = [
  {
    icon: Cpu,
    title: 'Own brain',
    desc: `${SG16_BRAND.sovereignBrain} (${SG16_BRAND.sovereignLicense}) on SG16 infrastructure`,
  },
  {
    icon: ShieldCheck,
    title: 'Not a wrapper',
    desc: 'SG16 Secure Room — your request hits sg16engine.com first, not a rented AI gateway',
  },
  {
    icon: Lock,
    title: 'Zero-Data Trace',
    desc: 'Messages processed live — chat content not stored in our database',
  },
] as const;

export function SovereignBanner() {
  return (
    <section className="landing-section landing-section-tight" aria-label="Sovereign AI">
      <div className="landing-shell landing-section-head">
        <h2 className="landing-section-title">Sovereign SG16 brain</h2>
        <p className="landing-section-sub">
          Self-hosted Mistral engine by {SG16_BRAND.company} — built for ownership, not dependency on third-party AI
          APIs.
        </p>
      </div>
      <div className="landing-shell landing-sovereign-grid">
        {items.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="landing-sovereign-card">
            <Icon className="mb-2 h-4 w-4 text-[#7CFC00]" strokeWidth={1.75} />
            <p className="text-[13px] font-semibold text-white">{title}</p>
            <p className="mt-1 text-[12px] font-light leading-relaxed text-white/50">{desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
