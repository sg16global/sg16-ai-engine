const WEIGHTS = {
  security: 0.28,
  quality: 0.22,
  syntax: 0.12,
  dependencies: 0.18,
  coverage: 0.08,
  types: 0.12,
};

const TOOL_CATEGORY = {
  eslint: 'quality',
  'sonarqube-sonarlint': 'quality',
  semgrep: 'security',
  gitleaks: 'security',
  'secret-patterns': 'security',
  'acorn-esprima': 'syntax',
  'retire.js': 'dependencies',
  'npm-audit': 'dependencies',
  depcheck: 'dependencies',
  'istanbul-nyc': 'coverage',
  tsc: 'types',
};

export function aggregateShieldScore(results) {
  const active = results.filter((r) => !r.skipped);
  const categories = {
    security: { score: 100, issues: 0, tools: [] },
    quality: { score: 100, issues: 0, tools: [] },
    syntax: { score: 100, issues: 0, tools: [] },
    dependencies: { score: 100, issues: 0, tools: [] },
    coverage: { score: 100, issues: 0, tools: [] },
    types: { score: 100, issues: 0, tools: [] },
  };

  for (const r of active) {
    const cat = TOOL_CATEGORY[r.tool] || 'quality';
    categories[cat].tools.push(r.tool);
    const penalty =
      r.errorCount ??
      r.leakCount ??
      r.findingCount ??
      r.vulnCount ??
      r.auditCount ??
      r.unusedCount ??
      (r.ok ? 0 : 1);
    categories[cat].issues += penalty;
    categories[cat].score = Math.max(0, categories[cat].score - Math.min(40, penalty * 8));
    if (!r.ok) categories[cat].score = Math.min(categories[cat].score, 70);
  }

  const usedWeights = { ...WEIGHTS };
  if (!categories.coverage.tools.length) {
    usedWeights.syntax += usedWeights.coverage / 2;
    usedWeights.quality += usedWeights.coverage / 2;
    usedWeights.coverage = 0;
  }
  if (!categories.types.tools.length) {
    usedWeights.quality += usedWeights.types;
    usedWeights.types = 0;
  }

  const totalWeight = Object.values(usedWeights).reduce((a, b) => a + b, 0);
  let score = 0;
  for (const [cat, weight] of Object.entries(usedWeights)) {
    if (weight <= 0) continue;
    score += (categories[cat].score * weight) / totalWeight;
  }

  const grade =
    score >= 95 ? 'A+' :
    score >= 90 ? 'A' :
    score >= 85 ? 'B+' :
    score >= 75 ? 'B' :
    score >= 65 ? 'C' :
    score >= 50 ? 'D' : 'F';

  const topFixes = active
    .filter((r) => !r.ok)
    .slice(0, 5)
    .map((r) => ({ tool: r.tool, summary: r.summary }));

  return {
    score: Math.round(score),
    grade,
    categories,
    topFixes,
    toolsRun: results.length,
    toolsActive: active.length,
    toolsSkipped: results.filter((r) => r.skipped).length,
  };
}
