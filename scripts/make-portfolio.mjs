// Portfolio generator: emits portfolio.html at the repo root from the site's
// own text: author.ts (headline, About), cards.ts (Hidden / Revealed /
// Changed), portfolio.ts (which case pages, in order) and the case pages in
// src/content/projects. No fact lives in this file.
//
// Two formats from the same pages: portrait for a phone held upright, landscape
// for a wide screen; /cv offers the one that matches the screen. Generate the
// PDFs (manual step, like the resume; weasyprint is host tooling):
//
//   node scripts/make-portfolio.mjs && weasyprint portfolio.html public/portfolio.pdf \
//     && weasyprint portfolio-landscape.html public/portfolio-landscape.pdf
//
// `--check` fails when either PDF was not made from today's sources (pdf-source.mjs)
// or a project spills onto a second page; check-build.mjs scans every PDF in dist.
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
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
import { portfolio, moreWork, sections, audienceOrder, coverPictures } from '../src/data/portfolio.ts';
import { spotlights } from '../src/data/home.ts';
import { planSvg } from '../src/data/stata-plan-svg.ts';
import { talk } from '../src/data/talk.ts';
import { siteConfig } from '../src/data/site.ts';
import { sourceHash, stampMeta, checkPdf } from './pdf-source.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const plan = planSvg(JSON.parse(readFileSync(join(root, 'src/data/stata-plan.json'), 'utf8')));
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


const month = new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

const hrc = (x) => `<dl class="hrc">
  <dt>Hidden</dt><dd>${esc(x.hidden)}</dd>
  <dt>Revealed</dt><dd>${esc(x.revealed)}</dd>
  <dt>Changed</dt><dd>${esc(x.changed)}</dd>
</dl>`;

const links = (p) =>
  [p.url, p.github].filter(Boolean).map((u) => `<a href="${u}">${esc(bare(u))}</a>`).join(' · ');

const words = (h) => h.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
// Sections go in whole, in order, until the next one would overflow the page;
// the rest stays on the site, linked. No sentence is cut.
const caseText = (x, budget) => {
  const steps = x.steps ? `<h2>How it works</h2><ol class="steps">${x.steps.map((t) => `<li>${esc(t)}</li>`).join('')}</ol>` : '';
  const parts = x.page.html.split(/(?=<h2>)/).filter((s) => s.trim()).concat(steps ? [steps] : []);
  const kept = [];
  let n = 0;
  for (const part of parts) {
    if (kept.length && n + words(part) > budget) break;
    kept.push(part);
    n += words(part);
  }
  const more = kept.length < parts.length
    ? `<p class="more">The full case: <a href="${x.page.url}">${esc(bare(x.page.url))}</a></p>` : '';
  return kept.join('') + more;
};

