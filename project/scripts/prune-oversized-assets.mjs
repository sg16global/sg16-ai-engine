import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Cloudflare Pages rejects any single asset over 25 MiB, so a deployment that
// contains one fails at upload time. The hero videos in public/landing that
// exceed the limit are not referenced by the app; drop them from dist/ (they
// stay in the repo) and log what was pruned.
const PAGES_MAX_ASSET_BYTES = 25 * 1024 * 1024;

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');

if (!fs.existsSync(dist)) {
  console.log('[prune-oversized-assets] no dist/ — nothing to do');
  process.exit(0);
}

const pruned = [];
(function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
    } else if (entry.isFile() && fs.statSync(full).size > PAGES_MAX_ASSET_BYTES) {
      fs.unlinkSync(full);
      pruned.push(path.relative(dist, full));
    }
  }
})(dist);

if (pruned.length === 0) {
  console.log('[prune-oversized-assets] OK — no file in dist/ exceeds 25 MiB');
} else {
  for (const file of pruned) {
    console.log(`[prune-oversized-assets] PRUNED ${file} (over the 25 MiB Pages per-file limit)`);
  }
}
