import { useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, Globe2, TrendingUp } from 'lucide-react';
import './landingNetworkCards.css';

const GEO_URL = 'https://saifglobal16.info';
const GEO_NEWS = 'https://saifglobal16.info/api/news?topic=war';
const FINANCE_URL = 'https://sg16finance.com';
const FINANCE_TICKER = 'https://sg16finance.com/api/ticker';

type TickerItem = { name: string; value: number; changePct: number };
type NewsArticle = { title?: string; source?: { name?: string } };

type FeedLine = { text: string; tone?: 'up' | 'down' | 'neutral' };

const financeFallback: FeedLine[] = [
  { text: 'Connecting to sg16finance.com…', tone: 'neutral' },
];

const geoFallback: FeedLine[] = [
  { text: 'Connecting to Geo Monitor wire…', tone: 'neutral' },
];

function truncate(text: string, max: number) {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).trim()}…`;
}

function formatPrice(n: number) {
  if (n >= 1000) return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatLine(item: TickerItem) {
  const sign = item.changePct >= 0 ? '+' : '';
  return `${item.name} ${formatPrice(item.value)} ${sign}${item.changePct.toFixed(2)}%`;
}

function LiveDot() {
  return <span className="landing-network-live-dot" aria-hidden="true" />;
}

function RollList({
  lines,
  accent,
}: {
  lines: FeedLine[];
  accent: 'geo' | 'finance';
}) {
  const loop = useMemo(() => [...lines, ...lines], [lines]);
  return (
    <div className="landing-network-roll-wrap" aria-live="polite">
      <ul className={`landing-network-roll landing-network-roll--${accent}`}>
        {loop.map((line, i) => (
          <li key={`${line.text}-${i}`} className={line.tone ? `is-${line.tone}` : undefined}>
            {line.text}
          </li>
        ))}
      </ul>
    </div>
  );
}

type SideCardProps = {
  href: string;
  title: string;
  tag: string;
  desc: string;
  accent: 'geo' | 'finance';
  icon: typeof Globe2;
  lines: FeedLine[];
  updatedLabel: string;
};

function SideCard({ href, title, tag, desc, accent, icon: Icon, lines, updatedLabel }: SideCardProps) {
  return (
    <button
      type="button"
      onClick={() => window.open(href, '_blank', 'noopener,noreferrer')}
      className={`landing-network-card landing-network-card--${accent}`}
      aria-label={`Open ${title} — ${desc}`}
    >
      <div className="landing-network-card__head">
        <span className={`landing-network-card__icon landing-network-card__icon--${accent}`}>
          <Icon className="h-4 w-4" strokeWidth={2} />
        </span>
        <div className="landing-network-card__titles">
          <span className={`landing-network-card__tag landing-network-card__tag--${accent}`}>
            <LiveDot /> {tag}
          </span>
          <strong>{title}</strong>
        </div>
        <ArrowUpRight className="landing-network-card__go" strokeWidth={2} />
      </div>
      <p className="landing-network-card__desc">{desc}</p>
      <p className="landing-network-card__updated">{updatedLabel}</p>
      <RollList lines={lines} accent={accent} />
      <span className={`landing-network-card__cta landing-network-card__cta--${accent}`}>
        Open live site →
      </span>
    </button>
  );
}

export function LandingNetworkCards() {
  const [financeLines, setFinanceLines] = useState<FeedLine[]>([]);
  const [financeUpdated, setFinanceUpdated] = useState('Connecting…');
  const [geoLines, setGeoLines] = useState<FeedLine[]>([]);
  const [geoUpdated, setGeoUpdated] = useState('Connecting…');

  useEffect(() => {
    let cancelled = false;

    async function loadTicker() {
      try {
        const res = await fetch(FINANCE_TICKER);
        if (!res.ok) throw new Error('ticker failed');
        const data = (await res.json()) as { row1?: TickerItem[]; row2?: TickerItem[]; source?: string };
        const items = [...(data.row1 ?? []), ...(data.row2 ?? [])].slice(0, 8);
        if (cancelled || items.length === 0) return;
        setFinanceLines(
          items.map((item) => ({
            text: formatLine(item),
            tone: item.changePct > 0 ? 'up' : item.changePct < 0 ? 'down' : 'neutral',
          })),
        );
        setFinanceUpdated(
          data.source === 'finnhub'
            ? `Live Finnhub · ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
            : `Markets · ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        );
      } catch {
        if (!cancelled) {
          setFinanceLines(financeFallback);
          setFinanceUpdated('Tap to open live dashboard');
        }
      }
    }

    loadTicker();
    const id = window.setInterval(loadTicker, 60_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadGeoNews() {
      try {
        const res = await fetch(GEO_NEWS);
        if (!res.ok) throw new Error('geo news failed');
        const data = (await res.json()) as { articles?: NewsArticle[] };
        const articles = (data.articles ?? []).filter((a) => a.title).slice(0, 10);
        if (cancelled || articles.length === 0) throw new Error('no headlines');
        setGeoLines(
          articles.map((article) => {
            const source = article.source?.name ? ` · ${article.source.name}` : '';
            return {
              text: truncate(article.title ?? '', 72) + source,
              tone: 'neutral' as const,
            };
          }),
        );
        setGeoUpdated(
          `Live wire · ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        );
      } catch {
        if (!cancelled) {
          setGeoLines(geoFallback);
          setGeoUpdated('Tap to open Geo Monitor');
        }
      }
    }

    loadGeoNews();
    const id = window.setInterval(loadGeoNews, 180_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  return (
    <div className="landing-network-cards" aria-label="SG16 live platforms">
      <SideCard
        href={GEO_URL}
        title="Geo Monitor"
        tag="Live"
        desc="Geopolitical world command map"
        accent="geo"
        icon={Globe2}
        lines={geoLines.length > 0 ? geoLines : [{ text: 'Loading geo wire…', tone: 'neutral' }]}
        updatedLabel={geoUpdated}
      />
      <SideCard
        href={FINANCE_URL}
        title="SG16 Finance"
        tag="Markets"
        desc="Global intelligence dashboard"
        accent="finance"
        icon={TrendingUp}
        lines={
          financeLines.length > 0
            ? financeLines
            : [{ text: 'Loading live tickers…', tone: 'neutral' as const }]
        }
        updatedLabel={financeUpdated}
      />
    </div>
  );
}
