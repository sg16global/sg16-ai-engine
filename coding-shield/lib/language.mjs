import { spawnSync } from 'node:child_process';
import { cliResult } from './shared.mjs';

const ALIASES = {
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

/** Guess the language from the code itself (used when the client sends "auto" or an unknown name). */
export function detectLanguage(code) {
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

export function resolveLanguage(language, code) {
  return ALIASES[String(language || '').trim().toLowerCase()] || detectLanguage(code);
}

let pythonBin;

/** python3 on the server image, python on Windows; null when neither is installed. */
function findPython() {
  if (pythonBin !== undefined) return pythonBin;
  pythonBin = null;
  for (const bin of ['python3', 'python']) {
    const r = spawnSync(bin, ['--version'], { encoding: 'utf8', windowsHide: true });
    if (!r.error && r.status === 0) {
      pythonBin = bin;
      break;
    }
  }
  return pythonBin;
}

export function runPython(script, input = '') {
  const bin = findPython();
  if (!bin) return null;
  return spawnSync(bin, ['-c', script], { input, encoding: 'utf8', windowsHide: true, timeout: 15_000 });
}

const SYNTAX_SCRIPT = `import ast, json, sys
try:
    ast.parse(sys.stdin.buffer.read())
    print(json.dumps({"ok": True}))
except SyntaxError as e:
    print(json.dumps({"ok": False, "line": e.lineno, "message": e.msg}))`;

export function checkPythonSyntax(code) {
  const r = runPython(SYNTAX_SCRIPT, code);
  let parsed = null;
  try {
    parsed = r && r.status === 0 ? JSON.parse(r.stdout.trim().split('\n').pop()) : null;
  } catch {
    parsed = null;
  }
  if (!parsed) return cliResult('python-syntax', true, 'skipped — Python not available', { skipped: true });
  if (parsed.ok) return cliResult('python-syntax', true, 'syntax valid (Python)', { errorCount: 0 });
  return cliResult('python-syntax', false, `syntax error on line ${parsed.line}: ${parsed.message}`, {
    errorCount: 1,
    messages: [{ line: parsed.line, message: `Syntax error: ${parsed.message}` }],
  });
}
