import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isDevStudioEnabled, studioRead, studioTree, studioWrite } from '../devStudio/files.js';

describe('Developer studio files', () => {
  it('is enabled outside production', () => {
    assert.equal(isDevStudioEnabled(), process.env.NODE_ENV !== 'production');
  });

  it('lists the repo and can read a known file', () => {
    const { tree } = studioTree(2);
    assert.ok(tree.some((n) => n.name === 'backend' || n.name === 'project'));
    const file = studioRead('backend/lib/devStudio/files.js');
    assert.match(file.content, /isDevStudioEnabled/);
  });

  it('rejects path escape', () => {
    assert.throws(() => studioRead('../etc/passwd'), /Invalid path|outside/);
    assert.throws(() => studioWrite('no-such-file.js', 'x'), /not found/i);
  });
});
