/**
 * PWA icons, screenshots, and automatic WebP compression for all public raster assets.
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

const RASTER_EXT = /\.(png|jpe?g)$/i;
const PWA_PNG_ONLY = new Set(['icon-192.png', 'icon-512.png', 'icon-maskable.png']);

/** Same list as src/lib/optimizedImage.ts MOBILE_WEBP_PATHS */
const MOBILE_VARIANTS = new Set([
  'hero.png',
  'hero-globe.png',
  'landing/hero-background.png',
]);

function walkFiles(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) walkFiles(full, out);
    else if (RASTER_EXT.test(ent.name)) out.push(full);
  }
  return out;
}

async function optimizePublicImages(sharp) {
  const files = walkFiles(publicDir);
  let optimized = 0;

  for (const file of files) {
    const base = path.basename(file);
    if (PWA_PNG_ONLY.has(base)) continue;

    const rel = path.relative(publicDir, file).replace(/\\/g, '/');
    const meta = await sharp(file).metadata();
    const width = meta.width || 0;

    let pipeline = sharp(file);
    if (width > 1400) {
      pipeline = pipeline.resize(1400, undefined, { withoutEnlargement: true });
    }

    const webpPath = file.replace(RASTER_EXT, '.webp');
    await pipeline.clone().webp({ quality: rel.includes('landing/hero') ? 82 : 80, effort: 4 }).toFile(webpPath);
    optimized += 1;

    if (MOBILE_VARIANTS.has(rel)) {
      const mobilePath = file.replace(RASTER_EXT, '-mobile.webp');
      const mobileWidth = rel.includes('landing/hero-background') ? 720 : 480;
      await sharp(file)
        .resize(mobileWidth, undefined, { withoutEnlargement: true })
        .webp({ quality: 78, effort: 4 })
        .toFile(mobilePath);
      console.log(`[pwa-assets] wrote ${path.relative(publicDir, mobilePath).replace(/\\/g, '/')}`);
    }

    const saved = fs.statSync(file).size - fs.statSync(webpPath).size;
    console.log(
      `[pwa-assets] webp ${path.relative(publicDir, webpPath).replace(/\\/g, '/')} (${Math.round(saved / 1024)}KB smaller)`,
    );
  }

  console.log(`[pwa-assets] optimized ${optimized} raster asset(s) to WebP`);
}

async function main() {
  let sharp;
  try {
    sharp = (await import('sharp')).default;
  } catch {
    console.warn('[pwa-assets] sharp not installed — skipping PNG generation. Run: npm i -D sharp');
    return;
  }

  if (heroPath) {
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
  } else {
    console.warn('[pwa-assets] hero.png / hero-globe.png not found — skipping icon generation');
  }

  await optimizePublicImages(sharp);
}

main().catch((err) => {
  console.error('[pwa-assets] failed:', err);
  process.exit(1);
});
