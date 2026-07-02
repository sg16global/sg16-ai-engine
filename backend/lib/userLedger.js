import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LEDGER_PATH = path.join(__dirname, '../data/signup-ledger.json');

const ACTIVE_SUBSCRIPTION_STATUSES = new Set(['active', 'trialing', 'past_due']);

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

function ensureRecord(ledger, googleSub) {
  if (!ledger[googleSub]) {
    ledger[googleSub] = defaultRecord();
  }
  return ledger[googleSub];
}

/** Returns existing signup_date or creates a new ledger entry. */
export function ensureSignupDate(googleSub) {
  const ledger = readLedger();
  const record = ensureRecord(ledger, googleSub);
  if (!record.signup_date) {
    record.signup_date = Date.now();
  }
  writeLedger(ledger);
  return record.signup_date;
}

export function getSignupDate(googleSub) {
  const ledger = readLedger();
  return ledger[googleSub]?.signup_date ?? null;
}

export function getUserRecord(googleSub) {
  const ledger = readLedger();
  return ledger[googleSub] ?? null;
}

export function updateUserRecord(googleSub, patch) {
  const ledger = readLedger();
  const record = ensureRecord(ledger, googleSub);
  Object.assign(record, patch);
  writeLedger(ledger);
  return record;
}

export function setStudentVerification(googleSub, verification) {
  return updateUserRecord(googleSub, {
    studentVerification: verification,
  });
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

export function buildSubscriptionPayload(googleSub) {
  const record = getUserRecord(googleSub);
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

export function getEntitlements(googleSub) {
  const record = getUserRecord(googleSub);
  const planTier = resolvePlanTier(record);
  const studentVerified = record?.studentVerification?.status === 'approved';

  return {
    planTier,
    studentVerified,
    subscription: buildSubscriptionPayload(googleSub),
  };
}

export function applyPaddleSubscription(googleSub, {
  planTier,
  status,
  paddleCustomerId,
  paddleSubscriptionId,
}) {
  return updateUserRecord(googleSub, {
    planTier: ACTIVE_SUBSCRIPTION_STATUSES.has(status) ? planTier : 'free',
    subscriptionStatus: status,
    paddleCustomerId: paddleCustomerId ?? undefined,
    paddleSubscriptionId: paddleSubscriptionId ?? undefined,
  });
}
