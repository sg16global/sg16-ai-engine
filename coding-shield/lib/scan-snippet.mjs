import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import * as acorn from 'acorn';
import * as esprima from 'esprima';
import { ESLint } from 'eslint';
import { CONFIG, cliResult } from './shared.mjs';
import { runSecretsOnText } from './run-secrets.mjs';
import { aggregateShieldScore } from './score.mjs';
import { checkPythonSyntax, resolveLanguage } from './language.mjs';
import { detectPackages } from './packages.mjs';

const EXTENSIONS = { javascript: '.js', typescript: '.ts', python: '.py', java: '.java' };
const LINTED = new Set(['javascript', 'typescript']);

/** ESLint / SonarJS rules that point at security risks; they count toward the security score. */
const SECURITY_RULES = new Set([
  'no-eval',
  'no-implied-eval',
  'no-new-func',
  'sonarjs/code-eval',
  'sonarjs/no-hardcoded-passwords',
  'sonarjs/no-hardcoded-secrets',
  'sonarjs/os-command',
  'sonarjs/sql-queries',
  'sonarjs/insecure-cookie',
  'sonarjs/insecure-jwt-token',
  'sonarjs/hashing',
  'sonarjs/weak-ssl',
  'sonarjs/pseudo-random',
  'sonarjs/unverified-certificate',
]);

function parseJsSyntax(code) {
  try {
    acorn.parse(code, { ecmaVersion: 'latest', sourceType: 'module' });
    return cliResult('acorn-esprima', true, 'syntax valid (Acorn)', { errorCount: 0 });
  } catch (acornErr) {
    try {
      esprima.parseScript(code, { loc: true });
      return cliResult('acorn-esprima', true, 'syntax valid (Esprima)', { errorCount: 0 });
    } catch {
      const line = acornErr.loc?.line;
      return cliResult('acorn-esprima', false, `syntax error${line ? ` on line ${line}` : ''}: ${acornErr.message}`, {
        errorCount: 1,
        messages: [{ line, message: `Syntax error: ${acornErr.message.replace(/ ?\(\d+:\d+\)$/, '')}` }],
      });
    }
  }
}

function eslintFor(fix) {
  return new ESLint({
    overrideConfigFile: join(CONFIG, 'eslint.config.js'),
    cwd: join(CONFIG, '..', '..'),
    fix,
  });
}

/** ESLint report (all messages, line by line) plus the auto-fixed code when ESLint could fix something. */
async function lintSnippet(code, filePath) {
  const [result] = await eslintFor(false).lintText(code, { filePath });
  const messages = (result?.messages || []).map((m) => ({
    line: m.line,
    column: m.column,
    message: m.message,
    ruleId: m.ruleId,
    severity: m.fatal ? 'error' : m.severity === 2 ? 'error' : 'warning',
    fatal: Boolean(m.fatal),
  }));

  let fixedCode = null;
  if (!messages.some((m) => m.fatal)) {
    const [fixed] = await eslintFor(true).lintText(code, { filePath });
    if (typeof fixed?.output === 'string' && fixed.output !== code) fixedCode = fixed.output;
  }

  // A parse error is reported once, as a syntax issue — not again as a lint error.
  const fatal = messages.filter((m) => m.fatal);
  const security = messages.filter((m) => !m.fatal && SECURITY_RULES.has(m.ruleId));
  const quality = messages.filter((m) => !m.fatal && !SECURITY_RULES.has(m.ruleId));
  const errorCount = quality.filter((m) => m.severity === 'error').length;
  const warnCount = quality.length - errorCount;

  const lint = cliResult('eslint', errorCount === 0, `${errorCount} error(s), ${warnCount} warning(s)`, {
    errorCount,
    warnCount,
    messages: quality.slice(0, 30),
    fixable: Boolean(fixedCode),
  });
  const lintSecurity = cliResult(
    'eslint-security',
    security.length === 0,
    security.length ? `${security.length} security issue(s)` : 'no security issues',
    { errorCount: security.length, messages: security },
  );
  return { lint, lintSecurity, fatal, fixedCode };
}

async function semgrepSnippet(code, fileName) {
  const dir = await mkdtemp(join(tmpdir(), 'sg16-deep-'));
  try {
    await writeFile(join(dir, fileName), code, 'utf8');
    const { runSemgrep } = await import('./run-semgrep.mjs');
    return await runSemgrep(dir, { outFile: join(dir, 'semgrep.json') });
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

export async function scanSnippet({ code, language = 'auto', mode = 'fast' }) {
  const trimmed = String(code || '').trim();
  if (!trimmed) {
    throw new Error('Code is required');
  }
  if (trimmed.length > 120_000) {
    throw new Error('Code too large (max 120KB)');
  }

  const lang = resolveLanguage(language, trimmed);
  const fileName = `snippet${EXTENSIONS[lang] || '.txt'}`;
  const results = [];
  let fixedCode = null;

  if (LINTED.has(lang)) {
    const { lint, lintSecurity, fatal, fixedCode: fixed } = await lintSnippet(trimmed, join('project', 'src', fileName));
    fixedCode = fixed;
    if (lang === 'javascript') {
      results.push(parseJsSyntax(trimmed));
    } else {
      // Acorn cannot read TypeScript; the TypeScript parser inside ESLint reports its syntax errors.
      results.push(
        fatal.length
          ? cliResult('acorn-esprima', false, `syntax error on line ${fatal[0].line}: ${fatal[0].message}`, {
              errorCount: fatal.length,
              messages: fatal.map((m) => ({ line: m.line, message: m.message })),
            })
          : cliResult('acorn-esprima', true, 'syntax valid (TypeScript parser)', { errorCount: 0 }),
      );
    }
    results.push(lint, lintSecurity);
  } else if (lang === 'python') {
    results.push(checkPythonSyntax(trimmed));
    results.push(cliResult('eslint', true, 'skipped — ESLint checks JavaScript/TypeScript only', { skipped: true }));
  } else {
    results.push(cliResult('acorn-esprima', true, `skipped — no syntax checker for ${lang}`, { skipped: true }));
    results.push(cliResult('eslint', true, 'skipped — ESLint checks JavaScript/TypeScript only', { skipped: true }));
  }

  results.push(await runSecretsOnText(trimmed, fileName));

  if (mode === 'deep') {
    results.push(await semgrepSnippet(trimmed, fileName));
  }

  const report = aggregateShieldScore(results);
  return {
    mode,
    language: lang,
    ...report,
    fixedCode,
    dependencies: detectPackages(trimmed, lang),
    tools: results,
    scannedAt: new Date().toISOString(),
  };
}
