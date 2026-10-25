/**
 * Market Shield data — real prices, straight from the browser.
 *
 * Crypto: CoinGecko → Binance → Coinbase (all CORS-enabled, called directly).
 * Currencies: open.er-api.com → Frankfurter (ECB), also direct.
 * Indices / commodities: Yahoo Finance is CORS-blocked for browsers, so quotes
 * go through the app's stateless edge function (/api/edge/quotes).
 * News: Google News RSS / BBC via the edge function (/api/edge/news).
 * Ported from the old server module (backend/lib/marketData.js): results are
 * cached for 60 s; if every source fails, the last good data is returned
 * marked `stale` instead of made-up numbers.
 */

export interface PriceItem {
  symbol: string;
  name: string;
  price: number;
  changePct: number | null;
}

export interface FxItem {
  pair: string;
  rate: number;
}

export interface Feed<T> {
  items: T[];
  source: string | null;
  updatedAt: string | null;
  stale: boolean;
  error?: string;
}

export interface MarketOverview {
  crypto: Feed<PriceItem>;
  quotes: Feed<PriceItem>;
  fx: Feed<FxItem>;
}

export interface NewsItem {
  title: string;
  url: string;
  publisher: string;
  date: string;
}

export type NewsTopic = 'markets' | 'crypto' | 'ai';

