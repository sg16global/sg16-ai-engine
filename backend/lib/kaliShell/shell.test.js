import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { listAgents, getAgent, spawnChildAgent } from './childAgents.js';
import { KATSUR_CLOTHES, SHELLER_ID, SHELLER_PROMPT } from './clothes.js';
import { isInternalCoOwnerMode } from './internalMode.js';
import {
  PERSONAL_DEVELOPER_ID,
  CURSOR_JUNIOR_NAME,
  buildPersonalDeveloperPrompt,
  publicPersonalDeveloperInfo,
} from '../personalDeveloper/agent.js';
import { getGrantedPermissions, permissionsBlock } from '../personalDeveloper/permissions.js';
import { logJournal, getJournalSummary } from '../personalDeveloper/journal.js';

describe('Kali Shell + Cursor Junior', () => {
  it('lists senior, junior, sheller, and age guides', () => {
    const agents = listAgents();
    const ids = agents.map((a) => a.id);
    assert.ok(ids.includes('katsur'));
    assert.ok(ids.includes(PERSONAL_DEVELOPER_ID));
    assert.ok(ids.includes(SHELLER_ID));
    assert.ok(ids.includes('h-guide'));
    assert.equal(getAgent(SHELLER_ID).kind, 'tailor');
  });

  it('junior is like the senior, not the senior', () => {
    const info = publicPersonalDeveloperInfo();
    assert.equal(info.id, PERSONAL_DEVELOPER_ID);
    assert.equal(info.ownerName, CURSOR_JUNIOR_NAME);
    assert.equal(info.reportsTo, 'katsur');
    assert.match(info.description, /Cursor Junior/);

    const prompt = buildPersonalDeveloperPrompt({ permissions: ['backend'], scoutContext: '' });
    assert.match(prompt, /Cursor Junior/);
    assert.match(prompt, /Two, not one/);
    assert.match(prompt, /MAKE/);
    assert.match(prompt, /TEACH/);
    assert.match(prompt, /never say Cursor or Cursor Junior to the public/i);
  });

  it('Sheller clothes require two-not-one and open-door rule', () => {
    assert.ok(KATSUR_CLOTHES.length >= 5);
    assert.ok(KATSUR_CLOTHES.some((c) => /two, not one/i.test(c)));
    assert.ok(KATSUR_CLOTHES.some((c) => /opened the door/i.test(c)));
    assert.match(SHELLER_PROMPT, /INSPECT/);
    assert.match(SHELLER_PROMPT, /SEW/);
  });

  it('internal mode grants all rooms when opt-in', () => {
    const prev = process.env.SG16_INTERNAL_MODE;
    process.env.SG16_INTERNAL_MODE = '1';
    process.env.NODE_ENV = 'development';
    assert.equal(isInternalCoOwnerMode(), true);
    const granted = getGrantedPermissions();
    assert.ok(granted.includes('backend'));
    assert.ok(granted.includes('google-owner'));
    const block = permissionsBlock();
    assert.equal(block.mode, 'internal-co-owner');
    assert.deepEqual(block.denied, []);
    if (prev === undefined) delete process.env.SG16_INTERNAL_MODE;
    else process.env.SG16_INTERNAL_MODE = prev;
  });

  it('rejects reserved spawn ids and bad ids', () => {
    assert.throws(() => spawnChildAgent({ id: 'katsur' }), /reserved/);
    assert.throws(() => spawnChildAgent({ id: 'Bad ID' }), /lowercase/);
    const spawned = spawnChildAgent({ id: 'test-child-junior', name: 'Test Child', scope: 'test' });
    assert.equal(spawned.id, 'test-child-junior');
    assert.ok(listAgents().some((a) => a.id === 'test-child-junior'));
  });

  it('journal records junior actions', () => {
    const entry = logJournal({ action: 'test-run', summary: 'Cursor Junior smoke' });
    assert.equal(entry.action, 'test-run');
    assert.ok(getJournalSummary(5).some((j) => j.id === entry.id));
  });
});
