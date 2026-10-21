/**
 * SG16 admin panel API: owner login, live status and the AI connection settings.
 *
 * - Login: ADMIN_EMAIL (default sg16global@gmail.com) + a password checked against ADMIN_PASSWORD_HASH
 *   (scrypt; make one with `npm run admin:hash --prefix backend`). The password itself is never stored.
 * - Settings saved here (AI_API_URL, AI_API_KEY, AI_MODEL, AI_VISION_MODEL, ADMIN_PASSWORD_HASH) apply at once
 *   and are written to data/admin-config.json. On Cloudflare that disk is wiped on restart, so the Worker
 *   also keeps them in the container's Durable Object (see cloudflare/src/backend.js) — the response header
 *   PERSIST_HEADER carries them to the Worker, which strips it before the browser sees the response.
 */
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildApiProvider, getApiProvider, getPrimaryProvider, probeApiChat } from './sg16Provider.js';
import { checkDatabaseHealth } from './db/index.js';
import { liveSearchAvailable } from './webSearch.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONFIG_FILE = process.env.SG16_ADMIN_CONFIG_FILE || path.join(__dirname, '..', 'data', 'admin-config.json');

export const PERSIST_HEADER = 'X-SG16-Persist-Env';
/** Set by the Cloudflare Worker on forwarded requests: it will store PERSIST_HEADER for restarts. */
export const PERSIST_REQUEST_HEADER = 'x-sg16-persist';

/** Settings the admin panel may change. */
export const ADMIN_ENV_KEYS = ['AI_API_URL', 'AI_API_KEY', 'AI_MODEL', 'AI_VISION_MODEL', 'ADMIN_PASSWORD_HASH'];

const DEFAULT_ADMIN_EMAIL = 'sg16global@gmail.com';
const TOKEN_TTL_MS = 12 * 60 * 60 * 1000;
const MIN_PASSWORD_LENGTH = 10;
const startedAt = Date.now();

let lastProbe = null;

// ── Passwords ────────────────────────────────────────────────────────────────

const SCRYPT = { N: 16384, r: 8, p: 1, keylen: 64 };

export function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, SCRYPT.keylen, { N: SCRYPT.N, r: SCRYPT.r, p: SCRYPT.p });
  return `scrypt$${SCRYPT.N}$${salt.toString('base64url')}$${hash.toString('base64url')}`;
}

export function verifyPassword(password, stored) {
  if (typeof password !== 'string' || typeof stored !== 'string') return false;
  const [scheme, n, saltB64, hashB64] = stored.split('$');
  if (scheme !== 'scrypt' || !n || !saltB64 || !hashB64) return false;
  const expected = Buffer.from(hashB64, 'base64url');
  let actual;
  try {
    actual = crypto.scryptSync(password, Buffer.from(saltB64, 'base64url'), expected.length, {
      N: Number(n), r: SCRYPT.r, p: SCRYPT.p, maxmem: 64 * 1024 * 1024,
    });
  } catch {
    return false;
  }
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

function adminEmail() {
  return (process.env.ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL).trim().toLowerCase();
}

function passwordHash() {
  return process.env.ADMIN_PASSWORD_HASH?.trim() || '';
}

export function isAdminConfigured() {
  return Boolean(passwordHash() && process.env.JWT_SECRET?.trim());
}

// ── Admin tokens (separate key from user sessions; changing the password signs everyone out) ──

function tokenKey() {
  return crypto.createHash('sha256').update(`${process.env.JWT_SECRET?.trim()}:sg16-admin`).digest();
}

function passwordVersion() {
  return crypto.createHash('sha256').update(passwordHash()).digest('base64url').slice(0, 12);
}

export function signAdminToken() {
  const body = { role: 'admin', email: adminEmail(), pv: passwordVersion(), exp: Date.now() + TOKEN_TTL_MS };
  const data = Buffer.from(JSON.stringify(body)).toString('base64url');
  const sig = crypto.createHmac('sha256', tokenKey()).update(data).digest('base64url');
  return `${data}.${sig}`;
}

export function verifyAdminToken(token) {
  if (!isAdminConfigured() || typeof token !== 'string' || !token.includes('.')) return null;
  const [data, sig] = token.split('.');
  const expected = crypto.createHmac('sha256', tokenKey()).update(data).digest('base64url');
  const a = Buffer.from(sig || '');
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString('utf8'));
    if (payload.role !== 'admin' || payload.exp < Date.now() || payload.pv !== passwordVersion()) return null;
    return payload;
  } catch {
    return null;
  }
}

export function requireAdmin(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!verifyAdminToken(token)) return res.status(401).json({ error: 'Admin login required.', code: 'ADMIN_AUTH' });
  next();
}

// ── Saved settings ───────────────────────────────────────────────────────────

