/** Built-in secret detection when Gitleaks CLI is unavailable (API + local). */
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

export function scanSecretsInText(text, fileLabel = 'snippet') {
  const findings = [];
  for (const rule of RULES) {
    rule.re.lastIndex = 0;
    let match;
    while ((match = rule.re.exec(text)) !== null) {
      findings.push({
        ruleId: rule.id,
        severity: rule.severity,
        file: fileLabel,
        match: match[0].slice(0, 24) + (match[0].length > 24 ? '…' : ''),
      });
    }
  }
  return findings;
}
