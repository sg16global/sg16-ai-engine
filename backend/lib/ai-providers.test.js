import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it } from 'node:test';
import {
  callWithModelFallback,
  getApiProviders,
  getProviderChain,
  getProviderStatus,
  markProviderCooldown,
} from './sg16Provider.js';
import { getGenerationProfile, getModelChainForProfile } from './modelRouting.js';

const AI_ENV = /^(AI_API_URL|AI_API_KEY|AI_MODEL|AI_CODING_MODEL|AI_VISION_MODEL|AI_API_HEADERS)(_\d)?$/;
const realFetch = globalThis.fetch;

function clearAiEnv() {
  for (const key of Object.keys(process.env)) {
    if (AI_ENV.test(key)) delete process.env[key];
  }
}

/** Fake OpenAI-compatible servers: url → (body) => { status, json }. Records every request. */
function fakeFetch(routes) {
  const calls = [];
  globalThis.fetch = async (url, init) => {
    const body = JSON.parse(init.body);
    calls.push({ url, model: body.model, headers: init.headers });
    const route = Object.entries(routes).find(([prefix]) => url.startsWith(prefix));
    const { status = 200, json } = route ? route[1](body) : { status: 404, json: {} };
    return new Response(JSON.stringify(json), { status });
  };
  return calls;
}

const reply = (text) => ({ json: { choices: [{ message: { content: text } }] } });
const busy = () => ({ status: 429, json: { error: { message: 'rate limit reached' } } });

describe('AI connections (any company, automatic fallback)', () => {
  beforeEach(() => {
    clearAiEnv();
    for (const id of ['api', 'api2', 'api3']) markProviderCooldown(id, 0);
  });
  afterEach(() => {
    globalThis.fetch = realFetch;
    clearAiEnv();
  });

  it('reads slot 1 and fallback slots in order, each with its own chat and coding model', () => {
    process.env.AI_API_URL = 'https://own-models.example/v1';
    process.env.AI_MODEL = 'qwen3:4b-instruct-2507-q8_0';
    process.env.AI_CODING_MODEL = 'qwen2.5-coder:1.5b-instruct-fp16';
    process.env.AI_API_URL_3 = 'https://api.openai.com/v1/';
    process.env.AI_API_KEY_3 = 'sk-test';
    process.env.AI_MODEL_3 = 'gpt-4o-mini';

    const apis = getApiProviders();
    assert.deepEqual(apis.map((p) => p.id), ['api', 'api3']);
    assert.equal(apis[0].apiUrl, 'https://own-models.example/v1/chat/completions');
    assert.equal(apis[0].models.coding, 'qwen2.5-coder:1.5b-instruct-fp16');
    assert.equal(apis[1].models.coding, 'gpt-4o-mini', 'coding model defaults to the chat model');
    assert.deepEqual(getProviderChain().map((p) => p.id), ['api', 'api3']);

    const coding = getGenerationProfile('coding', 'code');
    const chat = getGenerationProfile('general', 'text');
    assert.deepEqual(getModelChainForProfile(coding, apis[0]), ['qwen2.5-coder:1.5b-instruct-fp16']);
    assert.deepEqual(getModelChainForProfile(chat, apis[0]), ['qwen3:4b-instruct-2507-q8_0']);
  });

  it('sends extra headers and ignores invalid header JSON', () => {
    process.env.AI_API_URL = 'https://own-models.example/v1';
    process.env.AI_API_HEADERS = '{"CF-Access-Client-Id":"id","CF-Access-Client-Secret":"secret"}';
    process.env.AI_API_URL_2 = 'https://api.groq.com/openai/v1';
    process.env.AI_API_HEADERS_2 = 'not json';
    const [first, second] = getApiProviders();
    assert.deepEqual(first.headers, { 'CF-Access-Client-Id': 'id', 'CF-Access-Client-Secret': 'secret' });
    assert.deepEqual(second.headers, {});
  });

  it('falls back to the next company when the first is busy, using that company\'s model', async () => {
    process.env.AI_API_URL = 'https://own-models.example/v1';
    process.env.AI_MODEL = 'qwen3:4b-instruct-2507-q8_0';
    process.env.AI_API_HEADERS = '{"X-Test":"1"}';
    process.env.AI_API_URL_2 = 'https://api.openai.com/v1';
    process.env.AI_API_KEY_2 = 'sk-test';
    process.env.AI_MODEL_2 = 'gpt-4o-mini';
    const calls = fakeFetch({ 'https://own-models.example': busy, 'https://api.openai.com': () => reply('hello from backup') });

    const profile = getGenerationProfile('general', 'text');
    const result = await callWithModelFallback({
      messages: [{ role: 'user', content: 'hi' }],
      modelsFor: (p) => getModelChainForProfile(profile, p),
    });

    assert.equal(result.content, 'hello from backup');
    assert.equal(result.provider, 'api2');
    assert.deepEqual(calls.map((c) => c.model), ['qwen3:4b-instruct-2507-q8_0', 'gpt-4o-mini']);
    assert.equal(calls[0].headers['X-Test'], '1');
    assert.equal(calls[1].headers.Authorization, 'Bearer sk-test');
  });

  it('shows the chat and coding model in the status', () => {
    process.env.AI_API_URL = 'https://own-models.example/v1';
    process.env.AI_MODEL = 'qwen3:4b-instruct-2507-q8_0';
    process.env.AI_CODING_MODEL = 'qwen2.5-coder:1.5b-instruct-fp16';
    const status = getProviderStatus();
    assert.equal(status.chatModel, 'qwen3:4b-instruct-2507-q8_0');
    assert.equal(status.codingModel, 'qwen2.5-coder:1.5b-instruct-fp16');
  });
});