function readSavedConfig() {
  try {
    const parsed = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

/** Startup: settings saved from the admin panel win over the deployment's environment. */
export function applySavedAdminConfig() {
  const saved = readSavedConfig();
  for (const key of ADMIN_ENV_KEYS) {
    if (typeof saved[key] === 'string') process.env[key] = saved[key];
  }
}

/** Applies `changes` now, writes them to disk, and returns what the Worker should persist. */
function saveAdminConfig(changes) {
  const saved = readSavedConfig();
  for (const [key, value] of Object.entries(changes)) {
    if (!ADMIN_ENV_KEYS.includes(key)) continue;
    saved[key] = value;
    process.env[key] = value;
  }
  try {
    fs.mkdirSync(path.dirname(CONFIG_FILE), { recursive: true });
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(saved, null, 2), { mode: 0o600 });
  } catch (err) {
    console.warn('[SG16 admin] could not write settings file:', err.message);
  }
  return changes;
}

function sendPersisted(req, res, changes) {
  if (req.get(PERSIST_REQUEST_HEADER) === '1') {
    res.set(PERSIST_HEADER, Buffer.from(JSON.stringify(changes)).toString('base64url'));
  }
}

// ── Status ───────────────────────────────────────────────────────────────────

function safeUrl(raw) {
  try {
    const u = new URL(raw);
    u.username = '';
    u.password = '';
    return u.toString().replace(/\/$/, '');
  } catch {
    return raw;
  }
}

function keyHint(key) {
  const k = key?.trim();
  if (!k) return null;
  return k.length <= 8 ? '••••' : `••••${k.slice(-4)}`;
}

function connectionInfo() {
  const api = getApiProvider();
  const primary = getPrimaryProvider();
  return {
    connected: Boolean(api),
    url: api ? safeUrl(process.env.AI_API_URL.trim()) : null,
    format: api?.format ?? null,
    model: api?.models.text ?? null,
    visionModel: api?.models.vision ?? null,
    keySet: Boolean(process.env.AI_API_KEY?.trim()),
    keyHint: keyHint(process.env.AI_API_KEY),
    savedFromPanel: typeof readSavedConfig().AI_API_URL === 'string',
    activeProvider: primary?.id ?? null,
  };
}

async function runProbe(provider) {
  if (!provider) return { ok: false, error: 'No AI API connected yet.', checkedAt: Date.now() };
  const result = await probeApiChat(provider, 30000);
  return { ...result, checkedAt: Date.now() };
}

export async function handleAdminStatus(req, res) {
  if (req.query.probe === '1' || !lastProbe) lastProbe = await runProbe(getApiProvider());
  const db = await checkDatabaseHealth().catch(() => ({ status: 'error' }));
  res.json({
    engine: { status: 'online', startedAt, uptimeSec: Math.round((Date.now() - startedAt) / 1000), node: process.version },
    ai: connectionInfo(),
    brain: lastProbe,
    liveSearch: liveSearchAvailable() ? 'ready' : 'off',
    database: db,
    adminEmail: adminEmail(),
  });
}

// ── Handlers ─────────────────────────────────────────────────────────────────

export function handleAdminLogin(req, res) {
  if (!isAdminConfigured()) {
    return res.status(503).json({ error: 'Admin login is not set up on this server (ADMIN_PASSWORD_HASH missing).' });
  }
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  const emailOk = crypto.timingSafeEqual(
    crypto.createHash('sha256').update(email).digest(),
    crypto.createHash('sha256').update(adminEmail()).digest(),
  );
  const passwordOk = verifyPassword(password, passwordHash());
  if (!emailOk || !passwordOk) return res.status(401).json({ error: 'Wrong email or password.' });
  res.json({ token: signAdminToken(), email: adminEmail(), expiresInSec: TOKEN_TTL_MS / 1000 });
}

function readConnectionBody(body) {
  const url = typeof body?.url === 'string' ? body.url.trim() : '';
  const model = typeof body?.model === 'string' ? body.model.trim() : '';
  const visionModel = typeof body?.visionModel === 'string' ? body.visionModel.trim() : '';
  const key = typeof body?.key === 'string' ? body.key.trim() : '';
  const keepKey = body?.keepKey !== false;

  if (!url) return { error: 'Enter the AI API URL.' };
  if (url.length > 500 || model.length > 200 || visionModel.length > 200 || key.length > 1000) {
    return { error: 'A value is too long.' };
  }
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') throw new Error('protocol');
  } catch {
    return { error: 'The URL must start with http:// or https://' };
  }
  // A blank key keeps the saved one, so the admin never has to paste it again.
  const effectiveKey = key || (keepKey ? process.env.AI_API_KEY?.trim() || '' : '');
  return { url, model, visionModel, key: effectiveKey };
}

export async function handleAdminTest(req, res) {
  const body = req.body ?? {};
  if (!body.url) {
    lastProbe = await runProbe(getApiProvider());
    return res.json({ brain: lastProbe });
  }
  const conn = readConnectionBody(body);
  if (conn.error) return res.status(400).json({ error: conn.error });
  res.json({ brain: await runProbe(buildApiProvider(conn)) });
}

export async function handleAdminSaveConnection(req, res) {
  const conn = readConnectionBody(req.body);
  if (conn.error) return res.status(400).json({ error: conn.error });
  const changes = saveAdminConfig({
    AI_API_URL: conn.url,
    AI_API_KEY: conn.key,
    AI_MODEL: conn.model,
    AI_VISION_MODEL: conn.visionModel,
  });
  sendPersisted(req, res, changes);
  lastProbe = req.body?.test === false ? null : await runProbe(getApiProvider());
  res.json({ ai: connectionInfo(), brain: lastProbe });
}

export function handleAdminChangePassword(req, res) {
  const current = typeof req.body?.current === 'string' ? req.body.current : '';
  const next = typeof req.body?.next === 'string' ? req.body.next : '';
  if (!verifyPassword(current, passwordHash())) return res.status(401).json({ error: 'Current password is wrong.' });
  if (next.length < MIN_PASSWORD_LENGTH) {
    return res.status(400).json({ error: `New password must be at least ${MIN_PASSWORD_LENGTH} characters.` });
  }
  const changes = saveAdminConfig({ ADMIN_PASSWORD_HASH: hashPassword(next) });
  sendPersisted(req, res, changes);
  // The old token stops working; hand back a fresh one.
  res.json({ ok: true, token: signAdminToken() });
}
