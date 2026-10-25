import { resolveLanguage } from './language';
import { lintCode } from './lint';
import { detectPackages } from './packages';
import { scanSecrets } from './secrets';
import { aggregateShieldScore } from './score';
import { checkJsSyntax, checkTsSyntax } from './syntax';
import { cliResult, type ShieldScanResponse, type ToolResult } from './types';

/**
 * One pasted snippet → a real Coding Shield report, entirely in the browser.
 * Ported from coding-shield/lib/scan-snippet.mjs; server-only tools (ESLint,
 * Semgrep, Python, Gitleaks CLI) are honestly marked skipped.
 */

export interface ScanSnippetPayload {
  code: string;
  language?: string;
  mode?: 'fast' | 'deep';
}

export async function scanCodeSnippet(payload: ScanSnippetPayload): Promise<ShieldScanResponse> {
  const trimmed = String(payload.code || '').trim();
  if (!trimmed) {
    throw new Error('Code is required');
  }
  if (trimmed.length > 120_000) {
    throw new Error('Code too large (max 120KB)');
  }

  const mode = payload.mode === 'deep' ? 'deep' : 'fast';
  const lang = resolveLanguage(payload.language ?? 'auto', trimmed);
  const results: ToolResult[] = [];

  if (lang === 'javascript') {
    results.push(checkJsSyntax(trimmed));
  } else if (lang === 'typescript') {
    results.push(checkTsSyntax(trimmed));
  } else if (lang === 'python') {
    results.push(
      cliResult('python-syntax', true, 'skipped — Python syntax checks run on your machine (npm run shield), not in the browser', {
        skipped: true,
      }),
    );
  } else {
    results.push(cliResult('acorn', true, `skipped — no syntax checker for ${lang} in the browser`, { skipped: true }));
  }

  if (lang === 'javascript' || lang === 'typescript') {
    const { quality, security } = lintCode(trimmed);
    results.push(quality, security);
  } else {
    results.push(cliResult('pattern-quality', true, 'skipped — pattern checks cover JavaScript/TypeScript only', { skipped: true }));
  }

  results.push(scanSecrets(trimmed));

  if (mode === 'deep') {
    results.push(
      cliResult('semgrep', true, 'skipped — Semgrep runs on your machine (npm run shield), not in the browser', { skipped: true }),
    );
  }

  const report = aggregateShieldScore(results);
  return {
    ok: true,
    shield: 'coding',
    score: report.score,
    grade: report.grade,
    mode,
    language: lang,
    categories: report.categories,
    issues: report.issues,
    topFixes: report.topFixes,
    tools: results.map((r) => ({ tool: r.tool, ok: r.ok, summary: r.summary, skipped: r.skipped })),
    limited: report.limited,
    // The browser lint has no safe auto-fixer — null is honest (the section stays hidden).
    fixedCode: null,
    dependencies: detectPackages(trimmed, lang),
    scannedAt: new Date().toISOString(),
  };
}
