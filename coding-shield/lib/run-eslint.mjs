import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { CONFIG, ROOT, cliResult, writeReport } from './shared.mjs';

export async function runEslint(target = join(ROOT, '..')) {
  const config = join(CONFIG, 'eslint.config.js');
  const out = join(ROOT, 'reports', 'eslint.json');
  const repo = join(ROOT, '..');
  const paths = [join(repo, 'backend/lib'), join(repo, 'project/src')];
  const result = spawnSync(
    process.platform === 'win32' ? 'npx.cmd' : 'npx',
    ['eslint', ...paths, '--config', config, '--format', 'json', '--output-file', out],
    { cwd: repo, encoding: 'utf8' },
  );

  let findings = [];
  try {
    const { readFileSync } = await import('node:fs');
    findings = JSON.parse(readFileSync(out, 'utf8'));
  } catch {
    /* empty */
  }

  const errorCount = findings.reduce((n, f) => n + (f.errorCount || 0), 0);
  const warnCount = findings.reduce((n, f) => n + (f.warningCount || 0), 0);
  const configError = /Could not find|Something went wrong/i.test(result.stderr || result.stdout || '');
  const ok = !configError && errorCount === 0;

  await writeReport('eslint-summary.json', cliResult('eslint', ok, `${errorCount} errors, ${warnCount} warnings`, {
    errorCount,
    warnCount,
    exitCode: result.status ?? 1,
  }));

  return cliResult('eslint', ok, `${errorCount} errors, ${warnCount} warnings`, { errorCount, warnCount });
}
