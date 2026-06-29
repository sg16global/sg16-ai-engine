import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LEDGER_PATH = path.join(__dirname, '../data/signup-ledger.json');

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

/** Returns existing signup_date or creates a new ledger entry (signup_date only). */
export function ensureSignupDate(googleSub) {
  const ledger = readLedger();
  if (!ledger[googleSub]) {
    ledger[googleSub] = { signup_date: Date.now() };
    writeLedger(ledger);
  }
  return ledger[googleSub].signup_date;
}

export function getSignupDate(googleSub) {
  const ledger = readLedger();
  return ledger[googleSub]?.signup_date ?? null;
}
