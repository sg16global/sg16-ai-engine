import { describe, it, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/worker.js';

const PAGES = {
  '/': '<title>app</title>',
  '/404': '<title>not found</title>',
  '/shield/': '<title>shield</title>',
  '/assets/app.js': 'console.log(1)',
};

const ASSETS = {
  async fetch(request) {
    const { pathname } = new URL(request.url);
    const body = PAGES[pathname];
    if (body === undefined) return new Response('missing', { status: 404 });
    const type = pathname.endsWith('.js') ? 'text/javascript' : 'text/html; charset=utf-8';
    return new Response(body, { headers: { 'Content-Type': type } });
  },
};

const env = (extra = {}) => ({ ASSETS, SHIELD_HOST: 'shield.sg16engine.com', BACKEND_URL: 'https://api.example.test', ...extra });
const realFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = realFetch;
});

describe('website pages', () => {
  it('serves the app for app routes with sign-in headers', async () => {
    for (const path of ['/', '/app', '/pricing/']) {
      const res = await worker.fetch(new Request(`https://sg16engine.com${path}`), env());
      assert.equal(res.status, 200, path);
      assert.match(await res.text(), /app/);
      assert.equal(res.headers.get('Cross-Origin-Opener-Policy'), 'same-origin-allow-popups');
      assert.equal(res.headers.get('Cache-Control'), 'no-cache');
    }
  });
  it('serves static files as they are', async () => {
    const res = await worker.fetch(new Request('https://sg16engine.com/assets/app.js'), env());
    assert.equal(res.status, 200);
    assert.equal(await res.text(), 'console.log(1)');
  });
  it('returns a real 404 page for unknown paths', async () => {
    const res = await worker.fetch(new Request('https://sg16engine.com/nope'), env());
    assert.equal(res.status, 404);
    assert.match(await res.text(), /not found/);
  });
  it('serves the shield landing page on the shield host', async () => {
    const res = await worker.fetch(new Request('https://shield.sg16engine.com/'), env());
    assert.match(await res.text(), /shield/);
    assert.equal((await worker.fetch(new Request('https://shield.sg16engine.com/app'), env())).status, 404);
  });
});

describe('backend forwarding', () => {
  it('forwards /api and /health to BACKEND_URL with client details', async () => {
    let seen;
    globalThis.fetch = async (url, init) => {
      seen = { url: String(url), init };
      return Response.json({ ok: true });
    };
    const res = await worker.fetch(
      new Request('https://sg16engine.com/api/v1/chat?x=1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer t', 'CF-Connecting-IP': '1.2.3.4' },
        body: '{"message":"hi"}',
      }),
      env(),
    );
    assert.equal(res.status, 200);
    assert.equal(seen.url, 'https://api.example.test/api/v1/chat?x=1');
    assert.equal(seen.init.method, 'POST');
    assert.equal(seen.init.headers.get('Authorization'), 'Bearer t');
    assert.equal(seen.init.headers.get('X-Forwarded-For'), '1.2.3.4');
    assert.equal(seen.init.headers.get('X-Forwarded-Host'), 'sg16engine.com');
    assert.equal(await new Response(seen.init.body).text(), '{"message":"hi"}');

    await worker.fetch(new Request('https://sg16engine.com/health'), env());
    assert.equal(seen.url, 'https://api.example.test/health');
  });
  it('returns 503 when BACKEND_URL is not set', async () => {
    const res = await worker.fetch(new Request('https://sg16engine.com/api/v1/billing/config'), env({ BACKEND_URL: '' }));
    assert.equal(res.status, 503);
    assert.match((await res.json()).error, /BACKEND_URL/);
  });
  it('returns 503 when the backend is down', async () => {
    globalThis.fetch = async () => {
      throw new TypeError('fetch failed');
    };
    const res = await worker.fetch(new Request('https://sg16engine.com/health'), env());
    assert.equal(res.status, 503);
  });
});

