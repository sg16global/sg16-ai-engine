/** PostgreSQL schema — one account (users), platform billing tables, webhook idempotency. */
export const SCHEMA_SQL = `
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  google_sub TEXT NOT NULL UNIQUE,
  email TEXT,
  name TEXT,
  picture TEXT,
  signup_date BIGINT NOT NULL,
  plan_tier TEXT NOT NULL DEFAULT 'free' CHECK (plan_tier IN ('free', 'student', 'pro')),
  subscription_status TEXT,
  paddle_customer_id TEXT,
  paddle_subscription_id TEXT,
  student_verification JSONB NOT NULL DEFAULT '{"status":"none"}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL DEFAULT 'paddle' CHECK (platform IN ('web', 'android', 'paddle')),
  status TEXT NOT NULL,
  plan TEXT NOT NULL CHECK (plan IN ('free', 'student', 'pro')),
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  paddle_subscription_id TEXT,
  external_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS web_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'lemon',
  external_subscription_id TEXT,
  external_customer_id TEXT,
  plan TEXT NOT NULL CHECK (plan IN ('student', 'pro')),
  status TEXT NOT NULL,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, provider)
);

CREATE TABLE IF NOT EXISTS android_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  purchase_token TEXT,
  product_id TEXT,
  plan TEXT NOT NULL CHECK (plan IN ('student', 'pro')),
  status TEXT NOT NULL,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id)
);

CREATE TABLE IF NOT EXISTS webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT NOT NULL UNIQUE,
  provider TEXT NOT NULL DEFAULT 'paddle',
  event_type TEXT,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  payload JSONB
);

CREATE TABLE IF NOT EXISTS user_rooms (
  google_sub TEXT PRIMARY KEY,
  chat_history JSONB NOT NULL DEFAULT '{}'::jsonb,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_rooms_updated ON user_rooms (updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_google_sub ON users (google_sub);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions (user_id);
CREATE INDEX IF NOT EXISTS idx_web_subscriptions_user_id ON web_subscriptions (user_id);
CREATE INDEX IF NOT EXISTS idx_android_subscriptions_user_id ON android_subscriptions (user_id);
`;
