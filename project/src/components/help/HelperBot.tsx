import { useMemo, useState } from 'react';
import { Headphones, Send, X, Mail } from 'lucide-react';
import { SG16_BRAND } from '../../core/branding';

const BASIC_REPLIES: { test: RegExp; answer: string }[] = [
  {
    test: /price|pricing|premium|subscribe|\$/,
    answer:
      'Plans: Free (Chat + Health basics), Student Shield (verified students), Pro Premium (full Coding repair & more). Open Premium in the menu for details.',
  },
  {
    test: /student|shield|verify|id/,
    answer:
      'Student Shield is our education-safe tutor. Use Student Verify with a valid student ID for the student plan.',
  },
  {
    test: /coding|score|repair|project/,
    answer:
      'Open Coding Hub → paste your project → Check & score (free). Repair / rewrite needs Premium.',
  },
  {
    test: /health|report|doctor/,
    answer:
      'Health Guide explains wellness questions and report language. It is not a doctor — seek a clinician for diagnosis.',
  },
  {
    test: /login|google|sign ?in|account/,
    answer: 'Use Sign in with Google. We never ask for your Google password on this site.',
  },
  {
    test: /hello|hi\b|help|how (do|to)|what is sg16/,
    answer: `Hi — I'm the 24h SG16 helping hand. Ask basic how-to here. For strong / account / billing issues I'll escalate to ${SG16_BRAND.contactEmail}.`,
  },
];

function looksStrong(text: string): boolean {
  const t = text.toLowerCase();
  if (text.length > 220) return true;
  return /refund|charged|hack|stolen|lawsuit|emergency|bug in production|can't login|cannot login|payment failed|urgent|lawsuit|legal|abuse/.test(
    t
  );
}

function basicAnswer(text: string): string | null {
  for (const row of BASIC_REPLIES) {
    if (row.test.test(text)) return row.answer;
  }
  return null;
}

export function HelperBot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [lines, setLines] = useState<{ role: 'user' | 'bot'; text: string }[]>([
    {
      role: 'bot',
      text: '24h helping hand online. Basic questions get instant tips. Strong issues → email to our team.',
    },
  ]);

  const mailto = useMemo(() => {
    const subject = encodeURIComponent('SG16 support — escalated from helper');
    const body = encodeURIComponent(
      `Hi SG16 team,\n\nI need help with:\n\n[describe issue]\n\n— sent from SG16 helping hand`
    );
    return `mailto:${SG16_BRAND.contactEmail}?subject=${subject}&body=${body}`;
  }, []);

  const send = () => {
    const q = input.trim();
    if (!q) return;
    setInput('');
    setLines((prev) => [...prev, { role: 'user', text: q }]);

    if (looksStrong(q)) {
      setLines((prev) => [
        ...prev,
        {
          role: 'bot',
          text: `This looks like a strong case. I've prepared an email to ${SG16_BRAND.contactEmail} — our team will solve it personally.`,
        },
      ]);
      window.setTimeout(() => {
        window.location.href = `${mailto}&body=${encodeURIComponent(`Hi SG16 team,\n\nIssue:\n${q}\n\n— from SG16 helping hand`)}`;
      }, 400);
      return;
    }

    const answer =
      basicAnswer(q) ||
      `I can help with basic how-to (Chat, Student Shield, Coding score, Health). For deeper account or urgent issues, tap Email us — ${SG16_BRAND.contactEmail}.`;
    setLines((prev) => [...prev, { role: 'bot', text: answer }]);
  };

  return (
    <div className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] lg:bottom-5 right-3 z-40 flex flex-col items-end gap-2">
      {open && (
        <div className="w-[min(92vw,340px)] rounded-2xl border border-violet-400/30 bg-[#0c0614]/95 backdrop-blur-xl shadow-[0_0_40px_rgba(139,92,246,0.25)] overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-white/10 bg-violet-500/10">
            <div className="flex items-center gap-2">
              <Headphones className="w-4 h-4 text-violet-300" />
              <div>
                <div className="text-xs font-semibold text-violet-100">Helping hand · 24h</div>
                <div className="text-[10px] text-white/45">Basic auto · strong → email</div>
              </div>
            </div>
            <button type="button" onClick={() => setOpen(false)} className="text-white/50 hover:text-white p-1">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="max-h-56 overflow-y-auto p-3 space-y-2">
            {lines.map((l, i) => (
              <div
                key={`${i}-${l.role}`}
                className={`text-xs leading-relaxed rounded-xl px-2.5 py-2 ${
                  l.role === 'user'
                    ? 'bg-violet-500/20 text-violet-50 ml-6'
                    : 'bg-white/5 text-white/80 mr-4'
                }`}
              >
                {l.text}
              </div>
            ))}
          </div>
          <div className="p-2 border-t border-white/10 flex gap-1.5">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
              placeholder="Ask basic help..."
              className="flex-1 rounded-lg bg-black/40 border border-white/10 px-2.5 py-1.5 text-xs outline-none focus:border-violet-400/50"
            />
            <button
              type="button"
              onClick={send}
              className="p-2 rounded-lg bg-violet-500/30 text-violet-100 border border-violet-400/30"
              aria-label="Send"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
            <a
              href={mailto}
              className="p-2 rounded-lg bg-white/5 text-white/70 border border-white/10"
              title="Email support"
            >
              <Mail className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 pl-3 pr-4 py-2.5 rounded-full border border-violet-400/40 bg-[#12081c] text-violet-100 shadow-[0_0_24px_rgba(139,92,246,0.35)]"
      >
        <span className="w-8 h-8 rounded-full bg-violet-600/80 flex items-center justify-center">
          <Headphones className="w-4 h-4 text-white" />
        </span>
        <span className="text-[11px] font-semibold uppercase tracking-wider">Help</span>
      </button>
    </div>
  );
}
