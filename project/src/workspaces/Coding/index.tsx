import { useState } from 'react';
import {
  ArrowLeft,
  Code2,
  Copy,
  FileCode2,
  Lightbulb,
  ClipboardList,
  ShieldCheck,
  MessageSquare,
  Trash2,
} from 'lucide-react';
import { WorkspaceShell } from '../../components/workspace/WorkspaceShell';
import { ModuleHub } from '../../components/workspace/ModuleHub';
import { ChatPanel } from '../../components/chat/ChatPanel';
import { ProjectCheckPanel } from '../../components/coding/ProjectCheckPanel';
import { HeroCard, ToolCard, BarListCard, BarRow } from '../../components/ui/Sg16Cards';
import { ToolPage } from '../../components/tools/ToolPage';
import { RecordTool, type ToolRecord } from '../../components/tools/RecordTool';
import { useAppStore } from '../../core/appState';
import {
  deleteCodingReport,
  loadCodingReports,
  saveCodingReport,
  languageName,
  type CodingReport,
} from '../../lib/codingReports';
import type { ShieldScanResponse } from '../../lib/codingShield';
import { useOpenChatRequest } from '../../hooks/useOpenChatRequest';

type View = 'hub' | 'check' | 'chat' | 'reports' | 'snippets';
type Snippet = ToolRecord & { title: string; language: string; code: string };

const LANGUAGES = ['JavaScript', 'TypeScript', 'Python', 'Java', 'C / C++', 'C#', 'Go', 'PHP', 'SQL', 'HTML / CSS', 'Other'];

function scoreTone(score: number) {
  if (score >= 75) return 'text-emerald-400';
  if (score >= 50) return 'text-amber-300';
  return 'text-[#FF5CB8]';
}

