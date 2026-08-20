import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { existsSync } from 'fs';
import { spawnSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(__dirname, '../../..');
const codingShieldRoot = path.join(repoRoot, 'coding-shield');
const engineUrl = pathToFileURL(path.join(codingShieldRoot, 'engine.mjs')).href;

function resolveCli(name) {
  if (process.platform !== 'win32') return name;
  const exe = `${name}.exe`;
  const pyExe = name === 'semgrep' ? 'pysemgrep.exe' : exe;
  const candidates = [
    path.join(repoRoot, 'tools', exe),
    path.join(process.env.APPDATA || '', 'Python', 'Python314', 'Scripts', pyExe),
    path.join(process.env.APPDATA || '', 'Python', 'Python314', 'Scripts', exe),
  ];
  for (const candidate of candidates) {
    if (candidate && existsSync(candidate)) return candidate;
  }
  return name;
}

function cliAvailable(name, args = ['--version']) {
  const r = spawnSync(resolveCli(name), args, { encoding: 'utf8', shell: false, windowsHide: true });
  return !r.error && (r.status ?? 1) === 0;
}

function npxAvailable(pkg, args = ['--version']) {
  const r = spawnSync('npx', ['--no-install', pkg, ...args], {
    encoding: 'utf8',
    shell: false,
    windowsHide: true,
    env: { ...process.env, NODE_PATH: process.env.NODE_PATH || '' },
  });
  return !r.error && (r.status ?? 1) === 0;
}

let enginePromise;

function getEngine() {
  if (!enginePromise) enginePromise = import(engineUrl);
  return enginePromise;
}

export async function scanCodeSnippet(payload) {
  const { scanSnippet } = await getEngine();
  return scanSnippet(payload);
}

export async function scanFullProject(options = {}) {
  const { runFullShield } = await getEngine();
  return runFullShield(undefined, options);
}

export async function getShieldToolStatus() {
  return {
    core: ['eslint', 'semgrep', 'gitleaks', 'acorn-esprima', 'retire.js', 'istanbul-nyc', 'sonarqube-sonarlint'],
    power: ['npm-audit', 'tsc', 'depcheck'],
    clis: {
      semgrep: cliAvailable('semgrep'),
      gitleaks: cliAvailable('gitleaks', ['version']),
      sonarScanner: cliAvailable('sonar-scanner'),
    },
    npm: {
      eslint: npxAvailable('eslint') || cliAvailable('eslint'),
      acorn: npxAvailable('acorn') || cliAvailable('acorn'),
      esprima: npxAvailable('esprima') || cliAvailable('esprima'),
      retire: npxAvailable('retire') || cliAvailable('retire'),
      nyc: npxAvailable('nyc') || cliAvailable('nyc'),
      tsc: npxAvailable('typescript', ['-v']),
      depcheck: npxAvailable('depcheck') || cliAvailable('depcheck'),
    },
    subdomain: 'https://shield.sg16engine.com',
  };
}
