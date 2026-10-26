/**
 * Language detection — ported from coding-shield/lib/language.mjs.
 * Pure heuristics on the pasted code; no server, no backtracking across lines.
 */

const ALIASES: Record<string, string> = {
  js: 'javascript',
  jsx: 'javascript',
  javascript: 'javascript',
  ts: 'typescript',
  tsx: 'typescript',
  typescript: 'typescript',
  py: 'python',
  python: 'python',
  java: 'java',
};

export type SnippetLanguage = 'javascript' | 'typescript' | 'python' | 'java';

/** Guess the language from the code itself (used when the client sends "auto" or an unknown name). */
export function detectLanguage(code: string): SnippetLanguage {
  const c = String(code);
  if (/public\s+static\s+void\s+main|System\.out\.print/.test(c)) return 'java';

  // Line-local patterns only ([ \t], bounded runs): this runs on pasted code, so no regex may backtrack across lines.
  const pythonSigns = [
    /^[ \t]*def [A-Za-z_]\w*[ \t]*\(/m,
    /^[ \t]*from [\w.]+ import /m,
    /^[ \t]*import [\w.]+[ \t]*$/m,
    /^[ \t]*(?:if|elif|for|while|with|try|except|class)\b[^\n{;]*:[ \t]*$/m,
    /^[ \t]*print\(/m,
  ].filter((re) => re.test(c)).length;
  const jsSigns = [
    /\b(?:const|let|var)[ \t]+\w+[ \t]*=/,
    /=>/,
    /\bfunction\b[ \t]*\w*[ \t]*\(/,
    /\bimport[ \t][^\n]{0,200}\bfrom[ \t]+['"]/,
    /\brequire\([ \t]*['"]/,
    /;[ \t]*$/m,
    /\{[ \t]*$/m,
  ].filter((re) => re.test(c)).length;

  if (pythonSigns > jsSigns) return 'python';
  if (/:[ \t]*(?:string|number|boolean|any|void|unknown)\b|\binterface[ \t]+\w+[ \t]*\{|\btype[ \t]+\w+[ \t]*=/.test(c)) return 'typescript';
  return 'javascript';
}

export function resolveLanguage(language: string | undefined, code: string): SnippetLanguage {
  const mapped = ALIASES[String(language || '').trim().toLowerCase()];
  if (mapped) return mapped as SnippetLanguage;
  return detectLanguage(code);
}
