import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { CONFIG, cliResult, writeReport, spawnCli } from './shared.mjs';
import { scanSecretsInText } from './secret-patterns.mjs';

export async function runSecretsOnText(code, fileName = 'snippet.js') {
  const builtIn = scanSecretsInText(code, fileName);
  let gitleaksCount = 0;

  const dir = await mkdtemp(join(tmpdir(), 'sg16-shield-'));
  try {
    const filePath = join(dir, fileName);
    await writeFile(filePath, code, 'utf8');
    const config = join(CONFIG, 'gitleaks.toml');
    const out = join(dir, 'gitleaks.json');
    const result = spawnCli('gitleaks', [
      'detect',
      '--source',
      dir,
      '--config',
      config,
      '--report-path',
      out,
      '--no-git',
    ]);

    if (!result.error && !/not recognized|not found/i.test(result.stderr || '')) {
      try {
        const { readFileSync, existsSync } = await import('node:fs');
        if (existsSync(out)) {
          const leaks = JSON.parse(readFileSync(out, 'utf8'));
          gitleaksCount = Array.isArray(leaks) ? leaks.length : 0;
        }
      } catch {
        /* empty */
      }
    }
  } finally {
    await rm(dir, { recursive: true, force: true });
  }

  const leakCount = Math.max(builtIn.length, gitleaksCount);
  const ok = leakCount === 0;
  const tool = gitleaksCount > 0 || builtIn.length === 0 ? 'gitleaks' : 'secret-patterns';
  const summary = cliResult(
    tool,
    ok,
    ok ? 'no secrets detected' : `${leakCount} secret(s) detected`,
    { leakCount, findings: builtIn.slice(0, 10) },
  );
  await writeReport('secrets-summary.json', summary);
  return summary;
}
