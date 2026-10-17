/**
 * SG16 Math Core — exact, verified math so the brain never guesses numbers.
 *
 * Handles arithmetic, percentages, equations (linear / quadratic in one variable),
 * linear systems, derivatives, simplification, and matrix / vector algebra
 * (determinant, inverse, transpose, trace, rank, eigenvalues, products, norms, angles).
 *
 * Every result is computed with mathjs and, for equations, checked by substitution.
 * Returns null when the text is not a math task, so the language model handles it.
 */
import { create, all } from 'mathjs';

const math = create(all, {});

// Keep references before locking down the expression language (mathjs security guidance).
const evaluate = math.evaluate;
const parse = math.parse;
const simplify = math.simplify;
const derivative = math.derivative;

math.import(
  {
    import() { throw new Error('Function import is disabled'); },
    createUnit() { throw new Error('Function createUnit is disabled'); },
    reviver() { throw new Error('Function reviver is disabled'); },
    evaluate() { throw new Error('Function evaluate is disabled'); },
    parse() { throw new Error('Function parse is disabled'); },
    simplify() { throw new Error('Function simplify is disabled'); },
    derivative() { throw new Error('Function derivative is disabled'); },
    resolve() { throw new Error('Function resolve is disabled'); },
  },
  { override: true },
);

const MAX_INPUT = 600;
const MAX_MATRIX_DIM = 12;
const MAX_UNKNOWNS = 6;
const EPS = 1e-9;
const CONSTANTS = new Set(['pi', 'e', 'i', 'tau', 'phi', 'Infinity', 'NaN', 'true', 'false']);

// ---------------------------------------------------------------- formatting

function isNear(a, b) {
  return Math.abs(a - b) <= EPS * Math.max(1, Math.abs(a), Math.abs(b));
}

function cleanNumber(x) {
  if (!Number.isFinite(x)) return x;
  const rounded = Math.round(x);
  if (isNear(x, rounded)) return rounded === 0 ? 0 : rounded;
  return Number(x.toPrecision(14));
}

/** Readable exact-looking form: integers, simple fractions, otherwise 12 significant digits. */
export function formatValue(value) {
  if (typeof value === 'number') {
    const x = cleanNumber(value);
    if (!Number.isFinite(x)) return 'undefined (not a finite number, e.g. division by zero)';
    if (Number.isInteger(x)) return String(x);
    try {
      const f = math.fraction(x);
      const d = Number(f.d);
      if (d <= 1000 && isNear(Number(f.s) * (Number(f.n) / d), x)) {
        return `${Number(f.s) < 0 ? '-' : ''}${f.n}/${f.d} (≈ ${math.format(x, { precision: 12 })})`;
      }
    } catch {
      /* not representable as a small fraction */
    }
    return math.format(x, { precision: 12 });
  }
  if (math.isMatrix(value)) return formatValue(value.toArray());
  if (Array.isArray(value)) {
    return `[${value.map((v) => (Array.isArray(v) ? formatValue(v) : formatPlain(v))).join(', ')}]`;
  }
  if (math.isComplex(value)) {
    const re = cleanNumber(value.re);
    const im = cleanNumber(value.im);
    if (im === 0) return formatValue(re);
    return math.format(math.complex(re, im), { precision: 12 });
  }
  return math.format(value, { precision: 12 });
}

function formatPlain(v) {
  if (typeof v === 'number') return math.format(cleanNumber(v), { precision: 12 });
  if (math.isComplex(v)) return formatValue(v);
  return math.format(v, { precision: 12 });
}

// ---------------------------------------------------------------- text → expression

