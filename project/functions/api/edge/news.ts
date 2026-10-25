/**
 * Edge function: GET /api/edge/news?q=...
 *
 * Google News RSS search + BBC world feeds, parsed into clean items for the
 * app's live-search and Market Shield. Ported from backend/lib/webFetcher.js.
 * Stateless, keyless, no database — safe to cache at the edge.
 */

// Minimal context typing — Cloudflare Pages Functions only need the request.
interface EdgeContext {
  request: Request;
}

export interface EdgeNewsItem {
  title: string;
  url: string;
  snippet: string;
  publisher?: string;
  date?: string;
  source?: string;
}

const FEEDS = (encodedQuery: string) => [
  `https://news.google.com/rss/search?q=${encodedQuery}&hl=en-US&gl=US&ceid=US:en`,
  'https://feeds.bbci.co.uk/news/world/rss.xml',
  'https://feeds.bbci.co.uk/news/rss.xml',
];

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

// Feeds often escape their HTML (&lt;a href=...&gt;), so decode before removing tags,
// otherwise the tags come back as visible text.
function stripTags(html: string): string {
  const unwrapped = html.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1');
  return decodeHtml(decodeHtml(unwrapped).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' '));
}

function isUrlLike(text: string): boolean {
  return /^(https?:\/\/|www\.)\S+$/i.test(text.trim());
}

function hostName(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

/** Google News titles end with " - Publisher"; split them so the source shows separately. */
function splitPublisher(title: string): { title: string; publisher: string } {
  const m = title.match(/^(.*\S)\s+-\s+([^-]{2,60})$/);
  return m ? { title: m[1], publisher: m[2].trim() } : { title, publisher: '' };
}

/** Clean one result for display: a real title, no repeated snippet, the publisher name. */
function cleanResult(item: Partial<EdgeNewsItem> & { title?: string }): EdgeNewsItem | null {
  const raw = (item?.title || '').trim();
  if (!raw || /^[*\s]+$/.test(raw)) return null;
  const { title, publisher } = splitPublisher(isUrlLike(raw) ? hostName(raw) || raw : raw);
  if (!title) return null;
  let snippet = (item.snippet || '').trim();
  // Google News descriptions only repeat the headline and publisher.
  if (snippet && (snippet.startsWith(title) || title.startsWith(snippet.slice(0, 40)))) snippet = '';
  return {
    ...item,
    title,
    publisher: item.publisher || publisher || hostName(item.url || ''),
    snippet,
  } as EdgeNewsItem;
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

function parseRssItems(xml: string, limit = 8): EdgeNewsItem[] {
  const items: EdgeNewsItem[] = [];
  const blocks = xml.match(/<item[\s\S]*?<\/item>/gi) || [];
  for (const block of blocks.slice(0, limit)) {
    const title = block.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];
    const link = block.match(/<link[^>]*>([\s\S]*?)<\/link>/i)?.[1];
    const pubDate = block.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i)?.[1];
    const desc = block.match(/<description[^>]*>([\s\S]*?)<\/description>/i)?.[1];
    if (!title) continue;
    items.push({
      title: stripTags(title),
      url: stripTags(link || ''),
      date: stripTags(pubDate || ''),
      snippet: stripTags(desc || '').slice(0, 280),
      source: 'news',
    });
  }
  return items;
}

async function fetchNewsResults(query: string): Promise<EdgeNewsItem[]> {
  const encoded = encodeURIComponent(query.replace(/\?/g, '').trim() || 'world news today');

  const all: EdgeNewsItem[] = [];
  for (const url of FEEDS(encoded)) {
    try {
      const xml = await fetchText(url);
      all.push(...parseRssItems(xml, 6));
      // The general BBC feeds are only a backup when the search feed returns too little.
      if (all.length >= 4) break;
    } catch {
      /* try next feed */
    }
  }

  const seen = new Set<string>();
  return all
    .map(cleanResult)
    .filter((item): item is EdgeNewsItem => {
      if (!item) return false;
      const key = item.title.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => (Date.parse(b.date || '') || 0) - (Date.parse(a.date || '') || 0))
    .slice(0, 10);
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      // The app is same-origin; permissive CORS also lets the mobile app call these.
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=300',
    },
  });
}

export async function onRequestGet(context: EdgeContext): Promise<Response> {
  const q = new URL(context.request.url).searchParams.get('q') || '';
  try {
    const items = await fetchNewsResults(q);
    return json({ items });
  } catch {
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
