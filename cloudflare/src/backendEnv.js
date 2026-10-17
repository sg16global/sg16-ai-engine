/** Worker secrets / vars handed to the backend process as environment variables. */
export const BACKEND_ENV_KEYS = [
  'JWT_SECRET',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'SG16_OWNER_EMAIL',
  'DATABASE_URL',
  'AI_API_URL',
  'AI_API_KEY',
  'AI_MODEL',
  'AI_VISION_MODEL',
  'SG16_APP_URL',
];

export function backendEnv(env) {
  const vars = { NODE_ENV: 'production', HOST: '0.0.0.0', PORT: '8000' };
  for (const key of BACKEND_ENV_KEYS) {
    if (typeof env[key] === 'string' && env[key].trim()) vars[key] = env[key].trim();
  }
  return vars;
}
