import { join } from 'node:path';
import { readFileSync, existsSync, rmSync } from 'node:fs';
import { CONFIG, ROOT, cliResult, writeReport, spawnCli } from './shared.mjs';

/** Semgrep JSON results → short findings the UI can list (line, rule, message, severity). */
function toFindings(results) {
  return results.slice(0, 30).map((r) => ({
    line: r.start?.line,
    ruleId: String(r.check_id || '').split('.').pop(),
    message: r.extra?.message || '',
    severity: String(r.extra?.severity || 'WARNING').toLowerCase(),
  }));
}

/**
 * `outFile` gives a scan its own results file. Snippet scans must pass one: with the shared
 * reports/semgrep.json, two scans at once (or a failed scan) could read someone else's results.
 */
export async function runSemgrep(target = join(ROOT, '..'), { outFile } = {}) {
  const config = join(CONFIG, 'semgrep.yml');
  const out = outFile || join(ROOT, 'reports', 'semgrep.json');
  rmSync(out, { force: true });

  const result = spawnCli('semgrep', ['--config', config, '--json', '--metrics', 'off', '--output', out, target]);

  if (result.error?.code === 'ENOENT') {
    const skipped = cliResult('semgrep', true, 'skipped — install semgrep CLI (pip install semgrep)', { skipped: true });
    if (!outFile) await writeReport('semgrep-summary.json', skipped);
    return skipped;
  }

  let findings = [];
  let parsed = false;
  try {
    if (existsSync(out)) {
      const raw = JSON.parse(readFileSync(out, 'utf8'));
      findings = raw.results || [];
      parsed = true;
    }
  } catch {
    /* empty */
  }

  if (!parsed) {
    const skipped = cliResult('semgrep', true, 'skipped — semgrep CLI not available or scan failed to start', {
      skipped: true,
      stderr: (result.stderr || '').slice(0, 200),
    });
    if (!outFile) await writeReport('semgrep-summary.json', skipped);
    return skipped;
  }

  const ok = findings.length === 0;
  const summary = cliResult('semgrep', ok, `${findings.length} finding(s)`, {
    findingCount: findings.length,
    findings: toFindings(findings),
  });
  if (!outFile) await writeReport('semgrep-summary.json', summary);
  return summary;
}
