import { runFullShield } from './engine.mjs';
import { ROOT, writeReport } from './lib/shared.mjs';
import { join } from 'node:path';

const repoRoot = join(ROOT, '..');
const target = process.argv[2] || repoRoot;
const only = process.argv[3] || null;

async function main() {
  console.log('SG16 Coding Shield — Super Brain Stack');
  console.log('Target:', target);
  console.log('Tools: 7 core + npm-audit + tsc + depcheck\n');

  const report = await runFullShield(target, { only: only || undefined });

  for (const r of report.tools) {
    const tag = r.skipped ? 'SKIP' : r.ok ? ' OK ' : 'FAIL';
    console.log(`[${tag}] ${r.tool}: ${r.summary}`);
  }

  await writeReport('shield-report.json', report);

  console.log('\n--- Coding Shield complete ---');
  console.log('Score:', report.score + '/100', report.grade);
  console.log('Report: coding-shield/reports/shield-report.json');

  const failed = report.tools.filter((r) => !r.ok && !r.skipped);
  if (failed.length) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
