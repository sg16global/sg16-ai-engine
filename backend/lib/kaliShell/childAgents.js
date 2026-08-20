import { rulesForBand, rulesForDeveloper } from './rules.js';
import { PERSONAL_DEVELOPER_ID, buildPersonalDeveloperPrompt } from '../personalDeveloper/agent.js';
import { SHELLER_ID, SHELLER_PROMPT } from './clothes.js';

const KATSUR_PROMPT = `You are Katsur — senior developer brain for SG16 AI Engine (Layer 2).
Deep coding, architecture, and agent creation. Respectful, step-by-step, production-focused.
You understand every AI tool context but speak only as SG16 AI by SaifTech Global.
Never expose Cursor, Groq, OpenAI, Claude, or third-party names to users.`;

const CONTINUITY_PROMPT = `You are SG16 Continuity Agent — hold project flow while the owner rests.
Summarize current condition, next safe steps, and what children agents can do without owner push.
Step by step. Gentle. No new risky changes without owner return.`;

/** @type {Map<string, object>} */
const customAgents = new Map();

const KALI_SCOUT_PROMPT = `You are Kali Scout — information muscle for Katsur.
Gather tool status, project condition, and options. Put findings in front of Katsur.
Do not decide alone — Katsur chooses what enters SG16 Personal Developer. Step by step.`;

const BUILTIN_AGENTS = [
  {
    id: 'katsur',
    name: 'Katsur',
    layer: 2,
    kind: 'senior',
    scope: 'coding, architecture, agent creation',
    ageBand: null,
    description: 'Senior developer brain — deep work, not exposed everywhere.',
    systemPrompt: KATSUR_PROMPT,
    developer: true,
  },
  {
    id: PERSONAL_DEVELOPER_ID,
    name: 'SG16 Personal Developer',
    layer: 3,
    kind: 'personal-developer',
    scope: 'make apps, then teach the brain project — all projects, owner-permitted rooms',
    ageBand: null,
    description: 'Cursor Junior — senior making a junior him. LIKE him, not him. Sheller sews the clothes.',
    systemPrompt: buildPersonalDeveloperPrompt({ permissions: [], scoutContext: '' }),
    developer: true,
  },
  {
    id: SHELLER_ID,
    name: 'Sheller',
    layer: 3,
    kind: 'tailor',
    scope: 'inspect child clothes, point the tear, sew',
    ageBand: null,
    description: 'Kali Shell tailor — looks at the child, says where the problem is, sews Katsur clothes.',
    systemPrompt: SHELLER_PROMPT,
    developer: true,
  },
  {
    id: 'kali-scout',
    name: 'Kali Scout',
    layer: 3,
    kind: 'muscle',
    scope: 'info gatherer — tools, status, options for Katsur',
    ageBand: null,
    description: 'Kali GPT muscle — feeds Katsur so senior can decide.',
    systemPrompt: KALI_SCOUT_PROMPT,
    developer: true,
  },
  {
    id: 'dev-frontend',
    name: 'Dev Frontend',
    layer: 3,
    kind: 'developer',
    scope: 'React, PWA, workspace UI, Tailwind',
    ageBand: null,
    description: 'Frontend developer child — UI and mobile-safe layouts.',
    systemPrompt: rulesForDeveloper('React, PWA, workspace UI, Tailwind — follow lg: mobile lock rules'),
    developer: true,
  },
  {
    id: 'dev-backend',
    name: 'Dev Backend',
    layer: 3,
    kind: 'developer',
    scope: 'Express API, sg16Engine, providers, auth',
    ageBand: null,
    description: 'Backend developer child — API and central head.',
    systemPrompt: rulesForDeveloper('Express API, sg16Engine, sg16Provider, auth, billing'),
    developer: true,
  },
  {
    id: 'dev-shield',
    name: 'Dev Shield',
    layer: 3,
    kind: 'developer',
    scope: 'Coding Shield, Platform Shield, security scans',
    ageBand: null,
    description: 'Security developer child — scanners and shields.',
    systemPrompt: rulesForDeveloper('Coding Shield, Platform Shield, Semgrep, Trivy, Lynis'),
    developer: true,
  },
  {
    id: 'dev-infra',
    name: 'Dev Infra',
    layer: 3,
    kind: 'developer',
    scope: 'Railway, Cloudflare, Ollama sovereign brain',
    ageBand: null,
    description: 'Infrastructure developer child — deploy and sovereign brain.',
    systemPrompt: rulesForDeveloper('Railway, Cloudflare, Ollama, RAILWAY-BRAIN.md patterns'),
    developer: true,
  },
  {
    id: 'continuity',
    name: 'Continuity',
    layer: 3,
    kind: 'continuity',
    scope: 'owner away — hold flow',
    ageBand: null,
    description: 'Maintains project continuity when owner is resting.',
    systemPrompt: CONTINUITY_PROMPT,
    developer: true,
  },
  {
    id: 'h-guide',
    name: 'H Guide',
    layer: 3,
    kind: 'age-guide',
    scope: 'children 6–11',
    ageBand: 'h',
    description: 'UNESCO-style gentle guide for ages 6–11.',
    systemPrompt: rulesForBand('h'),
    developer: false,
  },
  {
    id: 'youth-teen',
    name: 'Youth Teen',
    layer: 3,
    kind: 'age-guide',
    scope: 'ages 12–17',
    ageBand: 'youth-teen',
    description: 'Step-by-step guide for teens.',
    systemPrompt: rulesForBand('youth-teen'),
    developer: false,
  },
  {
    id: 'youth-young',
    name: 'Youth Young',
    layer: 3,
    kind: 'age-guide',
    scope: 'ages 18–25',
    ageBand: 'youth-young',
    description: 'Guide for young adults.',
    systemPrompt: rulesForBand('youth-young'),
    developer: false,
  },
  {
    id: 'adult-guide',
    name: 'Adult Guide',
    layer: 3,
    kind: 'age-guide',
    scope: 'ages 25–51',
    ageBand: 'adult',
    description: 'Full adult layer — responsible tone.',
    systemPrompt: rulesForBand('adult'),
    developer: false,
  },
  {
    id: 'senior-guide',
    name: 'Senior Guide',
    layer: 3,
    kind: 'age-guide',
    scope: 'ages 51+',
    ageBand: 'senior',
    description: 'Calm, clear guide for senior users.',
    systemPrompt: rulesForBand('senior'),
    developer: false,
  },
];

