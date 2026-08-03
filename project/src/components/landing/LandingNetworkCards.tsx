import { useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, Globe2, TrendingUp } from 'lucide-react';
import './landingNetworkCards.css';

const GEO_URL = 'https://saifglobal16.info';
const FINANCE_URL = 'https://sg16finance.com';
const FINANCE_TICKER = 'https://sg16finance.com/api/ticker';

type TickerItem = { name: string; value: number; changePct: number };

const geoHeadlines = [
  'Tension zone · Middle East watch',
  'USGS M4.2 · Pacific Ring alert',
  'Breaking · NATO summit coverage',
  'Live flights · European corridor',
  'Markets · Asia open sentiment',
  'News wire · geopolitical brief',
];

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
  lines: { text: string; tone?: 'up' | 'down' | 'neutral' }[];
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
  lines: { text: string; tone?: 'up' | 'down' | 'neutral' }[];
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
  const [financeLines, setFinanceLines] = useState<{ text: string; tone?: 'up' | 'down' | 'neutral' }[]>([]);
  const [financeUpdated, setFinanceUpdated] = useState('Connecting…');
  const [geoIndex, setGeoIndex] = useState(0);
  const [clock, setClock] = useState(() => new Date());

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
            ? `Live · ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
            : `Markets · updated ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        );
      } catch {
        if (!cancelled) {
          setFinanceLines([
            { text: 'NASDAQ 100 · loading markets…', tone: 'neutral' },
            { text: 'S&P 500 · sg16finance.com', tone: 'neutral' },
            { text: 'Bitcoin · live dashboard', tone: 'neutral' },
            { text: 'Gold · sector research', tone: 'neutral' },
          ]);
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
    const geoId = window.setInterval(() => setGeoIndex((i) => (i + 1) % geoHeadlines.length), 4500);
    const clockId = window.setInterval(() => setClock(new Date()), 1000);
    return () => {
      window.clearInterval(geoId);
      window.clearInterval(clockId);
    };
  }, []);

  const geoLines = useMemo(() => {
    const ordered = geoHeadlines.map((_, i) => geoHeadlines[(geoIndex + i) % geoHeadlines.length]);
    return ordered.map((text) => ({ text, tone: 'neutral' as const }));
  }, [geoIndex]);

  const geoUpdated = `Live feed · ${clock.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;

  return (
    <div className="landing-network-cards" aria-label="SG16 live platforms">
      <SideCard
        href={GEO_URL}
        title="Geo Monitor"
        tag="Live"
        desc="Geopolitical world command map"
        accent="geo"
        icon={Globe2}
        lines={geoLines}
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
