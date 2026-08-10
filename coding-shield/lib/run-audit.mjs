import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { ROOT, cliResult, writeReport } from './shared.mjs';

export async function runNpmAudit(cwd = join(ROOT, '..', 'backend')) {
  const result = spawnSync(
    process.platform === 'win32' ? 'npm.cmd' : 'npm',
    ['audit', '--json'],
    { cwd, encoding: 'utf8' },
  );

  let auditCount = 0;
  let critical = 0;
  try {
    const raw = JSON.parse(result.stdout || '{}');
    if (raw.metadata?.vulnerabilities) {
      const v = raw.metadata.vulnerabilities;
      auditCount = (v.critical || 0) + (v.high || 0) + (v.moderate || 0) + (v.low || 0);
      critical = v.critical || 0;
    }
  } catch {
    auditCount = result.status === 0 ? 0 : 1;
  }

  const ok = critical === 0 && auditCount === 0;
  const summary = cliResult(
    'npm-audit',
    ok,
    ok ? 'no known dependency vulnerabilities' : `${auditCount} npm advisory(ies) (${critical} critical)`,
    { auditCount, critical },
  );
  await writeReport('audit-summary.json', summary);
  return summary;
}
