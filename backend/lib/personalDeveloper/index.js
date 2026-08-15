import { getMasterRules } from '../masterRules.js';
import { callWithModelFallback, isSovereignBrain } from '../sg16Provider.js';
import { getOwnerInsightBlock, isOwnerAway, getAwayInstructions, wakeOwner, getAwayStartedAt, ownerPush } from '../kaliShell/ownerState.js';
import {
  PERSONAL_DEVELOPER_ID,
  buildPersonalDeveloperPrompt,
  publicPersonalDeveloperInfo,
} from './agent.js';
import { getGrantedPermissions, permissionsBlock } from './permissions.js';
import { logJournal, getJournalSince } from './journal.js';
import { gatherScoutContext, scoutForKatsur } from './scouts.js';
import { runShellBrain } from '../kaliShell/shellBrain.js';

const SG16_SHELL_IDENTITY = `You are SG16 Kali Shell — own brain orchestration for SaifTech Global.
Step by step. Point by point. Gentle attitude always.`;

export async function getPersonalDeveloperStatus() {
  const scout = await scoutForKatsur();
  return {
    status: 'ok',
    developer: publicPersonalDeveloperInfo(),
    permissions: permissionsBlock(),
    ownerAway: isOwnerAway(),
    awayInstructions: getAwayInstructions() || null,
    scoutAt: scout.at,
    brain: isSovereignBrain() ? 'sovereign-ollama' : 'api-fallback',
  };
}

export async function runPersonalDeveloper({ message, history = [], delegatedBy = null }) {
  if (!message?.trim()) {
    throw new Error('Message is required.');
  }

  const scoutContext = await gatherScoutContext();
  const permissions = getGrantedPermissions();
  const systemPrompt = buildPersonalDeveloperPrompt({ permissions, scoutContext });
  const masterRules = getMasterRules();
  const ownerBlock = getOwnerInsightBlock();
  const awayNote = getAwayInstructions();

  const systemParts = [
    SG16_SHELL_IDENTITY,
    systemPrompt,
    masterRules ? `\n--- SG16 Master Rules ---\n${masterRules}` : '',
    ownerBlock,
    awayNote ? `\nOwner away instructions: ${awayNote}` : '',
    delegatedBy === 'katsur' ? '\nTask delegated from Katsur (senior) — execute and report back.' : '',
  ].filter(Boolean);

  const messages = [
    { role: 'system', content: systemParts.join('\n') },
    ...history.slice(-12).map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: message.trim() },
  ];

  const timeoutMs = Number(process.env.SG16_CHAT_TIMEOUT_MS || 120000);
  const { content, model, provider } = await callWithModelFallback({
    messages,
    temperature: 0.55,
    maxTokens: 4096,
    timeoutMs,
  });

  logJournal({
    action: delegatedBy ? 'delegated-run' : 'run',
    summary: `Task: ${message.slice(0, 200)} → ${content.slice(0, 300)}`,
    meta: { delegatedBy, model, provider },
  });

  return {
    reply: content,
    agent: publicPersonalDeveloperInfo(),
    brain: isSovereignBrain() ? 'mistral-ollama' : 'api',
    model,
    provider,
    ownerAway: isOwnerAway(),
    delegatedBy,
  };
}

/** Katsur delegates a task to SG16 Personal Developer. */
export async function delegateFromKatsur({ message, history = [] }) {
  if (isOwnerAway()) {
    return runPersonalDeveloper({ message, history, delegatedBy: 'katsur' });
  }
  return runPersonalDeveloper({ message, history, delegatedBy: 'katsur' });
}

/** Owner returns — Katsur asks children for full condition report. */
export async function getKatsurWakeReport({ clearAway = true } = {}) {
  const since = getAwayStartedAt() ? new Date(getAwayStartedAt()).toISOString() : null;
  const journal = getJournalSince(since);
  const scout = await scoutForKatsur();
  const permissions = permissionsBlock();

  let ownerState = null;
  if (clearAway) {
    ownerState = wakeOwner();
  }

  const reportPrompt = `You are Katsur receiving wake-up reports from SG16 Personal Developer and Kali scouts.
Summarize for the owner: condition, what ran while away, risks, next steps. Step by step. Bullet points.`;

  const reportBody = [
    '=== Wake report request ===',
    scout.context,
    '',
    `Journal entries while away: ${journal.length}`,
    ...journal.slice(0, 15).map((j) => `- [${j.at}] ${j.action}: ${j.summary.slice(0, 200)}`),
  ].join('\n');

  let katsurSummary = null;
  try {
    const result = await runShellBrain({
      message: `${reportPrompt}\n\n${reportBody}`,
      agentId: 'katsur',
      history: [],
    });
    katsurSummary = result.reply;
  } catch {
    katsurSummary = `Manual report: ${journal.length} journal entries. Scout at ${scout.at}.`;
  }

  logJournal({ action: 'wake-report', summary: katsurSummary?.slice(0, 500) || 'Wake report generated' });

  return {
    at: new Date().toISOString(),
    owner: ownerState,
    permissions,
    scout,
    journal,
    katsurSummary,
  };
}

export async function setOwnerAwayMode({ awayDays, awayNote, insight, auth, sub }) {
  const state = ownerPush({ insight, awayDays, awayNote, sub: sub || auth?.sub });
  logJournal({
    action: 'owner-away',
    summary: `Owner away ${awayDays} days. Instructions: ${awayNote || '(none)'}`,
  });
  return state;
}

export { scoutForKatsur, gatherScoutContext };
