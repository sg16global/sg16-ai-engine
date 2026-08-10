import { useState } from 'react';
import { ClipboardCheck, Sparkles, Lock, Loader2, Shield } from 'lucide-react';
import { useAppStore } from '../../core/appState';
import { hasPaidAccess, isLaunchPeriod } from '../../core/access';
import { scanWithCodingShield } from '../../lib/codingShieldApi';
import { guessLanguage } from '../../lib/codingReports';

interface ProjectCheckPanelProps {
  onAnalyze: (prompt: string) => void;
}

/** Free: real Coding Shield score. Repair / deep scan → Premium. */
export function ProjectCheckPanel({ onAnalyze }: ProjectCheckPanelProps) {
  const [code, setCode] = useState('');
  const [scanning, setScanning] = useState(false);
  const [lastScore, setLastScore] = useState<number | null>(null);
  const [lastGrade, setLastGrade] = useState<string | null>(null);
  const subscription = useAppStore((s) => s.subscription);
  const authUser = useAppStore((s) => s.authUser);
  const openPricing = useAppStore((s) => s.openPricing);
  const premium =
    hasPaidAccess(subscription) || isLaunchPeriod(authUser);

  const analyze = async () => {
    const body = code.trim();
    if (!body || scanning) return;
    setScanning(true);
    try {
      const report = await scanWithCodingShield({
        code: body,
        language: guessLanguage(body),
        mode: 'fast',
      });
      setLastScore(report.score);
      setLastGrade(report.grade);

      const toolLines = report.tools
        .filter((t) => !t.skipped)
        .map((t) => `- ${t.tool}: ${t.summary}`)
        .join('\n');

      onAnalyze(
        [
          `Coding Shield scan complete — REAL TOOL RESULTS (not estimated).`,
          `SCORE: ${report.score}/100 (${report.grade})`,
          `Categories: ${Object.entries(report.categories)
            .map(([k, v]) => `${k} ${v.score}`)
            .join(', ')}`,
          '',
          'Tool results:',
          toolLines,
          '',
          'Give the user: 1) score explanation 2) top fixes 3) risks if ignored.',
          '',
          'CODE:',
          '```',
          body.slice(0, 12000),
          '```',
        ].join('\n'),
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Scan failed';
      onAnalyze(`Coding Shield could not run: ${message}. Review this code manually:\n\`\`\`\n${body.slice(0, 8000)}\n\`\`\``);
    } finally {
      setScanning(false);
    }
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
      ].join('\n'),
    );
  };

  return (
    <div className="shrink-0 px-4 sm:px-5 pt-3 pb-2">
      <div className="sg16-chat-col">
        <div className="sg16-card p-4">
          <div className="flex items-center gap-2 mb-2.5">
            <span className="w-9 h-9 rounded-2xl bg-sky-500/15 border border-sky-400/20 flex items-center justify-center">
              <ClipboardCheck className="w-4 h-4 text-sky-300" />
            </span>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-white tracking-tight flex items-center gap-1.5">
                Coding Shield
                <Shield className="w-3.5 h-3.5 text-sky-300/80" />
              </div>
              <div className="text-[11px] text-white/40">
                10-tool scan · shield.sg16engine.com · Score free
              </div>
            </div>
          </div>
          {lastScore != null && (
            <div className="mb-2 text-xs text-emerald-300/90">
              Last shield score: <strong>{lastScore}/100</strong> ({lastGrade})
            </div>
          )}
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            rows={3}
            placeholder="Paste code — ESLint, Sonar rules, Acorn, Gitleaks patterns run for real..."
            className="w-full rounded-[var(--sg16-r-bar)] bg-black/45 border border-white/[0.08] focus:border-sky-400/40 outline-none text-sm text-white/90 p-3 resize-y min-h-[72px] max-h-40 font-mono placeholder:text-white/25"
          />
          <div className="flex flex-wrap gap-2 mt-2.5">
            <button
              type="button"
              onClick={analyze}
              disabled={!code.trim() || scanning}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold bg-sky-500/15 text-sky-100 border border-sky-400/25 hover:bg-sky-500/25 disabled:opacity-40 transition"
            >
              {scanning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              {scanning ? 'Scanning…' : 'Shield scan'}
            </button>
            <button
              type="button"
              onClick={repair}
              disabled={!code.trim()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold bg-[#FF2E2E]/12 text-[#FFB4B4] border border-[#FF2E2E]/25 hover:bg-[#FF2E2E]/20 disabled:opacity-40 transition"
            >
              {!premium && <Lock className="w-3.5 h-3.5" />}
              Repair / rewrite
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
