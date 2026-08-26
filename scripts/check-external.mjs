// External-link liveness audit — on-demand tool, deliberately NOT part of
// preflight/CI: network flakiness must never block a deploy.
//
//   npm run build && npm run check:external
//
// Collects every external href from dist/ HTML, HEADs each (falls back to
// GET when HEAD is rejected) with a browser UA and a 10s timeout, and
// reports anything outside 2xx/3xx with the pages that reference it.
// Exit code 1 when any link is dead, so it can gate a manual audit.
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const DIST = 'dist';
const TIMEOUT_MS = 10_000;
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

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

const refs = new Map(); // url -> Set of referencing pages
for (const f of walk(DIST).filter((f) => f.endsWith('.html'))) {
  const html = readFileSync(f, 'utf8');
  for (const m of html.matchAll(/href="(https?:\/\/[^"]+)"/g)) {
    const url = m[1];
    if (!refs.has(url)) refs.set(url, new Set());
    refs.get(url).add(f.replace(/\\/g, '/'));
  }
}

async function probe(url, method) {
  const res = await fetch(url, {
    method,
    redirect: 'follow',
    headers: { 'user-agent': UA, accept: '*/*' },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  return res.status;
}

async function check(url) {
  try {
    let status = await probe(url, 'HEAD');
    if (status >= 400) status = await probe(url, 'GET');
    return { url, status, ok: status < 400 };
  } catch (err) {
    return { url, status: null, ok: false, error: err.cause?.code ?? err.name };
  }
}

const urls = [...refs.keys()].sort();
console.log(`checking ${urls.length} external links from dist/ …`);
const results = await Promise.all(urls.map(check));

const dead = results.filter((r) => !r.ok);
for (const r of results) {
  const tag = r.ok ? '✓' : '✗';
  const status = r.status ?? r.error;
  console.log(`${tag} ${status}  ${r.url}`);
  if (!r.ok) for (const page of refs.get(r.url)) console.log(`      ↳ referenced by ${page}`);
}

if (dead.length) {
  console.error(`\n✗ ${dead.length}/${urls.length} external link(s) not resolving`);
  process.exit(1);
}
console.log(`\n✓ all ${urls.length} external links resolve`);
