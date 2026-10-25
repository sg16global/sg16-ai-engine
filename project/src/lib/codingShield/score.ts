import type { ShieldCategory, ShieldIssue, ToolResult } from './types';

/**
 * Score aggregation — ported from coding-shield/lib/score.mjs, unchanged.
 * Honest scoring: categories no tool checked are excluded from the weighted
 * score, syntax errors cap the score, and security problems cap it lower.
 */

const WEIGHTS: Record<string, number> = {
  security: 0.28,
  quality: 0.22,
  syntax: 0.12,
  dependencies: 0.18,
  coverage: 0.08,
  types: 0.12,
};

const TOOL_CATEGORY: Record<string, string> = {
  // Browser tools
  acorn: 'syntax',
  'pattern-quality': 'quality',
  'pattern-security': 'security',
  'secret-patterns': 'security',
  // Server tools (kept so reports from either side score identically)
  eslint: 'quality',
  'sonarqube-sonarlint': 'quality',
  'eslint-security': 'security',
  semgrep: 'security',
  gitleaks: 'security',
  'acorn-esprima': 'syntax',
  'python-syntax': 'syntax',
  'retire.js': 'dependencies',
  'npm-audit': 'dependencies',
  depcheck: 'dependencies',
  'istanbul-nyc': 'coverage',
  tsc: 'types',
};

/** Points lost per issue, and the most one category can lose. Security problems cost the most. */
const PENALTY: Record<string, { perIssue: number; max: number }> = {
  security: { perIssue: 25, max: 75 },
  syntax: { perIssue: 100, max: 100 },
  quality: { perIssue: 6, max: 45 },
};

const DEFAULT_PENALTY = { perIssue: 8, max: 40 };

/** Code that does not parse cannot score above F; any security problem caps the score at C. */
const SYNTAX_ERROR_CAP = 45;
const SECURITY_ISSUE_CAP = 69;

function issueCount(r: ToolResult): number {
  return (
    r.errorCount ??
    r.leakCount ??
    (r.findings?.length) ??
    (r.messages?.length) ??
    (r.ok ? 0 : 1)
  );
}

/** One flat list of what to fix, with line numbers where the tool gives them. */
function collectIssues(active: ToolResult[]): ShieldIssue[] {
  const issues: ShieldIssue[] = [];
  for (const r of active) {
    const category = TOOL_CATEGORY[r.tool] || 'quality';
    for (const m of r.messages || []) {
      issues.push({ tool: r.tool, category, line: m.line ?? null, message: m.message, severity: m.severity || 'error' });
    }
    for (const f of r.findings || []) {
      issues.push({
        tool: r.tool,
        category,
        line: f.line ?? null,
        message: f.message || `Possible secret (${f.ruleId}): ${f.match || ''}`.trim(),
        severity: ['error', 'critical', 'high'].includes(f.severity) ? 'error' : 'warning',
      });
    }
    if (!r.ok && !(r.messages?.length || r.findings?.length)) {
      issues.push({ tool: r.tool, category, line: null, message: r.summary, severity: 'error' });
    }
  }
  const rank: Record<string, number> = { security: 0, syntax: 1, quality: 2 };
  return issues
    .sort(
      (a, b) =>
        (rank[a.category] ?? 3) - (rank[b.category] ?? 3) ||
        (a.severity === b.severity ? 0 : a.severity === 'error' ? -1 : 1) ||
        (a.line ?? 1e9) - (b.line ?? 1e9),
    )
    .slice(0, 50);
}

export interface ShieldScoreReport {
  score: number;
  grade: string;
  categories: Record<string, ShieldCategory>;
  issues: ShieldIssue[];
  topFixes: { tool: string; summary: string }[];
  toolsRun: number;
  toolsActive: number;
  toolsSkipped: number;
  limited: boolean;
}

export function aggregateShieldScore(results: ToolResult[]): ShieldScoreReport {
  const active = results.filter((r) => !r.skipped);
  const categories: Record<string, ShieldCategory> = Object.fromEntries(
    Object.keys(WEIGHTS).map((cat) => [cat, { score: null, issues: 0, tools: [] as string[] }]),
  );

  for (const r of active) {
    const cat = TOOL_CATEGORY[r.tool] || 'quality';
    const c = categories[cat];
    if (c.score === null) c.score = 100;
    c.tools.push(r.tool);
    const count = issueCount(r);
    const { perIssue, max } = PENALTY[cat] || DEFAULT_PENALTY;
    c.issues += count;
    c.score = Math.max(0, c.score - Math.min(max, count * perIssue));
    if (!r.ok) c.score = Math.min(c.score, 70);
  }

  // Only categories a tool actually checked count. An unchecked category is unknown, not 100%.
  let totalWeight = 0;
  let score = 0;
  for (const [cat, weight] of Object.entries(WEIGHTS)) {
    if (categories[cat].score === null) continue;
    totalWeight += weight;
    score += (categories[cat].score as number) * weight;
  }
  score = totalWeight ? score / totalWeight : 0;

  if (categories.syntax.issues > 0) score = Math.min(score, SYNTAX_ERROR_CAP);
  if (categories.security.issues > 0) score = Math.min(score, SECURITY_ISSUE_CAP);

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
    issues: collectIssues(active),
    topFixes,
    toolsRun: results.length,
    toolsActive: active.length,
    toolsSkipped: results.filter((r) => r.skipped).length,
    limited: results.some((r) => r.skipped),
  };
}
