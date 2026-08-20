/** Local developer studio — file tree on this machine. Never on public production. */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../../..');

const SKIP_DIR = new Set([
  'node_modules',
  '.git',
  'dist',
  'release',
  'dev-dist',
  '.gradle',
  'build',
  'android',
]);

const TEXT_EXT = new Set([
  '.js', '.mjs', '.cjs', '.ts', '.tsx', '.jsx', '.json', '.md', '.css', '.html',
  '.txt', '.yml', '.yaml', '.toml', '.env', '.example', '.svg', '.sh', '.ps1',
]);

export function isDevStudioEnabled() {
  if (process.env.SG16_DEV_STUDIO === '0') return false;
  if (process.env.SG16_DEV_STUDIO === '1') return true;
  return process.env.NODE_ENV !== 'production';
}

export function studioRoot() {
  const raw = process.env.SG16_DEV_ROOT?.trim();
  return path.resolve(raw || REPO_ROOT);
}

function assertInsideRoot(rel) {
  const root = studioRoot();
  const clean = String(rel || '').replace(/\\/g, '/').replace(/^\/+/, '');
  if (clean.includes('\0') || clean.split('/').includes('..')) {
    throw new Error('Invalid path.');
  }
  const abs = path.resolve(root, clean);
  const relToRoot = path.relative(root, abs);
  if (relToRoot.startsWith('..') || path.isAbsolute(relToRoot)) {
    throw new Error('Path outside studio root.');
  }
  return { root, abs, rel: clean };
}

function listDir(abs, rel, depth, maxDepth) {
  if (depth > maxDepth) return [];
  let names;
  try {
    names = fs.readdirSync(abs);
  } catch {
    return [];
  }
  const nodes = [];
  for (const name of names.sort()) {
    if (name.startsWith('.') && name !== '.env.example') continue;
    if (SKIP_DIR.has(name)) continue;
    const childAbs = path.join(abs, name);
    const childRel = rel ? `${rel}/${name}` : name;
    let stat;
    try {
      stat = fs.statSync(childAbs);
    } catch {
      continue;
    }
    if (stat.isDirectory()) {
      nodes.push({
        name,
        path: childRel,
        type: 'dir',
        children: listDir(childAbs, childRel, depth + 1, maxDepth),
      });
    } else {
      nodes.push({ name, path: childRel, type: 'file' });
    }
  }
  return nodes;
}

export function studioStatus() {
  return {
    enabled: isDevStudioEnabled(),
    root: isDevStudioEnabled() ? studioRoot() : null,
    flow: 'developer-studio',
  };
}

export function studioTree(maxDepth = 3) {
  if (!isDevStudioEnabled()) {
    const err = new Error('Developer studio files only run on the PC / localhost.');
    err.code = 'STUDIO_OFF';
    throw err;
  }
  const root = studioRoot();
  return { root, tree: listDir(root, '', 0, maxDepth) };
}

export function studioRead(relPath) {
  if (!isDevStudioEnabled()) {
    const err = new Error('Developer studio files only run on the PC / localhost.');
    err.code = 'STUDIO_OFF';
    throw err;
  }
  const { abs, rel } = assertInsideRoot(relPath);
  if (!fs.existsSync(abs) || !fs.statSync(abs).isFile()) {
    throw new Error('File not found.');
  }
  const ext = path.extname(abs).toLowerCase();
  if (!TEXT_EXT.has(ext) && !path.basename(abs).startsWith('.')) {
    throw new Error('This file type is not opened in the studio editor.');
  }
  const content = fs.readFileSync(abs, 'utf8');
  if (content.length > 400_000) throw new Error('File too large for the editor.');
  return { path: rel, content };
}

export function studioWrite(relPath, content) {
  if (!isDevStudioEnabled()) {
    const err = new Error('Developer studio files only run on the PC / localhost.');
    err.code = 'STUDIO_OFF';
    throw err;
  }
  if (typeof content !== 'string') throw new Error('Content must be text.');
  if (content.length > 400_000) throw new Error('File too large to save.');
  const { abs, rel } = assertInsideRoot(relPath);
  if (!fs.existsSync(abs) || !fs.statSync(abs).isFile()) {
    throw new Error('File not found. Studio saves existing files only.');
  }
  fs.writeFileSync(abs, content, 'utf8');
  return { path: rel, saved: true, bytes: Buffer.byteLength(content, 'utf8') };
}
