/**
 * The universal AI gateway — one barrel for every AI call in the app.
 *
 * `chatCompletion` (client.ts) is the single place requests leave the app;
 * everything else builds on it. Connections are configured in Admin
 * (`/admin`) and stored on this device (core/aiConfigStore.ts) as raw
 * values — any base URL, API key, and model strings. No presets, no
 * per-vendor adapters.
 */

export * from './types';
export * from './config';
export * from './wire';
export * from './client';
export * from './prompts';
export * from './webSearch';
export * from './engine';
export * from './vision';
export * from './images';
export * from './transcribe';
export * from './router';
