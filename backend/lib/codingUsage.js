import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getPool, isDatabaseReady } from './db/index.js';
import { isFullAccessOpen } from './launchMode.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const USAGE_PATH = path.join(__dirname, '../data/coding-usage.json');

export function getCodingDailyLimit() {
  const raw = Number(process.env.SG16_CODING_DAILY_LIMIT);
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 25;
}

function utcDateKey() {
  return new Date().toISOString().slice(0, 10);
}

function nextResetAt() {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + 1);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

export function buildCodingUsagePayload(used, limit = getCodingDailyLimit()) {
  const safeUsed = Math.max(0, used);
  const safeLimit = Math.max(1, limit);
  return {
    used: safeUsed,
    limit: safeLimit,
    remaining: Math.max(0, safeLimit - safeUsed),
    resetAt: nextResetAt(),
  };
}

/* ---------- JSON fallback ---------- */

function ensureUsageFile() {
  const dir = path.dirname(USAGE_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(USAGE_PATH)) {
    fs.writeFileSync(USAGE_PATH, JSON.stringify({}, null, 2), 'utf8');
  }
}

function readUsageLedger() {
  ensureUsageFile();
  try {
    return JSON.parse(fs.readFileSync(USAGE_PATH, 'utf8'));
  } catch {
    return {};
  }
}

function writeUsageLedger(ledger) {
  ensureUsageFile();
  fs.writeFileSync(USAGE_PATH, JSON.stringify(ledger, null, 2), 'utf8');
}

async function getCountJson(googleSub) {
  const ledger = readUsageLedger();
  const row = ledger[googleSub];
  const today = utcDateKey();
  if (!row || row.date !== today) return 0;
  return Number(row.count) || 0;
}

async function incrementJson(googleSub) {
  const ledger = readUsageLedger();
  const today = utcDateKey();
  const row = ledger[googleSub];
  const count = !row || row.date !== today ? 1 : (Number(row.count) || 0) + 1;
  ledger[googleSub] = { date: today, count };
  writeUsageLedger(ledger);
  return count;
}

/* ---------- PostgreSQL ---------- */

async function getCountPg(googleSub) {
  const today = utcDateKey();
  const { rows } = await getPool().query(
    `SELECT request_count FROM coding_daily_usage
     WHERE google_sub = $1 AND usage_date = $2::date`,
    [googleSub, today],
  );
  return Number(rows[0]?.request_count) || 0;
}

async function incrementPg(googleSub) {
  const today = utcDateKey();
  const { rows } = await getPool().query(
    `INSERT INTO coding_daily_usage (google_sub, usage_date, request_count)
     VALUES ($1, $2::date, 1)
     ON CONFLICT (google_sub, usage_date)
     DO UPDATE SET request_count = coding_daily_usage.request_count + 1
     RETURNING request_count`,
    [googleSub, today],
  );
  return Number(rows[0]?.request_count) || 1;
}

async function getCount(googleSub) {
  if (isDatabaseReady()) return getCountPg(googleSub);
  return getCountJson(googleSub);
}

async function increment(googleSub) {
  if (isDatabaseReady()) return incrementPg(googleSub);
  return incrementJson(googleSub);
}

/** Read-only daily coding token balance for a user. */
export async function getCodingUsage(googleSub) {
  if (!googleSub) {
    return buildCodingUsagePayload(0);
  }
  const count = await getCount(googleSub);
  return buildCodingUsagePayload(count);
}

/** Read-only coding token balance (Coding Hub internal). */
export async function handleCodingUsageRequest(req, res) {
  try {
    const usage = await getCodingUsage(req.auth?.sub);
    res.json({ codingUsage: usage });
  } catch (err) {
    console.error('[SG16 coding usage]', err);
    res.status(500).json({ error: 'Could not load coding tokens.' });
  }
}

/**
 * Coding Hub only — one token per AI request (check, repair, chat help).
 * Skipped during launch-free mode.
 */
export async function checkAndIncrementCodingUsage(googleSub) {
  const limit = getCodingDailyLimit();

  if (!googleSub) {
    return { allowed: false, ...buildCodingUsagePayload(limit, limit) };
  }

  if (isFullAccessOpen()) {
    return { allowed: true, ...buildCodingUsagePayload(0, limit) };
  }

  const count = await getCount(googleSub);
  if (count >= limit) {
    return { allowed: false, ...buildCodingUsagePayload(count, limit) };
  }

  const used = await increment(googleSub);
  return { allowed: true, ...buildCodingUsagePayload(used, limit) };
}
