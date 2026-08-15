/** Sheller — Kali Shell tailor. Inspect child clothes, point the tear, sew. */

import { runShellBrain } from './shellBrain.js';
import { logJournal } from '../personalDeveloper/journal.js';
import { PERSONAL_DEVELOPER_ID } from '../personalDeveloper/agent.js';
import { KATSUR_CLOTHES, SHELLER_ID } from './clothes.js';

function clothesBlock() {
  return KATSUR_CLOTHES.map((c, i) => `${i + 1}. ${c}`).join('\n');
}

/** Sheller looks at the child — where is the problem? */
export async function inspectChildClothes({ work = '', history = [] } = {}) {
  const message = [
    'INSPECT the child. Look at how it is. Where is the problem?',
    '',
    'Katsur clothes (must fit):',
    clothesBlock(),
    work.trim()
      ? `\n--- Child work / sample ---\n${work.trim()}\n--- End sample ---`
      : '\nNo work sample — inspect the child identity and clothes only.',
  ].join('\n');

  const result = await runShellBrain({
    message,
    agentId: SHELLER_ID,
    history,
  });

  logJournal({
    action: 'sheller-inspect',
    summary: result.reply.slice(0, 500),
    agentId: SHELLER_ID,
  });

  return {
    action: 'inspect',
    clothes: KATSUR_CLOTHES,
    child: PERSONAL_DEVELOPER_ID,
    sheller: result.reply,
    brain: result.brain,
    model: result.model,
  };
}

/** Sew the clothes — stick the tear, give dressed child back. */
export async function sewChildClothes({ work = '', inspectNotes = '', history = [] } = {}) {
  let notes = inspectNotes.trim();
  if (!notes) {
    const inspected = await inspectChildClothes({ work, history });
    notes = inspected.sheller;
  }

  const message = [
    'SEW the clothes. Stick the problem. Think. Give the dressed child back.',
    '',
    'Inspect notes from Sheller:',
    notes,
    work.trim() ? `\n--- Child work to sew ---\n${work.trim()}\n--- End work ---` : '',
    '',
    'Return: (1) what you sewed (2) dressed child ready to run (3) still two, not one.',
  ].filter(Boolean).join('\n');

  const result = await runShellBrain({
    message,
    agentId: SHELLER_ID,
    history,
  });

  logJournal({
    action: 'sheller-sew',
    summary: result.reply.slice(0, 500),
    agentId: SHELLER_ID,
  });

  return {
    action: 'sew',
    clothes: KATSUR_CLOTHES,
    child: PERSONAL_DEVELOPER_ID,
    inspectNotes: notes,
    sewn: result.reply,
    brain: result.brain,
    model: result.model,
  };
}

export { KATSUR_CLOTHES, SHELLER_ID };
