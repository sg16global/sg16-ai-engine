/**
 * The Node backend (backend/server.js, built from the repo Dockerfile) as a Cloudflare Container.
 * It starts on the first /api request and sleeps after 15 minutes without traffic.
 * No accounts and no stored chats (history lives on each user's device). Its disk is wiped on every
 * restart; set DATABASE_URL only if student verification results must survive restarts.
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
