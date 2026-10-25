import { describe, expect, it } from 'vitest';

import { detectLanguage, resolveLanguage } from './language';
import { lintCode } from './lint';
import { detectPackages } from './packages';
import { scanCodeSnippet } from './scan';
import { scanSecretsInText } from './secrets';
import { aggregateShieldScore } from './score';
import { checkJsSyntax, checkTsSyntax } from './syntax';
import { cliResult, type ToolResult } from './types';

describe('detectLanguage', () => {
  it('detects JavaScript', () => {
    expect(detectLanguage("const x = 1;\nconsole.log(x);")).toBe('javascript');
  });

  it('detects TypeScript by type markers', () => {
    expect(detectLanguage('const x: string = "a";')).toBe('typescript');
    expect(detectLanguage('interface Foo { a: number }')).toBe('typescript');
  });

  it('detects Python', () => {
    expect(detectLanguage('def main():\n    print("hi")')).toBe('python');
  });

  it('detects Java', () => {
    expect(detectLanguage('public class Main { public static void main(String[] args) { System.out.println("hi"); } }')).toBe('java');
  });
});

describe('resolveLanguage', () => {
  it('maps aliases', () => {
    expect(resolveLanguage('ts', 'const a = 1')).toBe('typescript');
    expect(resolveLanguage('py', 'print(1)')).toBe('python');
    expect(resolveLanguage('JS', 'const a = 1')).toBe('javascript');
  });

  it('falls back to detection for auto/unknown', () => {
    expect(resolveLanguage('auto', 'def f(): pass')).toBe('python');
    expect(resolveLanguage(undefined, 'const a = 1;')).toBe('javascript');
  });
});

describe('checkJsSyntax (acorn)', () => {
  it('accepts valid JavaScript', () => {
    const result = checkJsSyntax('const add = (a, b) => a + b;\nexport default add;');
    expect(result.ok).toBe(true);
    expect(result.errorCount).toBe(0);
  });

  it('reports a real syntax error with a line number', () => {
    const result = checkJsSyntax('const a = 1;\nconst b = ;');
    expect(result.ok).toBe(false);
    expect(result.errorCount).toBe(1);
    expect(result.messages?.[0]?.line).toBe(2);
    expect(result.messages?.[0]?.fatal).toBe(true);
  });
});

describe('checkTsSyntax (acorn)', () => {
  it('accepts plain-JS-looking TypeScript', () => {
    expect(checkTsSyntax('const a = 1;').ok).toBe(true);
  });

  it('honestly skips real TypeScript type syntax instead of faking an error', () => {
    const result = checkTsSyntax('const x: string = "a";');
    expect(result.ok).toBe(true);
    expect(result.skipped).toBe(true);
  });

  it('reports a genuine syntax error without type markers', () => {
    const result = checkTsSyntax('const b = ;');
    expect(result.ok).toBe(false);
    expect(result.skipped).toBeUndefined();
  });
});

describe('scanSecretsInText', () => {
  it('finds an AWS key, a GitHub token and an OpenAI key', () => {
    const code = [
      'const aws = "AKIAIOSFODNN7EXAMPLE";',
      'const gh = "ghp_abcdefghijklmnopqrstuvwxyz12";',
      'const oa = "sk-abcdefghijklmnopqrstuvwxyz12";',
    ].join('\n');
    const findings = scanSecretsInText(code);
    const ruleIds = findings.map((f) => f.ruleId).sort();
    expect(ruleIds).toEqual(['aws-key', 'github-token', 'openai-key']);
  });

  it('reports the correct line numbers', () => {
    const findings = scanSecretsInText('const a = 1;\nconst key = "AKIAIOSFODNN7EXAMPLE";');
    expect(findings).toHaveLength(1);
    expect(findings[0].line).toBe(2);
  });

  it('finds generic hardcoded secrets', () => {
    const findings = scanSecretsInText('const config = { api_key: "supersecretvalue123" };');
    expect(findings.some((f) => f.ruleId === 'generic-secret')).toBe(true);
  });

  it('stays quiet on clean code', () => {
    expect(scanSecretsInText('const greeting = "hello world";')).toHaveLength(0);
  });
});

describe('lintCode (pattern rules)', () => {
  it('flags eval as a security error', () => {
    const { security } = lintCode('eval(userInput);');
    expect(security.ok).toBe(false);
    expect(security.messages?.some((m) => m.ruleId === 'no-eval')).toBe(true);
  });

  it('flags innerHTML assignment as a security warning', () => {
    const { security } = lintCode('el.innerHTML = html;');
    expect(security.messages?.some((m) => m.ruleId === 'no-inner-html' && m.severity === 'warning')).toBe(true);
  });

  it('flags hardcoded credentials', () => {
    const { security } = lintCode('const password = "hunter2hunter2";');
    expect(security.messages?.some((m) => m.ruleId === 'hardcoded-credential')).toBe(true);
  });

  it('passes clean code in both categories', () => {
    const { quality, security } = lintCode('export function add(a, b) { return a + b; }');
    expect(quality.ok).toBe(true);
    expect(security.ok).toBe(true);
  });
});

