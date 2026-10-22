const AI_KEYS = ['AI_API_URL', 'AI_API_KEY', 'AI_MODEL', 'AI_CODING_MODEL', 'AI_VISION_MODEL', 'AI_API_HEADERS'];

/** AI connection slot 1 (AI_API_URL, …) plus automatic fallback slots 2–5 (AI_API_URL_2, …). */
const AI_SLOT_KEYS = [1, 2, 3, 4, 5].flatMap((slot) => AI_KEYS.map((key) => (slot === 1 ? key : `${key}_${slot}`)));

/** Worker secrets / vars handed to the backend process as environment variables. */
export const BACKEND_ENV_KEYS = ['JWT_SECRET', 'DATABASE_URL', ...AI_SLOT_KEYS, 'SG16_APP_URL'];

export function backendEnv(env) {
  const vars = { NODE_ENV: 'production', HOST: '0.0.0.0', PORT: '8000' };
  for (const key of BACKEND_ENV_KEYS) {
    if (typeof env[key] === 'string' && env[key].trim()) vars[key] = env[key].trim();
  }
  return vars;
}
