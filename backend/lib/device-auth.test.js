import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { handleDeviceAuth, verifySession } from './auth.js';
import { handleGetUserHistory, handleGetUserRoom, handlePutUserHistory } from './userRoom.js';

const envSnapshot = { ...process.env };

function fakeRes() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}

describe('device sessions (no Google sign-in)', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret-for-unit-tests-only';
  });
  afterEach(() => {
    process.env = { ...envSnapshot };
  });

  it('issues an anonymous session for a valid device id', async () => {
    const res = fakeRes();
    await handleDeviceAuth({ body: { deviceId: '3f2b9c1e-7a44-4d0b-9e2f-1c6a5b8d7e90' } }, res);
    assert.equal(res.statusCode, 200);
    const session = verifySession(res.body.token);
    assert.equal(session.sub, 'device-3f2b9c1e-7a44-4d0b-9e2f-1c6a5b8d7e90');
    assert.equal(session.device, true);
    assert.equal(session.email, undefined);
    assert.equal(res.body.user.id, session.sub);
  });

  it('rejects missing or malformed device ids', async () => {
    for (const deviceId of [undefined, '', 'short', '../../etc/passwd-aaaaaaaaaaaa', 'x'.repeat(65)]) {
      const res = fakeRes();
      await handleDeviceAuth({ body: { deviceId } }, res);
      assert.equal(res.statusCode, 400, String(deviceId));
    }
  });

  it('never stores or returns chat history for device sessions', async () => {
    const auth = { sub: 'device-abc', device: true };
    for (const handler of [handleGetUserRoom, handleGetUserHistory, handlePutUserHistory]) {
      const res = fakeRes();
      await handler({ auth, body: { chatHistory: { general: [] } } }, res);
      assert.equal(res.statusCode, 403);
      assert.equal(res.body.code, 'DEVICE_ONLY');
    }
  });
});
