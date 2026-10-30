// One-page leave-behind for after a conversation (owner, 2026-10-28: "a nice
// pdf to send after conversations in dubai"): the hero lines, the homepage's
// three spotlights, and two QR codes, to the full portfolio PDF and to the
// practice site. Every line comes from the site's data; no fact lives here.
//
//   node scripts/make-leave-behind.mjs && weasyprint leave-behind.html <out.pdf>
//
// QR codes need the `segno` CLI (owner approved 2026-10-29; `uv tool install segno`).
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import { parse as parseYaml } from 'yaml';
import { author } from '../src/data/author.ts';
import { practiceUrl } from '../src/data/cards.ts';
import { spotlights, homeCards } from '../src/data/home.ts';
import { talk } from '../src/data/talk.ts';
import { siteConfig } from '../src/data/site.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const esc = (s) => s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const bare = (url) => url.replace(/^https?:\/\//, '').replace(/\/$/, '');

const title = (slug) => {
  const raw = readFileSync(join(root, 'src/content/projects', `${slug}.md`), 'utf8');
  return parseYaml(raw.match(/^---\n([\s\S]*?)\n---/)[1]).title;
};

const work = mkdtempSync(join(tmpdir(), 'qr-'));
const qr = (url) => {
  const out = join(work, 'qr.svg');
  execFileSync('segno', ['--output', out, '--border', '0', '--scale', '4', '--dark', '#171717', url]);
  return `data:image/svg+xml;base64,${readFileSync(out).toString('base64')}`;
};
const portfolioUrl = `${siteConfig.url}/portfolio.pdf`;
const codes = [
  { url: portfolioUrl, label: 'The full portfolio (PDF)' },
  { url: practiceUrl, label: 'For robot makers' },
].map((c) => ({ ...c, src: qr(c.url) }));
rmSync(work, { recursive: true });

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${esc(author.name)}</title>
<meta name="author" content="${esc(author.name)}">
<style>
  @font-face { font-family: 'Space Grotesk'; src: url('public/fonts/space-grotesk-latin.woff2') format('woff2'); }
  @font-face { font-family: 'Space Grotesk'; src: url('public/fonts/space-grotesk-latin-ext.woff2') format('woff2'); unicode-range: U+0100-024F, U+1E00-1EFF; }
  @font-face { font-family: 'JetBrains Mono'; src: url('public/fonts/jetbrains-mono-latin.woff2') format('woff2'); }
  @page { size: A4; margin: 18mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  :root { --ink: #171717; --muted: #5c5c5c; --accent: #2563eb; --rule: #d9d9d9; }
  body { font-family: 'Space Grotesk', sans-serif; color: var(--ink); font-size: 10pt; line-height: 1.45; }
  a { color: inherit; text-decoration: none; }
  .mono { font-family: 'JetBrains Mono', monospace; font-size: 7.5pt; letter-spacing: 0.02em; color: var(--muted); }
  .kicker, .spot .label { text-transform: uppercase; letter-spacing: 0.12em; color: var(--accent); }
  .page { height: 261mm; position: relative; }
  h1 { font-size: 30pt; line-height: 1.05; letter-spacing: -0.03em; margin-top: 4mm; }
  .sub { font-size: 13pt; color: var(--muted); margin-top: 3mm; }
  .role { margin-top: 5mm; }
  .talk { margin-top: 2mm; }
  .spots { margin-top: 12mm; border-top: 1.2pt solid var(--ink); }
  .spot { display: grid; grid-template-columns: 38mm 1fr; column-gap: 6mm; padding: 5mm 0; border-bottom: 0.5pt solid var(--rule); }
  .spot h2 { font-size: 13pt; letter-spacing: -0.01em; line-height: 1.2; }
  .spot .lead { margin-top: 1.5mm; max-width: 120mm; }
  .spot ul { list-style: none; margin-top: 2mm; }
  .spot li { font-size: 8.5pt; color: var(--muted); }
  .spot li::before { content: "→ "; color: var(--accent); }
  .foot { position: absolute; left: 0; right: 0; bottom: 0; }
  .codes { display: flex; gap: 14mm; margin-bottom: 7mm; }
  .code { display: flex; gap: 4mm; align-items: flex-end; }
  .code img { width: 26mm; height: 26mm; }
  .code p { font-size: 9.5pt; font-weight: 600; white-space: nowrap; }
  .code .mono { font-weight: 400; display: block; margin-top: 1mm; }
  .contacts a { white-space: nowrap; }
</style>
</head>
<body>
<div class="page">
  <p class="mono kicker">${esc(author.name)}</p>
  <h1>${esc(author.headline)}</h1>
  <p class="sub">${esc(author.subtitle)}</p>
  <p class="mono role">${esc(author.role)} · ${esc(author.affiliation)}</p>
  ${talk ? `<p class="mono talk">Speaking · ${esc(talk.event)}, ${esc(talk.when)}</p>` : ''}
  <div class="spots">
${spotlights.map((s) => `    <section class="spot">
      <p class="mono label">${esc(s.label)}</p>
      <div>
        <h2>${esc(s.title)}</h2>
        ${s.lead ? `<p class="lead">${esc(s.lead)}</p>` : ''}
        <ul>${s.slugs.map((slug) => `<li>${esc(title(slug))}</li>`).join('')}</ul>
      </div>
    </section>`).join('\n')}
    <section class="spot">
      <p class="mono label">More work</p>
      <div><ul>${homeCards.map((c) => `<li>${esc(c.title)}</li>`).join('')}</ul></div>
    </section>
  </div>
  <div class="foot">
    <div class="codes">
${codes.map((c) => `      <a class="code" href="${c.url}"><img src="${c.src}" alt=""><p>${esc(c.label)}<span class="mono">${esc(bare(c.url))}</span></p></a>`).join('\n')}
    </div>
    <p class="mono contacts"><a href="mailto:${author.email}">${esc(author.email)}</a> · <a href="${siteConfig.url}">${esc(bare(siteConfig.url))}</a> · ${author.social.filter((s) => s.icon !== 'email').map((s) => `<a href="${s.href}">${esc(bare(s.href).replace('www.', ''))}</a>`).join(' · ')}</p>
  </div>
</div>
</body>
</html>
`;
writeFileSync(join(root, 'leave-behind.html'), html);
console.log('leave-behind.html written');
