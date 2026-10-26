/**
 * Edge function: GET /api/edge/quotes?symbols=^GSPC,^IXIC,...
 *
 * Yahoo Finance spark quotes (1-day closes + previous close) for indices,
 * gold and oil. Yahoo blocks browser CORS, so the browser asks this function
 * and the function asks Yahoo (query1, with query2 as backup). The raw Yahoo
 * JSON is passed through; the client parses it (lib/marketApi.ts).
 * Ported from backend/lib/marketData.js (fetchQuotes).
 */

// Minimal context typing — Cloudflare Pages Functions only need the request.
interface EdgeContext {
  request: Request;
}

const YAHOO_HOSTS = ['https://query1.finance.yahoo.com', 'https://query2.finance.yahoo.com'];

async function fetchYahoo(host: string, path: string): Promise<unknown> {
  const res = await fetch(`${host}${path}`, {
    headers: {
      'User-Agent': 'SG16-AI-Engine/1.0 (Saif Tech Global LLC; +https://saiftechglobal.com)',
      Accept: 'application/json',
    },
    signal: AbortSignal.timeout(12_000),
  });
  if (!res.ok) throw new Error(`Yahoo ${res.status}`);
  return res.json();
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=60',
    },
  });
}

export async function onRequestGet(context: EdgeContext): Promise<Response> {
  const raw = (new URL(context.request.url).searchParams.get('symbols') || '').trim();
  if (!raw) return json({});

  // The client sends each symbol percent-encoded, joined by commas; Yahoo
  // expects the same shape in its query string.
  const symbols = raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => encodeURIComponent(s))
    .join(',');
  if (!symbols) return json({});

  const path = `/v8/finance/spark?symbols=${symbols}&range=1d&interval=1d`;

  let lastError: unknown = null;
  for (const host of YAHOO_HOSTS) {
    try {
      const data = await fetchYahoo(host, path);
      if (data && typeof data === 'object' && Object.keys(data).length) return json(data);
      lastError = new Error('Yahoo returned no quotes');
    } catch (err) {
      lastError = err;
    }
  }

  return json({ error: lastError instanceof Error ? lastError.message : 'Yahoo Finance unavailable' }, 502);
}

export async function onRequestOptions(): Promise<Response> {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
