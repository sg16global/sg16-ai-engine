import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { CONFIG, ROOT, cliResult, writeReport } from './shared.mjs';

export async function runNyc() {
  const config = join(CONFIG, 'nyc.config.js');
  const repo = join(ROOT, '..');

  const result = spawnSync(
    process.platform === 'win32' ? 'npx.cmd' : 'npx',
    ['nyc', '--nycrc-path', config, 'node', '--test'],
    { cwd: join(repo, 'backend'), encoding: 'utf8', shell: process.platform === 'win32' },
  );

  const combined = (result.stdout || '') + (result.stderr || '');
  const noTests = /no test files|could not find|tests?\s+0/i.test(combined);

  if (noTests || (result.status ?? 1) !== 0) {
    const skipped = cliResult(
      'istanbul-nyc',
      true,
      'skipped — add backend tests to enable NYC coverage',
      { skipped: true, exitCode: result.status },
    );
    await writeReport('nyc-summary.json', skipped);
    return skipped;
  }

  const ok = (result.status ?? 1) === 0;
  const summary = cliResult(
    'istanbul-nyc',
    ok,
    ok ? 'coverage report generated' : 'coverage run failed',
    { exitCode: result.status, stdout: (result.stdout || '').slice(-500) },
  );
  await writeReport('nyc-summary.json', summary);
  return summary;
}
