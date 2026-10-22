import { useState } from 'react';
import { BellRing, MessageSquare, Newspaper } from 'lucide-react';
import { WorkspaceShell } from '../../components/workspace/WorkspaceShell';
import { ModuleHub } from '../../components/workspace/ModuleHub';
import { ChatPanel } from '../../components/chat/ChatPanel';
import { ToolCard } from '../../components/ui/Sg16Cards';
import { ToolPage } from '../../components/tools/ToolPage';
import { AlertsTool, MARKET_KEYS, MarketBoard, NewsTool, type PriceAlert } from '../../components/tools/marketTools';
import { useLocalCollection } from '../../lib/localStore';
import { useOpenChatRequest } from '../../hooks/useOpenChatRequest';

type View = 'hub' | 'chat' | 'alerts' | 'news';

export const MarketWorkspace = () => {
  const [view, setView] = useState<View>('hub');
  const { items: alerts } = useLocalCollection<PriceAlert>(MARKET_KEYS.alerts);
  const waiting = alerts.filter((a) => !a.triggeredAt).length;
  const hit = alerts.length - waiting;

  useOpenChatRequest('market', () => setView('chat'));

  if (view === 'chat') {
    return (
      <WorkspaceShell
        title="Market Shield"
        subtitle="Ask about markets in plain language — never auto-trade, not financial advice"
        badge="AI"
        badgeClass="text-white"
        skin="shell"
      >
        <ChatPanel
          workspaceId="market"
          placeholder="Ask about a market, a term, or today's news…"
          suggestions={[
            'Explain what moves the price of gold',
            'What is the difference between a stock index and a stock?',
            'Latest major AI industry news',
            'How do I read a crypto price chart as a beginner?',
          ]}
          loadingLabel="Market Pilot is reviewing…"
          onBack={() => setView('hub')}
          backLabel="Back to Market"
        />
      </WorkspaceShell>
    );
  }

  if (view === 'alerts' || view === 'news') {
    return (
      <div className="sg16-work-field h-full">
        <ToolPage
          title={view === 'alerts' ? 'Price alerts' : 'Market headlines'}
          subtitle={view === 'alerts' ? 'Get told when a price crosses your level.' : 'Latest headlines from public news feeds.'}
          backLabel="Back to Market"
          onBack={() => setView('hub')}
        >
          {view === 'alerts' ? <AlertsTool /> : <NewsTool />}
        </ToolPage>
      </div>
    );
  }

  return (
    <div className="sg16-work-field h-full text-white">
      <ModuleHub
        title="Market Shield"
        subtitle="Live prices, your watchlist, price alerts and headlines — never auto-trade"
        skin="shell"
      >
        <div className="grid sm:grid-cols-3 gap-4">
          <ToolCard
            title="Price alerts"
            desc={alerts.length ? `${waiting} watching${hit ? ` · ${hit} hit` : ''}` : 'Get told when a price crosses your level'}
            icon={<BellRing className="w-5 h-5" />}
            iconClass="bg-white/10 text-white"
            onClick={() => setView('alerts')}
          />
          <ToolCard
            title="Headlines"
            desc="Markets, crypto and AI industry news"
            icon={<Newspaper className="w-5 h-5" />}
            iconClass="bg-white/10 text-white"
            onClick={() => setView('news')}
          />
          <ToolCard
            title="Ask Market AI"
            desc="Plain-language explanations"
            icon={<MessageSquare className="w-5 h-5" />}
            iconClass="bg-white/10 text-white"
            onClick={() => setView('chat')}
          />
        </div>
        <MarketBoard />
        <div className="rounded-2xl border border-white/15 bg-white/[0.03] p-4 text-xs text-white/55 leading-relaxed">
          <strong className="text-white/80">Safety:</strong> SG16 never buys, sells or trades for you. Prices come from public
          sources (CoinGecko, Binance, Coinbase, Yahoo Finance, ExchangeRate-API, Frankfurter) and can be delayed.
          Educational use only — not financial advice.
        </div>
      </ModuleHub>
    </div>
  );
};

export default MarketWorkspace;
