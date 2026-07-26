import { useState } from 'react';
import { ArrowLeft, TrendingUp, Newspaper, Bitcoin, Bell } from 'lucide-react';
import { WorkspaceShell } from '../../components/workspace/WorkspaceShell';
import { ModuleHub } from '../../components/workspace/ModuleHub';
import { ChatPanel } from '../../components/chat/ChatPanel';
import { ToolCard } from '../../components/ui/Sg16Cards';
import { useAppStore } from '../../core/appState';
import { usePilotStore } from '../../core/pilotState';

type View = 'hub' | 'chat';

export const MarketWorkspace = () => {
  const [view, setView] = useState<View>('hub');
  const startPilot = usePilotStore((s) => s.startPilot);

  const openChat = (prompt?: string) => {
    if (prompt) {
      useAppStore.setState({ pendingPrompt: prompt, pendingPromptToken: Date.now() });
    }
    setView('chat');
  };

  if (view === 'chat') {
    return (
      <WorkspaceShell
        title="Market Shield"
        subtitle="Monitor · summarize · notify — never auto-trade"
        badge="Intelligence"
        badgeClass="text-white"
        skin="shell"
      >
        <div className="h-full flex flex-col min-h-0 bg-black text-white">
          <div className="px-4 sm:px-5 pt-3">
            <button
              type="button"
              onClick={() => setView('hub')}
              className="inline-flex items-center gap-1.5 text-xs text-white/55 hover:text-white border border-white/15 rounded-xl px-3 py-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Market
            </button>
          </div>
          <div className="flex-1 min-h-0">
            <ChatPanel
              workspaceId="market"
              placeholder="Ask for market summary, crypto overview, or news…"
              suggestions={[
                "Summarize today's global market mood (not financial advice)",
                'Crypto summary for beginners (not financial advice)',
                'Latest major AI industry news',
                'Help me set a notify-only watchlist plan',
              ]}
              loadingLabel="Market Pilot is reviewing…"
            />
          </div>
        </div>
      </WorkspaceShell>
    );
  }

  return (
    <div className="sg16-work-field min-h-full">
      <ModuleHub
        title="Market Shield"
        subtitle="Global market intelligence — analyze, monitor, notify. No auto buy/sell."
        skin="shell"
      >
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <ToolCard
            title="Today's market"
            desc="Plain-language market mood"
            icon={<TrendingUp className="w-5 h-5" />}
            iconClass="bg-white/10 text-white"
            onClick={() => openChat("Summarize today's global market mood (not financial advice).")}
          />
          <ToolCard
            title="Crypto summary"
            desc="Beginner-friendly overview"
            icon={<Bitcoin className="w-5 h-5" />}
            iconClass="bg-white/10 text-white"
            onClick={() => openChat('Give a clear crypto market summary (not financial advice).')}
          />
          <ToolCard
            title="AI / market news"
            desc="Important headlines only"
            icon={<Newspaper className="w-5 h-5" />}
            iconClass="bg-white/10 text-white"
            onClick={() => openChat('Summarize the latest major AI and market news.')}
          />
          <ToolCard
            title="Market Pilot"
            desc="Watch & notify for hours"
            icon={<Bell className="w-5 h-5" />}
            iconClass="bg-white/10 text-white"
            onClick={() =>
              startPilot(
                'Monitor major markets and crypto themes; notify only on significant moves or news. No trading.',
                'market',
              )
            }
          />
        </div>
        <div className="rounded-2xl border border-white/15 bg-white/[0.03] p-4 text-xs text-white/55 leading-relaxed">
          <strong className="text-white/80">Safety:</strong> Market Pilot does not buy, sell, or
          execute trades. Educational summaries only — not financial advice.
        </div>
      </ModuleHub>
    </div>
  );
};

export default MarketWorkspace;