describe('detectPackages', () => {
  it('collects npm imports and builds the install command', () => {
    const result = detectPackages(
      "import React from 'react';\nimport { debounce } from 'lodash';\nrequire('axios');",
      'javascript',
    );
    expect(result.manager).toBe('npm');
    expect(result.packages).toEqual(['react', 'lodash', 'axios']);
    expect(result.installCommand).toBe('npm install react lodash axios');
  });

  it('maps Python imports to pip and filters the stdlib', () => {
    const result = detectPackages('import os\nimport json\nimport requests\nfrom flask import Flask', 'python');
    expect(result.manager).toBe('pip');
    expect(result.packages).toEqual(['flask', 'requests']);
    expect(result.installCommand).toBe('pip install flask requests');
  });

  it('returns null manager when nothing is imported', () => {
    const result = detectPackages('const a = 1;', 'javascript');
    expect(result.manager).toBe('npm');
    expect(result.packages).toEqual([]);
    expect(result.installCommand).toBeNull();
  });
});

describe('aggregateShieldScore', () => {
  const ok = (tool: string): ToolResult => cliResult(tool, true, 'clean', { errorCount: 0 });

  it('scores a clean run high with a top grade', () => {
    const report = aggregateShieldScore([
      ok('acorn'),
      ok('pattern-quality'),
      ok('pattern-security'),
      ok('secret-patterns'),
    ]);
    expect(report.score).toBe(100);
    expect(report.grade).toBe('A+');
    expect(report.toolsActive).toBe(4);
    expect(report.toolsSkipped).toBe(0);
  });

  it('caps the score at 45 when syntax fails', () => {
    const report = aggregateShieldScore([
      cliResult('acorn', false, 'syntax error on line 2', { errorCount: 1 }),
      ok('pattern-quality'),
      ok('pattern-security'),
    ]);
    expect(report.score).toBeLessThanOrEqual(45);
    expect(report.grade).toBe('F');
  });

  it('caps the score at 69 when security issues exist', () => {
    const report = aggregateShieldScore([
      ok('acorn'),
      cliResult('pattern-security', false, '1 issue', {
        messages: [{ line: 1, message: 'eval used', severity: 'error', ruleId: 'no-eval' }],
      }),
      ok('pattern-quality'),
    ]);
    expect(report.score).toBeLessThanOrEqual(69);
    expect(report.issues[0].category).toBe('security');
  });

  it('excludes skipped tools from the score and marks the report limited', () => {
    const report = aggregateShieldScore([
      ok('acorn'),
      cliResult('semgrep', true, 'skipped — server only', { skipped: true }),
    ]);
    expect(report.toolsSkipped).toBe(1);
    expect(report.limited).toBe(true);
    expect(report.categories.coverage.score).toBeNull();
  });
});

describe('scanCodeSnippet (end to end)', () => {
  it('returns a full report for clean JavaScript', async () => {
    const report = await scanCodeSnippet({ code: 'export function add(a, b) { return a + b; }' });
    expect(report.ok).toBe(true);
    expect(report.language).toBe('javascript');
    expect(report.mode).toBe('fast');
    expect(report.fixedCode).toBeNull();
    expect(report.score).toBeGreaterThanOrEqual(90);
    expect(report.dependencies.manager).toBe('npm');
    expect(report.tools.every((t) => t.tool !== 'semgrep')).toBe(true);
  });

  it('caps the score and lists the finding when a secret is pasted', async () => {
    const report = await scanCodeSnippet({ code: 'const key = "AKIAIOSFODNN7EXAMPLE";' });
    expect(report.score).toBeLessThanOrEqual(69);
    expect(report.issues.some((i) => i.category === 'security')).toBe(true);
  });

  it('honestly skips server-only tools in deep mode', async () => {
    const report = await scanCodeSnippet({ code: 'const a = 1;', mode: 'deep' });
    const semgrep = report.tools.find((t) => t.tool === 'semgrep');
    expect(semgrep?.skipped).toBe(true);
    expect(report.limited).toBe(true);
  });

  it('marks Python scans as limited (no browser Python checker)', async () => {
    const report = await scanCodeSnippet({ code: 'def main():\n    print("hi")' });
    expect(report.language).toBe('python');
    expect(report.limited).toBe(true);
    expect(report.dependencies.manager).toBe('pip');
  });

  it('rejects empty and oversized input', async () => {
    await expect(scanCodeSnippet({ code: '   ' })).rejects.toThrow('Code is required');
    await expect(scanCodeSnippet({ code: 'x'.repeat(120_001) })).rejects.toThrow('Code too large');
  });
});
