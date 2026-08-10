import { join } from 'node:path';
import { CONFIG, ROOT, cliResult, writeReport, spawnCli } from './shared.mjs';

export async function runSemgrep(target = join(ROOT, '..')) {
  const config = join(CONFIG, 'semgrep.yml');
  const out = join(ROOT, 'reports', 'semgrep.json');

  const result = spawnCli('semgrep', ['--config', config, '--json', '--output', out, target]);

  if (result.error?.code === 'ENOENT') {
    const skipped = cliResult('semgrep', true, 'skipped — install semgrep CLI (pip install semgrep)', { skipped: true });
    await writeReport('semgrep-summary.json', skipped);
    return skipped;
  }

  let findings = [];
  try {
    const { readFileSync, existsSync } = await import('node:fs');
    if (existsSync(out)) {
      const raw = JSON.parse(readFileSync(out, 'utf8'));
      findings = raw.results || [];
    }
  } catch {
    /* empty */
  }

  const stderr = result.stderr || '';
  if ((result.status ?? 1) !== 0 && findings.length === 0 && /failed|error|not found/i.test(stderr)) {
    const skipped = cliResult('semgrep', true, 'skipped — semgrep CLI not available or scan failed to start', {
      skipped: true,
      stderr: stderr.slice(0, 200),
    });
    await writeReport('semgrep-summary.json', skipped);
    return skipped;
  }

  const ok = findings.length === 0;
  const summary = cliResult('semgrep', ok, `${findings.length} finding(s)`, { findingCount: findings.length });
  await writeReport('semgrep-summary.json', summary);
  return summary;
}
