import { useAiConfigStore } from '../../core/aiConfigStore';
import { chatCompletion } from './client';
import type { AiChatMessage } from './types';

/**
 * Live web intelligence — runs entirely in the browser.
 *
 * - Weather: wttr.in directly (CORS-enabled).
 * - News RSS + web search + Yahoo quotes: CORS-blocked for browsers, so they
 *   go through the app's own stateless Cloudflare Pages Functions
 *   (/api/edge/*) — no dedicated server, no keys, edge-cached.
 * - Synthesis: the configured AI model answers from the live context, so
 *   answers work identically no matter which AI API is connected.
 */

const LIVE_PATTERNS = [
  /\b(news|headlines|breaking)\b/i,
  /\b(today|tonight|this morning|this afternoon|this evening|right now|currently|as of now)\b/i,
  /\b(latest|recent|up to date|up-to-date|current|live update)\b/i,
  /\b(yesterday|this week|this month|this year)\b/i,
  /\b(weather|forecast|temperature)\b/i,
  /\b(stock|share price|market|crypto|bitcoin|ethereum)\b/i,
  /\b(score|match result|who won|standings)\b/i,
  /\b(election|president|prime minister|government|parliament)\b/i,
  /\b(what happened|what's happening|whats happening|what is happening)\b/i,
  /\b(what's going on|whats going on|going on in|happening in)\b/i,
  /\b(search for|look up|find out)\b/i,
  /\b(release date|when did|when will|how much does|price of)\b/i,
  /\b(update me|brief me|inform me)\b/i,
];

const LIVE_SYSTEM = `You are SG16 AI Engine by Saif Tech Global LLC with live web intelligence.
Never mention Groq, OpenAI, Llama, DuckDuckGo, or any third-party AI provider.
Always present yourself exclusively as SG16 AI.

Rules:
- Answer ONLY from the provided live web context when it is present.
- For news, list key headlines with dates and brief context.
- Include markdown source links from the context when helpful.
- If context is partial, say what is confirmed and what is uncertain.
- Never invent events, numbers, or quotes not supported by the context.`;

const SYNTH_SYSTEM = `${LIVE_SYSTEM}

You will receive numbered live web search results. Synthesize a clear, helpful answer.`;

function isChitchat(message: string): boolean {
  const t = message.trim();
  return /^(hi|hello|hey|thanks|thank you|ok|okay|bye|good morning|good night)\b/i.test(t) && t.length < 40;
}

function isCreativeOrCodeTask(message: string): boolean {
  return /\b(write|compose|draft|poem|story|essay|code|function|implement|debug|script)\b/i.test(message);
}

export function needsWebSearch(message: string, workspaceId = 'general'): boolean {
  if (!useAiConfigStore.getState().options.liveSearch) return false;
  if (workspaceId === 'coding' || workspaceId === 'translate') return false;
  if (isChitchat(message) || isCreativeOrCodeTask(message)) return false;

  const text = message.trim();
  if (text.length < 4) return false;

  if (LIVE_PATTERNS.some((re) => re.test(text))) return true;

  if (workspaceId === 'general' || workspaceId === 'voice' || workspaceId === 'market') {
    const isQuestion =
      /\?\s*$/.test(text) ||
      /^(what|who|when|where|why|how|is|are|was|were|did|does|do|can|will|tell me)\b/i.test(text);
    if (isQuestion && text.length >= 10) {
      if (/\b(news|world|global|country|economy|sport|celebrity|company|ceo|launch|announced)\b/i.test(text)) {
        return true;
      }
      if (/\b(today|now|latest|current|recent|this week)\b/i.test(text)) return true;
    }
  }

  return false;
}

export function liveSearchAvailable(): boolean {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return false;
  return useAiConfigStore.getState().options.liveSearch;
}

/* ── Edge function + direct fetchers ── */

export interface WebResultItem {
  title: string;
  url: string;
  snippet: string;
  publisher?: string;
  date?: string;
  source?: string;
  detail?: string;
}

async function fetchJson(url: string, timeoutMs = 15_000): Promise<unknown> {
  const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
  if (!res.ok) throw new Error(`Fetch failed ${res.status}`);
  return res.json();
}

/** News headlines via the app's edge function (Google News RSS search + BBC). */
export async function fetchNewsResults(query: string): Promise<WebResultItem[]> {
  const q = query.replace(/\?/g, '').trim() || 'world news today';
  const data = (await fetchJson(`/api/edge/news?q=${encodeURIComponent(q)}`)) as {
    items?: WebResultItem[];
  };
  return Array.isArray(data.items) ? data.items : [];
}

/** General web results via the app's edge function (DuckDuckGo lite). */
export async function fetchWebResults(query: string, limit = 8): Promise<WebResultItem[]> {
  const data = (await fetchJson(`/api/edge/search?q=${encodeURIComponent(query)}&limit=${limit}`)) as {
    items?: WebResultItem[];
  };
  return Array.isArray(data.items) ? data.items : [];
}

/* ── Weather — wttr.in answers browsers directly (CORS-enabled) ── */

function extractLocation(query: string): string {
  const m = query.match(/\b(?:in|for|at)\s+([A-Za-z][A-Za-z\s,.-]{2,40})/i);
  if (m) return m[1].replace(/\?.*$/, '').trim();
  const m2 = query.match(/\bweather\s+(?:in\s+)?([A-Za-z][A-Za-z\s,.-]{2,40})/i);
  if (m2) return m2[1].replace(/\?.*$/, '').trim();
  return '';
}

function isWeatherQuery(query: string): boolean {
  return /\b(weather|forecast|temperature|rain|sunny)\b/i.test(query);
}

function isNewsQuery(query: string): boolean {
  return /\b(news|headlines|breaking|happening|top stories)\b/i.test(query);
}

export async function fetchWeatherResult(query: string): Promise<WebResultItem[]> {
  const location = extractLocation(query) || 'Albuquerque';
  const loc = encodeURIComponent(location);
  try {
    const oneLine = await fetch(`https://wttr.in/${loc}?format=3`, { signal: AbortSignal.timeout(12_000) }).then((r) =>
      r.ok ? r.text() : Promise.reject(new Error('wttr.in failed')),
    );
    const json = (await fetchJson(`https://wttr.in/${loc}?format=j1`, 12_000)) as {
      current_condition?: Array<{ FeelsLikeC?: string; humidity?: string; windspeedKmph?: string }>;
      nearest_area?: Array<{ areaName?: Array<{ value?: string }> }>;
    };
    const cur = json.current_condition?.[0];
    const area = json.nearest_area?.[0]?.areaName?.[0]?.value || location;
    return [
      {
        title: `Weather for ${area}`,
        snippet: oneLine.trim(),
        url: `https://wttr.in/${loc}`,
        date: new Date().toUTCString(),
        source: 'weather',
        detail: cur
          ? `Feels like ${cur.FeelsLikeC}°C · Humidity ${cur.humidity}% · Wind ${cur.windspeedKmph} km/h`
          : '',
      },
    ];
  } catch {
    return [];
  }
}

/** Merge news/weather/web results, de-duplicated, newest first. */
export async function fetchWebContext(query: string): Promise<WebResultItem[]> {
  const tasks: Promise<WebResultItem[]>[] = [];
  if (isNewsQuery(query) || /\btoday\b/i.test(query)) {
    tasks.push(fetchNewsResults(query).catch(() => []));
  }
  if (isWeatherQuery(query)) {
    tasks.push(fetchWeatherResult(query));
  }
  tasks.push(fetchWebResults(query).catch(() => []));

  const batches = await Promise.allSettled(tasks);
  const merged: WebResultItem[] = [];
  const seen = new Set<string>();
  for (const batch of batches) {
    if (batch.status !== 'fulfilled') continue;
    for (const item of batch.value) {
      const key = (item.title + item.url).toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(item);
    }
  }
  return merged.slice(0, 12);
}

/* ── Formatting + synthesis ── */

export function formatContextBlock(results: WebResultItem[]): string {
  if (!results.length) return '';
  return results
    .map((r, i) => {
      const parts = [`[${i + 1}] ${r.title}`];
      if (r.snippet) parts.push(r.snippet);
      if (r.detail) parts.push(r.detail);
      if (r.date) parts.push(`Date: ${r.date}`);
      if (r.url) parts.push(`URL: ${r.url}`);
      return parts.join('\n');
    })
    .join('\n\n');
}

function shortDate(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });
}

