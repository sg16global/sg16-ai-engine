/**
 * The Node backend (backend/server.js, built from the repo Dockerfile) as a Cloudflare Container.
 * It starts on the first /api request and sleeps after 15 minutes without traffic.
 * No accounts and no stored chats (history lives on each user's device). Its disk is wiped on every
 * restart; set DATABASE_URL only if student verification results must survive restarts.
 *
 * Settings saved in the admin panel (AI connection, admin password) are kept in this Durable Object's
 * storage and handed to the container as environment variables every time it starts.
 */
import { Container } from '@cloudflare/containers';
import { backendEnv, pickAdminEnv } from './backendEnv.js';

const ADMIN_ENV_STORAGE_KEY = 'adminEnv';

export class Backend extends Container {
  defaultPort = 8000;
  sleepAfter = '15m';

  constructor(ctx, env) {
    super(ctx, env);
    this.envVars = backendEnv(env);
    ctx.blockConcurrencyWhile(async () => {
      const saved = (await ctx.storage.get(ADMIN_ENV_STORAGE_KEY)) || {};
      this.envVars = backendEnv(env, saved);
    });
  }

  /** Called by the Worker after the admin panel saves settings (the running backend already applied them). */
  async saveAdminEnv(changes) {
    const saved = { ...((await this.ctx.storage.get(ADMIN_ENV_STORAGE_KEY)) || {}), ...pickAdminEnv(changes) };
    await this.ctx.storage.put(ADMIN_ENV_STORAGE_KEY, saved);
    this.envVars = backendEnv(this.env, saved);
  }
}
