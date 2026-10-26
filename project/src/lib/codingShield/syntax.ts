import * as acorn from 'acorn';
import { cliResult, type ToolResult } from './types';

/**
 * Syntax checks — Acorn (browser build) for JavaScript. TypeScript type
 * syntax is not readable by Acorn: when the code uses type syntax the check is
 * honestly skipped, otherwise a parse failure is a real syntax error.
 */

interface AcornError {
  message?: string;
  loc?: { line?: number };
}

function syntaxErrorResult(tool: string, err: unknown, fallback: string): ToolResult {
  const e = (err ?? {}) as AcornError;
  const line = typeof e.loc?.line === 'number' ? e.loc.line : null;
  const message = String(e.message ?? fallback).replace(/ \(\d+:\d+\)$/, '');
  return cliResult(tool, false, `syntax error${line ? ` on line ${line}` : ''}: ${message}`, {
    errorCount: 1,
    messages: [{ line, message: `Syntax error: ${message}`, severity: 'error', fatal: true }],
  });
}

/** Parse JavaScript with Acorn (ES latest, modules). */
export function checkJsSyntax(code: string): ToolResult {
  try {
    acorn.parse(code, { ecmaVersion: 'latest', sourceType: 'module' });
    return cliResult('acorn', true, 'syntax valid (Acorn)', { errorCount: 0 });
  } catch (err) {
    return syntaxErrorResult('acorn', err, 'Syntax error');
  }
}

/** TypeScript markers Acorn cannot parse — used to tell "TS syntax" from a real error. */
const TS_MARKERS =
  /:\s*(?:string|number|boolean|any|void|unknown|never|object)\b|\binterface\s+\w+\s*\{|\btype\s+\w+\s*=|<[A-Z]\w+(\[\])?>\s*\(|\bas\s+const\b|\benum\s+\w+|\bimplements\s+\w+|\breadonly\s+\w+(\[\])?\s*:/;

/**
 * Parse TypeScript with Acorn. Type annotations make Acorn fail, so a failure
 * on code with type syntax is reported as skipped (a type-aware checker — tsc —
 * is needed), never as a fake error. Plain-JS-looking failures are real errors.
 */
export function checkTsSyntax(code: string): ToolResult {
  try {
    acorn.parse(code, { ecmaVersion: 'latest', sourceType: 'module' });
    return cliResult('acorn', true, 'syntax valid (Acorn)', { errorCount: 0 });
  } catch (err) {
    if (TS_MARKERS.test(code)) {
      return cliResult('acorn', true, 'skipped — TypeScript type syntax needs a type-aware checker (tsc)', { skipped: true });
    }
    return syntaxErrorResult('acorn', err, 'Syntax error');
  }
}