const LEAD =
  /^\s*(?:hey|hi|please|pls|sg16|can you|could you|kindly|now)?[\s,]*(?:please\s+)?(?:what\s+is|what's|whats|calculate|compute|evaluate|solve|find|work\s+out|how\s+much\s+is|tell\s+me|give\s+me|determine|get)?\s*(?:the\s+)?(?:value|answer|result)?\s*(?:of|for)?\s*[:\-]?\s*/i;

function normalizeWords(text) {
  return text
    .replace(/[×✕]/g, '*')
    .replace(/÷/g, '/')
    .replace(/[−–—]/g, '-')
    .replace(/π/g, 'pi')
    .replace(/√\s*\(/g, 'sqrt(')
    .replace(/√\s*([0-9.]+)/g, 'sqrt($1)')
    .replace(/²/g, '^2')
    .replace(/³/g, '^3')
    .replace(/\bsquare\s+root\s+of\s+([0-9.]+)/gi, 'sqrt($1)')
    .replace(/\bcube\s+root\s+of\s+([0-9.]+)/gi, 'cbrt($1)')
    .replace(/([0-9.]+)\s*%\s*of\s*([0-9.]+)/gi, '($1/100)*$2')
    .replace(/\bto\s+the\s+power\s+of\b/gi, '^')
    .replace(/\braised\s+to\b/gi, '^')
    .replace(/\bsquared\b/gi, '^2')
    .replace(/\bcubed\b/gi, '^3')
    .replace(/\bmultiplied\s+by\b|\btimes\b/gi, '*')
    .replace(/\bdivided\s+by\b|\bover\b/gi, '/')
    .replace(/\bplus\b/gi, '+')
    .replace(/\bminus\b/gi, '-')
    .replace(/\bmod(?:ulo)?\b/gi, ' mod ')
    .replace(/(\d)\s*[xX]\s*(?=\d)/g, '$1*');
}

function stripLead(text) {
  // Trailing "!" is kept: in math it is factorial.
  return text.replace(LEAD, '').replace(/[?.\s]+$/, '').trim();
}

/** Names used as free variables in an expression (excludes functions and constants). */
function freeSymbols(node) {
  const names = new Set();
  node.traverse((n, path, parent) => {
    if (n.isSymbolNode && !(parent && parent.isFunctionNode && path === 'fn') && !CONSTANTS.has(n.name)) {
      names.add(n.name);
    }
  });
  return [...names];
}

function isMathLike(expr) {
  return /\d/.test(expr) && /^[\w\s+\-*/^().,!%[\];:<>=|']+$/.test(expr);
}

function isNumericResult(v) {
  return (
    typeof v === 'number' ||
    math.isComplex(v) ||
    math.isFraction(v) ||
    math.isBigNumber(v) ||
    math.isUnit(v) ||
    math.isMatrix(v) ||
    (Array.isArray(v) && v.length > 0)
  );
}

// ---------------------------------------------------------------- matrices & vectors

/** Balanced top-level [...] groups, e.g. "[[1,2],[3,4]] and [5,6]" → two strings. */
function extractBracketGroups(text) {
  const groups = [];
  let depth = 0;
  let start = -1;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '[') {
      if (depth === 0) start = i;
      depth++;
    } else if (text[i] === ']' && depth > 0) {
      depth--;
      if (depth === 0) groups.push(text.slice(start, i + 1));
    }
  }
  return groups;
}

function toMatrix(src) {
  const value = evaluate(src);
  const m = math.isMatrix(value) ? value : math.matrix(value);
  const size = m.size();
  if (size.length > 2 || size.some((d) => d < 1 || d > MAX_MATRIX_DIM)) {
    throw new Error(`Matrices up to ${MAX_MATRIX_DIM}×${MAX_MATRIX_DIM} are supported`);
  }
  m.forEach((v) => {
    if (typeof v !== 'number' || !Number.isFinite(v)) throw new Error('Matrix entries must be numbers');
  });
  return m;
}

/** Rank by Gaussian elimination with partial pivoting. */
export function matrixRank(m) {
  const rows = m.toArray().map((r) => (Array.isArray(r) ? [...r] : [r]));
  const nRows = rows.length;
  const nCols = rows[0].length;
  let rank = 0;
  for (let col = 0; col < nCols && rank < nRows; col++) {
    let pivot = rank;
    for (let r = rank + 1; r < nRows; r++) {
      if (Math.abs(rows[r][col]) > Math.abs(rows[pivot][col])) pivot = r;
    }
    if (Math.abs(rows[pivot][col]) < EPS) continue;
    [rows[rank], rows[pivot]] = [rows[pivot], rows[rank]];
    for (let r = 0; r < nRows; r++) {
      if (r === rank) continue;
      const factor = rows[r][col] / rows[rank][col];
      for (let c = col; c < nCols; c++) rows[r][c] -= factor * rows[rank][c];
    }
    rank++;
  }
  return rank;
}

const MATRIX_OPS = [
  { re: /\bdeterminant\b|\bdet\b/i, arity: 1, name: 'determinant', run: (a) => math.det(a) },
  { re: /\binverse\b|\binvert\b|\binv\b/i, arity: 1, name: 'inverse', run: (a) => math.inv(a) },
  { re: /\btranspose\b/i, arity: 1, name: 'transpose', run: (a) => math.transpose(a) },
  { re: /\btrace\b/i, arity: 1, name: 'trace', run: (a) => math.trace(a) },
  { re: /\brank\b/i, arity: 1, name: 'rank', run: (a) => matrixRank(a) },
  {
    re: /\beigen\s*values?\b|\beigenvalues?\b/i,
    arity: 1,
    name: 'eigenvalues',
    run: (a) => math.eigs(a).values,
  },
  { re: /\bcross\b/i, arity: 2, name: 'cross product', run: (a, b) => math.cross(a, b) },
  { re: /\bdot\b|\binner\s+product\b|\bscalar\s+product\b/i, arity: 2, name: 'dot product', run: (a, b) => math.dot(a, b) },
  {
    re: /\bangle\b/i,
    arity: 2,
    name: 'angle (degrees)',
    run: (a, b) => {
      const cos = math.dot(a, b) / (math.norm(a) * math.norm(b));
      return (Math.acos(Math.min(1, Math.max(-1, cos))) * 180) / Math.PI;
    },
  },
  { re: /\bunit\s+vector\b|\bnormali[sz]e\b/i, arity: 1, name: 'unit vector', run: (a) => math.divide(a, math.norm(a)) },
  { re: /\bnorm\b|\bmagnitude\b|\blength\b/i, arity: 1, name: 'norm', run: (a) => math.norm(a) },
  { re: /\bproduct\b|\bmultiply\b|\btimes\b|\*/i, arity: 2, name: 'product', run: (a, b) => math.multiply(a, b) },
  { re: /\bsum\b|\badd\b|\bplus\b|\+/i, arity: 2, name: 'sum', run: (a, b) => math.add(a, b) },
  { re: /\bdifference\b|\bsubtract\b|\bminus\b|-/i, arity: 2, name: 'difference', run: (a, b) => math.subtract(a, b) },
];

function solveMatrixTask(text) {
  const groups = extractBracketGroups(text);
  if (groups.length === 0) return null;
  const words = text.replace(/\[[^\]]*\]/g, ' ');
  const op = MATRIX_OPS.find((o) => o.re.test(words) && groups.length >= o.arity);
  if (!op) return null;
  const operands = groups.slice(0, op.arity).map(toMatrix);
  const result = op.run(...operands);
  const isVector = operands.every((m) => m.size().length === 1);
  return {
    kind: isVector ? 'vector' : 'matrix',
    input: `${op.name} of ${groups.slice(0, op.arity).join(' and ')}`,
    result: formatValue(result),
  };
}

