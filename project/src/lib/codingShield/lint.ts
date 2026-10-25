import { cliResult, type LintMessage, type ToolResult } from './types';

/**
 * Pattern lint — the browser's honest stand-in for the server's ESLint run.
 *
 * ESLint cannot run in a browser, so these are line-anchored pattern rules in
 * the spirit of the repo's eslint.config.js (no-eval, no-var, SonarJS security
 * rules). Every finding is real and line-numbered; nothing is estimated.
 */

interface PatternRule {
  id: string;
  category: 'security' | 'quality';
  re: RegExp;
  message: string;
  severity: 'error' | 'warning';
}

const RULES: PatternRule[] = [
  {
    id: 'no-eval',
    category: 'security',
    re: /\beval\s*\(/g,
    message: 'eval() executes arbitrary code — a security risk.',
    severity: 'error',
  },
  {
    id: 'no-new-func',
    category: 'security',
    re: /new\s+Function\s*\(/g,
    message: 'new Function() executes arbitrary code — a security risk.',
    severity: 'error',
  },
  {
    id: 'no-implied-eval',
    category: 'security',
    re: /\b(?:setTimeout|setInterval)\s*\(\s*['"]/g,
    message: 'Passing a string to setTimeout/setInterval executes it as code — pass a function instead.',
    severity: 'error',
  },
  {
    id: 'no-inner-html',
    category: 'security',
    re: /\.innerHTML\s*=/g,
    message: 'Assigning innerHTML can inject markup (XSS). Use textContent or sanitize first.',
    severity: 'warning',
  },
  {
    id: 'no-document-write',
    category: 'security',
    re: /document\.write\s*\(/g,
    message: 'document.write() can inject markup (XSS). Build DOM nodes instead.',
    severity: 'warning',
  },
  {
    id: 'hardcoded-credential',
    category: 'security',
    re: /\b(password|passwd|pwd|secret|api[_-]?key)\s*[:=]\s*['"][^'"\s]{4,}['"]/gi,
    message: 'Hardcoded credential — move it to an environment variable.',
    severity: 'error',
  },
  {
    id: 'os-command',
    category: 'security',
    re: /\brequire\s*\(\s*['"]child_process['"]\s*\)|\bexecSync\s*\(|\bspawnSync\s*\(|\bchild_process\s*\.\s*(?:exec|spawn)\s*\(/g,
    message: 'Running system commands from code is a security risk — validate and sandbox any input.',
    severity: 'error',
  },
  {
    id: 'sql-string',
    category: 'security',
    re: /["'`](?:SELECT|INSERT|UPDATE|DELETE)\b[^"'`\n]{0,200}\b(?:FROM|INTO|TABLE)\b[^"'`\n]{0,100}["'`]/gi,
    message: 'SQL built as a string can be injected — use parameterized queries.',
    severity: 'warning',
  },
  {
    id: 'pseudo-random',
    category: 'security',
    re: /Math\.random\s*\(/g,
    message: 'Math.random() is not cryptographically secure — use crypto.getRandomValues() for tokens.',
    severity: 'warning',
  },
  {
    id: 'unverified-certificate',
    category: 'security',
    re: /rejectUnauthorized\s*:\s*false/g,
    message: 'rejectUnauthorized: false disables TLS certificate checks.',
    severity: 'error',
  },
  {
    id: 'insecure-jwt',
    category: 'security',
    re: /\b(?:jwt|jsonwebtoken)\s*\.\s*sign\s*\([^)]*['"]none['"]/g,
    message: 'Signing JWTs with the "none" algorithm is insecure.',
    severity: 'error',
  },
  {
    id: 'no-var',
    category: 'quality',
    re: /(^|[;\n{])\s*var\s+[A-Za-z_$]/g,
    message: 'Use let or const instead of var.',
    severity: 'warning',
  },
  {
    id: 'debugger-statement',
    category: 'quality',
    re: /(^|[;\n{])\s*debugger\s*;/g,
    message: 'Remove the debugger statement.',
    severity: 'warning',
  },
  {
    id: 'http-url',
    category: 'quality',
    re: /['"]http:\/\/(?!localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])/g,
    message: 'Use https:// instead of http://.',
    severity: 'warning',
  },
  {
    id: 'console-output',
    category: 'quality',
    re: /\bconsole\.(?:log|debug|info)\s*\(/g,
    message: 'Remove console output before shipping.',
    severity: 'warning',
  },
];

const MAX_MESSAGES_PER_TOOL = 30;

/**
 * Run the pattern rules over JavaScript/TypeScript code.
 * Returns the quality and security tool results (the two categories the server
 * split ESLint output into).
 */
export function lintCode(code: string): { quality: ToolResult; security: ToolResult } {
  const qualityMessages: LintMessage[] = [];
  const securityMessages: LintMessage[] = [];

  for (const rule of RULES) {
    rule.re.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = rule.re.exec(code)) !== null) {
      const line = code.slice(0, match.index).split('\n').length;
      const entry: LintMessage = {
        line,
        message: `${rule.message} (${rule.id})`,
        ruleId: rule.id,
        severity: rule.severity,
      };
      (rule.category === 'security' ? securityMessages : qualityMessages).push(entry);
      if (qualityMessages.length + securityMessages.length >= MAX_MESSAGES_PER_TOOL * 2) break;
    }
    if (qualityMessages.length + securityMessages.length >= MAX_MESSAGES_PER_TOOL * 2) break;
  }

  const toResult = (tool: string, messages: LintMessage[]): ToolResult => {
    const errors = messages.filter((m) => m.severity === 'error').length;
    const warnings = messages.length - errors;
    return cliResult(
      tool,
      errors === 0,
      errors === 0
        ? warnings === 0
          ? 'no issues found'
          : `${warnings} warning(s)`
        : `${errors} error(s), ${warnings} warning(s)`,
      { errorCount: errors, warnCount: warnings, messages: messages.slice(0, MAX_MESSAGES_PER_TOOL) },
    );
  };

  return { quality: toResult('pattern-quality', qualityMessages), security: toResult('pattern-security', securityMessages) };
}