const CSS_COMMON = `
  @font-face { font-family: 'Space Grotesk'; src: url('public/fonts/space-grotesk-latin.woff2') format('woff2'); }
  @font-face { font-family: 'Space Grotesk'; src: url('public/fonts/space-grotesk-latin-ext.woff2') format('woff2'); unicode-range: U+0100-024F, U+1E00-1EFF; }
  @font-face { font-family: 'JetBrains Mono'; src: url('public/fonts/jetbrains-mono-latin.woff2') format('woff2'); }
  @page :first { @bottom-left { content: none; } @bottom-right { content: none; } }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  :root { --ink: #171717; --muted: #5c5c5c; --accent: #2563eb; --rule: #d9d9d9; }
  body { font-family: 'Space Grotesk', sans-serif; color: var(--ink); line-height: 1.45; }
  a { color: inherit; text-decoration: none; }
  .label, .kicker, dt, .case h2, .tags, .links, .foot, .contacts, .toc .n {
    font-family: 'JetBrains Mono', monospace; font-size: 7.5pt; color: var(--muted); letter-spacing: 0.02em;
  }
  .kicker, .sect { text-transform: uppercase; letter-spacing: 0.12em; color: var(--accent); }
  .kicker { margin-bottom: 3mm; }
  .cover { position: relative; page-break-after: always; }
  .cover .lines span { display: block; }
  .cover .lines span:first-child { color: var(--ink); }
  .cover .id { position: absolute; left: 0; right: 0; bottom: 0; }
  .cvis { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4mm; margin-top: 12mm; }
  .cvis figure { margin: 0; }
  .cvis img, .cvis .pl { display: block; width: 100%; height: 50mm; object-fit: cover; border: 0.4pt solid var(--rule); background: #fff; box-sizing: border-box; }
  .cvis .pl svg { display: block; height: 100%; width: auto; margin: 0 auto; }
  .cvis figcaption { font-family: 'JetBrains Mono', monospace; font-size: 7pt; text-transform: uppercase; letter-spacing: 0.12em; color: var(--accent); margin-top: 1.5mm; }
  .plan .walls { stroke: #777; stroke-opacity: .5; stroke-width: 2.2; stroke-linecap: round; fill: none; }
  .plan .was, .plan .said { fill: none; stroke-width: 4; stroke-linecap: round; stroke-linejoin: round; }
  .plan .was { stroke: var(--ink); } .plan .said { stroke: var(--accent); }
  .plan .was-dot { fill: var(--ink); } .plan .said-dot { fill: var(--accent); }
  .plan .gap { stroke: var(--ink); stroke-width: 1.5; stroke-dasharray: 4 4; } .plan .bar { stroke: var(--ink); stroke-width: 2; }
  .plan .lab { font: 600 14px 'Space Grotesk', sans-serif; fill: var(--ink); paint-order: stroke; stroke: #fff; stroke-width: 5px; }
  .plan .said-lab { fill: var(--accent); } .plan .big { font-size: 22px; font-weight: 700; } .plan .tick { font: 12px 'JetBrains Mono', monospace; fill: #777; }
  .cover .who { font-size: 12pt; font-weight: 700; margin-bottom: 2mm; }
  .contacts a { white-space: nowrap; }
  .about { page-break-after: always; }
  .about .bio p + p { margin-top: 3mm; }
  .talk { margin-top: 6mm; font-size: 10.5pt; }
  .talk span { font-family: 'JetBrains Mono', monospace; font-size: 7.5pt; color: var(--muted); margin-right: 3mm; }
  .toc li { list-style: none; display: flex; align-items: baseline; gap: 4mm; padding: 1.2mm 0; border-top: 0.5pt solid var(--rule); }
  .toc li:last-child { border-bottom: 0.5pt solid var(--rule); }
  .toc .t { font-size: 10pt; font-weight: 600; }
  .toc .l { flex: 1; color: var(--muted); font-size: 8pt; }
  .toc .n::after { content: target-counter(attr(href), page); }
  .toc li.sec { border-top: none; padding: 3mm 0 0.5mm; }
  .toc li.sec .t { font-family: 'JetBrains Mono', monospace; font-size: 7.5pt; font-weight: 400; text-transform: uppercase; letter-spacing: 0.12em; color: var(--accent); }
  .project { page-break-before: always; }
  .project h2.title { font-size: 19pt; letter-spacing: -0.02em; line-height: 1.1; margin: 2mm 0 4mm; }
  .project .role { color: var(--muted); margin-bottom: 5mm; }
  dl.hrc { display: grid; grid-template-columns: 17mm 1fr; row-gap: 3mm; border-top: 1.2pt solid var(--ink); padding-top: 3mm; }
  dl.hrc dd { font-size: 10pt; line-height: 1.4; }
  dl.hrc dt { padding-top: 0.8mm; }
  .case h2 { font-weight: 400; text-transform: uppercase; letter-spacing: 0.12em; margin: 3mm 0 1.2mm; break-after: avoid; }
  .case > h2:first-child { margin-top: 0; }
  .case p + p { margin-top: 1.6mm; }
  .case ul, .case ol.steps { margin: 1.2mm 0 0 4mm; }
  .case li + li { margin-top: 0.8mm; }
  .case code { font-family: 'JetBrains Mono', monospace; font-size: 7.5pt; }
  .case a, .links a, .foot a { color: var(--accent); }
  .case .more { margin-top: 2.5mm; font-family: 'JetBrains Mono', monospace; font-size: 7.5pt; color: var(--muted); }
  figure { page-break-inside: avoid; }
  figcaption { font-size: 7.5pt; color: var(--muted); margin-top: 1.5mm; }
`;

