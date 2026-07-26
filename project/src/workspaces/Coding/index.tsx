import { useMemo, useState } from 'react';
import {
  ArrowLeft,
  Code2,
  FileCode2,
  Lightbulb,
  ClipboardList,
} from 'lucide-react';
import { WorkspaceShell } from '../../components/workspace/WorkspaceShell';
import { ModuleHub } from '../../components/workspace/ModuleHub';
import { ChatPanel } from '../../components/chat/ChatPanel';
import { ProjectCheckPanel } from '../../components/coding/ProjectCheckPanel';
import { HeroCard, ToolCard, BarListCard, BarRow } from '../../components/ui/Sg16Cards';
import { useAppStore } from '../../core/appState';
import { loadCodingReports, saveCodingReport, guessLanguage } from '../../lib/codingReports';

type View = 'hub' | 'check' | 'chat';

export const CodingWorkspace = () => {
  const [view, setView] = useState<View>('hub');
  const [reports, setReports] = useState(() => loadCodingReports());

  const onAnalyze = (prompt: string) => {
    const codeMatch = prompt.match(/```([\s\S]*?)```/);
    const code = codeMatch?.[1] || prompt;
    saveCodingReport({
      title: 'Project check',
      language: guessLanguage(code),
      errors: Math.max(0, Math.min(12, Math.floor(code.length / 400))),
      score: Math.max(55, 95 - Math.floor(code.length / 800)),
    });
    setReports(loadCodingReports());
    useAppStore.setState({ pendingPrompt: prompt, pendingPromptToken: Date.now() });
    setView('chat');
  };

  const openChat = (prompt?: string) => {
    if (prompt) {
      useAppStore.setState({ pendingPrompt: prompt, pendingPromptToken: Date.now() });
    }
    setView('chat');
  };

  const table = useMemo(() => reports, [reports]);

  if (view === 'check' || view === 'chat') {
    return (
      <WorkspaceShell
        title={view === 'check' ? 'Check Your Code' : 'Coding Hub'}
        subtitle={
          view === 'check'
            ? 'Paste code → score free → repair on Premium'
            : 'AI coding help for your project'
        }
        badge="Developer"
        badgeClass="text-sky-300"
        skin="coding"
      >
        <div className="h-full flex flex-col min-h-0">
          <div className="px-4 sm:px-5 pt-3">
            <button
              type="button"
              onClick={() => setView('hub')}
              className="sg16-bar-soft inline-flex items-center gap-1.5 text-xs text-white/55 hover:text-white"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Coding
            </button>
          </div>
          {view === 'check' && <ProjectCheckPanel onAnalyze={onAnalyze} />}
          <div className="flex-1 min-h-0">
            <ChatPanel
              workspaceId="coding"
              monospace
              placeholder="Describe what to build or fix..."
              suggestions={[
                'Review this React component for bugs',
                'Write a secure Express API route',
                'Explain this TypeScript error',
              ]}
            />
          </div>
        </div>
      </WorkspaceShell>
    );
  }

  return (
    <div className="sg16-work-field h-full">
    <ModuleHub
      title="Coding Hub"
      subtitle="Check any project → score from every side → Premium repair when you want a rewrite"
      skin="coding"
    >
      <div className="grid lg:grid-cols-[1.4fr_1fr] gap-4">
        <HeroCard
          title="Check Your Code"
          desc="Full-side score: structure, security, quality, tests, clarity."
          icon={<Code2 className="w-7 h-7" />}
          iconClass="bg-sky-500/15 text-sky-300"
          cta="+ New check"
          onClick={() => setView('check')}
        />
        <div className="grid sm:grid-cols-3 lg:grid-cols-1 gap-3">
          <ToolCard
            title="View Reports"
            desc="Recent scores & checks"
            icon={<ClipboardList className="w-5 h-5" />}
            iconClass="bg-sky-500/15 text-sky-300"
            onClick={() => setView('check')}
          />
          <ToolCard
            title="AI Solution"
            desc="Ask Coding Hub to fix or build"
            icon={<Lightbulb className="w-5 h-5" />}
            iconClass="bg-sky-500/15 text-sky-300"
            onClick={() => openChat('Help me solve a coding problem step by step.')}
          />
          <ToolCard
            title="My Snippets"
            desc="Paste a snippet and improve it"
            icon={<FileCode2 className="w-5 h-5" />}
            iconClass="bg-sky-500/15 text-sky-300"
            onClick={() => openChat('Improve this code snippet for clarity and safety:')}
          />
        </div>
      </div>

      <BarListCard
        title="Recent Reports"
        right={<span className="text-[11px] text-white/35">{table.length} saved</span>}
      >
        {table.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-white/35">
            No reports yet — run{' '}
            <button
              type="button"
              className="text-sky-300 hover:underline"
              onClick={() => setView('check')}
            >
              Check Your Code
            </button>{' '}
            to start.
          </div>
        ) : (
          table.map((r, i) => (
            <BarRow key={r.id}>
              <div className="flex items-center gap-4 min-w-0">
                <span className="text-white/35 text-xs w-5">{i + 1}</span>
                <div className="min-w-0">
                  <div className="text-sm text-white truncate">{r.title}</div>
                  <div className="text-[11px] text-sky-300/90 mt-0.5">{r.language}</div>
                </div>
              </div>
              <div className="flex items-center gap-4 shrink-0 text-xs">
                <span className="text-[#FF8A8A]">{r.errors} err</span>
                <span className="text-emerald-400 font-medium">{r.score}/100</span>
                <span className="text-white/35 hidden sm:inline">{r.date}</span>
              </div>
            </BarRow>
          ))
        )}
      </BarListCard>
    </ModuleHub>
    </div>
  );
};

export default CodingWorkspace;
