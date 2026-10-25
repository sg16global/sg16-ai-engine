/**
 * Secret scanning — ported from coding-shield/lib/secret-patterns.mjs.
 * The same built-in rules the server used when the Gitleaks CLI was unavailable.
 */

import { cliResult, type SecretFinding, type ToolResult } from './types';

const RULES = [
  { id: 'aws-key', re: /AKIA[0-9A-Z]{16}/g, severity: 'critical' },
  { id: 'github-token', re: /ghp_[A-Za-z0-9_]{20,}/g, severity: 'critical' },
  { id: 'openai-key', re: /sk-[A-Za-z0-9]{20,}/g, severity: 'critical' },
  { id: 'jwt', re: /eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, severity: 'high' },
  {
    id: 'generic-secret',
    re: /(api[_-]?key|secret|password|token|private[_-]?key)\s*[:=]\s*['"][^'"\s]{8,}['"]/gi,
    severity: 'high',
  },
];

export function scanSecretsInText(text: string, fileLabel = 'snippet'): SecretFinding[] {
  const findings: SecretFinding[] = [];
  for (const rule of RULES) {
    rule.re.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = rule.re.exec(text)) !== null) {
      findings.push({
        ruleId: rule.id,
        severity: rule.severity,
        file: fileLabel,
        line: text.slice(0, match.index).split('\n').length,
        match: match[0].slice(0, 24) + (match[0].length > 24 ? '…' : ''),
      });
    }
  }
  return findings;
}

/** Secret scan as a tool result (Gitleaks CLI is not available in the browser). */
export function scanSecrets(code: string): ToolResult {
  const findings = scanSecretsInText(code, 'snippet');
  return cliResult(
    'secret-patterns',
    findings.length === 0,
    findings.length === 0 ? 'no secrets detected' : `${findings.length} secret(s) detected`,
    { leakCount: findings.length, findings: findings.slice(0, 10) },
  );
}