const FORMATS = {
  portrait: {
    file: 'portfolio',
    css: `
  @page { size: A4; margin: 18mm 18mm 20mm;
    @bottom-left { content: "${esc(author.name)} · portfolio"; font: 7pt 'JetBrains Mono'; color: #777; }
    @bottom-right { content: counter(page); font: 7pt 'JetBrains Mono'; color: #777; } }
  body { font-size: 10pt; }
  .cover { height: 259mm; }
  .cover .kicker { margin-bottom: 30mm; }
  .cover h1 { font-size: 34pt; line-height: 1.05; letter-spacing: -0.03em; font-weight: 700; max-width: 150mm; }
  .cover .sub { font-size: 14pt; color: var(--muted); margin-top: 5mm; }
  .cover .lines { margin-top: 10mm; font-size: 10.5pt; line-height: 1.55; color: var(--muted); }
  .about .bio p { font-size: 11.5pt; line-height: 1.5; max-width: 150mm; }
  .about .right { margin-top: 11mm; }
  .top { display: flex; gap: 7mm; align-items: flex-start; }
  .top .hrc { flex: 1; }
  .plate { width: 58mm; height: 58mm; object-fit: cover; }
  .case { margin-top: 6mm; max-width: 150mm; font-size: 10pt; }
  figure.wide { margin-top: 5mm; }
  figure.wide img { display: block; max-width: 100%; max-height: 82mm; width: auto; }
  .foot { display: flex; justify-content: space-between; gap: 6mm; margin-top: 5mm; padding-top: 2mm; border-top: 0.5pt solid var(--rule); }
  .foot a { white-space: nowrap; }
  .foot > span:last-child { text-align: right; }`,
    // Words of case text that fit under the top block: fewer when a wide figure follows.
    budget: (x) => (x.page.imageAlt ? 120 : 245),
    project: (x, kicker, asset, budget) => `<section class="project" id="${x.id}">
  <p class="label">${kicker ? `<span class="sect">${kicker}</span> · ` : ''}${esc(x.label)}</p>
  <h2 class="title">${esc(x.title)}</h2>
  ${x.role ? `<p class="role">${esc(x.role)}</p>` : ''}
  <div class="top">
    ${hrc(x)}
    ${x.picture && !x.page.imageAlt ? `<img class="plate" src="${asset(x.picture, 58)}" alt="">` : ''}
  </div>
  <div class="case">${caseText(x, budget)}</div>
  ${x.page.imageAlt ? `<figure class="wide"><img src="${asset(x.page.image, 174)}" alt=""><figcaption>${esc(x.page.imageAlt)}</figcaption></figure>` : ''}
  <p class="foot"><span>${x.page.tags.map(esc).join(' · ')}</span><span>${links(x.page)}</span></p>
</section>`,
  },
  landscape: {
    file: 'portfolio-landscape',
    css: `
  @page { size: A4 landscape; margin: 14mm 16mm 15mm;
    @bottom-left { content: "${esc(author.name)} · portfolio"; font: 7pt 'JetBrains Mono'; color: #777; }
    @bottom-right { content: counter(page); font: 7pt 'JetBrains Mono'; color: #777; } }
  body { font-size: 10pt; }
  .cover { height: 181mm; }
  .cover .kicker { margin-bottom: 26mm; }
  .cover h1 { font-size: 48pt; line-height: 1.02; letter-spacing: -0.03em; font-weight: 700; }
  .cover .sub { font-size: 17pt; color: var(--muted); margin-top: 5mm; }
  .cover .lines { margin-top: 12mm; font-size: 11.5pt; line-height: 1.55; color: var(--muted); }
  .cvis { margin-top: 12mm; gap: 6mm; } .cvis img, .cvis .pl { height: 46mm; }
  .about .left { float: left; width: 118mm; }
  .about .right { margin-left: 132mm; }
  .about .bio p { font-size: 11pt; line-height: 1.5; }
  .toc li:not(.sec) { flex-wrap: wrap; row-gap: 0.4mm; }
  .toc li:not(.sec) .n { order: 2; margin-left: auto; }
  .toc li:not(.sec) .l { order: 3; flex: 0 0 100%; }
  .project .lead { float: left; width: 84mm; }
  .project .body { margin-left: 94mm; }
  .tags { margin-top: 6mm; padding-top: 2mm; border-top: 0.5pt solid var(--rule); }
  .links { margin-top: 1.5mm; }
  .vis { margin-bottom: 5mm; }
  .vis img { display: block; max-width: 100%; max-height: 76mm; width: auto; }
  .case { column-count: 2; column-gap: 8mm; font-size: 10pt; line-height: 1.42; }
  .body.card dl.hrc { grid-template-columns: 24mm 1fr; row-gap: 5mm; padding-top: 4mm; margin-bottom: 9mm; }
  .body.card dl.hrc dd { font-size: 13pt; line-height: 1.32; letter-spacing: -0.005em; }
  .body.card dl.hrc dt { padding-top: 1.6mm; }
  .body.card .case { font-size: 10pt; line-height: 1.5; }`,
    // One visual per project, the larger the better (CommKit: visuals carry the page):
    // the case page's captioned figure if it has one, else its card plate or raster image.
    visual: (x, asset) =>
      x.page.imageAlt
        ? `<figure class="vis"><img src="${asset(x.page.image, 160)}" alt=""><figcaption>${esc(x.page.imageAlt)}</figcaption></figure>`
        : x.picture
          ? `<figure class="vis"><img src="${asset(x.picture, 140)}" alt=""></figure>`
          : '',
    // Words of case text that fit beside the lead column: fewer under a picture.
    budget: (x) => (x.page.imageAlt || x.picture ? 190 : 220),
    // A page with no picture yet carries its card in the wide column, set large, so the
    // page reads as designed rather than half empty (diagnostic, 30 Oct).
    project(x, kicker, asset, budget) {
      const vis = this.visual(x, asset);
      return `<section class="project" id="${x.id}">
  <div class="lead">
    <p class="label">${kicker ? `<span class="sect">${kicker}</span><br>` : ''}${esc(x.label)}</p>
    <h2 class="title">${esc(x.title)}</h2>
    ${x.role ? `<p class="role">${esc(x.role)}</p>` : ''}
    ${vis ? hrc(x) : ''}
    <p class="tags">${x.page.tags.map(esc).join(' · ')}</p>
    <p class="links">${links(x.page)}</p>
  </div>
  <div class="body${vis ? '' : ' card'}">
    ${vis || hrc(x)}
    <div class="case">${caseText(x, budget)}</div>
  </div>
</section>`;
    },
  },
};

