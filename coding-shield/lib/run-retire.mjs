import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { CONFIG, ROOT, cliResult, writeReport } from './shared.mjs';

export async function runRetire(target = join(ROOT, '..')) {
  const config = join(CONFIG, 'retire.json');
  const out = join(ROOT, 'reports', 'retire.json');

  const result = spawnSync(
    process.platform === 'win32' ? 'npx.cmd' : 'npx',
    ['retire', '--path', target, '--outputformat', 'json', '--outputpath', out],
    { cwd: join(ROOT, '..'), encoding: 'utf8', shell: process.platform === 'win32' },
  );

  let vulns = [];
  try {
    const { readFileSync } = await import('node:fs');
    const raw = readFileSync(out, 'utf8');
    vulns = raw.trim() ? JSON.parse(raw) : [];
  } catch {
    /* empty */
  }

  const count = Array.isArray(vulns) ? vulns.length : 0;
  const ok = count === 0 && (result.status ?? 1) === 0;
  const summary = cliResult('retire.js', ok, `${count} vulnerable lib(s)`, { vulnCount: count });
  await writeReport('retire-summary.json', summary);
  return summary;
}