function hostName(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

/** Plain list of live results — used when no AI model is available to synthesize. */
export function formatDirectAnswer(results: WebResultItem[], query: string): string | null {
  if (!results.length) return null;
  const clean = results.filter((r) => r.title && r.title.trim()).slice(0, 8);
  if (!clean.length) return null;

  const lines = [`**Live results:** ${query.trim()}`, ''];
  clean.forEach((r, i) => {
    const head = r.url ? `[${r.title}](${r.url})` : `**${r.title}**`;
    const meta = [r.publisher || hostName(r.url || ''), shortDate(r.date || '')].filter(Boolean).join(' · ');
    lines.push(`${i + 1}. ${head}${meta ? ` — ${meta}` : ''}`);
    if (r.snippet) lines.push(`   ${r.snippet}`);
    if (r.detail) lines.push(`   ${r.detail}`);
  });
  lines.push('', '_Headlines from live public web sources. Open a link to read the full story._');
  return lines.join('\n');
}

function todayLabel(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

async function synthesizeFromWebContext(
  message: string,
  history: Pick<AiChatMessage, 'role' | 'content'>[],
  results: WebResultItem[],
): Promise<{ reply: string; model: string } | null> {
  const context = formatContextBlock(results);
  if (!context) return null;

  const messages: AiChatMessage[] = [
    { role: 'system', content: `${SYNTH_SYSTEM}\n\nToday's date (UTC): ${todayLabel()}.` },
  ];
  for (const msg of history.slice(-4)) {
    messages.push({ role: msg.role === 'assistant' ? 'assistant' : 'user', content: String(msg.content) });
  }
  messages.push({
    role: 'user',
    content: `User question: ${message.trim()}\n\n--- LIVE WEB CONTEXT ---\n${context}\n\n--- END CONTEXT ---\n\nAnswer using only this live context.`,
  });

  try {
    const { content, model } = await chatCompletion({ messages, intent: 'chat', temperature: 0.3, maxTokens: 1800, timeoutMs: 90_000 });
    return { reply: content, model };
  } catch {
    return null;
  }
}

/** Live search: fetch public web context, then answer with the configured AI (direct list as fallback). */
export async function searchAndAnswer(
  message: string,
  history: Pick<AiChatMessage, 'role' | 'content'>[] = [],
): Promise<{ reply: string; liveSearch: true; source: string }> {
  const results = await fetchWebContext(message);
  const synthesized = await synthesizeFromWebContext(message, history, results);
  if (synthesized) return { reply: synthesized.reply, liveSearch: true, source: 'sg16-web' };

  const direct = formatDirectAnswer(results, message);
  if (direct) return { reply: direct, liveSearch: true, source: 'web-direct' };

  throw new Error('SG16 AI could not reach live web sources right now. Please try again.');
}