function ReportList({ reports, onDelete, onNewCheck }: { reports: CodingReport[]; onDelete?: (id: string) => void; onNewCheck: () => void }) {
  if (reports.length === 0) {
    return (
      <div className="px-5 py-10 text-center text-sm text-white/35">
        No reports yet — run{' '}
        <button type="button" className="text-[#FF5CB8] hover:underline" onClick={onNewCheck}>
          Check Your Code
        </button>{' '}
        to start.
      </div>
    );
  }
  return (
    <>
      {reports.map((r, i) => (
        <BarRow key={r.id}>
          <div className="flex items-center gap-4 min-w-0">
            <span className="text-white/35 text-xs w-5">{i + 1}</span>
            <div className="min-w-0">
              <div className="text-sm text-white truncate">{r.title}</div>
              <div className="text-[11px] text-[#FF5CB8]/90 mt-0.5">{r.language}</div>
            </div>
          </div>
          <div className="flex items-center gap-4 shrink-0 text-xs">
            <span className="text-[#FF5CB8]">{r.errors} err</span>
            <span className={`font-medium ${scoreTone(r.score)}`}>{r.score}/100</span>
            <span className="text-white/35 hidden sm:inline">{r.date}</span>
            {onDelete && (
              <button type="button" onClick={() => onDelete(r.id)} className="p-1 text-white/35 hover:text-[#FF5CB8]" aria-label="Delete report">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </BarRow>
      ))}
    </>
  );
}

export const CodingWorkspace = () => {
  const [view, setView] = useState<View>('hub');
  const [reports, setReports] = useState(() => loadCodingReports());
  const [checkCode, setCheckCode] = useState('');

  const onAnalyze = (prompt: string) => {
    useAppStore.setState({ pendingPrompt: prompt, pendingPromptToken: Date.now() });
    setView('chat');
  };
  const onScanned = (report: ShieldScanResponse) => {
    saveCodingReport({
      title: 'Coding Shield',
      language: languageName(report.language),
      errors: report.issues.filter((i) => i.severity === 'error').length,
      score: report.score,
    });
    setReports(loadCodingReports());
  };
  const openChat = (prompt?: string) => {
    if (prompt) {
      useAppStore.setState({ pendingPrompt: prompt, pendingPromptToken: Date.now() });
    }
    setView('chat');
  };
  const openCheck = (code = '') => {
    setCheckCode(code);
    setView('check');
  };
  useOpenChatRequest('coding', () => setView('chat'));

  if (view === 'check' || view === 'chat') {
    return (
      <WorkspaceShell
        title={view === 'check' ? 'Check Your Code' : 'Coding Hub'}
        subtitle={view === 'check' ? 'Paste code → real 10-tool scan → score and fixes' : 'AI coding help for your project'}
        badge="Developer"
        badgeClass="text-[#FF5CB8]"
        skin="coding"
      >
        {view === 'check' ? (
          // The scan gets the whole page (results can be long); "Explain with AI" opens the chat view.
          <div className="h-full overflow-y-auto overscroll-contain mobile-scroll-main pb-4">
            <div className="px-4 sm:px-5 pt-3">
              <button
                type="button"
                onClick={() => setView('hub')}
                className="sg16-bar-soft inline-flex items-center gap-1.5 text-xs text-white/55 hover:text-white"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Coding
              </button>
            </div>
            <ProjectCheckPanel key={checkCode} initialCode={checkCode} onAnalyze={onAnalyze} onScanned={onScanned} />
          </div>
        ) : (
          <ChatPanel
            workspaceId="coding"
            monospace
            placeholder="Describe what to build or fix..."
            suggestions={[
              'Review this React component for bugs',
              'Write a secure Express API route',
              'Explain this TypeScript error',
            ]}
            onBack={() => setView('hub')}
            backLabel="Back to Coding"
            onScanCode={(code) => openCheck(code)}
          />
        )}
      </WorkspaceShell>
    );
  }

  if (view === 'reports') {
    return (
      <div className="sg16-work-field h-full">
        <ToolPage title="Reports" subtitle="Every code check you ran on this device." backLabel="Back to Coding" onBack={() => setView('hub')}>
          <BarListCard title="All reports" right={<span className="text-[11px] text-white/35">{reports.length} saved</span>}>
            <ReportList
              reports={reports}
              onNewCheck={() => openCheck()}
              onDelete={(id) => {
                deleteCodingReport(id);
                setReports(loadCodingReports());
              }}
            />
          </BarListCard>
        </ToolPage>
      </div>
    );
  }

  if (view === 'snippets') {
    return (
      <div className="sg16-work-field h-full">
        <ToolPage title="My Snippets" subtitle="Save code you reuse — copy it, scan it, or ask the AI about it." backLabel="Back to Coding" onBack={() => setView('hub')}>
          <RecordTool<Snippet>
            storageKey="coding_snippets"
            itemLabel="snippet"
            emptyText="No snippets yet."
            fields={[
              { name: 'title', label: 'Title', required: true, placeholder: 'e.g. Fetch with timeout' },
              { name: 'language', label: 'Language', type: 'select', options: LANGUAGES },
              { name: 'code', label: 'Code', type: 'textarea', required: true },
            ]}
            sort={(a, b) => b.createdAt - a.createdAt}
            renderRow={(s) => (
              <>
                <div className="text-white">
                  <span className="font-medium">{s.title}</span> <span className="text-xs text-[#FF5CB8]">{s.language}</span>
                </div>
                <pre className="mt-1.5 max-h-28 overflow-auto rounded-lg bg-black/40 p-2 text-[11px] font-mono text-white/75">{s.code}</pre>
                <div className="flex flex-wrap gap-2 mt-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      const btn = e.currentTarget;
                      void navigator.clipboard?.writeText(s.code).then(() => {
                        btn.lastChild!.textContent = ' Copied';
                        window.setTimeout(() => (btn.lastChild!.textContent = ' Copy'), 1500);
                      });
                    }}
                    className="sg16-btn-secondary inline-flex items-center gap-1 px-2.5 py-1 text-[11px]"
                  >
                    <Copy className="w-3 h-3" />
                    <span> Copy</span>
                  </button>
                  <button type="button" onClick={() => openCheck(s.code)} className="sg16-btn-secondary inline-flex items-center gap-1 px-2.5 py-1 text-[11px]">
                    <ShieldCheck className="w-3 h-3" /> Scan
                  </button>
                  <button
                    type="button"
                    onClick={() => openChat(`Improve this ${s.language} code for clarity and safety:\n\n\`\`\`\n${s.code}\n\`\`\``)}
                    className="sg16-btn-secondary inline-flex items-center gap-1 px-2.5 py-1 text-[11px]"
                  >
                    <MessageSquare className="w-3 h-3" /> Ask AI
                  </button>
                </div>
              </>
            )}
          />
        </ToolPage>
      </div>
    );
  }

  return (
    <div className="sg16-work-field h-full">
    <ModuleHub
      title="Coding Hub"
      subtitle="Scan any code with 10 real tools → score from every side → fix with AI"
      skin="coding"
    >
      <div className="grid lg:grid-cols-[1.4fr_1fr] gap-4">
        <HeroCard
          title="Check Your Code"
          desc="Real scan: syntax, security, quality and dependencies — with line-by-line results."
          icon={<Code2 className="w-7 h-7" />}
          iconClass="bg-[#FF168D]/15 text-[#FF5CB8]"
          cta="+ New check"
          onClick={() => openCheck()}
        />
        <div className="grid sm:grid-cols-3 lg:grid-cols-1 gap-3">
          <ToolCard
            title="View Reports"
            desc={reports.length ? `${reports.length} saved checks` : 'Your past scores and checks'}
            icon={<ClipboardList className="w-5 h-5" />}
            iconClass="bg-[#FF168D]/15 text-[#FF5CB8]"
            onClick={() => setView('reports')}
          />
          <ToolCard
            title="AI Solution"
            desc="Ask Coding Hub AI to fix or build"
            icon={<Lightbulb className="w-5 h-5" />}
            iconClass="bg-[#FF168D]/15 text-[#FF5CB8]"
            onClick={() => openChat()}
          />
          <ToolCard
            title="My Snippets"
            desc="Save, copy, scan and improve your code"
            icon={<FileCode2 className="w-5 h-5" />}
            iconClass="bg-[#FF168D]/15 text-[#FF5CB8]"
            onClick={() => setView('snippets')}
          />
        </div>
      </div>

      <BarListCard
        title="Recent Reports"
        right={
          reports.length > 5 ? (
            <button type="button" onClick={() => setView('reports')} className="text-[11px] text-[#FF5CB8] hover:underline">
              See all {reports.length}
            </button>
          ) : (
            <span className="text-[11px] text-white/35">{reports.length} saved</span>
          )
        }
      >
        <ReportList reports={reports.slice(0, 5)} onNewCheck={() => openCheck()} />
      </BarListCard>
    </ModuleHub>
    </div>
  );
};

export default CodingWorkspace;
