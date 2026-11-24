// Gate for public/talks/: no metadata, capped size, referenced by an entry, credited.
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const DIR = process.env.TALKS_DIR || 'public/talks';
const { talks, MAX_EDGE } = await import('../src/data/talks.ts');
const errors = [];

function webpInfo(buf) {
  if (buf.length < 30 || buf.toString('latin1', 0, 4) !== 'RIFF' || buf.toString('latin1', 8, 12) !== 'WEBP') return null;
  const chunks = [];
  let w = 0, h = 0;
  for (let o = 12; o + 8 <= buf.length;) {
    const id = buf.toString('latin1', o, o + 4);
    const size = buf.readUInt32LE(o + 4);
    const d = o + 8;
    chunks.push(id);
    if (id === 'VP8X') { w = 1 + buf.readUIntLE(d + 4, 3); h = 1 + buf.readUIntLE(d + 7, 3); }
    else if (id === 'VP8 ' && !w) { w = buf.readUInt16LE(d + 6) & 0x3fff; h = buf.readUInt16LE(d + 8) & 0x3fff; }
    else if (id === 'VP8L' && !w) { const b = buf.readUInt32LE(d + 1); w = (b & 0x3fff) + 1; h = ((b >> 14) & 0x3fff) + 1; }
    o = d + size + (size & 1);
  }
  return { chunks, w, h };
}

const refs = new Map(talks.filter((t) => t.photo).map((t) => [t.photo.src, t]));
const files = existsSync(DIR) ? readdirSync(DIR) : [];
for (const name of files) {
  const rel = `${DIR}/${name}`;
  const info = name.endsWith('.webp') ? webpInfo(readFileSync(join(DIR, name))) : null;
  if (!info) { errors.push(`${rel}: not a readable .webp`); continue; }
  const bad = info.chunks.filter((c) => c === 'EXIF' || c === 'XMP ');
  if (bad.length) errors.push(`${rel}: carries metadata (${bad.map((c) => c.trim()).join(', ')}); rerun make-talk-photos`);
  if (Math.max(info.w, info.h) > MAX_EDGE) errors.push(`${rel}: long edge ${Math.max(info.w, info.h)} px exceeds MAX_EDGE ${MAX_EDGE}`);
  const t = refs.get(`/talks/${name}`);
  if (!t) errors.push(`${rel}: no talks entry references it`);
  else if (!t.photo.credit?.trim()) errors.push(`${rel}: entry "${t.id}" has an empty credit`);
  else if (t.photo.w !== info.w || t.photo.h !== info.h) errors.push(`${rel}: entry "${t.id}" says ${t.photo.w}x${t.photo.h}, file is ${info.w}x${info.h}`);
}
for (const t of talks) {
  if (t.photo && !files.includes(t.photo.src.split('/').pop())) errors.push(`entry "${t.id}": ${t.photo.src} is missing from ${DIR}`);
}

if (errors.length) {
  console.error(`✗ ${errors.length} talk photo check(s) failed:`);
  errors.forEach((e) => console.error('  • ' + e));
  process.exit(1);
}
console.log(`✓ talk photos clean — ${files.length} file(s), max edge ${MAX_EDGE}`);
