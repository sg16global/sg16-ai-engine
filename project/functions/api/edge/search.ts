/**
 * Edge function: GET /api/edge/search?q=...&limit=...
 *
 * General web results via DuckDuckGo's lite HTML endpoint (no API key, no
 * signup). Ported from backend/lib/webFetcher.js (fetchDuckDuckGoResults).
 * Stateless, keyless — safe to cache at the edge briefly.
 */

// Minimal context typing — Cloudflare Pages Functions only need the request.
interface EdgeContext {
  request: Request;
}

export interface EdgeSearchItem {
  title: string;
  url: string;
  snippet: string;
  publisher?: string;
  date?: string;
  source?: string;
}

function decodeHtml(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim();
}

function stripTags(html: string): string {
  const unwrapped = html.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1');
  return decodeHtml(decodeHtml(unwrapped).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' '));
}

function hostName(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

function cleanResult(item: Partial<EdgeSearchItem> & { title?: string }): EdgeSearchItem | null {
  const raw = (item?.title || '').trim();
  if (!raw || /^[*\s]+$/.test(raw)) return null;
  const title = raw;
  if (!title) return null;
  const snippet = (item.snippet || '').trim();
  return {
    ...item,
    title,
    publisher: item.publisher || hostName(item.url || ''),
    snippet: snippet.startsWith(title) ? '' : snippet,
  } as EdgeSearchItem;
}

async function fetchText(url: string, timeoutMs = 15_000): Promise<string> {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'SG16-AI-Engine/1.0 (Saif Tech Global LLC; +https://saiftechglobal.com)',
      Accept: 'text/html,application/xml,application/json,text/plain,*/*',
    },
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) throw new Error(`Fetch failed ${res.status}`);
  return res.text();
}

async function fetchDuckDuckGoResults(query: string, limit = 8): Promise<EdgeSearchItem[]> {
  const url = `https://lite.duckduckgo.com/lite/?q=${encodeURIComponent(query)}`;
  const html = await fetchText(url, 15_000);
  const results: EdgeSearchItem[] = [];

  const rows = html.split(/<tr>/i);
  for (const row of rows) {
    if (!row.includes('result-link') && !row.includes('uddg=')) continue;
    const linkMatch = row.match(/href="([^"]*uddg=[^"]+)"/i) || row.match(/href="(https?:\/\/[^"]+)"/i);
    const titleMatch = row.match(/class="result-link"[^>]*>([\s\S]*?)<\/a>/i);
    const snippetMatch = row.match(/class="result-snippet"[^>]*>([\s\S]*?)<\/td>/i);
    if (!linkMatch) continue;

    let href = decodeHtml(linkMatch[1]);
    if (href.includes('uddg=')) {
      const uddg = href.match(/uddg=([^&"]+)/);
      if (uddg) href = decodeURIComponent(uddg[1]);
    }

    const item = cleanResult({
      title: stripTags(titleMatch?.[1] || href),
      url: href,
      snippet: stripTags(snippetMatch?.[1] || '').slice(0, 280),
      source: 'web',
    });
    if (item) results.push(item);

    if (results.length >= limit) break;
  }

  return results;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=300',
    },
  });
}

export async function onRequestGet(context: EdgeContext): Promise<Response> {
  const url = new URL(context.request.url);
  const q = (url.searchParams.get('q') || '').trim();
  const limit = Math.min(20, Math.max(1, Number(url.searchParams.get('limit')) || 8));
  if (!q) return json({ items: [] });
  try {
    const items = await fetchDuckDuckGoResults(q, limit);
    return json({ items });
  } catch {
    // DuckDuckGo rate-limits datacenter IPs sometimes — an empty list is a
    // graceful answer; the AI layer simply answers without live context.
    return json({ items: [] });
  }
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
