import { getMasterRules } from '../masterRules.js';
import { callWithModelFallback, isCloudMistralBrain, isSovereignBrain } from '../sg16Provider.js';
import { getAgent, defaultDeveloperAgentId, continuityAgentId } from './childAgents.js';
import { getOwnerInsightBlock, isOwnerAway, getAwayInstructions } from './ownerState.js';
import { PERSONAL_DEVELOPER_ID, buildPersonalDeveloperPrompt } from '../personalDeveloper/agent.js';

const SG16_SHELL_IDENTITY = `You are SG16 Kali Shell — own brain orchestration for Saif Tech Global LLC.
All responses present as SG16 AI. Step by step. Point by point. Gentle attitude always.`;

export async function runShellBrain({ message, agentId, history = [] }) {
  if (!message?.trim()) {
    throw new Error('Message is required.');
  }

  let resolvedId = agentId?.trim() || defaultDeveloperAgentId();
  if (isOwnerAway() && !agentId) {
    resolvedId = continuityAgentId();
  }

  const agent = getAgent(resolvedId);
  if (!agent) {
    throw new Error(`Unknown agent: ${resolvedId}`);
  }

  let agentPrompt = agent.systemPrompt;
  if (resolvedId === PERSONAL_DEVELOPER_ID) {
    const { gatherScoutContext } = await import('../personalDeveloper/scouts.js');
    const { getGrantedPermissions } = await import('../personalDeveloper/permissions.js');
    agentPrompt = buildPersonalDeveloperPrompt({
      permissions: getGrantedPermissions(),
      scoutContext: await gatherScoutContext(),
    });
  }

  const masterRules = getMasterRules();
  const ownerBlock = getOwnerInsightBlock();
  const awayNote = getAwayInstructions();

  const systemParts = [
    SG16_SHELL_IDENTITY,
    agentPrompt,
    masterRules ? `\n--- SG16 Master Rules ---\n${masterRules}` : '',
    ownerBlock,
    isOwnerAway()
      ? `\nOwner is away — SG16 Personal Developer holds flow.${awayNote ? ` Instructions: ${awayNote}` : ''}`
      : '',
  ].filter(Boolean);

  const messages = [
    { role: 'system', content: systemParts.join('\n') },
    ...history.slice(-12).map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: message.trim() },
  ];

  const timeoutMs = Number(process.env.SG16_CHAT_TIMEOUT_MS || 120000);
  const { content, model, provider } = await callWithModelFallback({
    messages,
    temperature: 0.6,
    maxTokens: 2048,
    timeoutMs,
  });

  return {
    reply: content,
    agent: {
      id: agent.id,
      name: agent.name,
      layer: agent.layer,
      kind: agent.kind,
    },
    brain: isCloudMistralBrain() ? 'mistralbrain-cloud' : isSovereignBrain() ? 'mistral-ollama' : 'api',
    model,
    provider,
    ownerAway: isOwnerAway(),
  };
}

export async function getShellBrainStatus() {
  return {
    platform: 'SG16 Kali Shell',
    brain: isCloudMistralBrain() ? 'mistralbrain-cloud' : isSovereignBrain() ? 'sovereign-ollama' : 'api-fallback',
    masterRules: getMasterRules().length > 0 ? 'loaded' : 'missing',
  };
}
