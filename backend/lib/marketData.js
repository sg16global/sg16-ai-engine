/**
 * Market Shield data — real prices from public sources, each with a backup source.
 * Crypto: CoinGecko → Binance → Coinbase. Indices / gold / oil: Yahoo (query1 → query2).
 * Currencies: open.er-api.com → Frankfurter (ECB). Results are cached for 60 s; if every source
 * fails, the last good data is returned marked `stale` instead of made-up numbers.
 */
import { fetchNewsResults } from './webFetcher.js';

export const CRYPTO = [
  { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin' },
  { id: 'ethereum', symbol: 'ETH', name: 'Ethereum' },
  { id: 'solana', symbol: 'SOL', name: 'Solana' },
  { id: 'binancecoin', symbol: 'BNB', name: 'BNB' },
  { id: 'ripple', symbol: 'XRP', name: 'XRP' },
  { id: 'dogecoin', symbol: 'DOGE', name: 'Dogecoin' },
  { id: 'cardano', symbol: 'ADA', name: 'Cardano' },
];

export const QUOTES = [
  { symbol: '^GSPC', name: 'S&P 500' },
  { symbol: '^IXIC', name: 'NASDAQ' },
  { symbol: '^DJI', name: 'Dow Jones' },
  { symbol: '^FTSE', name: 'FTSE 100' },
  { symbol: '^N225', name: 'Nikkei 225' },
  { symbol: 'GC=F', name: 'Gold (oz)' },
  { symbol: 'CL=F', name: 'Crude oil (bbl)' },
];

export const FX = ['EUR', 'GBP', 'JPY', 'CNY', 'INR', 'MYR'];

const NEWS_TOPICS = {
  markets: 'stock market today',
  crypto: 'crypto market today',
  ai: 'artificial intelligence industry news',
};

const CACHE_MS = 60_000;
let fetchImpl = (...args) => fetch(...args);

/** Tests swap the network for canned responses. */
export function setFetchForTests(fn) {
  fetchImpl = fn ?? ((...args) => fetch(...args));
  cache.clear();
}

async function getJson(url) {
  const res = await fetchImpl(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (SG16 AI Engine market data)', Accept: 'application/json' },
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`${new URL(url).hostname} ${res.status}`);
  return res.json();
}

const num = (v) => (typeof v === 'number' ? v : Number.parseFloat(v));

// ── Parsers (exported for tests) ──

export function parseCoingecko(data) {
  return CRYPTO.filter((c) => data?.[c.id]?.usd != null).map((c) => ({
    symbol: c.symbol,
    name: c.name,
    price: num(data[c.id].usd),
    changePct: data[c.id].usd_24h_change != null ? num(data[c.id].usd_24h_change) : null,
  }));
}

export function parseBinance(rows) {
  const bySymbol = new Map((Array.isArray(rows) ? rows : []).map((r) => [r.symbol, r]));
  return CRYPTO.filter((c) => bySymbol.has(`${c.symbol}USDT`)).map((c) => {
    const r = bySymbol.get(`${c.symbol}USDT`);
    return { symbol: c.symbol, name: c.name, price: num(r.lastPrice), changePct: num(r.priceChangePercent) };
  });
}

export function parseYahooSpark(data) {
  return QUOTES.filter((q) => data?.[q.symbol]).map((q) => {
    const d = data[q.symbol];
    const price = num(d.fulldayPrice ?? d.close?.[d.close.length - 1]);
    const prev = num(d.chartPreviousClose ?? d.previousClose);
    const changePct =
      d.fulldayChangePercent != null
        ? num(d.fulldayChangePercent)
        : Number.isFinite(prev) && prev
          ? ((price - prev) / prev) * 100
          : null;
    return { symbol: q.symbol, name: q.name, price, changePct };
  }).filter((q) => Number.isFinite(q.price));
}

export function parseRates(data) {
  const rates = data?.rates;
  if (!rates) return [];
  return FX.filter((c) => rates[c] != null).map((c) => ({ pair: `USD/${c}`, rate: num(rates[c]) }));
}

// ── Sources with backups ──

async function firstWorking(sources) {
  const errors = [];
  for (const { name, run } of sources) {
    try {
      const items = await run();
      if (items.length) return { items, source: name };
      errors.push(`${name}: empty`);
    } catch (err) {
      errors.push(`${name}: ${err.message}`);
    }
  }
  throw new Error(errors.join('; '));
}

function fetchCrypto() {
  const ids = CRYPTO.map((c) => c.id).join(',');
  const pairs = encodeURIComponent(JSON.stringify(CRYPTO.map((c) => `${c.symbol}USDT`)));
  return firstWorking([
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
          const amount = r.status === 'fulfilled' ? num(r.value?.data?.amount) : NaN;
          return { symbol: c.symbol, name: c.name, price: amount, changePct: null };
        }).filter((c) => Number.isFinite(c.price));
      },
    },
  ]);
}

function fetchQuotes() {
  const symbols = QUOTES.map((q) => encodeURIComponent(q.symbol)).join(',');
  const path = `/v8/finance/spark?symbols=${symbols}&range=1d&interval=1d`;
  return firstWorking([
    { name: 'Yahoo Finance', run: async () => parseYahooSpark(await getJson(`https://query1.finance.yahoo.com${path}`)) },
    { name: 'Yahoo Finance (backup)', run: async () => parseYahooSpark(await getJson(`https://query2.finance.yahoo.com${path}`)) },
  ]);
}

function fetchFx() {
  return firstWorking([
    { name: 'ExchangeRate-API', run: async () => parseRates(await getJson('https://open.er-api.com/v6/latest/USD')) },
    {
      name: 'Frankfurter (ECB)',
      run: async () => parseRates(await getJson(`https://api.frankfurter.app/latest?from=USD&to=${FX.join(',')}`)),
    },
  ]);
}

// ── Cache: fresh for 60 s, last good copy kept if all sources fail ──

const cache = new Map();

async function cached(key, loader) {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_MS) return { ...hit.value, stale: false };
  try {
    const value = { ...(await loader()), updatedAt: new Date().toISOString() };
    cache.set(key, { at: Date.now(), value });
    return { ...value, stale: false };
  } catch (err) {
    if (hit) return { ...hit.value, stale: true };
    return { items: [], source: null, updatedAt: null, stale: false, error: err.message };
  }
}

export async function getMarketOverview() {
  const [crypto, quotes, fx] = await Promise.all([
    cached('crypto', fetchCrypto),
    cached('quotes', fetchQuotes),
    cached('fx', fetchFx),
  ]);
  return { crypto, quotes, fx };
}

export async function getMarketNews(topic = 'markets') {
  const query = NEWS_TOPICS[topic] || NEWS_TOPICS.markets;
  return cached(`news:${topic}`, async () => {
    const items = (await fetchNewsResults(query)).slice(0, 8).map((n) => ({
      title: n.title,
      url: n.url,
      publisher: n.publisher || '',
      date: n.date || '',
    }));
    if (!items.length) throw new Error('no headlines');
    return { items, source: 'Google News / BBC RSS' };
  });
}

export async function handleMarketOverview(_req, res) {
  res.set('Cache-Control', 'public, max-age=30');
  res.json(await getMarketOverview());
}

export async function handleMarketNews(req, res) {
  const topic = String(req.query.topic || 'markets');
  res.set('Cache-Control', 'public, max-age=60');
  res.json(await getMarketNews(NEWS_TOPICS[topic] ? topic : 'markets'));
}
