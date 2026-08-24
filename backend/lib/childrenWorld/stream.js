import { getPrimaryProvider, getTextModelChain } from '../sg16Provider.js';
import { fullSystemPrompt, VALID_AGE_TIERS } from './prompts.js';
import {
  Action,
  applySafetyPipeline,
  classify,
  crisisMessage,
  refusalMessage,
} from './safety.js';

const SAFE_COMPLETE_STEER =
  'Give only general safe guidance. No explicit details. Encourage trusted adult.';

const KALI_AGENT_BY_TIER = {
  '6-11': 'h-guide',
  '12-17': 'youth-teen',
  '18+': 'adult-guide',
};

function buildUserMessage(message, nickname) {
  const nick = (nickname || '').trim();
  if (nick) return `[Nickname: ${nick}]\n${message}`;
  return message;
}

function buildSystemPrompt(ageTier, steerSafe) {
  let system = fullSystemPrompt(ageTier);
  if (steerSafe) {
    system += `\n\nINTERNAL STEERING:\n${SAFE_COMPLETE_STEER}`;
  }
  return system;
}

function offlineFallback(message) {
  const t = message.toLowerCase();
  if (t.includes('sad') || t.includes('angry') || t.includes('scared')) {
    return (
      'I’m sorry you feel that way. Try three small steps: take slow breaths, ' +
      'tell a trusted grown-up, and do something gentle like drawing. What happened?'
    );
  }
  if (t.includes('7') && t.includes('8')) {
    return '7 × 8 = 56. A trick: 7×4=28, then double it to get 56.';
  }
  if (t.includes('story')) {
    return (
      'Once there was a brave bunny named Pip. Pip helped a lost bird find its nest. ' +
      'The bird said thank you. Pip smiled. The end.'
    );
  }
  if (t.includes('science')) {
    return 'Science fact: Honey bees can “talk” by doing a waggle dance to show where flowers are.';
  }
  return 'I can help with homework, stories, or feelings. What would you like to do?';
}

function finishResult({ ageTier, userText, pre, content, sessionId }) {
  const pipeline = applySafetyPipeline(ageTier, userText, content);
  const flags = [...new Set([...pre.flags, ...(pipeline.postFlags || [])])];
  const postAction = pipeline.postAction || pipeline.action;

  return {
    reply: pipeline.reply || content,
    safe: postAction === Action.ALLOW || postAction === Action.SAFE_COMPLETE,
    flags,
    action: postAction,
    agent: KALI_AGENT_BY_TIER[ageTier],
    sessionId: sessionId || undefined,
  };
}

async function streamOllamaTokens({ messages, onToken, maxTokens, temperature, timeoutMs }) {
  const provider = getPrimaryProvider();
  if (!provider?.apiUrl || provider.id !== 'ollama') {
    throw new Error('Ollama brain not available');
  }

  const model = getTextModelChain(provider)[0];
  const res = await fetch(provider.apiUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${provider.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      stream: true,
      options: {
        num_ctx: Number(process.env.OLLAMA_NUM_CTX || 2048),
        num_predict: maxTokens,
        num_thread: Number(process.env.OLLAMA_NUM_THREAD || 4),
      },
    }),
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => res.statusText);
    throw new Error(detail || 'Ollama stream failed');
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error('Ollama stream unavailable');

  const decoder = new TextDecoder();
  let buffer = '';
  let content = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed === 'data: [DONE]') continue;
      if (!trimmed.startsWith('data:')) continue;

      const payload = trimmed.replace(/^data:\s*/, '');
      try {
        const json = JSON.parse(payload);
        const delta = json.choices?.[0]?.delta?.content;
        if (!delta) continue;
        content += delta;
        onToken(delta, content);
      } catch {
        // ignore malformed chunks
      }
    }
  }

  return content.trim();
}

export async function streamChildrenWorldChat({
  ageTier,
  message,
  nickname = '',
  sessionId = '',
  onToken,
}) {
  if (!message?.trim()) {
    throw new Error('message is required');
  }
  if (!VALID_AGE_TIERS.includes(ageTier)) {
    throw new Error(`Unknown age tier: ${ageTier}`);
  }

  const userText = message.trim();
  const pre = classify(ageTier, userText);

  if (pre.action === Action.CRISIS) {
    return {
      reply: crisisMessage(ageTier),
      safe: false,
      flags: pre.flags,
      action: pre.action,
      agent: KALI_AGENT_BY_TIER[ageTier],
      sessionId: sessionId || undefined,
    };
  }

  if (pre.action === Action.REFUSE) {
    return {
      reply: refusalMessage(ageTier, pre.flags),
      safe: false,
      flags: pre.flags,
      action: pre.action,
      agent: KALI_AGENT_BY_TIER[ageTier],
      sessionId: sessionId || undefined,
    };
  }

  const sanitized = pre.redactedText || userText;
  const systemPrompt = buildSystemPrompt(ageTier, pre.action === Action.SAFE_COMPLETE);
  const userPayload = buildUserMessage(sanitized, nickname);
  const timeoutMs = Number(process.env.SG16_CHILDREN_CHAT_TIMEOUT_MS || 30000);
  const maxTokens = 180;

  let content = '';
  try {
    content = await streamOllamaTokens({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPayload },
      ],
      onToken: (delta, full) => {
        onToken?.(delta, full);
      },
      maxTokens,
      temperature: 0.5,
      timeoutMs,
    });
  } catch (err) {
    console.warn('[children-world] stream unavailable:', err.message);
    content = offlineFallback(sanitized);
    onToken?.(content, content);
  }

  if (!content) {
    content = offlineFallback(sanitized);
    onToken?.(content, content);
  }

  return finishResult({ ageTier, userText, pre, content, sessionId });
}
