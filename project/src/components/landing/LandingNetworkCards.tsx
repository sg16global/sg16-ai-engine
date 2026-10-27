import { useEffect, useState } from 'react';
import { ArrowRight, ArrowUpRight, BarChart3, Globe2, MapPin } from 'lucide-react';
import { WorldDotMap } from './WorldDotMap';

const GEO_URL = 'https://saifglobal16.info';
const FINANCE_URL = 'https://sg16finance.com';

const THREAT_LOCATIONS = [
  'Malacca, Malaysia',
  'US - New York',
  'UK - London',
  'DE - Frankfurt',
  'JP - Tokyo',
  'KR - Seoul',
];

const FINANCE_SYMBOLS = ['BTC', 'ETH', 'GOLD', 'S&P 500', 'NASDAQ'];

const MARKETS_REFRESH_MS = 60_000;
const GEO_REFRESH_MS = 10 * 60_000;

/**
 * Polls one of the landing data functions (functions/api/landing/*).
 * Keeps the last good answer; until one arrives the cards show "—".
 */
function useLandingFeed<T>(path: string, refreshMs: number): T | null {
  const [data, setData] = useState<T | null>(null);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const res = await fetch(path, { signal: AbortSignal.timeout(15_000) });
        if (!res.ok) return;
        const json = (await res.json()) as T;
        if (alive) setData(json);
      } catch {
        /* keep the last good data */
      }
    };
    void load();
    const t = setInterval(() => void load(), refreshMs);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [path, refreshMs]);

  return data;
}

type MarketRow = { sym: string; price: number | null; changePct: number | null };
type GeoRow = { city: string; tempC?: number; sky?: string };

function formatPrice(price: number | null): string {
  return price === null ? '—' : Math.round(price).toLocaleString('en-US');
}

function formatChange(changePct: number | null): string {
  return changePct === null ? '—' : `${changePct >= 0 ? '+' : ''}${changePct.toFixed(2)}%`;
}

function OpenButton({ href, label }: { href: string; label: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="lp-monitor__open" aria-label={label}>
      <ArrowUpRight className="h-[18px] w-[18px]" />
    </a>
  );
}

/** Geo Monitor — live city conditions from SaifGlobal16 Monitor (saifglobal16.info). */
export function GeoMonitorCard() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  const geo = useLandingFeed<{ items: GeoRow[] }>('/api/landing/geo', GEO_REFRESH_MS);

  return (
    <section className="lp-panel lp-neon lp-monitor" aria-label="Geo Monitor">
      <div className="lp-monitor__head">
        <span className="lp-icon-tile h-[46px] w-[46px]">
          <Globe2 className="h-6 w-6" />
        </span>
        <div className="min-w-0">
          <span className="lp-live">LIVE</span>
          <h3 className="lp-monitor__title">Geo Monitor</h3>
          <p className="lp-monitor__sub">Global traffic &amp; threat monitoring</p>
        </div>
        <OpenButton href={GEO_URL} label="Open Geo Monitor" />
      </div>

      <p className="lp-monitor__meta">Live view — {timeStr}</p>

      <div className="mt-2">
        {THREAT_LOCATIONS.map((city) => {
          const row = geo?.items.find((i) => i.city === city);
          const status = row?.tempC !== undefined && row.sky ? `${row.tempC}°C · ${row.sky}` : '—';
          return (
            <div key={city} className="lp-loc">
              <MapPin />
              {city} <span>— {status}</span>
            </div>
          );
        })}
      </div>

      <WorldDotMap className="mt-1 block h-[78px] w-full" />

      <a href={GEO_URL} target="_blank" rel="noopener noreferrer" className="lp-link lp-link--caps mt-2">
        Open live site <ArrowRight className="h-3.5 w-3.5" />
      </a>
    </section>
  );
}

/** SG16 Finance — live market ticker (crypto from sg16finance.com, index levels from Yahoo). */
export function FinanceCard() {
  const markets = useLandingFeed<{ items: MarketRow[] }>('/api/landing/markets', MARKETS_REFRESH_MS);

  return (
    <section className="lp-panel lp-neon lp-monitor" aria-label="SG16 Finance">
      <div className="lp-monitor__head">
        <span className="lp-icon-tile h-[46px] w-[46px]">
          <BarChart3 className="h-6 w-6" />
        </span>
        <div className="min-w-0 pt-1">
          <h3 className="lp-monitor__title mt-0">SG16 Finance</h3>
          <p className="lp-monitor__sub">Market intelligence &amp; data</p>
        </div>
        <OpenButton href={FINANCE_URL} label="Open SG16 Finance" />
      </div>

      <p className="lp-monitor__meta mt-4">Market Live</p>

      <div>
        {FINANCE_SYMBOLS.map((sym) => {
          const row = markets?.items.find((i) => i.sym === sym);
          return (
            <div key={sym} className="lp-ticker">
              <b>{sym}</b>
              <span>{formatPrice(row?.price ?? null)}</span>
              <em>{formatChange(row?.changePct ?? null)}</em>
            </div>
          );
        })}
      </div>

      <a href={FINANCE_URL} target="_blank" rel="noopener noreferrer" className="lp-link lp-link--caps mt-4">
        Open live site <ArrowRight className="h-3.5 w-3.5" />
      </a>
    </section>
  );
}
