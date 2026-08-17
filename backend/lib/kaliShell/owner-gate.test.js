import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { isInternalCoOwnerMode, isOwnerAllowed, emailFromVerifiedAuth } from './internalMode.js';

const envSnapshot = { ...process.env };

describe('owner gate (fail-closed)', () => {
  beforeEach(() => {
    delete process.env.SG16_INTERNAL_MODE;
    delete process.env.SG16_MARKET_MODE;
    delete process.env.SG16_OWNER_EMAIL;
    process.env.NODE_ENV = 'test';
  });

  afterEach(() => {
    process.env = { ...envSnapshot };
  });

  it('denies everyone when SG16_OWNER_EMAIL is unset', () => {
    assert.equal(isOwnerAllowed('boss@sg16engine.com'), false);
    assert.equal(isOwnerAllowed('saif@saifglobal16.info'), false);
  });

  it('allows only exact owner email match', () => {
    process.env.SG16_OWNER_EMAIL = 'saif@saifglobal16.info';
    assert.equal(isOwnerAllowed('saif@saifglobal16.info'), true);
    assert.equal(isOwnerAllowed('boss@evil.com'), false);
    assert.equal(isOwnerAllowed('saif@sg16engine.com.evil.com'), false);
    assert.equal(isOwnerAllowed('SAIF@saifglobal16.info'), true);
  });

  it('rejects internal mode in production', () => {
    process.env.NODE_ENV = 'production';
    process.env.SG16_INTERNAL_MODE = '1';
    assert.equal(isInternalCoOwnerMode(), false);
    process.env.SG16_OWNER_EMAIL = 'saif@saifglobal16.info';
    assert.equal(isOwnerAllowed('random@gmail.com'), false);
  });

  it('internal mode is opt-in in non-production', () => {
    process.env.NODE_ENV = 'development';
    assert.equal(isInternalCoOwnerMode(), false);
    process.env.SG16_INTERNAL_MODE = '1';
    assert.equal(isInternalCoOwnerMode(), true);
  });

  it('trusts only verified email in session token', () => {
    assert.equal(emailFromVerifiedAuth({ email: 'saif@saifglobal16.info' }), null);
    assert.equal(
      emailFromVerifiedAuth({ email: 'saif@saifglobal16.info', emailVerified: true }),
      'saif@saifglobal16.info',
    );
    assert.equal(emailFromVerifiedAuth({ email: '  boss@test.com  ', emailVerified: true }), 'boss@test.com');
  });
});
