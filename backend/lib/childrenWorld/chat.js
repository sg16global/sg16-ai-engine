import { callWithModelFallback } from '../sg16Provider.js';
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

export async function runChildrenWorldChat({ ageTier, message, nickname = '', sessionId = '' }) {
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

  const timeoutMs = Number(process.env.SG16_CHILDREN_CHAT_TIMEOUT_MS || 120000);
  const { content } = await callWithModelFallback({
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPayload },
    ],
    temperature: 0.6,
    maxTokens: 1024,
    timeoutMs,
  });

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

export function getChildrenWorldStatus() {
  return {
    service: 'sg16-children-world',
    tiers: VALID_AGE_TIERS,
    agents: KALI_AGENT_BY_TIER,
  };
}
