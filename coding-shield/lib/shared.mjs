import { mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
export const ROOT = join(__dirname, '..');
export const CONFIG = join(ROOT, 'config');
export const REPORTS = join(ROOT, 'reports');

/** Resolve CLI binaries on Windows (Python Scripts + SAIF MY CURSOR/tools). */
export function resolveCli(name) {
  if (process.platform !== 'win32') return name;

  const exe = `${name}.exe`;
  const pyExe = name === 'semgrep' ? 'pysemgrep.exe' : exe;
  const candidates = [
    join(ROOT, '..', '..', 'tools', exe),
    join(process.env.APPDATA || '', 'Python', 'Python314', 'Scripts', pyExe),
    join(process.env.APPDATA || '', 'Python', 'Python314', 'Scripts', exe),
    join(process.env.LOCALAPPDATA || '', 'Programs', 'Python', 'Python314', 'Scripts', pyExe),
    join(process.env.LOCALAPPDATA || '', 'Programs', 'Python', 'Python314', 'Scripts', exe),
  ];

  for (const candidate of candidates) {
    if (candidate && existsSync(candidate)) return candidate;
  }
  return name;
}

export function spawnCli(command, args, options = {}) {
  const bin = resolveCli(command);
  return spawnSync(bin, args, {
    encoding: 'utf8',
    shell: false,
    windowsHide: true,
    ...options,
  });
}

export async function ensureReportsDir() {
  await mkdir(REPORTS, { recursive: true });
}

export async function writeReport(name, data) {
  await ensureReportsDir();
  const path = join(REPORTS, name);
  await writeFile(path, typeof data === 'string' ? data : JSON.stringify(data, null, 2), 'utf8');
  return path;
}

export function cliResult(tool, ok, summary, details = {}) {
  return { tool, ok, summary, at: new Date().toISOString(), ...details };
}