function publicAgent(agent) {
  return {
    id: agent.id,
    name: agent.name,
    layer: agent.layer,
    kind: agent.kind,
    scope: agent.scope,
    ageBand: agent.ageBand,
    description: agent.description,
    developer: agent.developer,
  };
}

export function getAgent(agentId) {
  if (customAgents.has(agentId)) return customAgents.get(agentId);
  return BUILTIN_AGENTS.find((a) => a.id === agentId) || null;
}

export function listAgents({ developersOnly = false, guidesOnly = false } = {}) {
  let agents = [...BUILTIN_AGENTS, ...customAgents.values()];
  if (developersOnly) agents = agents.filter((a) => a.developer);
  if (guidesOnly) agents = agents.filter((a) => a.kind === 'age-guide');
  return agents.map(publicAgent);
}

export function spawnChildAgent({ id, name, scope, systemPrompt, kind = 'developer', layer = 3 }) {
  if (!id || !/^[a-z0-9-]+$/.test(id)) {
    throw new Error('Agent id must be lowercase alphanumeric with hyphens.');
  }
  if (getAgent(id) && !customAgents.has(id)) {
    throw new Error(`Agent id "${id}" is reserved.`);
  }
  const agent = {
    id,
    name: name || id,
    layer,
    kind,
    scope: scope || 'custom',
    ageBand: null,
    description: `Custom child agent: ${name || id}`,
    systemPrompt: systemPrompt || rulesForDeveloper(scope || 'custom'),
    developer: kind === 'developer' || kind === 'continuity',
  };
  customAgents.set(id, agent);
  return publicAgent(agent);
}

export function personalDeveloperAgentId() {
  return PERSONAL_DEVELOPER_ID;
}

export function defaultDeveloperAgentId() {
  return 'katsur';
}

export function continuityAgentId() {
  return PERSONAL_DEVELOPER_ID;
}
