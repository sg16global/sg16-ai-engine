import { useAppStore } from '../../core/appState';
import type { HelpSection } from '../../core/types';

const sections: { id: HelpSection; title: string; body: string[] }[] = [
  {
    id: 'overview',
    title: 'Getting Started',
    body: [
      'Type any question in the Ask Engine box on Home — SG16 AI routes you to the best workspace automatically.',
      'Use the sidebar to open any workspace directly: Coding, Image Studio, Document Lab, Translate, Voice AI, Memory Vault, Student Shield, or AI Chat.',
      'Upload images in Image Studio to create new visuals from a prompt (like ChatGPT) or edit photos — remove watermarks, change objects, and more.',
      'Memory Vault saves notes on your device and SG16 AI uses them when you ask recall questions.',
      'Voice AI uses your browser microphone for speech input and reads replies aloud.',
    ],
  },
  {
    id: 'privacy',
    title: 'Privacy Policy',
    body: [
      'SG16 AI Engine is built by SaifTech Global Limited.',
      'Chat history and Memory Vault entries are stored locally in your browser on this device unless you clear them in Settings.',
      'When you send a message, your text (and uploaded images or documents) are processed by SG16 AI to generate a response.',
      'We do not sell your personal data. You can delete local data anytime from Settings.',
      'For enterprise or privacy questions, contact us via the Contact section.',
    ],
  },
  {
    id: 'terms',
    title: 'Terms of Service',
    body: [
      'By using SG16 AI Engine you agree to use the platform responsibly and lawfully.',
      'Do not use SG16 AI to generate harmful, illegal, or abusive content.',
      'Student Shield is designed for educational use — non-educational topics may be redirected to AI Chat.',
      'AI responses may contain errors. Verify important information before acting on it.',
      'SaifTech Global Limited may update these terms as the platform evolves.',
    ],
  },
  {
    id: 'contact',
    title: 'Contact Us',
    body: [
      'Company: SaifTech Global Limited',
      'Product: SG16 AI Engine',
      'Email: support@saiftech.global',
      'For premium plans, enterprise deployment, or custom integrations, email us with your requirements.',
      'We typically respond within 1–2 business days.',
    ],
  },
];

export function HelpPanel() {
  const helpSection = useAppStore((s) => s.helpSection);
  const openHelp = useAppStore((s) => s.openHelp);

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Help Center</h1>
      <p className="text-sm text-gray-500 mb-6">Guides and policies for SG16 AI Engine.</p>

      <div className="flex flex-wrap gap-2 mb-8">
        {sections.map((s) => {
          const href =
            s.id === 'terms' ? '/terms' :
            s.id === 'privacy' ? '/privacy' :
            s.id === 'contact' ? '/contact' :
            '/help';
          return (
          <a
            key={s.id}
            href={href}
            onClick={(e) => {
              e.preventDefault();
              openHelp(s.id);
            }}
            className={`text-xs px-4 py-2 rounded-xl border transition ${
              helpSection === s.id
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                : 'border-white/10 text-gray-400 hover:border-white/20'
            }`}
          >
            {s.title}
          </a>
          );
        })}
      </div>

      {sections
        .filter((s) => s.id === helpSection)
        .map((s) => (
          <section key={s.id} className="bg-zinc-900/80 border border-white/10 rounded-2xl p-6">
            <h2 className="text-lg font-semibold mb-4">{s.title}</h2>
            <ul className="space-y-3">
              {s.body.map((line) => (
                <li key={line} className="text-sm text-gray-400 leading-relaxed flex gap-2">
                  <span className="text-emerald-400 shrink-0">•</span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
            {s.id === 'contact' && (
              <a
                href="mailto:support@saiftech.global"
                className="inline-block mt-6 bg-emerald-600 hover:bg-emerald-500 px-5 py-2.5 rounded-xl text-sm font-medium"
              >
                Email Support
              </a>
            )}
          </section>
        ))}
    </div>
  );
}
