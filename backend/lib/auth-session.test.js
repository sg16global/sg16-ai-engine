import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';
import { signSession, verifySession } from './auth.js';

const envSnapshot = { ...process.env };

describe('session token security', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret-for-unit-tests-only';
  });

  afterEach(() => {
    process.env = { ...envSnapshot };
  });

  it('throws when JWT_SECRET is missing', () => {
    delete process.env.JWT_SECRET;
    assert.throws(() => signSession({ sub: 'u1', signupDate: '2026-01-01' }), /JWT_SECRET is required/);
  });

  it('round-trips a valid session with embedded email', () => {
    const token = signSession({
      sub: 'user-123',
      signupDate: '2026-01-01',
      email: 'saif@saifglobal16.info',
      emailVerified: true,
    });
    const session = verifySession(token);
    assert.ok(session);
    assert.equal(session.email, 'saif@saifglobal16.info');
    assert.equal(session.emailVerified, true);
  });

  it('rejects tampered signature', () => {
    const token = signSession({ sub: 'user-123', signupDate: '2026-01-01' });
    const [data] = token.split('.');
    const bad = `${data}.forged-signature-value`;
    assert.equal(verifySession(bad), null);
  });

  it('rejects expired sessions', () => {
    const body = { sub: 'user-123', signupDate: '2026-01-01', exp: Date.now() - 1000 };
    const data = Buffer.from(JSON.stringify(body)).toString('base64url');
    const sig = crypto.createHmac('sha256', process.env.JWT_SECRET).update(data).digest('base64url');
    assert.equal(verifySession(`${data}.${sig}`), null);
  });
});
