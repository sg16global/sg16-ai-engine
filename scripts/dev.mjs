#!/usr/bin/env node
/**
 * Runs the SG16 backend (http://localhost:8000) and the Vite frontend (http://localhost:5173)
 * together. Vite forwards /api and /health to the backend, so the app works exactly like production.
 *
 *   npm run dev            backend + frontend
 *   npm run dev -- --ui    frontend only (uses SG16_DEV_API_TARGET from project/.env, e.g. https://sg16engine.com)
 */
import { spawn } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const uiOnly = process.argv.includes('--ui');

const services = [
  ...(uiOnly ? [] : [{ name: 'backend ', dir: 'backend', script: 'dev', color: '\x1b[36m' }]),
  { name: 'frontend', dir: 'project', script: 'dev', color: '\x1b[35m' },
];

for (const { dir } of services) {
  if (!existsSync(path.join(root, dir, 'node_modules'))) {
    console.error(`[dev] ${dir}/node_modules is missing. Run: npm install --prefix ${dir}`);
    process.exit(1);
  }
}
const backendEnv = path.join(root, 'backend', '.env');
if (!uiOnly && !existsSync(backendEnv)) {
  console.warn('[dev] backend/.env not found — copy backend/.env.example to backend/.env and fill in the keys you have.');
} else if (!uiOnly && !process.env.JWT_SECRET && !/^JWT_SECRET=\S+/m.test(readFileSync(backendEnv, 'utf8'))) {
  console.warn('[dev] JWT_SECRET is empty in backend/.env — sign-in will fail. Generate one with:');
  console.warn("      node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"");
}

const children = services.map(({ name, dir, script, color }) => {
  const child = spawn(`npm run ${script}`, {
    cwd: path.join(root, dir),
    shell: true,
    env: process.env,
  });
  const prefix = `${color}[${name}]\x1b[0m `;
  const pipe = (stream, out) => {
    let buffered = '';
    stream.on('data', (chunk) => {
      buffered += chunk;
      const lines = buffered.split(/\r?\n/);
      buffered = lines.pop() ?? '';
      for (const line of lines) out.write(prefix + line + '\n');
    });
  };
  pipe(child.stdout, process.stdout);
  pipe(child.stderr, process.stderr);
  child.on('exit', (code) => {
    console.log(`${prefix}exited with code ${code}`);
    shutdown(code ?? 0);
  });
  return child;
});

let stopping = false;
function shutdown(code) {
  if (stopping) return;
  stopping = true;
  for (const child of children) child.kill();
  process.exit(code);
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));
