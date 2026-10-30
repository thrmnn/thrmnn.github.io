// Portfolio generator: emits portfolio.html at the repo root from the site's
// own text: author.ts (headline, About), cards.ts (Hidden / Revealed /
// Changed), portfolio.ts (which case pages, in order) and the case pages in
// src/content/projects. No fact lives in this file.
//
// Generate the PDF (manual step, like the resume; weasyprint is host tooling):
//
//   node scripts/make-portfolio.mjs && weasyprint portfolio.html public/portfolio.pdf
//
// `--check` fails when public/portfolio.pdf was not made from today's sources
// (pdf-source.mjs); check-build.mjs scans every PDF in dist for the forbidden terms.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import { parse as parseYaml } from 'yaml';
import sharp from 'sharp';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import { author } from '../src/data/author.ts';
import { workCards, practiceUrl } from '../src/data/cards.ts';
import { portfolio, moreWork, sections, audienceOrder } from '../src/data/portfolio.ts';
import { talk } from '../src/data/talk.ts';
import { siteConfig } from '../src/data/site.ts';
import { sourceHash, stampMeta, checkPdf } from './pdf-source.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const esc = (s) => s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const bare = (url) => url.replace(/^https?:\/\//, '').replace(/\/$/, '');
const md = unified().use(remarkParse).use(remarkRehype).use(rehypeStringify);

function caseFile(slug) {
  const raw = readFileSync(join(root, 'src/content/projects', `${slug}.md`), 'utf8');
  const [, front, body] = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  const data = parseYaml(front);
  if (data.draft) throw new Error(`${slug} is a draft; the portfolio only details published pages`);
  return { slug, ...data, html: String(md.processSync(body)), url: `${siteConfig.url}/projects/${slug}/` };
}

const card = (id) => {
  const c = workCards.find((w) => w.id === id);
  if (!c) throw new Error(`no work card "${id}"`);
  return c;
};

const resolve = (e) => {
  const c = e.card ? card(e.card) : null;
  const slug = e.slug ?? c.href.match(/^\/projects\/([^/]+)\/$/)[1];
  const page = caseFile(slug);
  const raster = page.image && !page.image.endsWith('.svg') ? page.image : null;
  return {
    page,
    label: c?.label ?? page.label,
    title: c?.title ?? page.title,
    hidden: c?.hidden ?? e.hidden,
    revealed: c?.revealed ?? e.revealed,
    changed: c?.changed ?? e.changed,
    role: e.role,
    steps: e.steps,
    picture: page.cardImage ?? raster,
  };
};
const audience = process.argv.includes('--audience') ? process.argv[process.argv.indexOf('--audience') + 1] : null;
if (audience && !audienceOrder[audience]) throw new Error(`unknown audience "${audience}"`);
const outName = audience ? `portfolio-${audience}.html` : 'portfolio.html';
const bySlug = new Map();
for (const e of [...portfolio, ...moreWork]) {
  const r = resolve(e);
  bySlug.set(r.page.slug, r);
}
const order = audience ? audienceOrder[audience].map((id) => sections.find((s) => s.id === id)) : sections;
let seq = 0;
const groups = order.map((s) => ({
  name: s.name,
  items: s.slugs.map((slug) => {
    const x = bySlug.get(slug);
    if (!x) throw new Error(`section "${s.name}": no entry for ${slug}`);
    return { ...x, id: `p${seq++}` };
  }),
}));
const placed = groups.flatMap((g) => g.items);
for (const slug of bySlug.keys()) if (!placed.some((x) => x.page.slug === slug)) throw new Error(`${slug} is in no section`);

const practice = card('practice');

// Images are placeholders (`asset:<printed width mm>:<path>`) until the HTML is
// stamped, so the stamp hashes the source files, not one host's JPEG encoder.
const used = new Set();
const asset = (p, mm) => {
  used.add(p);
  return `asset:${mm}:${p}`;
};
const month = new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

const hrc = (x) => `<dl class="hrc">
  <dt>Hidden</dt><dd>${esc(x.hidden)}</dd>
  <dt>Revealed</dt><dd>${esc(x.revealed)}</dd>
  <dt>Changed</dt><dd>${esc(x.changed)}</dd>
</dl>`;

const links = (p) =>
  [p.url, p.github].filter(Boolean).map((u) => `<a href="${u}">${esc(bare(u))}</a>`).join(' · ');

