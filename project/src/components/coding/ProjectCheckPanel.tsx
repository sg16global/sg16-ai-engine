import { useState } from 'react';
import {
  ClipboardCheck,
  Sparkles,
  Lock,
  Loader2,
  Shield,
  Copy,
  Check,
  Wand2,
  Package,
  MessageSquare,
  Play,
  Maximize2,
  X,
} from 'lucide-react';
import { FullScreen, PreviewFrame, previewForPasted } from '../chat/CodeBlock';
import { useAppStore } from '../../core/appState';
import { hasPaidAccess, isLaunchPeriod } from '../../core/access';
import { scanWithCodingShield, type ShieldScanResponse } from '../../lib/codingShieldApi';
import { languageName } from '../../lib/codingReports';

interface ProjectCheckPanelProps {
  onAnalyze: (prompt: string) => void;
  onScanned?: (report: ShieldScanResponse) => void;
  /** Code to start with (e.g. a saved snippet). */
  initialCode?: string;
}

function scoreColor(score: number) {
  if (score >= 75) return 'text-emerald-300';
  if (score >= 50) return 'text-amber-300';
  return 'text-[#FF5C7A]';
}

function useCopy() {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      window.setTimeout(() => setCopied((c) => (c === key ? null : c)), 1500);
    } catch {
      /* clipboard blocked — the text stays visible to copy by hand */
    }
  };
  return { copied, copy };
}

function explainPrompt(report: ShieldScanResponse, code: string) {
  const issueLines = report.issues.length
    ? report.issues.map((i) => `- ${i.line ? `line ${i.line}: ` : ''}${i.message} (${i.tool})`).join('\n')
    : '- no problems found';
  return [
    'Coding Shield scan complete — REAL TOOL RESULTS (not estimated).',
    `SCORE: ${report.score}/100 (${report.grade}) · ${languageName(report.language)} · ${report.mode} scan`,
    '',
    'Problems found:',
    issueLines,
    '',
    'Explain each problem in plain words, show how to fix it, and say what can go wrong if it is ignored.',
    '',
    'CODE:',
    '```',
    code.slice(0, 12000),
    '```',
  ].join('\n');
}

