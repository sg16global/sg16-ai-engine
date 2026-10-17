/**
 * The Node backend (backend/server.js, built from the repo Dockerfile) as a Cloudflare Container.
 * It starts on the first /api request and sleeps after 15 minutes without traffic.
 * Its disk is wiped on every restart, so user data must live in Postgres (DATABASE_URL).
 */
import { Container } from '@cloudflare/containers';
import { backendEnv } from './backendEnv.js';

export class Backend extends Container {
  defaultPort = 8000;
  sleepAfter = '15m';

  constructor(ctx, env) {
    super(ctx, env);
    this.envVars = backendEnv(env);
  }
}
