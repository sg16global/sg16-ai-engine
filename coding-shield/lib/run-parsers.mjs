import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import * as acorn from 'acorn';
import * as esprima from 'esprima';
import { ROOT, cliResult, writeReport } from './shared.mjs';

const JS_EXT = new Set(['.js', '.mjs', '.cjs', '.jsx']);

function walk(dir, files = []) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return files;
  }
  for (const name of entries) {
    if (name === 'node_modules' || name === 'dist' || name === 'reports' || name === '.git') continue;
    const full = join(dir, name);
    let st;
    try {
      st = statSync(full);
    } catch {
      continue;
    }
    if (st.isDirectory()) walk(full, files);
    else if (JS_EXT.has(extname(name))) files.push(full);
  }
  return files;
}

function parseWithAcorn(code, source) {
  return acorn.parse(code, {
    ecmaVersion: 'latest',
    sourceType: 'module',
    locations: true,
  });
}

function parseWithEsprima(code, source) {
  return esprima.parseScript(code, { loc: true, source });
}

export async function runParsers(target = join(ROOT, '..')) {
  const files = walk(target).slice(0, 200);
  const errors = [];

  for (const file of files) {
    const code = readFileSync(file, 'utf8');
    try {
      parseWithAcorn(code, file);
    } catch {
      try {
        parseWithEsprima(code, file);
      } catch (esprimaErr) {
        errors.push({
          file,
          esprima: esprimaErr.message,
        });
      }
    }
  }

  const ok = errors.length === 0;
  const summary = cliResult('acorn-esprima', ok, `${errors.length} parse error(s) in ${files.length} file(s)`, {
    filesChecked: files.length,
    errorCount: errors.length,
    errors: errors.slice(0, 50),
  });
  await writeReport('parsers-summary.json', summary);
  return summary;
}
