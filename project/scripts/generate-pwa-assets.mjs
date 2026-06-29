/**
 * Generates PNG PWA icons and placeholder screenshots from hero-globe.png.
 * Run before vite build: node scripts/generate-pwa-assets.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, '..', 'public');
const heroPath = [path.join(publicDir, 'hero.png'), path.join(publicDir, 'hero-globe.png')].find((p) =>
  fs.existsSync(p),
);

async function main() {
  let sharp;
  try {
    sharp = (await import('sharp')).default;
  } catch {
    console.warn('[pwa-assets] sharp not installed — skipping PNG generation. Run: npm i -D sharp');
    return;
  }

  if (!heroPath) {
    console.warn('[pwa-assets] hero.png / hero-globe.png not found — skipping PNG generation');
    return;
  }

  const iconsDir = path.join(publicDir, 'icons');
  fs.mkdirSync(iconsDir, { recursive: true });

  const sizes = [
    { name: 'icon-192.png', size: 192 },
    { name: 'icon-512.png', size: 512 },
    { name: 'icon-maskable.png', size: 512, maskable: true },
  ];

  for (const { name, size, maskable } of sizes) {
    const out = path.join(iconsDir, name);
    let pipeline = sharp(heroPath).resize(size, size, { fit: 'cover', position: 'centre' });
    if (maskable) {
      pipeline = pipeline.extend({
        top: Math.round(size * 0.1),
        bottom: Math.round(size * 0.1),
        left: Math.round(size * 0.1),
        right: Math.round(size * 0.1),
        background: { r: 5, g: 5, b: 7, alpha: 1 },
      });
    }
    await pipeline.png({ quality: 90 }).toFile(out);
    console.log(`[pwa-assets] wrote ${name}`);
  }

  await sharp(heroPath)
    .resize(1024, 682, { fit: 'cover', position: 'centre' })
    .png()
    .toFile(path.join(publicDir, 'screenshot-desktop.png'));
  console.log('[pwa-assets] wrote screenshot-desktop.png');

  await sharp(heroPath)
    .resize(474, 1024, { fit: 'cover', position: 'centre' })
    .png()
    .toFile(path.join(publicDir, 'screenshot-mobile.png'));
  console.log('[pwa-assets] wrote screenshot-mobile.png');
}

main().catch((err) => {
  console.error('[pwa-assets] failed:', err);
  process.exit(1);
});