// Images are placeholders (`asset:<printed width mm>:<path>`) until the HTML is
// stamped, so the stamp hashes the source files, not one host's JPEG encoder.
const build = (f) => {
  const used = new Set();
  const asset = (p, mm) => {
    used.add(p);
    return `asset:${mm}:${p}`;
  };
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${esc(author.name)}, portfolio</title>
<meta name="author" content="${esc(author.name)}">
<style>${CSS_COMMON}${f.css}
</style>
</head>
<body>
<section class="cover">
  <p class="kicker">Portfolio · ${esc(month)}</p>
  <h1>${esc(author.headline)}</h1>
  <p class="sub">${esc(author.subtitle)}</p>
  <p class="lines">${author.heroLines.map((l) => `<span>${esc(l)}</span>`).join('')}</p>
  <div class="cvis">${spotlights.map((s) => `<figure>${coverPictures[s.id] === 'plan' ? `<div class="pl">${plan}</div>` : `<img src="${asset(coverPictures[s.id], 60)}" alt="">`}<figcaption>${esc(s.label)}</figcaption></figure>`).join('')}</div>
  <div class="id">
    <p class="who">${esc(author.name)}</p>
    <p class="contacts"><a href="mailto:${author.email}">${esc(author.email)}</a> · <a href="${siteConfig.url}">${esc(bare(siteConfig.url))}</a> · <a href="${practiceUrl}">${esc(bare(practiceUrl))}</a> · ${author.social.filter((s) => s.icon !== 'email').map((s) => `<a href="${s.href}">${esc(bare(s.href).replace('www.', ''))}</a>`).join(' · ')}</p>
  </div>
</section>

<section class="about">
  <div class="left">
    <p class="kicker">About</p>
    <div class="bio">${author.bio.map((p) => `<p>${p}</p>`).join('\n')}</div>
    ${talk ? `<p class="talk"><span>Speaking</span>${esc(talk.event)}, ${esc(talk.when)}</p>` : ''}
  </div>
  <div class="right">
    <p class="kicker">In this portfolio</p>
    <ul class="toc">
${groups.map((g) => `      <li class="sec"><span class="t">${esc(g.name)}</span></li>\n` + g.items.map((x) => `      <li><span class="t">${esc(x.title)}</span><span class="l">${esc(x.label)}</span><a class="n" href="#${x.id}"></a></li>`).join('\n')).join('\n')}
    </ul>
  </div>
</section>

${groups.map((g) => g.items.map((x) => f.project(x, x === g.items[0] ? esc(g.name) : '', asset, f.budget(x))).join('\n\n')).join('\n\n')}
</body>
</html>
`;
  return { html, used };
};

// JPEG at 200 dpi for the printed width keeps each PDF under check-build's 1 MB
// warning; weasyprint would embed the sources lossless.
const jpeg = async (p, mm) => {
  const buf = await sharp(join(root, 'public', p))
    .flatten({ background: '#ffffff' })
    .resize({ width: Math.round((mm / 25.4) * 200), withoutEnlargement: true })
    .jpeg({ quality: 80, mozjpeg: true })
    .toBuffer();
  return `data:image/jpeg;base64,${buf.toString('base64')}`;
};

for (const f of Object.values(FORMATS)) {
  const { html, used } = build(f);
  const text = html.replace(/<style>[\s\S]*?<\/style>/, '').replace(/<[^>]+>/g, '');
  for (const [re, where, why] of [
    [/theoh-io/i, html, 'work account'],
    [/Massif/i, text, 'studio name not public'],
    [/\+\d{1,3}[\d\s.-]{7,}/, text, 'phone'],
  ]) {
    const hit = where.match(re);
    if (hit) {
      console.error(`✗ forbidden content in ${f.file}.html (${why}): "${hit[0]}"`);
      process.exit(1);
    }
  }
  // The cover's month is the print date, not a source.
  const hash = sourceHash(html.replace(month, ''), [...used].sort().map((p) => join(root, 'public', p)));
  const pdf = join(root, 'public', `${f.file}.pdf`);
  if (process.argv.includes('--check')) {
    if (audience) continue;
    checkPdf(pdf, hash, `node scripts/make-portfolio.mjs && weasyprint ${f.file}.html public/${f.file}.pdf`);
    // One page per project (CommKit): cover, About, then exactly one page each; a spill is a defect.
    const pages = Number(execFileSync('pdfinfo', [pdf]).toString().match(/Pages:\s+(\d+)/)[1]);
    if (pages !== 2 + placed.length) {
      console.error(`✗ public/${f.file}.pdf has ${pages} pages, want ${2 + placed.length}: a project spills onto a second page`);
      process.exit(1);
    }
    console.log(`✓ ${f.file}.pdf: one page per project (${placed.length} projects, ${pages} pages)`);
    continue;
  }
  let out = html.replace('<meta charset="utf-8">', `<meta charset="utf-8">\n${stampMeta(hash)}`);
  for (const [ph, mm, p] of new Set(html.match(/asset:\d+:[^"]+/g)).values().map((ph) => ph.match(/^asset:(\d+):(.+)$/))) {
    out = out.replaceAll(`"${ph}"`, `"${await jpeg(p, Number(mm))}"`);
  }
  const name = audience ? `${f.file}-${audience}.html` : `${f.file}.html`;
  writeFileSync(join(root, name), out);
  console.log(`${name}: ${placed.length} case pages in ${groups.length} sections`);
}
