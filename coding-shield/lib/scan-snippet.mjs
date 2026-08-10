import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { tmpdir } from 'node:os';
import * as acorn from 'acorn';
import * as esprima from 'esprima';
import { ESLint } from 'eslint';
import { CONFIG, cliResult } from './shared.mjs';
import { runSecretsOnText } from './run-secrets.mjs';
import { aggregateShieldScore } from './score.mjs';

function extForLanguage(language) {
  const map = {
    javascript: '.js',
    typescript: '.ts',
    ts: '.ts',
    js: '.js',
    python: '.py',
    java: '.java',
  };
  return map[language?.toLowerCase()] || '.js';
}

function parseSyntax(code, fileName) {
  const ext = extname(fileName);
  if (ext === '.py' || ext === '.java') {
    return { ok: true, summary: 'syntax check skipped for non-JS language' };
  }
  try {
    acorn.parse(code, { ecmaVersion: 'latest', sourceType: 'module' });
    return cliResult('acorn-esprima', true, 'syntax valid (Acorn)', { errorCount: 0 });
  } catch {
    try {
      esprima.parseScript(code, { loc: true });
      return cliResult('acorn-esprima', true, 'syntax valid (Esprima)', { errorCount: 0 });
    } catch (err) {
      return cliResult('acorn-esprima', false, `syntax error: ${err.message}`, { errorCount: 1 });
    }
  }
}

async function lintSnippet(code, fileName) {
  const eslint = new ESLint({
    overrideConfigFile: join(CONFIG, 'eslint.config.js'),
    cwd: join(CONFIG, '..', '..'),
  });
  const results = await eslint.lintText(code, { filePath: fileName });
  const errorCount = results.reduce((n, r) => n + r.errorCount, 0);
  const warnCount = results.reduce((n, r) => n + r.warningCount, 0);
  const messages = results.flatMap((r) =>
    (r.messages || []).slice(0, 5).map((m) => ({
      line: m.line,
      message: m.message,
      ruleId: m.ruleId,
    })),
  );
  return cliResult(
    'eslint',
    errorCount === 0,
    `${errorCount} error(s), ${warnCount} warning(s)`,
    { errorCount, warnCount, messages },
  );
}

export async function scanSnippet({ code, language = 'javascript', mode = 'fast' }) {
  const trimmed = String(code || '').trim();
  if (!trimmed) {
    throw new Error('Code is required');
  }
  if (trimmed.length > 120_000) {
    throw new Error('Code too large (max 120KB)');
  }

  const fileName = `snippet${extForLanguage(language)}`;
  const results = [];

  results.push(parseSyntax(trimmed, fileName));
  results.push(await lintSnippet(trimmed, join('project', 'src', fileName)));
  results.push(await runSecretsOnText(trimmed, fileName));

  if (mode === 'deep') {
    const dir = await mkdtemp(join(tmpdir(), 'sg16-deep-'));
    try {
      await writeFile(join(dir, fileName), trimmed, 'utf8');
      const { runSemgrep } = await import('./run-semgrep.mjs');
      results.push(await runSemgrep(dir));
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  }

  const report = aggregateShieldScore(results);
  return {
    mode,
    language,
    ...report,
    tools: results,
    scannedAt: new Date().toISOString(),
  };
}
