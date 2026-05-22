// Post-build verification — the project's test suite.
// Runs against dist/ after `astro build`. Fails CI if the build is missing
// expected pages/assets, exposes a removed route, leaks publication content
// (see the no-publications rule), drops the canonical name, or contains a
// broken internal link.
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const DIST = 'dist';
const errors = [];
const fail = (m) => errors.push(m);
const must = (cond, m) => { if (!cond) fail(m); };

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
  must(existsSync(join(DIST, p)), `missing page: ${p}`);
}
must(files.some((f) => /projects\/[^/]+\/index\.html$/.test(f)), 'no project detail pages built');

// 2. expected assets
for (const a of ['og-default.png', 'favicon.svg', 'rss.xml', 'sitemap-index.xml']) {
  must(existsSync(join(DIST, a)), `missing asset: ${a}`);
}

// 3. removed routes must be gone
must(!existsSync(join(DIST, 'research')), 'research/ route must not exist');

// 4. no publication leakage (enforces the no-publications rule)
const forbidden = ['Nature Cities', 'AGU Fall', 'href="/research'];
for (const f of htmlFiles) {
  const html = readFileSync(f, 'utf8');
  for (const term of forbidden) {
    if (html.includes(term)) fail(`forbidden term "${term}" found in ${f}`);
  }
}

// 5. identity
const home = readFileSync(join(DIST, 'index.html'), 'utf8');
must(home.includes('Théo Alessandro Hermann'), 'canonical name missing from homepage');

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
      fail(`broken internal link "${m[1]}" in ${f} (→ ${target})`);
    }
  }
}

if (errors.length) {
  console.error(`\n✗ ${errors.length} build check(s) failed:`);
  errors.forEach((e) => console.error('  • ' + e));
  process.exit(1);
}
console.log(`✓ build checks passed — ${htmlFiles.length} pages, ${linkCount} internal links verified`);
