import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { ROOT, cliResult, writeReport } from './shared.mjs';

export async function runDepcheck(cwd = join(ROOT, '..', 'project')) {
  const result = spawnSync(
    process.platform === 'win32' ? 'npx.cmd' : 'npx',
    ['depcheck', '--json'],
    { cwd, encoding: 'utf8' },
  );

  let unusedCount = 0;
  try {
    const raw = JSON.parse(result.stdout || '{}');
    unusedCount = Array.isArray(raw.dependencies) ? raw.dependencies.length : 0;
  } catch {
    unusedCount = 0;
  }

  const ok = unusedCount === 0;
  const summary = cliResult(
    'depcheck',
    ok,
    ok ? 'no unused dependencies' : `${unusedCount} unused dependency(ies)`,
    { unusedCount },
  );
  await writeReport('depcheck-summary.json', summary);
  return summary;
}