describe('backend container', () => {
  it('forwards /api to the container when BACKEND_URL is empty', async () => {
    let seen;
    const BACKEND = {
      idFromName: (name) => `id:${name}`,
      get: (id) => ({
        async fetch(request) {
          seen = { id, url: request.url, method: request.method, body: await request.text(), fwd: request.headers.get('X-Forwarded-Host') };
          return Response.json({ from: 'container' });
        },
      }),
    };
    const res = await worker.fetch(
      new Request('https://sg16engine.com/api/v1/chat?x=1', { method: 'POST', body: '{"m":1}' }),
      env({ BACKEND_URL: '', BACKEND }),
    );
    assert.deepEqual(await res.json(), { from: 'container' });
    assert.equal(seen.id, 'id:main');
    assert.equal(seen.url, 'http://backend.internal/api/v1/chat?x=1');
    assert.equal(seen.method, 'POST');
    assert.equal(seen.body, '{"m":1}');
    assert.equal(seen.fwd, 'sg16engine.com');
  });
  it('returns 503 while the container cannot start', async () => {
    const BACKEND = {
      idFromName: () => 'id',
      get: () => ({
        fetch: async () => {
          throw new Error('container not ready');
        },
      }),
    };
    const res = await worker.fetch(new Request('https://sg16engine.com/health'), env({ BACKEND_URL: '', BACKEND }));
    assert.equal(res.status, 503);
  });
  it('passes only known, non-empty secrets to the backend process', async () => {
    const { backendEnv } = await import('../src/backendEnv.js');
    const vars = backendEnv({ JWT_SECRET: ' s ', AI_MODEL: 'devstral', DATABASE_URL: '', GOOGLE_CLIENT_ID: 'g', UNRELATED: 'x' });
    assert.deepEqual(vars, { NODE_ENV: 'production', HOST: '0.0.0.0', PORT: '8000', JWT_SECRET: 's', AI_MODEL: 'devstral' });
  });
});

describe('admin settings', () => {
  const persisted = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url');

  it('stores settings the backend hands back and never shows them to the browser', async () => {
    let seenFlag;
    let stored;
    const BACKEND = {
      idFromName: () => 'id',
      get: () => ({
        async fetch(request) {
          seenFlag = request.headers.get('x-sg16-persist');
          return Response.json({ ok: true }, { headers: { 'X-SG16-Persist-Env': persisted({ AI_API_URL: 'http://1.2.3.4:11434/v1', AI_API_KEY: 'k' }) } });
        },
        async saveAdminEnv(changes) {
          stored = changes;
        },
      }),
    };
    const res = await worker.fetch(
      new Request('https://sg16engine.com/api/v1/admin/connection', { method: 'PUT', headers: { 'x-sg16-persist': '0' }, body: '{}' }),
      env({ BACKEND_URL: '', BACKEND }),
    );
    assert.equal(res.status, 200);
    assert.equal(seenFlag, '1');
    assert.deepEqual(stored, { AI_API_URL: 'http://1.2.3.4:11434/v1', AI_API_KEY: 'k' });
    assert.equal(res.headers.get('X-SG16-Persist-Env'), null);
  });

  it('does not let a browser ask other routes to hand back settings', async () => {
    let seenFlag = 'unset';
    let saved = false;
    const BACKEND = {
      idFromName: () => 'id',
      get: () => ({
        async fetch(request) {
          seenFlag = request.headers.get('x-sg16-persist');
          return Response.json({ ok: true }, { headers: { 'X-SG16-Persist-Env': persisted({ AI_API_KEY: 'x' }) } });
        },
        async saveAdminEnv() {
          saved = true;
        },
      }),
    };
    const res = await worker.fetch(
      new Request('https://sg16engine.com/api/v1/chat', { method: 'POST', headers: { 'x-sg16-persist': '1' }, body: '{}' }),
      env({ BACKEND_URL: '', BACKEND }),
    );
    assert.equal(seenFlag, null);
    assert.equal(saved, false);
    assert.equal(res.headers.get('X-SG16-Persist-Env'), null);
  });

  it('starts the backend with saved admin settings over deploy secrets', async () => {
    const { backendEnv, pickAdminEnv } = await import('../src/backendEnv.js');
    const vars = backendEnv(
      { JWT_SECRET: 's', AI_API_URL: 'https://old.example', ADMIN_PASSWORD_HASH: 'scrypt$old' },
      pickAdminEnv({ AI_API_URL: 'http://vps:11434/v1', ADMIN_PASSWORD_HASH: 'scrypt$new', JWT_SECRET: 'evil', AI_MODEL: 5 }),
    );
    assert.equal(vars.AI_API_URL, 'http://vps:11434/v1');
    assert.equal(vars.ADMIN_PASSWORD_HASH, 'scrypt$new');
    assert.equal(vars.JWT_SECRET, 's');
    assert.equal(vars.AI_MODEL, undefined);
  });
});
