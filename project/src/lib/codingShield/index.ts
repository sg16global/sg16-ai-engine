/** Browser Coding Shield — scan pasted code with real local checks, no server. */

export { scanCodeSnippet, type ScanSnippetPayload } from './scan';
export { detectLanguage, resolveLanguage, type SnippetLanguage } from './language';
export { checkJsSyntax, checkTsSyntax } from './syntax';
export { lintCode } from './lint';
export { scanSecrets, scanSecretsInText } from './secrets';
export { detectPackages } from './packages';
export { aggregateShieldScore, type ShieldScoreReport } from './score';
export { cliResult, type LintMessage, type SecretFinding, type ToolResult } from './types';
export type { ShieldCategory, ShieldIssue, ShieldScanResponse } from './types';