// ---------------------------------------------------------------- equations

function compileEquation(eq) {
  const parts = eq.split(/(?<![<>=!])=(?!=)/);
  if (parts.length !== 2 || !parts[0].trim() || !parts[1].trim()) return null;
  const node = parse(`(${parts[0]}) - (${parts[1]})`);
  return { node, code: node.compile(), vars: freeSymbols(node) };
}

function evalAt(compiled, scope) {
  const v = compiled.code.evaluate(scope);
  return typeof v === 'number' ? v : NaN;
}

function solveSingleVariable(eq, variable) {
  const f = (t) => evalAt(eq, { [variable]: t });
  const c = f(0);
  const p1 = f(1);
  const m1 = f(-1);
  if (![c, p1, m1].every(Number.isFinite)) return null;
  const a = (p1 + m1) / 2 - c;
  const b = (p1 - m1) / 2;
  // Confirm the equation really is a polynomial of degree ≤ 2 before trusting the formula.
  for (const t of [2, -3, 0.5, 7]) {
    if (!isNear(f(t), a * t * t + b * t + c)) return null;
  }

  if (isNear(a, 0)) {
    if (isNear(b, 0)) {
      return isNear(c, 0) ? 'true for every value (identity)' : 'no solution';
    }
    return `${variable} = ${formatValue(-c / b)}`;
  }
  const disc = b * b - 4 * a * c;
  if (isNear(disc, 0)) return `${variable} = ${formatValue(-b / (2 * a))} (double root)`;
  if (disc > 0) {
    const r = Math.sqrt(disc);
    const roots = [(-b - r) / (2 * a), (-b + r) / (2 * a)].sort((x, y) => x - y);
    return `${variable} = ${formatValue(roots[0])} or ${variable} = ${formatValue(roots[1])}`;
  }
  const re = -b / (2 * a);
  const im = Math.sqrt(-disc) / (2 * a);
  return `${variable} = ${formatValue(math.complex(re, -Math.abs(im)))} or ${variable} = ${formatValue(math.complex(re, Math.abs(im)))}`;
}

