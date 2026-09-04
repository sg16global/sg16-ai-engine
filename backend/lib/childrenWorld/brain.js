import {
  callMistralBrainChat,
  isMistralBrainConfigured,
  pingMistralBrain,
} from '../mistralBrainClient.js';

const USER_ID = 'sg16-children-world';

export function isChildrenBrainReady() {
  return isMistralBrainConfigured();
}

export async function pingChildrenBrain() {
  const started = Date.now();
  try {
    const data = await pingMistralBrain();
    return {
      ok: data?.status === 'ok',
      latencyMs: Date.now() - started,
      brain: 'mistralbrain-cloud',
      url: process.env.MISTRAL_BRAIN_URL || 'https://api.mistralbrain.com',
    };
  } catch (err) {
    return {
      ok: false,
      latencyMs: Date.now() - started,
      brain: 'mistralbrain-cloud',
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function chatChildrenBrain({ messages, timeoutMs = 120000 }) {
  return callMistralBrainChat({
    messages,
    userId: USER_ID,
    timeoutMs,
  });
}

export async function streamChildrenBrain({ messages, onToken, timeoutMs = 120000 }) {
  const content = await chatChildrenBrain({ messages, timeoutMs });
  if (onToken) {
    let partial = '';
    for (const chunk of content.split(/(\s+)/)) {
      partial += chunk;
      onToken(chunk, partial);
    }
  }
  return content;
}
