import { useCallback, useEffect, useState } from 'react';
import { BellRing, ExternalLink, RefreshCw, Star, Trash2 } from 'lucide-react';
import {
  fetchMarketNews,
  fetchMarketOverview,
  formatPrice,
  priceMap,
  type Feed,
  type MarketOverview,
  type NewsItem,
  type NewsTopic,
  type PriceItem,
} from '../../lib/marketApi';
import { readLocal, useLocalCollection, useLocalValue, writeLocal, type LocalRecord } from '../../lib/localStore';

export const MARKET_KEYS = { watchlist: 'market_watchlist', alerts: 'market_alerts' } as const;

export type PriceAlert = LocalRecord & {
  symbol: string;
  name: string;
  direction: 'above' | 'below';
  price: number;
  triggeredAt?: number;
  triggeredPrice?: number;
};

const REFRESH_MS = 60_000;

function timeAgo(iso: string | null) {
  if (!iso) return '';
  const s = Math.round((Date.now() - Date.parse(iso)) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.round(s / 60)} min ago`;
  return new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

/**
 * Mark alerts whose condition is met. Returns the newly hit alerts so the caller can notify.
 * Runs whenever fresh prices arrive (Market page open, or the background watcher).
 */
export function checkAlerts(overview: MarketOverview): PriceAlert[] {
  const prices = priceMap(overview);
  const alerts = readLocal<PriceAlert[]>(MARKET_KEYS.alerts, []);
  const hit: PriceAlert[] = [];
  const next = alerts.map((a) => {
    const p = prices.get(a.symbol)?.price;
    if (a.triggeredAt || p == null) return a;
    if ((a.direction === 'above' && p >= a.price) || (a.direction === 'below' && p <= a.price)) {
      const done = { ...a, triggeredAt: Date.now(), triggeredPrice: p };
      hit.push(done);
      return done;
    }
    return a;
  });
  if (hit.length) {
    writeLocal(MARKET_KEYS.alerts, next);
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      hit.forEach((a) => {
        try {
          new Notification(`SG16 Market alert: ${a.name}`, {
            body: `${a.name} is ${a.direction} ${formatPrice(a.price)} — now ${formatPrice(a.triggeredPrice ?? 0)}`,
            icon: '/brand/favicon-64.png',
          });
        } catch {
          /* some browsers only allow notifications from a service worker */
        }
      });
    }
  }
  return hit;
}

/** Live prices for the Market page: loads now and every minute while shown. */
export function useMarketOverview() {
  const [data, setData] = useState<MarketOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const o = await fetchMarketOverview();
      setData(o);
      setError('');
      checkAlerts(o);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Market data is unavailable right now.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const t = window.setInterval(() => void load(), REFRESH_MS);
    return () => window.clearInterval(t);
  }, [load]);

  return { data, loading, error, reload: load };
}

function Change({ value }: { value: number | null }) {
  if (value == null) return <span className="text-white/35">—</span>;
  const up = value >= 0;
  return (
    <span className={up ? 'text-emerald-400' : 'text-[#FF5CB8]'}>
      {up ? '+' : ''}
      {value.toFixed(2)}%
    </span>
  );
}

function FeedNote({ feed }: { feed: Feed<unknown> }) {
  if (feed.error && !feed.items.length) return <span className="text-[#FF8FB8]">Unavailable right now — try again shortly.</span>;
  return (
    <span>
      {feed.source}
      {feed.updatedAt ? ` · ${timeAgo(feed.updatedAt)}` : ''}
      {feed.stale ? ' · last known prices (sources not answering)' : ''}
    </span>
  );
}

function PriceTable({
  title,
  feed,
  items,
  watchlist,
  onToggle,
}: {
  title: string;
  feed?: Feed<PriceItem>;
  items: PriceItem[];
  watchlist: string[];
  onToggle: (symbol: string) => void;
}) {
  return (
    <div className="sg16-card overflow-hidden">
      <div className="px-4 sm:px-5 py-3 border-b border-white/[0.06] flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        {feed && (
          <span className="text-[11px] text-white/40">
            <FeedNote feed={feed} />
          </span>
        )}
      </div>
      {items.length === 0 ? (
        <p className="px-5 py-6 text-sm text-white/40">No prices to show.</p>
      ) : (
        <ul className="divide-y divide-white/[0.05]">
          {items.map((i) => {
            const watched = watchlist.includes(i.symbol);
            return (
              <li key={i.symbol} className="flex items-center gap-3 px-4 sm:px-5 py-2.5 text-sm">
                <button
                  type="button"
                  onClick={() => onToggle(i.symbol)}
                  aria-label={watched ? `Remove ${i.name} from watchlist` : `Add ${i.name} to watchlist`}
                  className={watched ? 'text-[#FF5CB8]' : 'text-white/25 hover:text-white/60'}
                >
                  <Star className="w-4 h-4" fill={watched ? 'currentColor' : 'none'} />
                </button>
                <span className="min-w-0 flex-1 truncate text-white">
                  {i.name} <span className="text-white/35 text-xs">{i.symbol.replace(/[=^]|F$/g, '')}</span>
                </span>
                <span className="font-mono text-white/90 tabular-nums">{formatPrice(i.price)}</span>
                <span className="w-16 text-right text-xs tabular-nums">
                  <Change value={i.changePct} />
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/** Live board: watchlist, crypto, indices & commodities, currencies. */
export function MarketBoard() {
  const { data, loading, error, reload } = useMarketOverview();
  const [watchlist, setWatchlist] = useLocalValue<string[]>(MARKET_KEYS.watchlist, ['BTC', '^GSPC']);
  const toggle = (symbol: string) =>
    setWatchlist(watchlist.includes(symbol) ? watchlist.filter((s) => s !== symbol) : [...watchlist, symbol]);
  const prices = priceMap(data);
  const watched = watchlist.map((s) => prices.get(s)).filter((p): p is PriceItem => Boolean(p));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-white/45">Live prices refresh every minute. Prices in USD. Not financial advice.</p>
        <button type="button" onClick={() => void reload()} className="sg16-btn-secondary inline-flex items-center gap-1.5 px-3 py-1.5 text-xs" disabled={loading}>
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>
      {error && !data && <div className="sg16-bar-error">Market data is unavailable right now: {error}</div>}
      {!data && loading && <div className="sg16-card px-5 py-8 text-center text-sm text-white/45">Loading live prices…</div>}
      {data && (
        <>
          <PriceTable title="My watchlist" items={watched} watchlist={watchlist} onToggle={toggle} />
          <div className="grid lg:grid-cols-2 gap-4">
            <PriceTable title="Crypto" feed={data.crypto} items={data.crypto.items} watchlist={watchlist} onToggle={toggle} />
            <PriceTable title="Indices & commodities" feed={data.quotes} items={data.quotes.items} watchlist={watchlist} onToggle={toggle} />
          </div>
          <div className="sg16-card overflow-hidden">
            <div className="px-4 sm:px-5 py-3 border-b border-white/[0.06] flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-white">Currencies (1 USD =)</h3>
              <span className="text-[11px] text-white/40">
                <FeedNote feed={data.fx} />
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
              {data.fx.items.map((f) => (
                <div key={f.pair} className="px-4 py-3 border-white/[0.05] border-r border-b">
                  <div className="text-[11px] text-white/45">{f.pair.replace('USD/', '')}</div>
                  <div className="font-mono text-white tabular-nums">{f.rate.toLocaleString(undefined, { maximumFractionDigits: 4 })}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export function AlertsTool() {
  const { data } = useMarketOverview();
  const { items: alerts, add, update, remove } = useLocalCollection<PriceAlert>(MARKET_KEYS.alerts);
  const prices = priceMap(data);
  const options = [...prices.values()];
  const [symbol, setSymbol] = useState('BTC');
  const [direction, setDirection] = useState<'above' | 'below'>('above');
  const [price, setPrice] = useState('');
  const [permission, setPermission] = useState(typeof Notification !== 'undefined' ? Notification.permission : 'denied');
  const current = prices.get(symbol);

  const addAlert = () => {
    const target = Number(price);
    if (!current || !(target > 0)) return;
    add({ symbol, name: current.name, direction, price: target });
    setPrice('');
  };

  return (
    <div className="space-y-4">
      <div className="sg16-card p-4 sm:p-5 space-y-3">
        <div className="grid sm:grid-cols-[1.4fr_1fr_1fr_auto] gap-3 items-end">
          <label className="flex flex-col gap-1 text-xs text-white/60">
            Market
            <select className="sg16-field" value={symbol} onChange={(e) => setSymbol(e.target.value)}>
              {options.length === 0 && <option value="BTC">Bitcoin</option>}
              {options.map((o) => (
                <option key={o.symbol} value={o.symbol}>
                  {o.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-white/60">
            When price goes
            <select className="sg16-field" value={direction} onChange={(e) => setDirection(e.target.value as 'above' | 'below')}>
              <option value="above">Above</option>
              <option value="below">Below</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-white/60">
            Price (USD)
            <input className="sg16-field" type="number" inputMode="decimal" value={price} placeholder={current ? formatPrice(current.price) : ''} onChange={(e) => setPrice(e.target.value)} />
          </label>
          <button type="button" onClick={addAlert} disabled={!current || !(Number(price) > 0)} className="sg16-btn-primary px-4 py-2 text-sm">
            Add alert
          </button>
        </div>
        {current && <p className="text-xs text-white/45">Now: {current.name} {formatPrice(current.price)}</p>}
        {permission !== 'granted' && typeof Notification !== 'undefined' && permission !== 'denied' && (
          <button
            type="button"
            onClick={() => void Notification.requestPermission().then(setPermission)}
            className="sg16-btn-secondary inline-flex items-center gap-1.5 px-3 py-1.5 text-xs"
          >
            <BellRing className="w-3.5 h-3.5" /> Allow desktop notifications
          </button>
        )}
        <p className="text-[11px] text-white/35">
          Alerts are checked every 2 minutes while SG16 is open (any page). SG16 never buys or sells for you.
        </p>
      </div>

      <div className="sg16-card overflow-hidden">
        {alerts.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-white/40">No alerts yet.</p>
        ) : (
          <ul className="divide-y divide-white/[0.06]">
            {alerts.map((a) => {
              const now = prices.get(a.symbol)?.price;
              return (
                <li key={a.id} className="flex items-center gap-3 px-4 sm:px-5 py-3 text-sm">
                  <BellRing className={`w-4 h-4 shrink-0 ${a.triggeredAt ? 'text-[#FF5CB8]' : 'text-white/35'}`} />
                  <div className="min-w-0 flex-1">
                    <div className="text-white">
                      {a.name} {a.direction} <span className="font-mono">{formatPrice(a.price)}</span>
                    </div>
                    <div className="text-xs text-white/45 mt-0.5">
                      {a.triggeredAt
                        ? `Hit ${new Date(a.triggeredAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })} at ${formatPrice(a.triggeredPrice ?? 0)}`
                        : `Watching${now != null ? ` · now ${formatPrice(now)}` : ''}`}
                    </div>
                  </div>
                  {a.triggeredAt && (
                    <button type="button" onClick={() => update(a.id, { triggeredAt: undefined, triggeredPrice: undefined })} className="text-xs text-white/55 hover:text-white px-2 py-1">
                      Watch again
                    </button>
                  )}
                  <button type="button" onClick={() => remove(a.id)} className="p-1.5 text-white/40 hover:text-[#FF5CB8]" aria-label="Delete alert">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

const TOPICS: { id: NewsTopic; label: string }[] = [
  { id: 'markets', label: 'Markets' },
  { id: 'crypto', label: 'Crypto' },
  { id: 'ai', label: 'AI industry' },
];

export function NewsTool() {
  const [topic, setTopic] = useState<NewsTopic>('markets');
  const [feed, setFeed] = useState<Feed<NewsItem> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchMarketNews(topic)
      .then((f) => !cancelled && setFeed(f))
      .catch(() => !cancelled && setFeed({ items: [], source: null, updatedAt: null, stale: false, error: 'unavailable' }))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [topic]);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {TOPICS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTopic(t.id)}
            className={`px-3 py-1.5 rounded-full text-xs border transition ${
              topic === t.id ? 'border-[#FF168D] bg-[#FF168D]/15 text-white' : 'border-white/15 text-white/60 hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="sg16-card overflow-hidden">
        {loading ? (
          <p className="px-5 py-8 text-center text-sm text-white/45">Loading headlines…</p>
        ) : !feed?.items.length ? (
          <p className="px-5 py-8 text-center text-sm text-white/45">Headlines are unavailable right now — try again shortly.</p>
        ) : (
          <ul className="divide-y divide-white/[0.06]">
            {feed.items.map((n) => (
              <li key={n.url || n.title}>
                <a href={n.url} target="_blank" rel="noopener noreferrer" className="flex gap-3 px-4 sm:px-5 py-3 hover:bg-white/[0.03] group">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm text-white group-hover:text-[#FF5CB8] [overflow-wrap:anywhere]">{n.title}</div>
                    <div className="text-xs text-white/40 mt-0.5">
                      {[n.publisher, n.date && new Date(n.date).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })].filter(Boolean).join(' · ')}
                    </div>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-white/30 shrink-0 mt-1" />
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
      {feed?.source && <p className="text-[11px] text-white/35">Headlines from {feed.source}. Opens the publisher’s page.</p>}
    </div>
  );
}
