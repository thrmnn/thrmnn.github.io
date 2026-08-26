// Resume generator — emits resume.html at the repo root from the site's
// canonical data (src/data/author.ts + src/data/skills.ts). No fact lives
// in this file; author.ts is the single source of truth.
//
// Generate the PDF (manual step, NOT part of CI — weasyprint is host
// tooling, never a package.json dependency):
//
//   node scripts/make-resume.mjs && weasyprint resume.html public/resume.pdf
//
// Identity rules (enforced downstream by scripts/check-build.mjs PDF scan):
// @thrmnn only — never theoh-io; no phone number.
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import { author } from '../src/data/author.ts';
import { skills } from '../src/data/skills.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const esc = (s) =>
  s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
// bio strings are trusted site-authored HTML (<strong> only) — keep markup.
const stripTags = (s) => s.replace(/<[^>]+>/g, '');

const contacts = [
  '<a href="mailto:thermann@mit.edu">thermann@mit.edu</a>',
  '<a href="mailto:thermann.ai@gmail.com">thermann.ai@gmail.com</a>',
  '<a href="https://github.com/thrmnn">github.com/thrmnn</a>',
  '<a href="https://www.linkedin.com/in/theohermann-epfl/">linkedin.com/in/theohermann-epfl</a>',
  '<a href="https://thrmnn.github.io">thrmnn.github.io</a>',
];

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${esc(author.name)} — Resume</title>
<style>
  @font-face {
    font-family: 'Space Grotesk';
    src: url('public/fonts/space-grotesk-latin.woff2') format('woff2');
  }
  @font-face {
    font-family: 'Space Grotesk';
    src: url('public/fonts/space-grotesk-latin-ext.woff2') format('woff2');
    unicode-range: U+0100-024F, U+1E00-1EFF;
  }
  @font-face {
    font-family: 'JetBrains Mono';
    src: url('public/fonts/jetbrains-mono-latin.woff2') format('woff2');
  }
  @page { size: A4; margin: 13mm 15mm 14mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  :root {
    --ink: #171717;
    --muted: #555;
    --accent: #2563eb;
    --rule: #d9d9d9;
  }
  body {
    font-family: 'Space Grotesk', sans-serif;
    color: var(--ink);
    font-size: 9pt;
    line-height: 1.38;
  }
  a { color: inherit; text-decoration: none; }
  .mono { font-family: 'JetBrains Mono', monospace; }
  header h1 { font-size: 19pt; font-weight: 700; letter-spacing: -0.02em; }
  header .role { color: var(--accent); font-weight: 500; font-size: 10.5pt; margin-top: 1mm; }
  header .contacts {
    font-family: 'JetBrains Mono', monospace;
    font-size: 7.5pt; color: var(--muted); margin-top: 2mm;
  }
  header .contacts a { color: var(--muted); }
  .summary { margin-top: 4mm; color: var(--ink); }
  .summary p + p { margin-top: 1.5mm; }
  h2 {
    font-family: 'JetBrains Mono', monospace;
    font-size: 8pt; font-weight: 600; text-transform: uppercase;
    letter-spacing: 0.12em; color: var(--accent);
    border-bottom: 0.5pt solid var(--rule);
    padding-bottom: 1mm; margin: 4mm 0 2mm;
  }
  .job { margin-bottom: 2.5mm; page-break-inside: avoid; }
  .job-head { display: flex; justify-content: space-between; align-items: baseline; }
  .job-head strong { font-size: 9.5pt; }
  .meta { font-family: 'JetBrains Mono', monospace; font-size: 7.5pt; color: var(--muted); }
  .job .org { color: var(--muted); font-size: 9pt; }
  .job .org a { color: var(--muted); }
  .job p.desc { margin-top: 1mm; }
  .edu { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 1.5mm; }
  .edu .inst { color: var(--muted); }
  table.skills { width: 100%; border-collapse: collapse; }
  table.skills td { vertical-align: top; padding: 0.8mm 0; }
  table.skills td.domain { font-weight: 600; white-space: nowrap; padding-right: 5mm; }
  .langs { color: var(--ink); }
  .langs .lvl { color: var(--muted); }
</style>
</head>
<body>
<header>
  <h1>${esc(author.name)}</h1>
  <p class="role">${esc(author.role)} · ${esc(author.affiliation)}</p>
  <p class="contacts">${contacts.join(' · ')}</p>
</header>

<div class="summary">
  ${author.bio.map((p) => `<p>${p}</p>`).join('\n  ')}
</div>

<h2>Experience</h2>
${author.experience
  .map(
    (job) => `<div class="job">
  <div class="job-head"><strong>${esc(job.role)}</strong><span class="meta">${esc(job.period)}</span></div>
  <p class="org">${job.url ? `<a href="${job.url}">${esc(job.company)}</a>` : esc(job.company)} · ${esc(job.location)}</p>
  <p class="desc">${esc(job.summary)}</p>
</div>`,
  )
  .join('\n')}

<h2>Education</h2>
${author.education
  .map(
    (edu) => `<div class="edu">
  <span><strong>${esc(edu.degree)}</strong> <span class="inst">— ${esc(edu.institution)}</span></span>
  <span class="meta">${esc(edu.years)}</span>
</div>`,
  )
  .join('\n')}

<h2>Technical Skills</h2>
<table class="skills">
${skills.map((row) => `  <tr><td class="domain">${esc(row.domain)}</td><td>${esc(row.technologies)}</td></tr>`).join('\n')}
</table>

<h2>Languages</h2>
<p class="langs">${author.languages.map((l) => `<strong>${esc(l.name)}</strong> <span class="lvl">${esc(l.level)}</span>`).join(' · ')}</p>
</body>
</html>
`;

// theoh-io anywhere (markup included); phone pattern on rendered text only
// (the CSS unicode-range would false-positive it).
const renderedText = stripTags(html.replace(/<style>[\s\S]*?<\/style>/, ''));
for (const [re, where] of [[/theoh-io/i, html], [/\+\d{1,3}[\d\s.-]{7,}/, renderedText]]) {
  const hit = where.match(re);
  if (hit) {
    console.error(`✗ forbidden content in generated resume.html: "${hit[0]}"`);
    process.exit(1);
  }
}

const out = join(root, 'resume.html');
writeFileSync(out, html);
console.log(`✓ wrote ${out} — now run: weasyprint resume.html public/resume.pdf`);
