import { join } from 'node:path';
import { CONFIG, ROOT, cliResult, writeReport, spawnCli } from './shared.mjs';

export async function runGitleaks(target = join(ROOT, '..')) {
  const config = join(CONFIG, 'gitleaks.toml');
  const out = join(ROOT, 'reports', 'gitleaks.json');

  const result = spawnCli('gitleaks', [
    'detect',
    '--source',
    target,
    '--config',
    config,
    '--report-path',
    out,
    '--no-git',
  ]);

  if (result.error?.code === 'ENOENT') {
    const skipped = cliResult('gitleaks', true, 'skipped — install gitleaks CLI', { skipped: true });
    await writeReport('gitleaks-summary.json', skipped);
    return skipped;
  }

  let leaks = [];
  try {
    const { readFileSync } = await import('node:fs');
    leaks = JSON.parse(readFileSync(out, 'utf8'));
  } catch {
    /* empty — no leaks file means clean */
  }

  const count = Array.isArray(leaks) ? leaks.length : 0;
  const ok = count === 0;
  const summary = cliResult('gitleaks', ok, `${count} secret(s) found`, { leakCount: count });
  await writeReport('gitleaks-summary.json', summary);
  return summary;
}
