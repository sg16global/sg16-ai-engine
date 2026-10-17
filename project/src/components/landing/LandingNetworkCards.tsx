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

const FINANCE_ITEMS = [
  { sym: 'BTC', price: '97,420', change: '+0.82%' },
  { sym: 'ETH', price: '3,145', change: '+1.21%' },
  { sym: 'GOLD', price: '2,628', change: '+0.56%' },
  { sym: 'S&P 500', price: '5,762', change: '+0.47%' },
  { sym: 'NASDAQ', price: '18,341', change: '+0.73%' },
];

function OpenButton({ href, label }: { href: string; label: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="lp-monitor__open" aria-label={label}>
      <ArrowUpRight className="h-[18px] w-[18px]" />
    </a>
  );
}

/** Geo Monitor — live traffic & threat monitoring (saifglobal16.info). */
export function GeoMonitorCard() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

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
        {THREAT_LOCATIONS.map((city) => (
          <div key={city} className="lp-loc">
            <MapPin />
            {city} <span>— Normal</span>
          </div>
        ))}
      </div>

      <WorldDotMap className="mt-1 block h-[78px] w-full" />

      <a href={GEO_URL} target="_blank" rel="noopener noreferrer" className="lp-link lp-link--caps mt-2">
        Open live site <ArrowRight className="h-3.5 w-3.5" />
      </a>
    </section>
  );
}

/** SG16 Finance — market intelligence ticker (sg16finance.com). */
export function FinanceCard() {
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
        {FINANCE_ITEMS.map((item) => (
          <div key={item.sym} className="lp-ticker">
            <b>{item.sym}</b>
            <span>{item.price}</span>
            <em>{item.change}</em>
          </div>
        ))}
      </div>

      <a href={FINANCE_URL} target="_blank" rel="noopener noreferrer" className="lp-link lp-link--caps mt-4">
        Open live site <ArrowRight className="h-3.5 w-3.5" />
      </a>
    </section>
  );
}
