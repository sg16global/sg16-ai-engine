#!/usr/bin/env node
/**
 * Checks that an SG16 backend is reachable and reports what is configured.
 *
 *   npm run api:check                          -> http://localhost:8000
 *   npm run api:check -- https://sg16engine.com
 */
const base = (process.argv[2] || process.env.SG16_API_URL || 'http://localhost:8000').replace(/\/+$/, '');

async function get(path, timeoutMs = 60_000) {
  const started = Date.now();
  try {
    const res = await fetch(base + path, { signal: AbortSignal.timeout(timeoutMs) });
    const text = await res.text();
    let json = null;
    try {
      json = JSON.parse(text);
    } catch {
      /* not JSON */
    }
    return { ok: res.ok && json !== null, status: res.status, json, ms: Date.now() - started };
  } catch (err) {
    return { ok: false, status: 0, json: null, ms: Date.now() - started, error: err.cause?.code || err.message };
  }
}

const mark = (ok) => (ok ? '\x1b[32m✔\x1b[0m' : '\x1b[31m✘\x1b[0m');

async function main() {
  console.log(`SG16 API check → ${base}\n`);

  const health = await get('/health');
  console.log(`${mark(health.ok)} /health                ${health.status || health.error} (${health.ms}ms)`);
  if (!health.ok) {
    console.log(
      `\nBackend is not reachable. Start it with "npm run dev" (or "npm run dev:backend"),` +
        ` or pass a deployed URL: npm run api:check -- https://sg16engine.com`,
    );
    return false;
  }

  const h = health.json;
  const providers = h.providers && typeof h.providers === 'object' ? h.providers : {};
  console.log(`    brain:        ${h.brain ?? 'unknown'}`);
  console.log(`    database:     ${typeof h.database === 'object' ? JSON.stringify(h.database) : h.database}`);
  console.log(`    live search:  ${h.liveSearch ?? 'unknown'}`);
  if (Object.keys(providers).length) console.log(`    providers:    ${JSON.stringify(providers)}`);

  const billing = await get('/api/v1/billing/config');
  console.log(`${mark(billing.ok)} /api/v1/billing/config ${billing.status} — launch free: ${billing.json?.launchFree ?? 'unknown'}`);

  const shield = await get('/api/v1/coding-shield/health');
  console.log(`${mark(shield.ok)} /api/v1/coding-shield  ${shield.status}`);

  // /health/deep sends one tiny prompt to the configured AI, so this shows whether chat really works.
  // Self-hosted brains can take ~45 s to wake, so allow a long wait here.
  const deep = await get('/health/deep', 180_000);
  const brainChat = deep.json?.brainChat;
  const aiOk = brainChat?.ok === true;
  const aiDetail = brainChat
    ? aiOk
      ? `answered with ${brainChat.model ?? 'model'} in ${brainChat.latencyMs}ms`
      : `FAILED — ${brainChat.error}`
    : deep.ok
      ? 'no AI configured (set AI_API_URL / AI_API_KEY, plus AI_MODEL for OpenAI-compatible APIs)'
      : `/health/deep did not answer (${deep.status || deep.error})`;
  console.log(`${mark(aiOk)} AI chat                ${aiDetail}`);

  const allOk = billing.ok && shield.ok && aiOk;
  console.log(allOk ? '\nEverything responds, including the AI. The app can connect.' : '\nSome checks failed — see above.');
  return allOk;
}

// exitCode instead of process.exit(): exiting with fetch sockets still open crashes Node on Windows.
process.exitCode = (await main()) ? 0 : 1;
