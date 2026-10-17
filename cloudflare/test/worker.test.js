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
