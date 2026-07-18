import { useState } from 'react';
import { ClipboardCheck, Sparkles, Lock } from 'lucide-react';
import { useAppStore } from '../../core/appState';
import { hasPaidAccess, isLaunchPeriod } from '../../core/access';

interface ProjectCheckPanelProps {
  onAnalyze: (prompt: string) => void;
}

/** Free: score + suggestions. Repair / rewrite → Premium. */
export function ProjectCheckPanel({ onAnalyze }: ProjectCheckPanelProps) {
  const [code, setCode] = useState('');
  const subscription = useAppStore((s) => s.subscription);
  const authUser = useAppStore((s) => s.authUser);
  const openPricing = useAppStore((s) => s.openPricing);
  const premium =
    hasPaidAccess(subscription) || isLaunchPeriod(authUser);

  const analyze = () => {
    const body = code.trim();
    if (!body) return;
    onAnalyze(
      [
        'Score this project or code from every side (structure, security, quality, tests, clarity).',
        'Return:',
        '1) SCORE: 0-100',
        '2) Breakdown by category',
        '3) Top 5 suggestions to improve',
        '4) Risks if left as-is',
        '',
        'CODE / PROJECT:',
        '```',
        body.slice(0, 12000),
        '```',
      ].join('\n')
    );
  };

  const repair = () => {
    if (!premium) {
      openPricing();
      return;
    }
    const body = code.trim();
    if (!body) return;
    onAnalyze(
      [
        'Repair and rewrite this code to production quality. Keep behavior, fix bugs, improve structure.',
        'Return improved full code with brief change notes.',
        '',
        '```',
        body.slice(0, 12000),
        '```',
      ].join('\n')
    );
  };

  return (
    <div className="shrink-0 border-b border-white/10 px-4 py-3 bg-black/30">
      <div className="flex items-center gap-2 mb-2">
        <ClipboardCheck className="w-4 h-4 text-sky-300" />
        <span className="text-xs font-semibold uppercase tracking-wider text-sky-200">
          Project check
        </span>
        <span className="text-[10px] text-white/40">Score free · Repair Premium</span>
      </div>
      <textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        rows={3}
        placeholder="Paste project files / code here for a full-side score..."
        className="w-full rounded-xl bg-black/50 border border-violet-500/20 focus:border-sky-400/50 outline-none text-sm text-white/90 p-3 resize-y min-h-[72px] max-h-40 font-mono"
      />
      <div className="flex flex-wrap gap-2 mt-2">
        <button
          type="button"
          onClick={analyze}
          disabled={!code.trim()}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-sky-500/20 text-sky-200 border border-sky-400/30 hover:bg-sky-500/30 disabled:opacity-40"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Check & score
        </button>
        <button
          type="button"
          onClick={repair}
          disabled={!code.trim()}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-violet-500/20 text-violet-100 border border-violet-400/30 hover:bg-violet-500/30 disabled:opacity-40"
        >
          {!premium && <Lock className="w-3.5 h-3.5" />}
          Repair / rewrite
        </button>
      </div>
    </div>
  );
}
