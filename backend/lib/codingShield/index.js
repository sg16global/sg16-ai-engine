import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { existsSync } from 'fs';
import { spawnSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const engineUrl = pathToFileURL(path.join(__dirname, '../../coding-shield/engine.mjs')).href;
const codingShieldRoot = path.join(__dirname, '../../coding-shield');

function resolveCli(name) {
  if (process.platform !== 'win32') return name;
  const exe = `${name}.exe`;
  const pyExe = name === 'semgrep' ? 'pysemgrep.exe' : exe;
  const candidates = [
    path.join(codingShieldRoot, '..', '..', 'tools', exe),
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
      eslint: true,
      acorn: true,
      esprima: true,
      retire: true,
      nyc: true,
    },
    subdomain: 'https://shield.sg16engine.com',
  };
}
