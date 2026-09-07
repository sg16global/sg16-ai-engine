import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { isSpaPath, normaliseSpaPath } from './spaRoutes.js';

describe('spaRoutes', () => {
  it('accepts the documented client routes', () => {
    for (const path of ['/', '/app', '/welcome', '/pricing', '/terms', '/privacy', '/contact', '/license', '/room', '/settings', '/help']) {
      assert.equal(isSpaPath(path), true, path);
    }
  });

  it('treats a trailing slash as the same route', () => {
    assert.equal(isSpaPath('/pricing/'), true);
    assert.equal(normaliseSpaPath('/app/'), '/app');
  });

  it('rejects unknown paths', () => {
    assert.equal(isSpaPath('/definitely-not-real-99999'), false);
    assert.equal(isSpaPath('/wp-admin'), false);
    assert.equal(isSpaPath('/app/nope'), false);
  });
});
