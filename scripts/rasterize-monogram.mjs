/**
 * Rasterize each variant's master SVG to all required PNG sizes.
 *
 * Strategy: NATIVE rendering at each target resolution.
 *   For every target size we override the master SVG's width/height attrs
 *   to the target (keeping its viewBox intact), then pass to Sharp at
 *   density 72. libRSVG/Cairo anti-aliases at the target raster resolution
 *   directly — no supersampling, no Lanczos downscale. That preserves
 *   crisp edges at all sizes, including 16/32/48 px favicons where the
 *   downsample approach otherwise smears glyph strokes.
 */
import sharp from 'sharp';
import { readFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const monogramDir = resolve(root, 'monogram');

const VARIANTS = ['terra', 'dark', 'paper'];
const SIZES = [16, 32, 48, 180, 192, 400, 512, 800, 1024];

/** Swap the width/height attrs on the master SVG to target px. */
function svgAtSize(svgStr, size) {
  return svgStr.replace(
    /(<svg[^>]*?)\s+width="[^"]+"\s+height="[^"]+"/,
    `$1 width="${size}" height="${size}"`,
  );
}

async function rasterizeVariant(variant) {
  const svgPath = resolve(monogramDir, variant, `monogram-${variant}.svg`);
  const masterSvg = await readFile(svgPath, 'utf8');

  const tasks = SIZES.map(async (size) => {
    const sized = svgAtSize(masterSvg, size);
    const outPath = resolve(monogramDir, variant, `monogram-${variant}-${size}.png`);
    await sharp(Buffer.from(sized), { density: 72, limitInputPixels: false })
      .png({ compressionLevel: 9, palette: size <= 48 })
      .toFile(outPath);
    return { size, outPath };
  });

  const results = await Promise.all(tasks);
  return { variant, results };
}

const all = await Promise.all(VARIANTS.map(rasterizeVariant));

for (const { variant, results } of all) {
  console.log(`${variant}:`);
  for (const { size, outPath } of results) {
    console.log(`  ${size.toString().padStart(4)}px  →  ${outPath.replace(root + '/', '')}`);
  }
}
