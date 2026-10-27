// The source stamp that ties a generated PDF to the HTML it was made from.
// make-resume.mjs and make-portfolio.mjs write `src-sha256:<hash>` into the
// PDF's keywords; with --check they regenerate the HTML and look for that
// stamp, so a PDF left behind by an edit to author.ts, cards.ts or a case page
// fails preflight. The resume went stale exactly that way on the cycle-16
// branches (role and About changed, resume.pdf not regenerated).
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { inflateSync } from 'node:zlib';

export const sourceHash = (html, files = []) => {
  const h = createHash('sha256').update(html);
  for (const f of files) h.update(readFileSync(f));
  return h.digest('hex').slice(0, 16);
};

export const stampMeta = (hash) => `<meta name="keywords" content="src-sha256:${hash}">`;

// weasyprint writes the Info dict inside a compressed object stream.
function hasStamp(pdf, stamp) {
  const b = readFileSync(pdf);
  const s = b.toString('latin1');
  if (s.includes(stamp)) return true;
  for (const m of s.matchAll(/stream\r?\n/g)) {
    const start = m.index + m[0].length;
    try {
      if (inflateSync(b.subarray(start, s.indexOf('endstream', start))).toString('latin1').includes(stamp)) return true;
    } catch {}
  }
  return false;
}

export function checkPdf(pdf, hash, regenerate) {
  const stamp = `src-sha256:${hash}`;
  let ok;
  try {
    ok = hasStamp(pdf, stamp);
  } catch (err) {
    console.error(`✗ ${pdf}: cannot read it (${err.message})`);
    process.exit(1);
  }
  if (!ok) {
    console.error(`✗ ${pdf} does not match its sources (no ${stamp}). Regenerate:\n    ${regenerate}`);
    process.exit(1);
  }
  console.log(`✓ ${pdf} matches its generator (${stamp})`);
}
