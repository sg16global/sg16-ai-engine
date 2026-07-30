import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getPool, isDatabaseReady } from './db/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LEDGER_PATH = path.join(__dirname, '../data/signup-ledger.json');

const ACTIVE_SUBSCRIPTION_STATUSES = new Set(['active', 'trialing', 'past_due']);

function defaultRecord() {
  return {
    signup_date: Date.now(),
    planTier: 'free',
    subscriptionStatus: null,
    paddleCustomerId: null,
    paddleSubscriptionId: null,
    studentVerification: { status: 'none' },
  };
}

function rowToRecord(row) {
  if (!row) return null;
  return {
    signup_date: Number(row.signup_date),
    planTier: row.plan_tier,
    subscriptionStatus: row.subscription_status,
    paddleCustomerId: row.paddle_customer_id,
    paddleSubscriptionId: row.paddle_subscription_id,
    studentVerification: row.student_verification ?? { status: 'none' },
    email: row.email ?? undefined,
    name: row.name ?? undefined,
  };
}

/* ---------- JSON fallback (dev only when DATABASE_URL unset) ---------- */

function ensureLedgerFile() {
  const dir = path.dirname(LEDGER_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(LEDGER_PATH)) {
    fs.writeFileSync(LEDGER_PATH, JSON.stringify({}, null, 2), 'utf8');
  }
}

function readLedger() {
  ensureLedgerFile();
  try {
    return JSON.parse(fs.readFileSync(LEDGER_PATH, 'utf8'));
  } catch {
    return {};
  }
}

function writeLedger(ledger) {
  ensureLedgerFile();
  fs.writeFileSync(LEDGER_PATH, JSON.stringify(ledger, null, 2), 'utf8');
}

function ensureJsonRecord(ledger, googleSub) {
  if (!ledger[googleSub]) ledger[googleSub] = defaultRecord();
  return ledger[googleSub];
}

async function ensureSignupDateJson(googleSub, profile = {}) {
  const ledger = readLedger();
  const record = ensureJsonRecord(ledger, googleSub);
  if (!record.signup_date) record.signup_date = Date.now();
  if (profile.email && !record.email) record.email = profile.email;
  if (profile.name && !record.name) record.name = profile.name;
  writeLedger(ledger);
  return record.signup_date;
}

async function getUserRecordJson(googleSub) {
  const ledger = readLedger();
  return ledger[googleSub] ?? null;
}

async function updateUserRecordJson(googleSub, patch) {
  const ledger = readLedger();
  const record = ensureJsonRecord(ledger, googleSub);
  Object.assign(record, patch);
  writeLedger(ledger);
  return record;
}

/* ---------- PostgreSQL ---------- */

async function ensureSignupDatePg(googleSub, profile = {}) {
  const pool = getPool();
  const existing = await pool.query('SELECT signup_date FROM users WHERE google_sub = $1', [googleSub]);
  if (existing.rows[0]) {
    if (profile.email || profile.name) {
      await pool.query(
        `UPDATE users SET
          email = COALESCE($2, email),
          name = COALESCE($3, name),
          updated_at = NOW()
         WHERE google_sub = $1`,
        [googleSub, profile.email ?? null, profile.name ?? null],
      );
    }
    return Number(existing.rows[0].signup_date);
  }

  const signupDate = Date.now();
  await pool.query(
    `INSERT INTO users (google_sub, email, name, signup_date)
     VALUES ($1, $2, $3, $4)`,
    [googleSub, profile.email ?? null, profile.name ?? null, signupDate],
  );
  return signupDate;
}

async function getUserRecordPg(googleSub) {
  const { rows } = await getPool().query('SELECT * FROM users WHERE google_sub = $1 LIMIT 1', [googleSub]);
  return rowToRecord(rows[0]);
}

async function updateUserRecordPg(googleSub, patch) {
  const pool = getPool();
  const current = await getUserRecordPg(googleSub);
  const base = current ?? defaultRecord();

  const next = {
    planTier: patch.planTier ?? base.planTier,
    subscriptionStatus:
      patch.subscriptionStatus !== undefined ? patch.subscriptionStatus : base.subscriptionStatus,
    paddleCustomerId:
      patch.paddleCustomerId !== undefined ? patch.paddleCustomerId : base.paddleCustomerId,
    paddleSubscriptionId:
      patch.paddleSubscriptionId !== undefined ? patch.paddleSubscriptionId : base.paddleSubscriptionId,
    studentVerification: patch.studentVerification ?? base.studentVerification,
    email: patch.email ?? base.email,
    name: patch.name ?? base.name,
  };

  await pool.query(
    `INSERT INTO users (
      google_sub, signup_date, plan_tier, subscription_status,
      paddle_customer_id, paddle_subscription_id, student_verification, email, name
    ) VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9)
    ON CONFLICT (google_sub) DO UPDATE SET
      plan_tier = EXCLUDED.plan_tier,
      subscription_status = EXCLUDED.subscription_status,
      paddle_customer_id = EXCLUDED.paddle_customer_id,
      paddle_subscription_id = EXCLUDED.paddle_subscription_id,
      student_verification = EXCLUDED.student_verification,
      email = COALESCE(EXCLUDED.email, users.email),
      name = COALESCE(EXCLUDED.name, users.name),
      updated_at = NOW()`,
    [
      googleSub,
      base.signup_date ?? Date.now(),
      next.planTier,
      next.subscriptionStatus,
      next.paddleCustomerId,
      next.paddleSubscriptionId,
      JSON.stringify(next.studentVerification ?? { status: 'none' }),
      next.email ?? null,
      next.name ?? null,
    ],
  );

  return getUserRecordPg(googleSub);
}

