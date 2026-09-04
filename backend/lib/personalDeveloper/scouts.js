/** Kali shell scouts — gather info/tools for Katsur to decide what enters Personal Developer. */

import { isCloudMistralBrain, isSovereignBrain, getProviderStatus } from '../sg16Provider.js';
import { isMasterRulesLoaded } from '../masterRules.js';
import { getOwnerState, getAwayInstructions } from '../kaliShell/ownerState.js';
import { getPlatformToolStatus } from '../platformShield/index.js';
import { checkDatabaseHealth, isDatabaseReady } from '../db/index.js';
import { permissionsBlock } from './permissions.js';
import { getJournalSummary } from './journal.js';

export async function gatherScoutContext() {
  const parts = [];

  parts.push(`Brain: ${isCloudMistralBrain() ? 'mistralbrain-cloud (own)' : isSovereignBrain() ? 'ollama (own)' : 'unconfigured'}`);
  parts.push(`Master rules: ${isMasterRulesLoaded() ? 'loaded' : 'missing'}`);

  const owner = getOwnerState();
  parts.push(`Owner away: ${owner.away ? 'yes' : 'no'}`);
  if (owner.away && owner.awayUntil) parts.push(`Away until: ${owner.awayUntil}`);
  const awayNote = getAwayInstructions();
  if (awayNote) parts.push(`Away instructions: ${awayNote}`);

  const perms = permissionsBlock();
  parts.push(`PD permissions granted: ${perms.granted.join(', ') || 'none'}`);
  if (perms.denied.length) parts.push(`PD permissions locked: ${perms.denied.join(', ')}`);

  try {
    const db = await checkDatabaseHealth();
    parts.push(`Database: ${db.ok ? 'ok' : 'issue'} (${isDatabaseReady() ? 'postgres' : 'json fallback'})`);
  } catch {
    parts.push('Database: check failed');
  }

  try {
    const providers = getProviderStatus();
    parts.push(`Providers: primary=${providers.primary || 'none'}, chain=${(providers.chain || []).join(' → ')}`);
  } catch {
    parts.push('Providers: status unavailable');
  }

  try {
    const platform = await getPlatformToolStatus();
    parts.push(`Platform Shield: ${platform.ready ? 'ready' : 'partial'} (trivy=${platform.clis.trivy}, lynis=${platform.clis.lynis})`);
  } catch {
    parts.push('Platform Shield: unavailable on this host');
  }

  const recent = getJournalSummary(5);
  if (recent.length) {
    parts.push('Recent PD journal:');
    for (const j of recent) {
      parts.push(`  [${j.at}] ${j.action}: ${j.summary.slice(0, 120)}`);
    }
  }

  return parts.join('\n');
}

export async function scoutForKatsur() {
  const context = await gatherScoutContext();
  return {
    at: new Date().toISOString(),
    context,
    purpose: 'Kali scout — info for Katsur to decide tools/tasks for Personal Developer',
  };
}
