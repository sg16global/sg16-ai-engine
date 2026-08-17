import { listAgents, spawnChildAgent, getAgent } from './childAgents.js';
import { getOwnerState, ownerPush, isOwnerEmail, isOwnerAway } from './ownerState.js';
import { runShellBrain, getShellBrainStatus } from './shellBrain.js';
import { inspectChildClothes, sewChildClothes } from './sheller.js';
import { isSovereignBrain } from '../sg16Provider.js';
import { isMasterRulesLoaded } from '../masterRules.js';
import { emailFromVerifiedAuth } from './internalMode.js';

export async function getKaliShellStatus() {
  const brain = await getShellBrainStatus();
  const agents = listAgents();
  const developers = listAgents({ developersOnly: true });
  const guides = listAgents({ guidesOnly: true });
  const owner = getOwnerState();

  return {
    status: 'ok',
    platform: 'SG16 Kali Shell',
    layer: {
      owner: 1,
      katsur: 2,
      children: 3,
    },
    brain: brain.brain,
    sovereign: isSovereignBrain(),
    centralRules: isMasterRulesLoaded() ? 'loaded' : 'missing',
    owner,
    agents: {
      total: agents.length,
      developers: developers.length,
      ageGuides: guides.length,
    },
    ready: isMasterRulesLoaded(),
  };
}

export async function runKaliShell({ message, agentId, history, auth }) {
  if (isOwnerAway() && agentId === 'katsur') {
    const err = new Error('Katsur sleeps when owner is away — use SG16 Personal Developer (sg16-personal-developer).');
    err.code = 'OWNER_AWAY';
    throw err;
  }
  return runShellBrain({ message, agentId, history });
}

export async function pushOwnerInsight({ insight, awayDays, awayNote, auth }) {
  const email = emailFromVerifiedAuth(auth);
  if (!isOwnerEmail(email)) {
    const err = new Error('Owner push requires the owner account.');
    err.code = 'OWNER_ONLY';
    throw err;
  }
  return ownerPush({ insight, awayDays, awayNote, sub: auth?.sub });
}

export async function registerChildAgent(payload, auth) {
  const email = emailFromVerifiedAuth(auth);
  if (!isOwnerEmail(email)) {
    const err = new Error('Spawning agents requires the owner account.');
    err.code = 'OWNER_ONLY';
    throw err;
  }
  return spawnChildAgent(payload);
}

export function getAgentsList(filter) {
  return listAgents(filter);
}

export function resolveAgent(agentId) {
  return getAgent(agentId);
}

export { inspectChildClothes, sewChildClothes };
