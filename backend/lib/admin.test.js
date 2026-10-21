import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { before, describe, it } from 'node:test';

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sg16-admin-'));
process.env.SG16_ADMIN_CONFIG_FILE = path.join(tmp, 'admin-config.json');
process.env.JWT_SECRET = 'test-secret-for-admin';
delete process.env.ADMIN_EMAIL;

const admin = await import('./admin.js');

function call(handler, { body = {}, headers = {}, query = {} } = {}) {
  return new Promise((resolve) => {
    const res = {
      statusCode: 200,
      headers: {},
      status(code) { this.statusCode = code; return this; },
      set(name, value) { this.headers[name.toLowerCase()] = value; return this; },
      json(data) { resolve({ status: this.statusCode, body: data, headers: this.headers }); },
    };
    const req = { body, query, headers, get: (h) => headers[h.toLowerCase()] };
    handler(req, res);
  });
}

describe('admin login', () => {
  before(() => {
    process.env.ADMIN_PASSWORD_HASH = admin.hashPassword('correct horse battery');
  });

  it('hashes passwords and checks them', () => {
    const hash = admin.hashPassword('s3cret-pass-123');
    assert.match(hash, /^scrypt\$/);
    assert.equal(admin.verifyPassword('s3cret-pass-123', hash), true);
    assert.equal(admin.verifyPassword('wrong', hash), false);
    assert.equal(admin.verifyPassword('s3cret-pass-123', 'garbage'), false);
  });

  it('logs in with the default owner email, any letter case', async () => {
    const res = await call(admin.handleAdminLogin, { body: { email: ' SG16Global@gmail.com ', password: 'correct horse battery' } });
    assert.equal(res.status, 200);
    assert.ok(admin.verifyAdminToken(res.body.token));
  });

  it('rejects a wrong password or email with the same message', async () => {
    const a = await call(admin.handleAdminLogin, { body: { email: 'sg16global@gmail.com', password: 'nope' } });
    const b = await call(admin.handleAdminLogin, { body: { email: 'other@gmail.com', password: 'correct horse battery' } });
    assert.equal(a.status, 401);
    assert.equal(b.status, 401);
    assert.equal(a.body.error, b.body.error);
  });

  it('does not accept a user session or a tampered token as admin', () => {
    const token = admin.signAdminToken();
    const [data, sig] = token.split('.');
    const forged = Buffer.from(JSON.stringify({ ...JSON.parse(Buffer.from(data, 'base64url')), exp: Date.now() + 1e12 })).toString('base64url');
    assert.equal(admin.verifyAdminToken(`${forged}.${sig}`), null);
    assert.equal(admin.verifyAdminToken('abc.def'), null);
  });

  it('refuses login when no password hash is configured', async () => {
    const saved = process.env.ADMIN_PASSWORD_HASH;
    delete process.env.ADMIN_PASSWORD_HASH;
    const res = await call(admin.handleAdminLogin, { body: { email: 'sg16global@gmail.com', password: 'x' } });
    process.env.ADMIN_PASSWORD_HASH = saved;
    assert.equal(res.status, 503);
  });
});

describe('admin settings', () => {
  it('changes the password, signs out old tokens, and hands the hash to the Worker', async () => {
    process.env.ADMIN_PASSWORD_HASH = admin.hashPassword('first-password-1');
    const oldToken = admin.signAdminToken();
    const res = await call(admin.handleAdminChangePassword, {
      body: { current: 'first-password-1', next: 'second-password-2' },
      headers: { 'x-sg16-persist': '1' },
    });
    assert.equal(res.status, 200);
    assert.equal(admin.verifyAdminToken(oldToken), null);
    assert.ok(admin.verifyAdminToken(res.body.token));
    const persisted = JSON.parse(Buffer.from(res.headers['x-sg16-persist-env'], 'base64url').toString());
    assert.ok(admin.verifyPassword('second-password-2', persisted.ADMIN_PASSWORD_HASH));
  });

  it('rejects a short new password or a wrong current one', async () => {
    process.env.ADMIN_PASSWORD_HASH = admin.hashPassword('first-password-1');
    assert.equal((await call(admin.handleAdminChangePassword, { body: { current: 'bad', next: 'long-enough-pass' } })).status, 401);
    assert.equal((await call(admin.handleAdminChangePassword, { body: { current: 'first-password-1', next: 'short' } })).status, 400);
  });

  it('saves the AI connection, keeps the key when left blank, and never returns the key', async () => {
    const first = await call(admin.handleAdminSaveConnection, {
      body: { url: 'http://10.0.0.5:11434/v1', key: 'sk-secret-1234', model: 'mistral:7b', test: false },
    });
    assert.equal(first.status, 200);
    assert.equal(process.env.AI_API_URL, 'http://10.0.0.5:11434/v1');
    assert.equal(first.body.ai.keyHint, '••••1234');
    assert.equal(JSON.stringify(first.body).includes('sk-secret-1234'), false);
    assert.equal(first.headers['x-sg16-persist-env'], undefined, 'only sent when the Worker asks');

    await call(admin.handleAdminSaveConnection, { body: { url: 'http://10.0.0.6:11434/v1', key: '', model: 'llama3', test: false } });
    assert.equal(process.env.AI_API_KEY, 'sk-secret-1234');
    assert.equal(process.env.AI_MODEL, 'llama3');

    const saved = JSON.parse(fs.readFileSync(process.env.SG16_ADMIN_CONFIG_FILE, 'utf8'));
    assert.equal(saved.AI_API_URL, 'http://10.0.0.6:11434/v1');
  });

  it('rejects URLs that are not http(s)', async () => {
    const res = await call(admin.handleAdminSaveConnection, { body: { url: 'file:///etc/passwd', test: false } });
    assert.equal(res.status, 400);
  });

  it('re-applies saved settings on startup', () => {
    process.env.AI_API_URL = 'https://from-deploy.example';
    admin.applySavedAdminConfig();
    assert.equal(process.env.AI_API_URL, 'http://10.0.0.6:11434/v1');
  });
});