const CRYPTO = [
  { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin' },
  { id: 'ethereum', symbol: 'ETH', name: 'Ethereum' },
  { id: 'solana', symbol: 'SOL', name: 'Solana' },
  { id: 'binancecoin', symbol: 'BNB', name: 'BNB' },
  { id: 'ripple', symbol: 'XRP', name: 'XRP' },
  { id: 'dogecoin', symbol: 'DOGE', name: 'Dogecoin' },
  { id: 'cardano', symbol: 'ADA', name: 'Cardano' },
];

const QUOTES = [
  { symbol: '^GSPC', name: 'S&P 500' },
  { symbol: '^IXIC', name: 'NASDAQ' },
  { symbol: '^DJI', name: 'Dow Jones' },
  { symbol: '^FTSE', name: 'FTSE 100' },
  { symbol: '^N225', name: 'Nikkei 225' },
  { symbol: 'GC=F', name: 'Gold (oz)' },
  { symbol: 'CL=F', name: 'Crude oil (bbl)' },
];

const FX = ['EUR', 'GBP', 'JPY', 'CNY', 'INR', 'MYR'];

const NEWS_TOPICS: Record<NewsTopic, string> = {
  markets: 'stock market today',
  crypto: 'crypto market today',
  ai: 'artificial intelligence industry news',
};

const CACHE_MS = 60_000;

async function getJson(url: string, timeoutMs = 10_000): Promise<unknown> {
  const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
  if (!res.ok) throw new Error(`${new URL(url).hostname} ${res.status}`);
  return res.json();
}

const num = (v: unknown): number => (typeof v === 'number' ? v : Number.parseFloat(String(v)));

/* ── Parsers (exported for tests) ── */

export function parseCoingecko(data: unknown): PriceItem[] {
  const d = data as Record<string, { usd?: number; usd_24h_change?: number }> | null;
  return CRYPTO.filter((c) => d?.[c.id]?.usd != null).map((c) => ({
    symbol: c.symbol,
    name: c.name,
    price: num(d![c.id].usd),
    changePct: d![c.id].usd_24h_change != null ? num(d![c.id].usd_24h_change) : null,
  }));
}

export function parseBinance(rows: unknown): PriceItem[] {
  const list = Array.isArray(rows) ? (rows as Array<{ symbol?: string; lastPrice?: string; priceChangePercent?: string }>) : [];
  const bySymbol = new Map(list.map((r) => [r.symbol, r]));
  return CRYPTO.filter((c) => bySymbol.has(`${c.symbol}USDT`)).map((c) => {
    const r = bySymbol.get(`${c.symbol}USDT`)!;
    return { symbol: c.symbol, name: c.name, price: num(r.lastPrice), changePct: num(r.priceChangePercent) };
  });
}

interface YahooSparkQuote {
  fulldayPrice?: number;
  close?: number[];
  chartPreviousClose?: number;
  previousClose?: number;
  fulldayChangePercent?: number;
}

export function parseYahooSpark(data: unknown): PriceItem[] {
  const d = (data ?? {}) as Record<string, YahooSparkQuote>;
  return QUOTES.filter((q) => d?.[q.symbol]).map((q) => {
    const quote = d[q.symbol];
    const price = num(quote.fulldayPrice ?? quote.close?.[quote.close.length - 1]);
    const prev = num(quote.chartPreviousClose ?? quote.previousClose);
    const changePct =
      quote.fulldayChangePercent != null
        ? num(quote.fulldayChangePercent)
        : Number.isFinite(prev) && prev
          ? ((price - prev) / prev) * 100
          : null;
    return { symbol: q.symbol, name: q.name, price, changePct };
  }).filter((q) => Number.isFinite(q.price));
}

export function parseRates(data: unknown): FxItem[] {
  const rates = (data as { rates?: Record<string, number> } | null)?.rates;
  if (!rates) return [];
  return FX.filter((c) => rates[c] != null).map((c) => ({ pair: `USD/${c}`, rate: num(rates[c]) }));
}

/* ── Sources with backups ── */

async function firstWorking<T>(sources: { name: string; run: () => Promise<T[]> }[]): Promise<{ items: T[]; source: string }> {
  const errors: string[] = [];
  for (const { name, run } of sources) {
    try {
      const items = await run();
      if (items.length) return { items, source: name };
      errors.push(`${name}: empty`);
    } catch (err) {
      errors.push(`${name}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  throw new Error(errors.join('; '));
}

function fetchCrypto(): Promise<{ items: PriceItem[]; source: string }> {
  const ids = CRYPTO.map((c) => c.id).join(',');
  const pairs = encodeURIComponent(JSON.stringify(CRYPTO.map((c) => `${c.symbol}USDT`)));
  return firstWorking<PriceItem>([
    {
      name: 'CoinGecko',
      run: async () =>
        parseCoingecko(
          await getJson(
            `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`,
          ),
        ),
    },
    {
      name: 'Binance',
      run: async () => parseBinance(await getJson(`https://api.binance.com/api/v3/ticker/24hr?symbols=${pairs}`)),
    },
    {
      name: 'Coinbase',
      run: async () => {
        const settled = await Promise.allSettled(
          CRYPTO.map((c) => getJson(`https://api.coinbase.com/v2/prices/${c.symbol}-USD/spot`)),
        );
        return CRYPTO.map((c, i) => {
          const r = settled[i];
          const amount = r.status === 'fulfilled' ? num((r.value as { data?: { amount?: string } })?.data?.amount) : NaN;
          return { symbol: c.symbol, name: c.name, price: amount, changePct: null };
        }).filter((c) => Number.isFinite(c.price));
      },
    },
  ]);
}

/** Quotes via the app's edge function (Yahoo is CORS-blocked for browsers). */
async function fetchQuotes(): Promise<{ items: PriceItem[]; source: string }> {
  const symbols = QUOTES.map((q) => encodeURIComponent(q.symbol)).join(',');
  const data = await getJson(`/api/edge/quotes?symbols=${symbols}`, 15_000);
  const items = parseYahooSpark(data);
  if (!items.length) throw new Error('Yahoo Finance: empty');
  return { items, source: 'Yahoo Finance' };
}

function fetchFx(): Promise<{ items: FxItem[]; source: string }> {
  return firstWorking<FxItem>([
    { name: 'ExchangeRate-API', run: async () => parseRates(await getJson('https://open.er-api.com/v6/latest/USD')) },
    {
      name: 'Frankfurter (ECB)',
      run: async () => parseRates(await getJson(`https://api.frankfurter.app/latest?from=USD&to=${FX.join(',')}`)),
    },
  ]);
}

/* ── Cache: fresh for 60 s, last good copy kept if all sources fail ── */

const cache = new Map<string, { at: number; value: { items: unknown[]; source: string | null; updatedAt: string } }>();

async function cached<T>(key: string, loader: () => Promise<{ items: T[]; source: string }>): Promise<Feed<T>> {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_MS) return { ...(hit.value as unknown as Feed<T>), stale: false };
  try {
    const value = { ...(await loader()), updatedAt: new Date().toISOString() };
    cache.set(key, { at: Date.now(), value: value as unknown as { items: unknown[]; source: string | null; updatedAt: string } });
    return { ...value, stale: false };
  } catch (err) {
    if (hit) return { ...(hit.value as unknown as Feed<T>), stale: true };
    return { items: [], source: null, updatedAt: null, stale: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function fetchMarketOverview(): Promise<MarketOverview> {
  const [crypto, quotes, fx] = await Promise.all([
    cached('crypto', fetchCrypto),
    cached('quotes', fetchQuotes),
    cached('fx', fetchFx),
  ]);
  return { crypto, quotes, fx };
}

export async function fetchMarketNews(topic: NewsTopic = 'markets'): Promise<Feed<NewsItem>> {
  const query = NEWS_TOPICS[topic] || NEWS_TOPICS.markets;
  return cached(`news:${topic}`, async () => {
    const data = (await getJson(`/api/edge/news?q=${encodeURIComponent(query)}`, 15_000)) as {
      items?: Array<{ title?: string; url?: string; publisher?: string; date?: string }>;
    };
    const items: NewsItem[] = (Array.isArray(data.items) ? data.items : []).slice(0, 8).map((n) => ({
      title: n.title || '',
      url: n.url || '',
      publisher: n.publisher || '',
      date: n.date || '',
    }));
    if (!items.length) throw new Error('no headlines');
    return { items, source: 'Google News / BBC RSS' };
  });
}

/** All priced items by symbol (crypto + indices / commodities). */
export function priceMap(o: MarketOverview | null) {
  const map = new Map<string, PriceItem>();
  o?.crypto.items.forEach((i) => map.set(i.symbol, i));
  o?.quotes.items.forEach((i) => map.set(i.symbol, i));
  return map;
}

export function formatPrice(n: number) {
  const digits = n >= 1000 ? 0 : n >= 1 ? 2 : 4;
  return n.toLocaleString(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits });
}
