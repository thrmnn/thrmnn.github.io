// Post-build verification — the project's test suite.
// Runs against dist/ after `astro build`. Fails CI if the build is missing
// expected pages/assets, exposes a removed route, leaks publication content
// (see the no-publications rule), drops the canonical name, contains a
// broken internal link, ships an oversized asset, or regresses bundle size.
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const DIST = 'dist';

// Group errors by category so the failure output triages itself instead of
// dumping a flat list. CI logs become much easier to scan.
const groups = {
  pages: [],
  assets: [],
  removed_routes: [],
  forbidden_terms: [],
  identity: [],
  broken_links: [],
  asset_budget: [],
  bundle_budget: [],
};
const fail = (group, m) => { groups[group].push(m); };
const must = (group, cond, m) => { if (!cond) fail(group, m); };

if (!existsSync(DIST)) {
  console.error('✗ no dist/ — run `npm run build` first');
  process.exit(1);
}

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

const files = walk(DIST).map((f) => f.replace(/\\/g, '/'));
const htmlFiles = files.filter((f) => f.endsWith('.html'));

// 1. expected pages
for (const p of ['index.html', 'projects/index.html', 'cv/index.html', 'now/index.html', '404.html']) {
  must('pages', existsSync(join(DIST, p)), `missing page: ${p}`);
}
must('pages', files.some((f) => /projects\/[^/]+\/index\.html$/.test(f)), 'no project detail pages built');

// 2. expected assets
for (const a of ['og-default.png', 'favicon.svg', 'rss.xml', 'sitemap-index.xml']) {
  must('assets', existsSync(join(DIST, a)), `missing asset: ${a}`);
}

// 3. removed routes must be gone
must('removed_routes', !existsSync(join(DIST, 'research')), 'research/ route must not exist');

// 4. no publication leakage (enforces the no-publications rule)
//    Also catches the old @theoh-io handle so it can't slip back in.
const forbidden = ['Nature Cities', 'AGU Fall', 'href="/research', '@theoh-io', 'theoh-io/'];
for (const f of htmlFiles) {
  const html = readFileSync(f, 'utf8');
  for (const term of forbidden) {
    if (html.includes(term)) fail('forbidden_terms', `"${term}" found in ${f}`);
  }
}

// 5. identity
const home = readFileSync(join(DIST, 'index.html'), 'utf8');
must('identity', home.includes('Théo Alessandro Hermann'), 'canonical name missing from homepage');

// 6. internal links resolve to a built file
function resolveLink(href) {
  let path = href.split('#')[0].split('?')[0];
  if (!path.startsWith('/') || path.startsWith('//')) return null; // external / anchor
  if (path === '/') return 'index.html';
  if (path.endsWith('/')) path += 'index.html';
  else if (!/\.[a-z0-9]+$/i.test(path.slice(path.lastIndexOf('/') + 1))) path += '/index.html';
  return path.replace(/^\//, '');
}
const linkRe = /(?:href|src)="([^"]+)"/g;
let linkCount = 0;
for (const f of htmlFiles) {
  const html = readFileSync(f, 'utf8');
  for (const m of html.matchAll(linkRe)) {
    const target = resolveLink(m[1]);
    if (!target) continue;
    linkCount++;
    if (!existsSync(join(DIST, target))) {
      fail('broken_links', `"${m[1]}" in ${f} (→ ${target})`);
    }
  }
}

// 7. asset budgets — guard against accidentally shipping a 17MB hero.gif.
//    Per-extension limits because a paper PDF reasonably weighs more than
//    a hero image. Per CLAUDE.md feedback-perf-nonnegotiable: perf is a
//    definition-of-done constraint.
const KB = 1024, MB = 1024 * 1024;
const ASSET_BUDGETS = {
  // ext: [hard limit bytes, warn-above bytes]
  png:  [1 * MB, 500 * KB],
  jpg:  [1 * MB, 500 * KB],
  jpeg: [1 * MB, 500 * KB],
  webp: [1 * MB, 500 * KB],
  gif:  [1 * MB, 500 * KB],
  svg:  [200 * KB, 80 * KB],
  webm: [3 * MB, 1.5 * MB],   // hero videos legitimately bigger
  mp4:  [3 * MB, 1.5 * MB],
  mp3:  [5 * MB, 2 * MB],
  woff: [200 * KB, 100 * KB],
  woff2:[200 * KB, 100 * KB],
  pdf:  [2 * MB, 1 * MB],     // academic papers / reports
};
const assetWarnings = [];
for (const f of files) {
  const ext = f.match(/\.([a-z0-9]+)$/i)?.[1].toLowerCase();
  const budget = ext && ASSET_BUDGETS[ext];
  if (!budget) continue;
  const [limit, warn] = budget;
  const size = statSync(f).size;
  if (size > limit) {
    fail('asset_budget', `${f} is ${(size / MB).toFixed(2)} MB (limit ${(limit / MB).toFixed(1)} MB for .${ext})`);
  } else if (size > warn) {
    assetWarnings.push(`${f} is ${(size / KB).toFixed(0)} KB (warn ≥ ${(warn / KB).toFixed(0)} KB for .${ext})`);
  }
}

// 8. bundle budget — JS regression guard.
//    Baseline established 2026-06-08 at ~8 KB single chunk. The 10x ceiling
//    is generous; the point is to catch a runaway `import { ... } from
//    'some-huge-lib'` that accidentally hydrates a page.
const JS_BUDGET_BYTES = 80 * 1024; // 80 KB total across _astro/*.js
let totalJsBytes = 0;
const astroDir = join(DIST, '_astro');
if (existsSync(astroDir)) {
  for (const f of walk(astroDir)) {
    if (f.endsWith('.js')) totalJsBytes += statSync(f).size;
  }
}
if (totalJsBytes > JS_BUDGET_BYTES) {
  fail('bundle_budget', `JS bundle is ${(totalJsBytes / 1024).toFixed(1)} KB (budget ${JS_BUDGET_BYTES / 1024} KB)`);
}

const totalErrors = Object.values(groups).reduce((s, a) => s + a.length, 0);
if (totalErrors) {
  console.error(`\n✗ ${totalErrors} build check(s) failed:`);
  for (const [name, items] of Object.entries(groups)) {
    if (!items.length) continue;
    console.error(`\n  [${name}]`);
    items.forEach((e) => console.error('    • ' + e));
  }
  process.exit(1);
}

if (assetWarnings.length) {
  console.warn(`\n⚠ ${assetWarnings.length} asset(s) over the 500 KB soft warn:`);
  assetWarnings.forEach((w) => console.warn('    • ' + w));
}

console.log(
  `✓ build checks passed — ${htmlFiles.length} pages, ${linkCount} internal links, ` +
  `${(totalJsBytes / 1024).toFixed(1)} KB JS`,
);