async function syncSubscriptionRowPg(googleSub, record) {
  if (!record?.subscriptionStatus) return;
  const pool = getPool();
  const user = await pool.query('SELECT id FROM users WHERE google_sub = $1', [googleSub]);
  const userId = user.rows[0]?.id;
  if (!userId) return;

  await pool.query(
    `INSERT INTO subscriptions (user_id, platform, status, plan, paddle_subscription_id, external_id)
     VALUES ($1, 'paddle', $2, $3, $4, $5)`,
    [
      userId,
      record.subscriptionStatus,
      record.planTier ?? 'free',
      record.paddleSubscriptionId ?? null,
      record.paddleSubscriptionId ?? null,
    ],
  );
}

/* ---------- Public API ---------- */

export async function ensureSignupDate(googleSub, profile = {}) {
  if (isDatabaseReady()) return ensureSignupDatePg(googleSub, profile);
  return ensureSignupDateJson(googleSub, profile);
}

export async function getSignupDate(googleSub) {
  const record = await getUserRecord(googleSub);
  return record?.signup_date ?? null;
}

export async function getUserRecord(googleSub) {
  if (isDatabaseReady()) return getUserRecordPg(googleSub);
  return getUserRecordJson(googleSub);
}

export async function updateUserRecord(googleSub, patch) {
  if (isDatabaseReady()) {
    const record = await updateUserRecordPg(googleSub, patch);
    await syncSubscriptionRowPg(googleSub, record);
    return record;
  }
  return updateUserRecordJson(googleSub, patch);
}

export async function setStudentVerification(googleSub, verification) {
  return updateUserRecord(googleSub, { studentVerification: verification });
}

export function subscriptionIsActive(record) {
  if (!record) return false;
  return ACTIVE_SUBSCRIPTION_STATUSES.has(record.subscriptionStatus);
}

export function resolvePlanTier(record) {
  if (!record) return 'free';
  if (!subscriptionIsActive(record)) return 'free';
  if (record.planTier === 'pro' || record.planTier === 'student') return record.planTier;
  return 'free';
}

export async function buildSubscriptionPayload(googleSub) {
  const record = await getUserRecord(googleSub);
  const plan = resolvePlanTier(record);
  const verification = record?.studentVerification ?? { status: 'none' };

  return {
    plan,
    studentVerification: verification,
    subscriptionStatus: record?.subscriptionStatus ?? null,
    paddleCustomerId: record?.paddleCustomerId ?? null,
    paddleSubscriptionId: record?.paddleSubscriptionId ?? null,
    billingActive: subscriptionIsActive(record),
  };
}

export async function getEntitlements(googleSub) {
  const record = await getUserRecord(googleSub);
  const planTier = resolvePlanTier(record);
  const studentVerified = record?.studentVerification?.status === 'approved';

  return {
    planTier,
    studentVerified,
    subscription: await buildSubscriptionPayload(googleSub),
  };
}

export async function applyPaddleSubscription(googleSub, {
  planTier,
  status,
  paddleCustomerId,
  paddleSubscriptionId,
}) {
  return applyBillingSubscription(googleSub, {
    provider: 'paddle',
    planTier,
    status,
    externalCustomerId: paddleCustomerId,
    externalSubscriptionId: paddleSubscriptionId,
  });
}

async function syncWebSubscriptionPg(googleSub, {
  provider,
  plan,
  status,
  externalSubscriptionId,
  externalCustomerId,
  currentPeriodEnd,
}) {
  const pool = getPool();
  const user = await pool.query('SELECT id FROM users WHERE google_sub = $1', [googleSub]);
  const userId = user.rows[0]?.id;
  if (!userId) return;

  const periodEnd = currentPeriodEnd ? new Date(currentPeriodEnd) : null;
  const validPeriodEnd = periodEnd && !Number.isNaN(periodEnd.getTime()) ? periodEnd : null;

  await pool.query(
    `INSERT INTO web_subscriptions (
      user_id, provider, external_subscription_id, external_customer_id,
      plan, status, current_period_end, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
    ON CONFLICT (user_id, provider) DO UPDATE SET
      external_subscription_id = EXCLUDED.external_subscription_id,
      external_customer_id = EXCLUDED.external_customer_id,
      plan = EXCLUDED.plan,
      status = EXCLUDED.status,
      current_period_end = COALESCE(EXCLUDED.current_period_end, web_subscriptions.current_period_end),
      updated_at = NOW()`,
    [
      userId,
      provider,
      externalSubscriptionId ?? null,
      externalCustomerId ?? null,
      plan === 'student' ? 'student' : 'pro',
      status,
      validPeriodEnd,
    ],
  );
}

/** Provider-agnostic billing update (Dodo, Paddle legacy, future providers). */
export async function applyBillingSubscription(googleSub, {
  provider = 'dodo',
  planTier,
  status,
  externalSubscriptionId,
  externalCustomerId,
  currentPeriodEnd,
}) {
  const current = await getUserRecord(googleSub);
  const active = ACTIVE_SUBSCRIPTION_STATUSES.has(status);
  const record = await updateUserRecord(googleSub, {
    planTier: active ? planTier : 'free',
    subscriptionStatus: status,
    paddleCustomerId: externalCustomerId ?? undefined,
    paddleSubscriptionId: externalSubscriptionId ?? undefined,
  });

  if (isDatabaseReady() && provider) {
    const webPlan =
      (active ? planTier : current?.planTier) === 'student' ? 'student' : 'pro';
    await syncWebSubscriptionPg(googleSub, {
      provider,
      plan: webPlan,
      status,
      externalSubscriptionId,
      externalCustomerId,
      currentPeriodEnd,
    });
  }

  return record;
}
