/**
 * Stage 2 of the monogram pipeline: rasterize each variant's master SVG
 * to the PNG sizes the spec requires.
 *
 * SVG → PNG via Sharp. We render the SVG at high density first (so the
 * underlying glyph paths are sharp), then Lanczos3-resize to the target.
 * That yields cleaner small-size output than letting Sharp pick the
 * raster size off the SVG width attribute alone.
 *
 * Run after `generate-monogram.py` has emitted the three SVGs.
 */
import sharp from 'sharp';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const monogramDir = resolve(root, 'monogram');

const VARIANTS = ['terra', 'dark', 'paper'];
const SIZES = [16, 32, 48, 180, 192, 400, 512, 800, 1024];

// Density picks the SVG rasterization resolution before resize.
// We pick a density that yields ~2× the largest target, then Sharp resizes
// down for every smaller target. Master canvas is 1000×1000 viewBox.
const RASTER_DENSITY = 600;

async function rasterizeVariant(variant) {
  const svgPath = resolve(monogramDir, variant, `monogram-${variant}.svg`);
  const svg = await readFile(svgPath);

  const tasks = SIZES.map(async (size) => {
    const outPath = resolve(monogramDir, variant, `monogram-${variant}-${size}.png`);
    await sharp(svg, { density: RASTER_DENSITY })
      .resize(size, size, { kernel: sharp.kernel.lanczos3, fit: 'cover' })
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
