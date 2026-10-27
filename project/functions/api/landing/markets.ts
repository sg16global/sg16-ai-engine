/**
 * GET /api/landing/markets — the landing page "SG16 Finance" card.
 *
 * BTC and ETH come from SG16 Finance (sg16finance.com/api/quotes, Coinbase
 * 24h). Gold, S&P 500 and Nasdaq are real index/futures levels from Yahoo
 * (GC=F, ^GSPC, ^IXIC) — SG16 Finance quotes those through ETF proxies
 * (GLD, SPY, QQQ), whose prices are not the index level.
 *
 * Edge-cached for 60 s. A source that fails gives null for its rows — the
 * card shows "—", never an invented number.
 */

interface EdgeContext {
  request: Request;
  waitUntil: (promise: Promise<unknown>) => void;
}

type Row = { sym: string; price: number | null; changePct: number | null };

const CACHE_SECONDS = 60;
const YAHOO_HOSTS = ['https://query1.finance.yahoo.com', 'https://query2.finance.yahoo.com'];
const YAHOO_ROWS: Array<{ sym: string; symbol: string }> = [
  { sym: 'GOLD', symbol: 'GC=F' },
  { sym: 'S&P 500', symbol: '^GSPC' },
  { sym: 'NASDAQ', symbol: '^IXIC' },
];

async function financeCrypto(): Promise<Record<string, { price: number; changePct: number }>> {
  const res = await fetch('https://sg16finance.com/api/quotes', { signal: AbortSignal.timeout(10_000) });
  if (!res.ok) throw new Error(`sg16finance ${res.status}`);
  const data = (await res.json()) as { quotes?: Array<{ symbol?: string; price?: string; changePercent?: string }> };
  const out: Record<string, { price: number; changePct: number }> = {};
  for (const q of data.quotes ?? []) {
    const price = Number(q.price);
    const changePct = Number(q.changePercent);
    if ((q.symbol === 'BTC' || q.symbol === 'ETH') && Number.isFinite(price) && Number.isFinite(changePct)) {
      out[q.symbol] = { price, changePct };
    }
  }
  return out;
}

type Spark = Record<string, { close?: Array<number | null>; chartPreviousClose?: number } | undefined>;

async function yahooLevels(): Promise<Spark> {
  const symbols = YAHOO_ROWS.map((r) => encodeURIComponent(r.symbol)).join(',');
  const path = `/v8/finance/spark?symbols=${symbols}&range=1d&interval=1d`;
  let lastError: unknown = null;
  for (const host of YAHOO_HOSTS) {
    try {
      const res = await fetch(`${host}${path}`, {
        headers: { 'User-Agent': 'SG16-AI-Engine/1.0 (Saif Tech Global LLC; +https://saiftechglobal.com)', Accept: 'application/json' },
        signal: AbortSignal.timeout(10_000),
      });
      if (!res.ok) throw new Error(`Yahoo ${res.status}`);
      return (await res.json()) as Spark;
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError;
}

async function build(): Promise<Row[]> {
  const [crypto, spark] = await Promise.allSettled([financeCrypto(), yahooLevels()]);
  const rows: Row[] = ['BTC', 'ETH'].map((sym) => {
    const q = crypto.status === 'fulfilled' ? crypto.value[sym] : undefined;
    return { sym, price: q?.price ?? null, changePct: q?.changePct ?? null };
  });
  for (const { sym, symbol } of YAHOO_ROWS) {
    const s = spark.status === 'fulfilled' ? spark.value[symbol] : undefined;
    const closes = (s?.close ?? []).filter((c): c is number => typeof c === 'number' && Number.isFinite(c));
    const last = closes.length ? closes[closes.length - 1] : undefined;
    const prev = s?.chartPreviousClose;
    rows.push({
      sym,
      price: last ?? null,
      changePct: last !== undefined && prev ? ((last - prev) / prev) * 100 : null,
    });
  }
  return rows;
}

export async function onRequestGet(context: EdgeContext): Promise<Response> {
  const cache = (caches as unknown as { default: Cache }).default;
  const key = new Request(new URL('/api/landing/markets', context.request.url).toString());
  const hit = await cache.match(key);
  if (hit) return hit;

  const rows = await build();
  const res = new Response(JSON.stringify({ updated: Date.now(), items: rows }), {
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': `public, max-age=${CACHE_SECONDS}` },
  });
  if (rows.some((r) => r.price !== null)) context.waitUntil(cache.put(key, res.clone()));
  return res;
}
