import { SG16_BRAND } from '../../core/branding';
import { LEGAL_SECTIONS, type LegalSection } from '../../content/legalContent';

interface LegalDocumentViewProps {
  section: LegalSection;
  showNav?: boolean;
  onSelectSection?: (section: LegalSection) => void;
}

const SECTION_PATH: Record<LegalSection, string> = {
  overview: '/help',
  privacy: '/privacy',
  terms: '/terms',
  contact: '/contact',
  license: '/license',
};

export function LegalDocumentView({ section, showNav = true, onSelectSection }: LegalDocumentViewProps) {
  const active = LEGAL_SECTIONS.find((s) => s.id === section) ?? LEGAL_SECTIONS[0];

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 lg:py-10">
      <h1 className="text-2xl font-bold mb-2">{active.title}</h1>
      <p className="text-sm text-gray-500 mb-6">
        {SG16_BRAND.company} — {SG16_BRAND.name}
      </p>

      {showNav && (
        <div className="flex flex-wrap gap-2 mb-8">
          {LEGAL_SECTIONS.map((s) => (
            <a
              key={s.id}
              href={SECTION_PATH[s.id]}
              onClick={(e) => {
                if (onSelectSection) {
                  e.preventDefault();
                  onSelectSection(s.id);
                }
              }}
              className={`text-xs px-4 py-2 rounded-xl border transition ${
                section === s.id
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                  : 'border-white/10 text-gray-400 hover:border-white/20'
              }`}
            >
              {s.title}
            </a>
          ))}
        </div>
      )}

      <section className="bg-zinc-900/80 border border-white/10 rounded-2xl p-6">
        <ul className="space-y-3">
          {active.body.map((line) => (
            <li key={line} className="text-sm text-gray-400 leading-relaxed flex gap-2">
              <span className="text-emerald-400 shrink-0">•</span>
              <span>{line}</span>
            </li>
          ))}
        </ul>
        {section === 'contact' && (
          <a
            href={`mailto:${SG16_BRAND.contactEmail}`}
            className="inline-block mt-6 bg-emerald-600 hover:bg-emerald-500 px-5 py-2.5 rounded-xl text-sm font-medium"
          >
            Email {SG16_BRAND.contactEmail}
          </a>
        )}
      </section>
    </div>
  );
}