/** Free: real Coding Shield score + problem list + safe auto-fixes. Repair / rewrite → Premium. */
export function ProjectCheckPanel({ onAnalyze, onScanned, initialCode = '' }: ProjectCheckPanelProps) {
  const [code, setCode] = useState(initialCode);
  const [run, setRun] = useState<{ kind: 'web' | 'console' | 'none'; doc: string } | null>(null);
  const [runKey, setRunKey] = useState(0);
  const [fullRun, setFullRun] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [report, setReport] = useState<ShieldScanResponse | null>(null);
  const [scannedCode, setScannedCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { copied, copy } = useCopy();
  const subscription = useAppStore((s) => s.subscription);
  const authUser = useAppStore((s) => s.authUser);
  const openPricing = useAppStore((s) => s.openPricing);
  const premium =
    hasPaidAccess(subscription) || isLaunchPeriod(authUser);
  const mode = premium ? 'deep' : 'fast';

  const analyze = async () => {
    const body = code.trim();
    if (!body || scanning) return;
    setScanning(true);
    setError(null);
    try {
      const result = await scanWithCodingShield({ code: body, language: 'auto', mode });
      setReport(result);
      setScannedCode(body);
      onScanned?.(result);
    } catch (err) {
      setReport(null);
      setError(err instanceof Error ? err.message : 'Scan failed');
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
        <div className="sg16-card p-4 max-h-[62vh] overflow-y-auto">
          <div className="flex items-center gap-2 mb-2.5">
            <span className="w-9 h-9 rounded-2xl bg-[#FF168D]/15 border border-[#FF168D]/20 flex items-center justify-center">
              <ClipboardCheck className="w-4 h-4 text-[#FF5CB8]" />
            </span>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-white tracking-tight flex items-center gap-1.5">
                Coding Shield
                <Shield className="w-3.5 h-3.5 text-[#FF5CB8]/80" />
              </div>
              <div className="text-[11px] text-white/40">
                JavaScript · TypeScript · Python · {mode === 'deep' ? 'Deep scan (security rules)' : 'Fast scan'} · Score free
              </div>
            </div>
          </div>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            rows={3}
            placeholder="Paste code — syntax, ESLint, security rules and secret checks run for real..."
            className="w-full rounded-[var(--sg16-r-bar)] bg-black/45 border border-white/[0.08] focus:border-[#FF168D]/40 outline-none text-sm text-white/90 p-3 resize-y min-h-[72px] max-h-40 font-mono placeholder:text-white/25"
          />
          <div className="flex flex-wrap gap-2 mt-2.5">
            <button
              type="button"
              onClick={() => {
                const p = previewForPasted(code);
                setRun(p ?? { kind: 'none', doc: '' });
                setRunKey((k) => k + 1);
              }}
              disabled={!code.trim()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-200 border border-emerald-400/25 hover:bg-emerald-500/20 disabled:opacity-40 transition"
            >
              <Play className="w-3.5 h-3.5" />
              Preview / Run
            </button>
            <button
              type="button"
              onClick={analyze}
              disabled={!code.trim() || scanning}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold bg-[#FF168D]/15 text-[#FFE0F0] border border-[#FF168D]/25 hover:bg-[#FF168D]/25 disabled:opacity-40 transition"
            >
              {scanning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              {scanning ? (mode === 'deep' ? 'Scanning… (about 20 s)' : 'Scanning…') : 'Shield scan'}
            </button>
            <button
              type="button"
              onClick={repair}
              disabled={!code.trim()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold bg-[#FF168D]/12 text-[#FFB3DA] border border-[#FF168D]/25 hover:bg-[#FF168D]/20 disabled:opacity-40 transition"
            >
              {!premium && <Lock className="w-3.5 h-3.5" />}
              Repair / rewrite
            </button>
          </div>

          {run && (
            <div className="mt-3 rounded-xl border border-white/10 bg-black/40 overflow-hidden">
              <div className="flex items-center gap-3 px-3 py-1.5 border-b border-white/[0.08] text-[11px] text-white/55">
                <span className="flex-1">
                  {run.kind === 'web' ? 'Preview' : run.kind === 'console' ? 'Run — console output' : 'Preview / Run'}
                  {run.kind !== 'none' && ' · runs sealed off from SG16'}
                </span>
                {run.kind !== 'none' && (
                  <button type="button" onClick={() => setFullRun(true)} className="inline-flex items-center gap-1 hover:text-white">
                    <Maximize2 className="w-3 h-3" /> Full screen
                  </button>
                )}
                <button type="button" onClick={() => setRun(null)} className="inline-flex items-center gap-1 hover:text-white" aria-label="Close preview">
                  <X className="w-3 h-3" /> Close
                </button>
              </div>
              {run.kind === 'none' ? (
                <p className="px-3 py-3 text-xs text-white/60">
                  Preview / Run works for HTML, CSS and browser JavaScript. Python, Java and other languages can be scanned
                  here but cannot run inside the browser.
                </p>
              ) : (
                <PreviewFrame key={runKey} doc={run.doc} className={run.kind === 'web' ? 'h-80 resize-y' : 'h-48 resize-y'} />
              )}
            </div>
          )}
          {fullRun && run && run.kind !== 'none' && <FullScreen doc={run.doc} onClose={() => setFullRun(false)} />}

          {error && (
            <div className="mt-3 rounded-xl border border-[#FF5C7A]/30 bg-[#FF5C7A]/10 px-3 py-2 text-xs text-[#FFB3C0]">
              Coding Shield could not run: {error}
            </div>
          )}

          {report && (
            <div className="mt-3 space-y-3">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className={`text-2xl font-bold tabular-nums ${scoreColor(report.score)}`}>
                  {report.score}/100
                </span>
                <span className={`text-sm font-semibold ${scoreColor(report.score)}`}>Grade {report.grade}</span>
                <span className="text-[11px] text-white/45">
                  {languageName(report.language)} · {report.mode === 'deep' ? 'deep scan' : 'fast scan'} ·{' '}
                  {report.issues.length} problem{report.issues.length === 1 ? '' : 's'}
                </span>
              </div>
              {report.limited && (
                <div className="text-[11px] text-white/45">
                  Some checks do not apply to {languageName(report.language)}:{' '}
                  {report.tools
                    .filter((t) => t.skipped)
                    .map((t) => t.summary.replace(/^skipped — /, ''))
                    .join('; ')}
                </div>
              )}

              {report.issues.length > 0 ? (
                <ul className="rounded-xl border border-white/[0.08] bg-black/30 divide-y divide-white/[0.06]">
                  {report.issues.map((issue, i) => (
                    <li key={i} className="flex gap-2.5 px-3 py-2 text-xs">
                      <span
                        className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                          issue.severity === 'error' ? 'bg-[#FF5C7A]' : 'bg-amber-300'
                        }`}
                        aria-label={issue.severity}
                      />
                      <span className="w-14 shrink-0 font-mono text-white/45">
                        {issue.line ? `Line ${issue.line}` : '—'}
                      </span>
                      <span className="min-w-0 flex-1 text-white/85">
                        {issue.message}
                        <span className="ml-1.5 text-white/35">
                          {issue.category === 'security' ? 'security · ' : ''}
                          {issue.tool}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-xs text-emerald-300/90">No problems found.</div>
              )}

              {report.fixedCode && (
                <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/[0.04] p-3">
                  <div className="mb-2 flex flex-wrap items-center gap-2 text-xs font-semibold text-emerald-200">
                    <Wand2 className="h-3.5 w-3.5" /> Auto-fixed code (safe fixes only)
                    <span className="ml-auto flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => copy('fixed', report.fixedCode!)}
                        className="inline-flex items-center gap-1 rounded-full border border-white/10 px-2.5 py-1 text-[11px] font-medium text-white/80 hover:bg-white/10"
                      >
                        {copied === 'fixed' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        {copied === 'fixed' ? 'Copied' : 'Copy'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setCode(report.fixedCode!)}
                        className="inline-flex items-center gap-1 rounded-full border border-white/10 px-2.5 py-1 text-[11px] font-medium text-white/80 hover:bg-white/10"
                      >
                        Use this code
                      </button>
                    </span>
                  </div>
                  <pre className="max-h-48 overflow-auto whitespace-pre text-[11px] leading-relaxed text-white/80 font-mono">
                    {report.fixedCode}
                  </pre>
                </div>
              )}

              {report.dependencies.installCommand && (
                <div className="flex flex-wrap items-center gap-2 rounded-xl border border-white/[0.08] bg-black/30 px-3 py-2 text-xs">
                  <Package className="h-3.5 w-3.5 text-[#FF5CB8]" />
                  <span className="text-white/55">Install packages:</span>
                  <code className="min-w-0 flex-1 break-all font-mono text-white/90">
                    {report.dependencies.installCommand}
                  </code>
                  <button
                    type="button"
                    onClick={() => copy('install', report.dependencies.installCommand!)}
                    className="inline-flex items-center gap-1 rounded-full border border-white/10 px-2.5 py-1 text-[11px] font-medium text-white/80 hover:bg-white/10"
                  >
                    {copied === 'install' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    {copied === 'install' ? 'Copied' : 'Copy'}
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={() => onAnalyze(explainPrompt(report, scannedCode))}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold bg-white/[0.06] text-white/85 border border-white/10 hover:bg-white/10 transition"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Explain with AI
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
