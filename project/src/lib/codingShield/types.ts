/**
 * Coding Shield — browser port of coding-shield/lib/scan-snippet.mjs.
 *
 * The server ran ESLint / Semgrep / Gitleaks / Acorn / Python. In the browser
 * the honest equivalents are: Acorn for JS syntax, pattern rules for security
 * and quality, and regex secret scanning. Tools that need a server are marked
 * `skipped` — never faked.
 */

export type ShieldCategory = {
  /** null when no tool checked this category */
  score: number | null;
  issues: number;
  tools: string[];
};

export type ShieldIssue = {
  tool: string;
  category: string;
  line: number | null;
  message: string;
  severity: 'error' | 'warning';
};

export type ShieldScanResponse = {
  ok: boolean;
  shield: string;
  subdomain?: string;
  score: number;
  grade: string;
  mode: 'fast' | 'deep';
  language: string;
  categories: Record<string, ShieldCategory>;
  issues: ShieldIssue[];
  topFixes: { tool: string; summary: string }[];
  tools: { tool: string; ok: boolean; summary: string; skipped?: boolean }[];
  /** true when some checks do not apply to this language */
  limited: boolean;
  /** code after safe automatic fixes, when a tool changed anything (null in the browser) */
  fixedCode: string | null;
  dependencies: { manager: 'npm' | 'pip' | null; packages: string[]; installCommand: string | null };
  scannedAt: string;
  error?: string;
  upgrade?: boolean;
};

/* ── Tool results (shared shape, ported from coding-shield/lib/shared.mjs) ── */

export interface LintMessage {
  line: number | null;
  column?: number;
  message: string;
  ruleId?: string;
  severity: 'error' | 'warning';
  fatal?: boolean;
}

export interface SecretFinding {
  ruleId: string;
  severity: string;
  file: string;
  line: number;
  match: string;
  /** Gitleaks-style findings carry a message; the built-in pattern rules do not. */
  message?: string;
}

export interface ToolResult {
  tool: string;
  ok: boolean;
  summary: string;
  at: string;
  errorCount?: number;
  warnCount?: number;
  leakCount?: number;
  messages?: LintMessage[];
  findings?: SecretFinding[];
  skipped?: boolean;
  fixable?: boolean;
}

export function cliResult(tool: string, ok: boolean, summary: string, details: Partial<ToolResult> = {}): ToolResult {
  return { tool, ok, summary, at: new Date().toISOString(), ...details };
}
