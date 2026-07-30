import pg from 'pg';
import { SCHEMA_SQL } from './schema.js';
import { migrateJsonLedgerIfNeeded } from './migrateJson.js';

const { Pool } = pg;

let pool = null;
let ready = false;

export function isDatabaseEnabled() {
  return Boolean(process.env.DATABASE_URL?.trim());
}

export function isDatabaseReady() {
  return ready;
}

export function getPool() {
  if (!pool) {
    throw new Error('PostgreSQL is not initialized. Set DATABASE_URL and restart the server.');
  }
  return pool;
}

export async function initDatabase() {
  if (!isDatabaseEnabled()) {
    console.warn('[SG16 db] DATABASE_URL not set — using JSON ledger (development fallback only)');
    return { enabled: false, ready: false };
  }

  pool = new Pool({
    connectionString: process.env.DATABASE_URL.trim(),
    ssl: process.env.PGSSLMODE === 'disable' ? false : { rejectUnauthorized: false },
    max: 10,
  });

  await pool.query(SCHEMA_SQL);
  await migrateJsonLedgerIfNeeded(pool);

  ready = true;
  console.log('[SG16 db] PostgreSQL ready — users, subscriptions, webhook_events');
  return { enabled: true, ready: true };
}

export async function checkDatabaseHealth() {
  if (!isDatabaseEnabled()) return { enabled: false, ok: false };
  if (!pool) return { enabled: true, ok: false, error: 'not_initialized' };
  try {
    await pool.query('SELECT 1');
    const { rows } = await pool.query('SELECT COUNT(*)::int AS users FROM users');
    return { enabled: true, ok: true, users: rows[0]?.users ?? 0 };
  } catch (err) {
    return {
      enabled: true,
      ok: false,
      error: err instanceof Error ? err.message : 'database_error',
    };
  }
}

/** Record webhook once; returns true if this is a duplicate event. */
export async function recordWebhookEvent(eventId, provider, eventType, payload) {
  if (!isDatabaseReady()) return false;
  try {
    await getPool().query(
      `INSERT INTO webhook_events (event_id, provider, event_type, payload)
       VALUES ($1, $2, $3, $4::jsonb)`,
      [eventId, provider, eventType ?? null, JSON.stringify(payload ?? {})],
    );
    return false;
  } catch (err) {
    if (err?.code === '23505') return true;
    throw err;
  }
}
