import { builtinModules } from 'node:module';
import { runPython } from './language.mjs';

const NODE_BUILTINS = new Set(builtinModules.map((m) => m.replace(/^node:/, '')));

/** Import name → pip package name, where they differ. */
const PIP_NAMES = {
  cv2: 'opencv-python',
  PIL: 'Pillow',
  sklearn: 'scikit-learn',
  yaml: 'PyYAML',
  bs4: 'beautifulsoup4',
  dotenv: 'python-dotenv',
  jwt: 'PyJWT',
  dateutil: 'python-dateutil',
  Crypto: 'pycryptodome',
};

/** Fallback when Python is not installed to list its standard library. */
const PY_STDLIB_FALLBACK = new Set(
  'abc argparse array ast asyncio base64 bisect builtins calendar collections concurrent contextlib copy csv ctypes dataclasses datetime decimal difflib email enum errno fnmatch fractions functools gc getpass glob gzip hashlib heapq hmac html http importlib inspect io ipaddress itertools json logging math mimetypes multiprocessing numbers operator os pathlib pickle platform pprint queue random re secrets select shlex shutil signal socket sqlite3 ssl stat statistics string struct subprocess sys tempfile textwrap threading time timeit traceback types typing unicodedata unittest urllib uuid warnings weakref xml zipfile zlib __future__'.split(
    ' ',
  ),
);

let pyStdlib;

function pythonStdlib() {
  if (pyStdlib) return pyStdlib;
  const r = runPython('import sys, json; print(json.dumps(sorted(sys.stdlib_module_names)))');
  try {
    pyStdlib = r && r.status === 0 ? new Set([...JSON.parse(r.stdout), '__future__']) : PY_STDLIB_FALLBACK;
  } catch {
    pyStdlib = PY_STDLIB_FALLBACK;
  }
  return pyStdlib;
}

function npmName(spec) {
  if (/^[./]|^node:|^https?:/.test(spec)) return null;
  const parts = spec.split('/');
  const name = spec.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0];
  if (!/^(@[a-z0-9][\w.-]*\/)?[a-z0-9][\w.-]*$/i.test(name) || NODE_BUILTINS.has(name)) return null;
  return name;
}

function collect(code, patterns) {
  const found = [];
  for (const re of patterns) {
    for (const m of code.matchAll(re)) found.push(m[1]);
  }
  return found;
}

/**
 * Packages the code imports that are not built in, plus the command that installs them.
 * Nothing is installed — the user copies the command.
 */
export function detectPackages(code, language) {
  const text = String(code);

  if (language === 'python') {
    const stdlib = pythonStdlib();
    // "import a, b.c as d" → a, b.c ; "from x.y import z" → x.y  (line-local patterns, no cross-line backtracking)
    const modules = [
      ...collect(text, [/^[ \t]*from[ \t]+([A-Za-z_][\w.]*)[ \t]+import\b/gm]),
      ...collect(text, [/^[ \t]*import[ \t]+([^\n#;]{1,300})/gm]).flatMap((list) =>
        list.split(',').map((part) => part.trim().split(/[ \t]/)[0]),
      ),
    ].filter((m) => /^[A-Za-z_][\w.]*$/.test(m));
    const packages = [
      ...new Set(
        modules
          .map((m) => m.split('.')[0])
          .filter((m) => m && !stdlib.has(m))
          .map((m) => PIP_NAMES[m] || m),
      ),
    ];
    return { manager: 'pip', packages, installCommand: packages.length ? `pip install ${packages.join(' ')}` : null };
  }

  if (language === 'javascript' || language === 'typescript') {
    // Bounded runs keep these linear on hostile input; {0,500} still spans multi-line `import {\n a,\n b\n} from 'x'`.
    const specs = collect(text, [
      /\bimport[ \t]+[^'"`;]{0,500}?\bfrom[ \t]*['"]([^'"\n]{1,200})['"]/g,
      /\bimport[ \t]*['"]([^'"\n]{1,200})['"]/g,
      /\bexport[ \t]+[^'"`;]{0,500}?\bfrom[ \t]*['"]([^'"\n]{1,200})['"]/g,
      /\brequire\([ \t]*['"]([^'"\n]{1,200})['"][ \t]*\)/g,
      /\bimport\([ \t]*['"]([^'"\n]{1,200})['"][ \t]*\)/g,
    ]);
    const packages = [...new Set(specs.map(npmName).filter(Boolean))];
    return { manager: 'npm', packages, installCommand: packages.length ? `npm install ${packages.join(' ')}` : null };
  }

  return { manager: null, packages: [], installCommand: null };
}
