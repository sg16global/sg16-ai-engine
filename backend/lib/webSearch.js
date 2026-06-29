import {
  callChatCompletion,
  callWithModelFallback,
  getApiKey,
  getGroqApiUrl,
  isProviderInCooldown,
  isRateLimitError,
  markProviderCooldown,
  todayLabel,
} from './sg16Provider.js';
import {
  fetchWebContext,
  formatContextBlock,
  formatDirectAnswer,
} from './webFetcher.js';

const COMPOUND_MINI = process.env.SG16_COMPOUND_MODEL || 'groq/compound-mini';
const COMPOUND_FULL = process.env.SG16_COMPOUND_MODEL_FULL || 'groq/compound';

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

const COMPLEX_LIVE_PATTERNS = [
  /\b(compare|research|deep dive|comprehensive|detailed report)\b/i,
  /\b(multiple sources|several sources)\b/i,
];

const LIVE_SYSTEM = `You are SG16 AI Engine by SaifTech Global Limited with live web intelligence.
Never mention Groq, OpenAI, Llama, Compound, DuckDuckGo, or any third-party provider.
Always present yourself exclusively as SG16 AI.

Rules:
- Answer ONLY from the provided live web context when it is present.
- For news, list key headlines with dates and brief context.
- Include markdown source links from the context when helpful.
- If context is partial, say what is confirmed and what is uncertain.
- Never invent events, numbers, or quotes not supported by the context.`;

const SYNTH_SYSTEM = `${LIVE_SYSTEM}

You will receive numbered live web search results. Synthesize a clear, helpful answer like Google AI.`;

function isLiveSearchEnabled() {
  if (process.env.SG16_LIVE_SEARCH === '0' || process.env.SG16_LIVE_SEARCH === 'false') {
    return false;
  }
  return true;
}

function isCreativeOrCodeTask(message) {
  return /\b(write|compose|draft|poem|story|essay|code|function|implement|debug|script)\b/i.test(message);
}

function isChitchat(message) {
  const t = message.trim();
  return /^(hi|hello|hey|thanks|thank you|ok|okay|bye|good morning|good night)\b/i.test(t) && t.length < 40;
}

export function needsWebSearch(message, workspaceId = 'general') {
  if (!isLiveSearchEnabled()) return false;
  if (workspaceId === 'coding' || workspaceId === 'translate') return false;
  if (isChitchat(message) || isCreativeOrCodeTask(message)) return false;

  const text = message.trim();
  if (text.length < 4) return false;

  if (LIVE_PATTERNS.some((re) => re.test(text))) return true;

  if (workspaceId === 'general' || workspaceId === 'voice') {
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

function pickCompoundModel(message) {
  if (COMPLEX_LIVE_PATTERNS.some((re) => re.test(message))) return COMPOUND_FULL;
  return COMPOUND_MINI;
}

async function tryCompoundSearch({ message, history }) {
  if (isProviderInCooldown('compound')) return null;

  const apiUrl = getGroqApiUrl();
  const apiKey = getApiKey();
  if (!apiUrl || !apiKey) return null;

  const model = pickCompoundModel(message);
  const messages = [
    { role: 'system', content: `${LIVE_SYSTEM}\n\nToday's date (UTC): ${todayLabel()}.` },
  ];
  for (const msg of history.slice(-6)) {
    messages.push({ role: msg.role, content: msg.content });
  }
  messages.push({
    role: 'user',
    content: `${message.trim()}\n\n(Search the live web for the most current accurate answer.)`,
  });

  try {
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Groq-Model-Version': 'latest',
      },
      body: JSON.stringify({ model, messages, temperature: 0.4, max_tokens: 2048 }),
      signal: AbortSignal.timeout(120000),
    });

    const data = await res.json();
    if (!res.ok) {
      if (isRateLimitError(data.error?.message, res.status)) {
        markProviderCooldown('compound');
        console.warn('SG16 Compound rate limited — using SG16 web fallback');
        return null;
      }
      throw new Error(data.error?.message || 'SG16 live search failed');
    }

    const reply = data.choices?.[0]?.message?.content?.trim();
    if (!reply) return null;
    return { reply, liveSearch: true, source: 'compound' };
  } catch (err) {
    if (isRateLimitError(err.message, err.status)) {
      markProviderCooldown('compound');
      return null;
    }
    throw err;
  }
}

async function synthesizeFromWebContext({ message, history, results }) {
  const context = formatContextBlock(results);
  if (!context) return null;

  const messages = [
    {
      role: 'system',
      content: `${SYNTH_SYSTEM}\n\nToday's date (UTC): ${todayLabel()}.`,
    },
  ];
  for (const msg of history.slice(-4)) {
    messages.push({ role: msg.role, content: msg.content });
  }
  messages.push({
    role: 'user',
    content: `User question: ${message.trim()}\n\n--- LIVE WEB CONTEXT ---\n${context}\n\n--- END CONTEXT ---\n\nAnswer using only this live context.`,
  });

  try {
    const { content, model } = await callWithModelFallback({
      messages,
      temperature: 0.3,
      maxTokens: 1800,
    });
    return { reply: content, liveSearch: true, source: 'sg16-web', model };
  } catch (err) {
    console.warn('SG16 synthesize fallback:', err.message);
    return null;
  }
}

async function fallbackWebSearch({ message, history }) {
  const results = await fetchWebContext(message);
  const synthesized = await synthesizeFromWebContext({ message, history, results });
  if (synthesized) return synthesized;

  const direct = formatDirectAnswer(results, message);
  if (direct) {
    return { reply: direct, liveSearch: true, source: 'web-direct' };
  }

  throw new Error('SG16 AI could not reach live web sources right now. Please try again.');
}

export async function searchAndAnswer({ message, history = [], workspaceId = 'general' }) {
  const compound = await tryCompoundSearch({ message, history });
  if (compound) return compound;

  return fallbackWebSearch({ message, history });
}

export function liveSearchAvailable() {
  return isLiveSearchEnabled();
}
