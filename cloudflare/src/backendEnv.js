/** Worker secrets / vars handed to the backend process as environment variables. */
export const BACKEND_ENV_KEYS = [
  'JWT_SECRET',
  'DATABASE_URL',
  'AI_API_URL',
  'AI_API_KEY',
  'AI_MODEL',
  'AI_VISION_MODEL',
  'SG16_APP_URL',
  'ADMIN_EMAIL',
  'ADMIN_PASSWORD_HASH',
];

/** Settings the admin panel can change; the Backend Durable Object stores them across restarts. */
export const ADMIN_ENV_KEYS = ['AI_API_URL', 'AI_API_KEY', 'AI_MODEL', 'AI_VISION_MODEL', 'ADMIN_PASSWORD_HASH'];

export function backendEnv(env, saved = {}) {
  const vars = { NODE_ENV: 'production', HOST: '0.0.0.0', PORT: '8000' };
  for (const key of BACKEND_ENV_KEYS) {
    if (typeof env[key] === 'string' && env[key].trim()) vars[key] = env[key].trim();
  }
  // Admin panel settings win over deploy-time secrets.
  for (const key of ADMIN_ENV_KEYS) {
    if (typeof saved[key] === 'string') vars[key] = saved[key];
  }
  return vars;
}

/** Keeps only admin-panel keys with string values (what the backend reported as changed). */
export function pickAdminEnv(changes) {
  const out = {};
  if (!changes || typeof changes !== 'object') return out;
  for (const key of ADMIN_ENV_KEYS) {
    if (typeof changes[key] === 'string') out[key] = changes[key];
  }
  return out;
}
