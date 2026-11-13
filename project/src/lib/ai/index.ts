/**
 * The AI layer — one barrel for every AI call in the app.
 *
 * `chatCompletion` (client.ts) is the single place chat requests leave the
 * app, and wire.ts only ever calls SG16's own backend (/api/ai/*). The AI
 * connection is set once by the owner on that backend.
 */

export * from './types';
export * from './wire';
export * from './client';
export * from './prompts';
export * from './webSearch';
export * from './engine';
export * from './vision';
export * from './images';
export * from './transcribe';
export * from './router';
