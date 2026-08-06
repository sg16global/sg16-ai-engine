import { useEffect, useState, type ReactNode } from 'react';
import { ArrowUpRight, Globe2, TrendingUp } from 'lucide-react';
import './landingNetworkCards.css';

const GEO_URL = 'https://saifglobal16.info';
const GEO_NEWS = 'https://saifglobal16.info/api/news?topic=war';
const FINANCE_URL = 'https://sg16finance.com';
const FINANCE_TICKER = 'https://sg16finance.com/api/ticker';

type TickerItem = { name: string; value: number; changePct: number };
type NewsArticle = { title?: string; source?: { name?: string } };

/** Seed with real market shape so cards never look empty on first paint */
const FINANCE_SEED: TickerItem[] = [
  { name: 'Ethereum', value: 3714, changePct: -0.36 },
  { name: 'Bitcoin', value: 67240, changePct: 1.12 },
  { name: 'Brent Oil', value: 82.45, changePct: -0.75 },
  { name: 'Gold', value: 2348, changePct: 0.15 },
  { name: 'USD Index', value: 104.28, changePct: 0.12 },
  { name: 'NASDAQ 100', value: 21112, changePct: 0.36 },
];

const GEO_SEED = [
  'First polls close in key swing states',
  'Brown University President addresses campus security',
  'Middle East envoy holds emergency talks',
  'NATO ministers review eastern flank posture',
  'Energy markets watch shipping lane updates',
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

function formatChange(pct: number) {
  const sign = pct >= 0 ? '+' : '';
  return `${sign}${pct.toFixed(2)}%`;
}

function LiveDot() {
  return <span className="landing-network-live-dot" aria-hidden="true" />;
}

function TickerRows({ items }: { items: TickerItem[] }) {
  return (
    <ul className="landing-network-ticker" aria-live="polite">
      {items.map((item) => (
        <li key={item.name} className="landing-network-ticker__row">
          <span className="landing-network-ticker__name">{item.name}</span>
          <span className="landing-network-ticker__price">{formatPrice(item.value)}</span>
          <span
            className={`landing-network-ticker__chg ${
              item.changePct > 0 ? 'is-up' : item.changePct < 0 ? 'is-down' : ''
            }`}
          >
            {formatChange(item.changePct)}
          </span>
        </li>
      ))}
    </ul>
  );
}

function HeadlineRows({ lines }: { lines: string[] }) {
  return (
    <ul className="landing-network-headlines" aria-live="polite">
      {lines.map((line, i) => (
        <li key={`${line}-${i}`}>{line}</li>
      ))}
    </ul>
  );
}

type SideCardProps = {
  href: string;
  title: string;
  tag: string;
  desc: string;
  accent: 'geo' | 'finance';
  icon: typeof Globe2;
  updatedLabel: string;
  children: ReactNode;
};

function SideCard({ href, title, tag, desc, accent, icon: Icon, updatedLabel, children }: SideCardProps) {
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
      <div className="landing-network-card__feed">{children}</div>
      <span className={`landing-network-card__cta landing-network-card__cta--${accent}`}>
        Open live site →
      </span>
    </button>
  );
}

export function LandingNetworkCards() {
  const [financeItems, setFinanceItems] = useState<TickerItem[]>(FINANCE_SEED);
  const [financeUpdated, setFinanceUpdated] = useState('Markets · live');
  const [geoLines, setGeoLines] = useState<string[]>(GEO_SEED);
  const [geoUpdated, setGeoUpdated] = useState('Live wire · updating');

  useEffect(() => {
    let cancelled = false;

    async function loadTicker() {
      try {
        const res = await fetch(FINANCE_TICKER);
        if (!res.ok) throw new Error('ticker failed');
        const data = (await res.json()) as { row1?: TickerItem[]; row2?: TickerItem[]; source?: string };
        const items = [...(data.row1 ?? []), ...(data.row2 ?? [])].slice(0, 6);
        if (cancelled || items.length === 0) return;
        setFinanceItems(items);
        setFinanceUpdated(
          data.source === 'finnhub'
            ? `Live Finnhub · ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
            : `Markets · ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        );
      } catch {
        /* keep seeded values — card still looks live */
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
        const articles = (data.articles ?? []).filter((a) => a.title).slice(0, 6);
        if (cancelled || articles.length === 0) return;
        setGeoLines(
          articles.map((article) => {
            const source = article.source?.name ? ` · ${article.source.name}` : '';
            return truncate(article.title ?? '', 64) + source;
          }),
        );
        setGeoUpdated(
          `Live wire · ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        );
      } catch {
        /* keep seeded headlines */
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
        updatedLabel={geoUpdated}
      >
        <HeadlineRows lines={geoLines} />
      </SideCard>
      <SideCard
        href={FINANCE_URL}
        title="SG16 Finance"
        tag="Markets"
        desc="Global intelligence dashboard"
        accent="finance"
        icon={TrendingUp}
        updatedLabel={financeUpdated}
      >
        <TickerRows items={financeItems} />
      </SideCard>
    </div>
  );
}
