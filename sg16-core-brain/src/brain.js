/**
 * SG16 Core Brain — combines the Math Core with Mistral 7B.
 *
 * 1. Math Core computes any math in the question exactly.
 *    Plain arithmetic is answered by the core alone (instant, no model cost).
 * 2. Mistral 7B (Workers AI) answers, given the verified math result to explain.
 * 3. Only if the core model fails: add-on OpenAI-compatible APIs, in order.
 * 4. If every model fails but the Math Core solved it, the math answer is still returned.
 */
import { solveMath } from './mathCore.js';
import { coreModels, extraProviders, runCoreModel, runOpenAICompatible } from './providers.js';

const IDENTITY = `You are SG16 AI ENGINE, the core brain of SG16 AI Engine by Saif Tech Global LLC.
Never mention any third-party AI provider or model vendor. Answer clearly and helpfully.`;

/** Mistral 7B on Workers AI has a 15k-token window; keep the prompt well inside it. */
const MAX_PROMPT_CHARS = 24_000;

export class BrainUnavailableError extends Error {
  constructor(failures) {
    super('SG16 Core Brain could not answer right now');
    this.name = 'BrainUnavailableError';
    this.failures = failures;
  }
}

export function lastUserText(messages) {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (m?.role === 'user' && typeof m.content === 'string') return m.content;
  }
  return '';
}

function mathNote(math) {
  return `SG16 Math Core computed this exactly (verified): ${math.input} → ${math.result}
Use exactly this result. Do not recalculate it differently; explain the steps that lead to it.`;
}

function buildMessages(messages, math) {
  const system = [IDENTITY, ...messages.filter((m) => m.role === 'system').map((m) => m.content)];
  if (math) system.push(mathNote(math));

  const turns = messages
    .filter((m) => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .map((m) => ({ role: m.role, content: m.content }));

  // Drop the oldest turns until the prompt fits; always keep the latest message.
  let budget = MAX_PROMPT_CHARS - system.join('\n\n').length;
  const kept = [];
  for (let i = turns.length - 1; i >= 0; i--) {
    const cost = turns[i].content.length;
    if (kept.length > 0 && cost > budget) break;
    kept.unshift(i === turns.length - 1 ? { ...turns[i], content: turns[i].content.slice(0, Math.max(budget, 2000)) } : turns[i]);
    budget -= cost;
  }
  return [{ role: 'system', content: system.join('\n\n') }, ...kept];
}

function mathAnswer(math) {
  return `**${math.input} = ${math.result}**`;
}

/**
 * @param {object} env Worker env (AI binding, CORE_MODEL, CORE_FALLBACK_MODELS, EXTRA_PROVIDERS)
 * @param {{ messages: {role: string, content: string}[], userText?: string, maxTokens?: number, temperature?: number }} input
 * @returns {Promise<{ answer: string, provider: string, model: string, math: object | null }>}
 */
export async function think(env, { messages, userText, maxTokens = 1024, temperature = 0.6 }) {
  const question = userText ?? lastUserText(messages);
  const math = solveMath(question);

  if (math?.kind === 'arithmetic') {
    return { answer: mathAnswer(math), provider: 'sg16-math-core', model: 'sg16-math-core', math };
  }

  const prompt = buildMessages(messages, math);
  const options = { maxTokens, temperature };
  const failures = [];

  for (const model of coreModels(env)) {
    try {
      const answer = await runCoreModel(env, model, prompt, options);
      return { answer, provider: 'sg16-core', model, math };
    } catch (err) {
      failures.push({ provider: 'sg16-core', model, error: String(err?.message || err) });
    }
  }

  for (const provider of extraProviders(env)) {
    try {
      const answer = await runOpenAICompatible(provider, prompt, options);
      return { answer, provider: `addon:${provider.name || 'api'}`, model: provider.model, math };
    } catch (err) {
      failures.push({ provider: provider.name || provider.url, model: provider.model, error: String(err?.message || err) });
    }
  }

  if (math) {
    return { answer: mathAnswer(math), provider: 'sg16-math-core', model: 'sg16-math-core', math };
  }
  throw new BrainUnavailableError(failures);
}
