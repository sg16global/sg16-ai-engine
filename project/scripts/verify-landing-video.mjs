import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const videoPath = path.join(root, 'backend/public/landing/sg16-brain-bg.mp4');

if (!fs.existsSync(videoPath)) {
  console.error('[verify-landing-video] MISSING:', videoPath);
  process.exit(1);
}

const { size } = fs.statSync(videoPath);
if (size < 1_000_000) {
  console.error('[verify-landing-video] File too small — likely Git LFS pointer:', size, 'bytes');
  process.exit(1);
}

console.log('[verify-landing-video] OK', path.basename(videoPath), `${(size / 1024 / 1024).toFixed(1)} MB`);
