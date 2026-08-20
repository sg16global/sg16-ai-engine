import { join } from 'node:path';
import { ROOT } from './lib/shared.mjs';
import { runEslint } from './lib/run-eslint.mjs';
import { runSemgrep } from './lib/run-semgrep.mjs';
import { runGitleaks } from './lib/run-gitleaks.mjs';
import { runParsers } from './lib/run-parsers.mjs';
import { runRetire } from './lib/run-retire.mjs';
import { runNyc } from './lib/run-nyc.mjs';
import { runSonar } from './lib/run-sonar.mjs';
import { runNpmAudit } from './lib/run-audit.mjs';
import { runTsc } from './lib/run-tsc.mjs';
import { runDepcheck } from './lib/run-depcheck.mjs';
import { aggregateShieldScore } from './lib/score.mjs';
import { scanSnippet } from './lib/scan-snippet.mjs';

const repoRoot = join(ROOT, '..');

const FULL_TOOLS = {
  eslint: () => runEslint(repoRoot),
  semgrep: () => runSemgrep(repoRoot),
  gitleaks: () => runGitleaks(repoRoot),
  parsers: () => runParsers(repoRoot),
  retire: () => runRetire(repoRoot),
  nyc: () => runNyc(),
  sonar: () => runSonar(),
  audit: () => runNpmAudit(),
  tsc: () => runTsc(),
  depcheck: () => runDepcheck(),
};

/** All 7 original + 3 power tools = 10-tool Coding Shield */
export async function runFullShield(target = repoRoot, { only } = {}) {
  const entries = only
    ? [[only, FULL_TOOLS[only]]].filter(([, fn]) => typeof fn === 'function')
    : Object.entries(FULL_TOOLS);

  const results = await Promise.all(entries.map(([, fn]) => fn()));

  const report = aggregateShieldScore(results);
  return { target, ...report, tools: results, scannedAt: new Date().toISOString() };
}

export { scanSnippet, aggregateShieldScore, FULL_TOOLS };