function solveLinearSystem(eqs, vars) {
  const zero = Object.fromEntries(vars.map((v) => [v, 0]));
  const A = [];
  const b = [];
  for (const eq of eqs) {
    const c0 = evalAt(eq, zero);
    if (!Number.isFinite(c0)) return null;
    const row = vars.map((v) => evalAt(eq, { ...zero, [v]: 1 }) - c0);
    // Linearity check at an arbitrary point.
    const probe = Object.fromEntries(vars.map((v, i) => [v, 1.5 + i * 0.75]));
    const predicted = row.reduce((s, coef, i) => s + coef * probe[vars[i]], c0);
    if (!isNear(evalAt(eq, probe), predicted)) return null;
    A.push(row);
    b.push(-c0);
  }
  if (A.length !== vars.length) {
    return `needs ${vars.length} independent equations for ${vars.length} unknowns (got ${A.length})`;
  }
  if (isNear(math.det(A), 0)) return 'no unique solution (the equations are dependent or inconsistent)';
  const solution = math.lusolve(A, b).map((r) => r[0]);
  return vars.map((v, i) => `${v} = ${formatValue(solution[i])}`).join(', ');
}

function solveEquationTask(text) {
  if (!/(?<![<>=!])=(?!=)/.test(text)) return null;
  const body = normalizeWords(stripLead(text))
    .replace(/^for\s+[a-z](?:\s*(?:,|and)\s*[a-z])*\s*[:,]?\s*/i, '')
    .replace(/^[a-z](?:\s*(?:,|and)\s*[a-z])*\s*:\s*/i, '')
    .replace(/\bfor\s+[a-z](?:\s*(?:,|and)\s*[a-z])*\s*$/i, '')
    .trim();
  const pieces = body
    .split(/;|\n|,(?![^([]*[)\]])|\band\b/i)
    .map((s) => s.trim())
    .filter((s) => s.includes('='));
  if (pieces.length === 0 || pieces.length > MAX_UNKNOWNS) return null;

  const eqs = pieces.map(compileEquation);
  if (eqs.some((e) => !e)) return null;
  const vars = [...new Set(eqs.flatMap((e) => e.vars))].sort();
  if (vars.length === 0 || vars.length > MAX_UNKNOWNS) return null;
  // Unknowns are short names like x, y, z, x1 — "2 = good" is a sentence, not an equation.
  if (!vars.every((v) => /^[a-z]\d?$/i.test(v))) return null;

  if (eqs.length === 1 && vars.length === 1) {
    const result = solveSingleVariable(eqs[0], vars[0]);
    return result ? { kind: 'equation', input: pieces[0], result } : null;
  }
  const result = solveLinearSystem(eqs, vars);
  return result ? { kind: 'system', input: pieces.join(', '), result } : null;
}

// ---------------------------------------------------------------- calculus & algebra

function solveCalculusTask(text) {
  const d = text.match(/\b(?:derivative|differentiate|d\/d([a-z]))\b\s*(?:of)?\s*(.+?)(?:\s+(?:with\s+respect\s+to|wrt|w\.r\.t\.?)\s+([a-z]))?\s*$/i);
  if (d) {
    const expr = normalizeWords(d[2]).replace(/[?.]+$/, '');
    const node = parse(expr);
    const vars = freeSymbols(node);
    const variable = d[3] || d[1] || (vars.includes('x') ? 'x' : vars[0]);
    if (!variable) return null;
    return {
      kind: 'derivative',
      input: `d/d${variable} ${expr}`,
      result: simplify(derivative(node, variable)).toString(),
    };
  }
  const s = text.match(/\b(?:simplify|expand)\b\s*(?:the\s+expression)?\s*(.+)$/i);
  if (s) {
    const expr = normalizeWords(s[1]).replace(/[?.]+$/, '');
    return { kind: 'simplify', input: expr, result: simplify(expr).toString() };
  }
  return null;
}

// ---------------------------------------------------------------- arithmetic

function solveArithmeticTask(text) {
  const expr = normalizeWords(stripLead(text));
  if (!expr || !isMathLike(expr)) return null;
  const node = parse(expr);
  if (freeSymbols(node).length > 0) return null;
  const value = node.evaluate();
  if (!isNumericResult(value)) return null;
  return { kind: 'arithmetic', input: expr, result: formatValue(value) };
}

// ---------------------------------------------------------------- public API

/**
 * Solve the math in a user message. Returns { kind, input, result, summary } or null.
 * Never throws — anything it cannot do with certainty is left to the language model.
 */
export function solveMath(rawText) {
  if (typeof rawText !== 'string') return null;
  const text = rawText.trim();
  if (!text || text.length > MAX_INPUT) return null;

  const solvers = [solveMatrixTask, solveCalculusTask, solveEquationTask, solveArithmeticTask];
  for (const solver of solvers) {
    try {
      const out = solver(text);
      if (out) return { ...out, summary: `${out.input} → ${out.result}` };
    } catch {
      /* try the next solver */
    }
  }
  return null;
}

/** Direct API: evaluate an expression or math question exactly. Throws on failure. */
export function computeMath(input) {
  const result = solveMath(input);
  if (!result) throw new Error('SG16 Math Core could not compute this input');
  return result;
}
