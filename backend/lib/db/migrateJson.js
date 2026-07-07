import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LEDGER_PATH = path.join(__dirname, '../../data/signup-ledger.json');

function readJsonLedger() {
  if (!fs.existsSync(LEDGER_PATH)) return {};
  try {
    return JSON.parse(fs.readFileSync(LEDGER_PATH, 'utf8'));
  } catch {
    return {};
  }
}

/** One-time import from signup-ledger.json when PostgreSQL is empty. */
export async function migrateJsonLedgerIfNeeded(pool) {
  const { rows } = await pool.query('SELECT COUNT(*)::int AS count FROM users');
  if (rows[0]?.count > 0) return 0;

  const ledger = readJsonLedger();
  const entries = Object.entries(ledger);
  if (entries.length === 0) return 0;

  let imported = 0;
  for (const [googleSub, raw] of entries) {
    const record = raw ?? {};
    await pool.query(
      `INSERT INTO users (
        google_sub, email, name, signup_date, plan_tier, subscription_status,
        paddle_customer_id, paddle_subscription_id, student_verification
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb)
      ON CONFLICT (google_sub) DO NOTHING`,
      [
        googleSub,
        record.email ?? null,
        record.name ?? null,
        record.signup_date ?? Date.now(),
        record.planTier ?? 'free',
        record.subscriptionStatus ?? null,
        record.paddleCustomerId ?? null,
        record.paddleSubscriptionId ?? null,
        JSON.stringify(record.studentVerification ?? { status: 'none' }),
      ],
    );
    imported += 1;
  }

  if (imported > 0) {
    console.log(`[SG16 db] Imported ${imported} user(s) from signup-ledger.json`);
  }
  return imported;
}
