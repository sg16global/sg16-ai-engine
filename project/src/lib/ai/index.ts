/**
 * The provider-agnostic AI layer — one barrel for every AI call in the app.
 *
 * `chatCompletion` (client.ts) is the single place requests leave the app;
 * everything else builds on it. Providers are configured in Admin
 * (`/admin`) and stored on this device (core/aiConfigStore.ts).
 */

export * from './types';
export * from './presets';
export * from './config';
export * from './client';
export * from './prompts';
export * from './webSearch';
export * from './engine';
export * from './vision';
export * from './images';
export * from './transcribe';
export * from './router';
