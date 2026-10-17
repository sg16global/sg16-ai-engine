import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/index.js';

const KEY = 'test-key';

function makeEnv({ ai, extra } = {}) {
  const calls = [];
  return {
    calls,
    env: {
      CORE_API_KEYS: `other, ${KEY}`,
      CORE_MODEL: '@cf/mistral/mistral-7b-instruct-v0.2-lora',
      EXTRA_PROVIDERS: extra,
      AI: {
        async run(model, input) {
          calls.push({ model, input });
          return ai ? ai(model, input) : { response: `mistral says hi (${model})` };
        },
      },
    },
  };
}

function req(path, { method = 'POST', body, key = KEY, header = 'x-door-key' } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (key) headers[header] = header === 'authorization' ? `Bearer ${key}` : key;
  return new Request(`https://brain.test${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
}

async function call(env, path, options) {
  const res = await worker.fetch(req(path, options), env);
  return { res, data: res.headers.get('Content-Type')?.includes('json') ? await res.json() : await res.text() };
}

describe('auth', () => {
  it('ping is public', async () => {
    const { env } = makeEnv();
    const res = await worker.fetch(new Request('https://brain.test/api/v1/ping'), env);
    assert.equal(res.status, 200);
    assert.equal((await res.json()).status, 'ok');
  });
  it('rejects missing and wrong keys', async () => {
    const { env } = makeEnv();
    assert.equal((await call(env, '/api/v1/control', { body: { task: 'hi' }, key: null })).res.status, 401);
    assert.equal((await call(env, '/api/v1/control', { body: { task: 'hi' }, key: 'nope' })).res.status, 401);
  });
  it('fails closed when no keys are configured', async () => {
    const { env } = makeEnv();
    env.CORE_API_KEYS = '';
    assert.equal((await call(env, '/api/v1/control', { body: { task: 'hi' } })).res.status, 503);
  });
});

describe('/api/v1/control (SG16 backend contract)', () => {
  it('answers with Mistral 7B', async () => {
    const { env, calls } = makeEnv();
    const { res, data } = await call(env, '/api/v1/control', { body: { task: 'User: hello', user_text: 'hello' } });
    assert.equal(res.status, 200);
    assert.equal(data.status, 'ok');
    assert.match(data.answer, /mistral says hi/);
    assert.equal(data.provider, 'sg16-core');
    assert.equal(calls[0].model, '@cf/mistral/mistral-7b-instruct-v0.2-lora');
  });
  it('answers plain arithmetic from the math core without calling the model', async () => {
    const { env, calls } = makeEnv();
    const { data } = await call(env, '/api/v1/control', { body: { task: 'x', user_text: 'what is 17 * 23' } });
    assert.equal(data.answer, '**17 * 23 = 391**');
    assert.equal(data.provider, 'sg16-math-core');
    assert.equal(calls.length, 0);
  });
  it('gives Mistral the verified math result to explain', async () => {
    const { env, calls } = makeEnv();
    await call(env, '/api/v1/control', { body: { task: 'x', user_text: 'solve x^2 - 5x + 6 = 0' } });
    assert.match(calls[0].input.messages[0].content, /x = 2 or x = 3/);
  });
  it('falls back to add-on APIs only when the core fails', async () => {
    const realFetch = globalThis.fetch;
    let addonCalled = false;
    globalThis.fetch = async (url, init) => {
      addonCalled = true;
      assert.equal(url, 'https://addon.test/v1/chat/completions');
      assert.equal(init.headers.Authorization, 'Bearer sk-addon');
      return Response.json({ choices: [{ message: { content: 'addon answer' } }] });
    };
    try {
      const { env } = makeEnv({
        ai: () => {
          throw new Error('4006: daily free allocation used');
        },
        extra: JSON.stringify([{ name: 'addon', url: 'https://addon.test/v1', key: 'sk-addon', model: 'm' }]),
      });
      const { data } = await call(env, '/api/v1/control', { body: { task: 'hello' } });
      assert.equal(data.answer, 'addon answer');
      assert.equal(data.provider, 'addon:addon');
      assert.ok(addonCalled);
    } finally {
      globalThis.fetch = realFetch;
    }
  });
  it('still returns the math answer when every model is down', async () => {
    const { env } = makeEnv({
      ai: () => {
        throw new Error('down');
      },
    });
    const { data } = await call(env, '/api/v1/control', {
      body: { task: 'x', user_text: 'determinant of [[1,2],[3,4]]' },
    });
    assert.match(data.answer, /-2/);
    assert.equal(data.provider, 'sg16-math-core');
  });
  it('returns 503 with reasons when nothing can answer', async () => {
    const { env } = makeEnv({
      ai: () => {
        throw new Error('down');
      },
    });
    const { res, data } = await call(env, '/api/v1/control', { body: { task: 'tell me a story' } });
    assert.equal(res.status, 503);
    assert.match(data.failures[0], /down/);
  });
  it('validates the body', async () => {
    const { env } = makeEnv();
    assert.equal((await call(env, '/api/v1/control', { body: {} })).res.status, 400);
  });
});

describe('OpenAI-compatible API', () => {
  it('lists the core model', async () => {
    const { env } = makeEnv();
    const { data } = await call(env, '/v1/models', { method: 'GET', header: 'authorization' });
    assert.equal(data.data[0].id, 'sg16-core');
  });
  it('answers chat completions with a Bearer key', async () => {
    const { env } = makeEnv();
    const { data } = await call(env, '/v1/chat/completions', {
      header: 'authorization',
      body: { model: 'sg16-core', messages: [{ role: 'user', content: 'hi' }] },
    });
    assert.equal(data.object, 'chat.completion');
    assert.match(data.choices[0].message.content, /mistral says hi/);
  });
  it('streams as server-sent events when asked', async () => {
    const { env } = makeEnv();
    const { res, data } = await call(env, '/v1/chat/completions', {
      header: 'authorization',
      body: { stream: true, messages: [{ role: 'user', content: 'hi' }] },
    });
    assert.equal(res.headers.get('Content-Type'), 'text/event-stream');
    assert.match(data, /chat\.completion\.chunk/);
    assert.match(data, /data: \[DONE\]/);
  });
});

describe('/api/v1/math and /api/v1/vision', () => {
  it('computes math directly', async () => {
    const { env } = makeEnv();
    const { data } = await call(env, '/api/v1/math', { body: { input: 'inverse of [[4,7],[2,6]]' } });
    assert.equal(data.result, '[[0.6, -0.7], [-0.2, 0.4]]');
  });
  it('sends image bytes to the vision model', async () => {
    const { env, calls } = makeEnv({ ai: () => ({ description: 'a red square' }) });
    const { data } = await call(env, '/api/v1/vision', { body: { prompt: 'what is it', image_base64: btoa('abc') } });
    assert.equal(data.answer, 'a red square');
    assert.deepEqual(calls[0].input.image, [97, 98, 99]);
  });
});
