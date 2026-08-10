import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { ROOT, cliResult, writeReport } from './shared.mjs';

export async function runTsc() {
  const projectDir = join(ROOT, '..', 'project');
  const result = spawnSync(
    process.platform === 'win32' ? 'npx.cmd' : 'npx',
    ['tsc', '--noEmit', '-p', 'tsconfig.app.json'],
    { cwd: projectDir, encoding: 'utf8' },
  );

  const output = (result.stdout || '') + (result.stderr || '');
  const errorCount = (output.match(/error TS\d+:/g) || []).length;
  const ok = errorCount === 0;

  const summary = cliResult(
    'tsc',
    ok,
    ok ? 'TypeScript types clean' : `${errorCount} type error(s)`,
    { errorCount },
  );
  await writeReport('tsc-summary.json', summary);
  return summary;
}