const project = (id, kicker) => (x) => `<section class="project" id="${id(x)}">
  <header>
    <p class="label">${kicker(x) ? `<span class="sect">${kicker(x)}</span> · ` : ''}${esc(x.label)}</p>
    <h2>${esc(x.title)}</h2>
    ${x.role ? `<p class="role">${esc(x.role)}</p>` : ''}
  </header>
  <div class="top">
    ${hrc(x)}
    ${x.picture ? `<img class="plate" src="${asset(x.picture, 58)}" alt="">` : ''}
  </div>
  <div class="case">${x.page.html}${x.steps ? `<h2>How it works</h2><ol class="steps">${x.steps.map((t) => `<li>${esc(t)}</li>`).join('')}</ol>` : ''}</div>
  ${x.page.imageAlt ? `<figure><img src="${asset(x.page.image, 174)}" alt=""><figcaption>${esc(x.page.imageAlt)}</figcaption></figure>` : ''}
  <p class="foot"><span>${x.page.tags.map(esc).join(' · ')}</span><span>${links(x.page)}</span></p>
</section>`;

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${esc(author.name)}, portfolio</title>
<meta name="author" content="${esc(author.name)}">
<style>
  @font-face { font-family: 'Space Grotesk'; src: url('public/fonts/space-grotesk-latin.woff2') format('woff2'); }
  @font-face { font-family: 'Space Grotesk'; src: url('public/fonts/space-grotesk-latin-ext.woff2') format('woff2'); unicode-range: U+0100-024F, U+1E00-1EFF; }
  @font-face { font-family: 'JetBrains Mono'; src: url('public/fonts/jetbrains-mono-latin.woff2') format('woff2'); }
  @page {
    size: A4; margin: 18mm 18mm 20mm;
    @bottom-left { content: "${esc(author.name)} · portfolio"; font: 7pt 'JetBrains Mono'; color: #777; }
    @bottom-right { content: counter(page); font: 7pt 'JetBrains Mono'; color: #777; }
  }
  @page :first { @bottom-left { content: none; } @bottom-right { content: none; } }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  :root { --ink: #171717; --muted: #5c5c5c; --accent: #2563eb; --rule: #d9d9d9; }
  body { font-family: 'Space Grotesk', sans-serif; color: var(--ink); font-size: 9.5pt; line-height: 1.45; }
  a { color: inherit; text-decoration: none; }
  .label, .kicker, dt, .case h2, .foot, .contacts, .toc .n {
    font-family: 'JetBrains Mono', monospace; font-size: 7.5pt; color: var(--muted); letter-spacing: 0.02em;
  }

  .cover { height: 259mm; position: relative; page-break-after: always; }
  .cover .id { position: absolute; left: 0; right: 0; bottom: 0; }
  .cover .kicker { margin-bottom: 30mm; }
  .cover h1 { font-size: 34pt; line-height: 1.05; letter-spacing: -0.03em; font-weight: 700; max-width: 150mm; }
  .cover .sub { font-size: 14pt; color: var(--muted); margin-top: 6mm; max-width: 140mm; }
  .cover .who { font-size: 12pt; font-weight: 700; }
  .cover .role { color: var(--muted); margin: 1mm 0 3mm; }
  .contacts a { white-space: nowrap; }

  .about { page-break-after: always; }
  .kicker { text-transform: uppercase; letter-spacing: 0.12em; color: var(--accent); margin-bottom: 3mm; }
  .about .bio p { font-size: 11.5pt; line-height: 1.5; max-width: 150mm; }
  .about .bio p + p { margin-top: 3mm; }
  .about section { margin-top: 11mm; }
  .about h2 { font-size: 15pt; letter-spacing: -0.01em; margin: 1mm 0 4mm; }
  .talk { margin-top: 6mm; font-size: 10.5pt; }
  .talk span { font-family: 'JetBrains Mono', monospace; font-size: 7.5pt; color: var(--muted); margin-right: 3mm; }
  .toc li { list-style: none; display: flex; align-items: baseline; gap: 4mm; padding: 1.3mm 0; border-top: 0.5pt solid var(--rule); }
  .toc li:last-child { border-bottom: 0.5pt solid var(--rule); }
  .toc .t { font-size: 10.5pt; font-weight: 600; }
  .toc .l { flex: 1; color: var(--muted); font-size: 8.5pt; }
  .toc .n::after { content: target-counter(attr(href), page); }
  .sect { text-transform: uppercase; letter-spacing: 0.12em; color: var(--accent); }
  .toc li.sec { border-top: none; padding: 2.5mm 0 0.5mm; }
  .toc li.sec .t { font-family: 'JetBrains Mono', monospace; font-size: 7.5pt; font-weight: 400; text-transform: uppercase; letter-spacing: 0.12em; color: var(--accent); }

  .project { page-break-before: always; }
  .project > header h2 { font-size: 20pt; letter-spacing: -0.02em; line-height: 1.1; margin: 1.5mm 0 6mm; }
  .top { display: flex; gap: 7mm; align-items: flex-start; }
  .top .hrc { flex: 1; }
  .plate { width: 58mm; height: 58mm; object-fit: cover; }
  dl.hrc { display: grid; grid-template-columns: 19mm 1fr; row-gap: 3mm; border-top: 1.2pt solid var(--ink); padding-top: 3mm; }
  dl.hrc dd { font-size: 10.5pt; line-height: 1.4; }
  dl.hrc dt { padding-top: 0.8mm; }
  .case { margin-top: 6mm; max-width: 150mm; }
  .case h2 { font-weight: 400; text-transform: uppercase; letter-spacing: 0.12em; margin: 4mm 0 1.5mm; page-break-after: avoid; }
  .case p + p { margin-top: 2mm; }
  .case ul { margin: 1.5mm 0 0 4.5mm; }
  .case li + li { margin-top: 1mm; }
  .case code { font-family: 'JetBrains Mono', monospace; font-size: 8pt; }
  .case a { color: var(--accent); }
  figure { margin-top: 6mm; page-break-inside: avoid; }
  figure img { width: 100%; }
  figcaption { font-size: 8pt; color: var(--muted); margin-top: 1.5mm; max-width: 150mm; }
  .foot { display: flex; justify-content: space-between; gap: 6mm; margin-top: 6mm; padding-top: 2mm; border-top: 0.5pt solid var(--rule); }
  .foot a { color: var(--accent); white-space: nowrap; }
  .foot > span:last-child { text-align: right; }
  .project > header .role { color: var(--muted); margin: -3.5mm 0 6mm; max-width: 150mm; }
  .case ol.steps { margin: 1.5mm 0 0 4.5mm; }
  .case ol.steps li + li { margin-top: 1mm; }
</style>
</head>
<body>
<section class="cover">
  <p class="kicker">Portfolio · ${esc(month)}</p>
  <h1>${esc(author.headline)}</h1>
  <p class="sub">${esc(author.subtitle)}</p>
  <div class="id">
    <p class="who">${esc(author.name)}</p>
    <p class="role">${esc(author.role)} · ${esc(author.affiliation)}</p>
    <p class="contacts"><a href="mailto:${author.email}">${esc(author.email)}</a> · <a href="${siteConfig.url}">${esc(bare(siteConfig.url))}</a> · <a href="${practiceUrl}">${esc(bare(practiceUrl))}</a> · ${author.social.filter((s) => s.icon !== 'email').map((s) => `<a href="${s.href}">${esc(bare(s.href).replace('www.', ''))}</a>`).join(' · ')}</p>
  </div>
</section>

<section class="about">
  <p class="kicker">About</p>
  <div class="bio">${author.bio.map((p) => `<p>${p}</p>`).join('\n')}</div>
  ${talk ? `<p class="talk"><span>Speaking</span>${esc(talk.event)}, ${esc(talk.when)}</p>` : ''}

  <section>
    <p class="kicker">${esc(practice.label)}</p>
    <h2>${esc(practice.title)}</h2>
    ${hrc(practice)}
    <p class="foot"><span></span><a href="${practiceUrl}">${esc(bare(practiceUrl))}</a></p>
  </section>

  <section>
    <p class="kicker">In this portfolio</p>
    <ul class="toc">
${groups.map((g) => `      <li class="sec"><span class="t">${esc(g.name)}</span></li>\n` + g.items.map((x) => `      <li><span class="t">${esc(x.title)}</span><span class="l">${esc(x.label)}</span><a class="n" href="#${x.id}"></a></li>`).join('\n')).join('\n')}
    </ul>
  </section>
</section>

${groups.map((g) => g.items.map(project((x) => x.id, (x) => (x === g.items[0] ? esc(g.name) : ''))).join('\n\n')).join('\n\n')}
</body>
</html>
`;

const text = html.replace(/<style>[\s\S]*?<\/style>/, '').replace(/<[^>]+>/g, '');
for (const [re, where, why] of [
  [/theoh-io/i, html, 'work account'],
  [/Massif/i, text, 'studio name not public'],
  [/\+\d{1,3}[\d\s.-]{7,}/, text, 'phone'],
]) {
  const hit = where.match(re);
  if (hit) {
    console.error(`✗ forbidden content in portfolio.html (${why}): "${hit[0]}"`);
    process.exit(1);
  }
}
// The cover's month is the print date, not a source.
const hash = sourceHash(html.replace(month, ''), [...used].sort().map((p) => join(root, 'public', p)));
if (process.argv.includes('--check') && !audience) {
  checkPdf(join(root, 'public/portfolio.pdf'), hash, 'node scripts/make-portfolio.mjs && weasyprint portfolio.html public/portfolio.pdf');
  process.exit(0);
}

// JPEG at 200 dpi for the printed width keeps the PDF under check-build's 1 MB
// warning; weasyprint would embed the sources lossless.
const jpeg = async (p, mm) => {
  const buf = await sharp(join(root, 'public', p))
    .flatten({ background: '#ffffff' })
    .resize({ width: Math.round((mm / 25.4) * 200), withoutEnlargement: true })
    .jpeg({ quality: 80, mozjpeg: true })
    .toBuffer();
  return `data:image/jpeg;base64,${buf.toString('base64')}`;
};
let out = html.replace('<meta charset="utf-8">', `<meta charset="utf-8">\n${stampMeta(hash)}`);
for (const [ph, mm, p] of new Set(html.match(/asset:\d+:[^"]+/g)).values().map((ph) => ph.match(/^asset:(\d+):(.+)$/))) {
  out = out.replaceAll(`"${ph}"`, `"${await jpeg(p, Number(mm))}"`);
}
writeFileSync(join(root, outName), out);
console.log(`${outName}: ${placed.length} case pages in ${groups.length} sections`);
