/**
 * Generate brand raster assets from SVG sources.
 *
 * Pulls Fraunces and Switzer from the system fontconfig (run `fc-cache -f`
 * after dropping the TTFs into ~/.fonts/ or /usr/share/fonts/).
 *
 * Outputs:
 *   public/favicon.png          32×32
 *   public/apple-touch-icon.png 180×180
 *   public/avatar.webp          512×512 (square)
 *   public/og-default.png       1200×630
 */
import sharp from 'sharp';
import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const PAPER = '#F5F2EC';
const INK = '#1A1815';
const INK_SOFT = '#4A4640';
const INK_MUTED = '#7A7570';
const RULE = 'rgba(26,24,21,0.18)';

const root = resolve(import.meta.dirname, '..');
const out = (p) => resolve(root, 'public', p);

/** Square monogram SVG. `size` controls the viewBox in px. */
function monogramSvg(size) {
  // Fraunces "T·A·H" centered with comfortable side padding (clips otherwise).
  const fontSize = Math.round(size * 0.28);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  <rect width="${size}" height="${size}" rx="${Math.round(size * 0.1)}" fill="${PAPER}"/>
  <text
    x="${size / 2}"
    y="${size / 2 + fontSize * 0.34}"
    text-anchor="middle"
    font-family="Fraunces, Georgia, serif"
    font-weight="450"
    font-size="${fontSize}"
    fill="${INK}"
    font-feature-settings="'opsz' ${Math.min(144, Math.max(36, Math.round(size * 0.4)))}, 'SOFT' 50"
    letter-spacing="-0.5"
  >T·A·H</text>
</svg>`;
}

/** OG card 1200×630 — wordmark + positioning + URL + mono caption. */
function ogSvg() {
  const W = 1200,
    H = 630;
  const padX = 80,
    padY = 80;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <rect width="${W}" height="${H}" fill="${PAPER}"/>

  <!-- subtle paper texture: faint diagonal grid -->
  <defs>
    <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse">
      <path d="M48 0 L0 0 0 48" fill="none" stroke="rgba(26,24,21,0.025)" stroke-width="1"/>
    </pattern>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#grid)"/>

  <!-- top eyebrow: mono caption with handle -->
  <text x="${padX}" y="${padY + 14}" font-family="JetBrains Mono, monospace" font-size="18" fill="${INK_MUTED}" letter-spacing="3">THEOALESSANDRO.COM</text>

  <!-- horizontal rule under eyebrow -->
  <line x1="${padX}" y1="${padY + 36}" x2="${padX + 200}" y2="${padY + 36}" stroke="${RULE}" stroke-width="1"/>

  <!-- wordmark -->
  <text
    x="${padX}"
    y="${H / 2 + 6}"
    font-family="Fraunces, Georgia, serif"
    font-weight="450"
    font-size="96"
    fill="${INK}"
    font-feature-settings="'opsz' 144, 'SOFT' 60"
    letter-spacing="-2"
  >Théo Alessandro Hermann</text>

  <!-- positioning, Switzer -->
  <text
    x="${padX}"
    y="${H / 2 + 78}"
    font-family="Switzer Variable, Switzer, system-ui, sans-serif"
    font-weight="400"
    font-size="30"
    fill="${INK_SOFT}"
  >Researcher and builder. MIT Senseable Rio.</text>
  <text
    x="${padX}"
    y="${H / 2 + 118}"
    font-family="Switzer Variable, Switzer, system-ui, sans-serif"
    font-weight="400"
    font-size="30"
    fill="${INK_SOFT}"
  >Urban science, robotics, and what comes next.</text>

  <!-- bottom rule + caption -->
  <line x1="${padX}" y1="${H - padY - 16}" x2="${W - padX}" y2="${H - padY - 16}" stroke="${RULE}" stroke-width="1"/>
  <text x="${padX}" y="${H - padY + 16}" font-family="JetBrains Mono, monospace" font-size="16" fill="${INK_MUTED}" letter-spacing="2">RIO · 2026</text>
  <text x="${W - padX}" y="${H - padY + 16}" text-anchor="end" font-family="JetBrains Mono, monospace" font-size="16" fill="${INK_MUTED}" letter-spacing="2">T · A · H</text>
</svg>`;
}

async function renderPng(svg, size, file) {
  const buf = await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer();
  await writeFile(out(file), buf);
  console.log(`  ${file}  (${buf.length} bytes)`);
}

async function renderWebp(svg, file, quality = 90) {
  const buf = await sharp(Buffer.from(svg)).webp({ quality }).toBuffer();
  await writeFile(out(file), buf);
  console.log(`  ${file}  (${buf.length} bytes)`);
}

console.log('Generating brand assets:');

// favicon.png — small bitmap fallback (modern browsers prefer the SVG)
await renderPng(monogramSvg(64), 64, 'favicon.png');

// apple-touch-icon.png — 180×180, used by iOS home screen
await renderPng(monogramSvg(180), 180, 'apple-touch-icon.png');

// avatar.webp — square profile picture, 512×512
await renderWebp(monogramSvg(512), 'avatar.webp', 92);

// og-default.png — 1200×630, used for link previews
await renderPng(ogSvg(), 1200, 'og-default.png');

console.log('Done.');
