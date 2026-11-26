// Build-time decode of the Stata replay files (scripts/assets/stata) into metres, for the replay figure on the ros2-localization-triage page.
// Frames and formats follow scripts/sample-stata-replay.py and scripts/make-stata-plate.py.
import { readFileSync } from 'node:fs';
import { inflateRawSync } from 'node:zlib';

const DIR = `${process.cwd()}/scripts/assets/stata`;
const json = (f: string) => JSON.parse(readFileSync(`${DIR}/${f}`, 'utf8'));

function npz(file: string): Record<string, { shape: number[]; data: number[] }> {
  const buf = readFileSync(file);
  const out: Record<string, { shape: number[]; data: number[] }> = {};
  let eocd = buf.length - 22;
  while (buf.readUInt32LE(eocd) !== 0x06054b50) eocd--;
  const n = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  for (let i = 0; i < n; i++) {
    const method = buf.readUInt16LE(p + 10), csize = buf.readUInt32LE(p + 20);
    const nlen = buf.readUInt16LE(p + 28), elen = buf.readUInt16LE(p + 30), clen = buf.readUInt16LE(p + 32);
    const lho = buf.readUInt32LE(p + 42);
    const name = buf.toString('utf8', p + 46, p + 46 + nlen).replace(/\.npy$/, '');
    const dstart = lho + 30 + buf.readUInt16LE(lho + 26) + buf.readUInt16LE(lho + 28);
    const raw = buf.subarray(dstart, dstart + csize);
    const npy = method === 8 ? inflateRawSync(raw) : raw;
    const hl = npy[6] === 1 ? npy.readUInt16LE(8) : npy.readUInt32LE(8);
    const off = (npy[6] === 1 ? 10 : 12) + hl;
    const head = npy.toString('latin1', npy[6] === 1 ? 10 : 12, off);
    const descr = /'descr':\s*'([^']+)'/.exec(head)![1];
    const shape = (/'shape':\s*\(([^)]*)\)/.exec(head)![1].split(',').map((s) => s.trim()).filter(Boolean).map(Number));
    const count = shape.reduce((a, b) => a * b, 1);
    const data: number[] = [];
    for (let k = 0; k < count; k++) {
      data.push(descr === '<i2' ? npy.readInt16LE(off + 2 * k) : descr === '<f8' ? npy.readDoubleLE(off + 8 * k) : NaN);
    }
    out[name] = { shape, data };
    p += 46 + nlen + elen + clen;
  }
  return out;
}

const r1 = (v: number) => Math.round(v * 10) / 10;
const r2 = (v: number) => Math.round(v * 100) / 100;
const r3 = (v: number) => Math.round(v * 1000) / 1000;

export function stataMeta() {
  return json('stata-replay.meta.json') as {
    platform: string; dataset: string; license: string; duration_s: number; poses: number; source: string;
    lost_window: { position_error_median_m: number; amcl_reported_sigma_median_m: number };
    zones_s: { healthy_end_s: number; lost_start_s: number; lost_end_s: number };
  };
}

export function stataFacts() {
  const m = stataMeta();
  const plate = readFileSync(`${process.cwd()}/scripts/make-stata-plate.py`, 'utf8');
  const stated = /part3_after_floor_change,\s*(\d+)\s*s/.exec(plate);
  if (!stated) throw new Error('make-stata-plate.py no longer states the lost window length');
  return [
    { label: 'Lost window', value: `${stated[1]} s, median ${r1(m.lost_window.position_error_median_m)} m off` },
    { label: 'Reported uncertainty', value: `median ${m.lost_window.amcl_reported_sigma_median_m} m` },
    { label: 'Dataset', value: `${m.dataset}, ${m.license}` },
  ];
}

export function stataReplay() {
  const meta = stataMeta();
  const rep = json('stata-replay.json') as { t_max_s: number; poses: number[][]; events: number[][]; detectors: string[]; frame: { center: number[]; scale: number } };
  const [cx, cy] = rep.frame.center, sc = rep.frame.scale;
  const lm = npz(`${DIR}/lost-moment.npz`);
  const keyT = lm.meta.data[0], keyErr = lm.meta.data[1], keySig = lm.meta.data[2];
  const keyTrue = lm.true_pose.data, keyRep = lm.amcl_pose.data;
  const timed = json('stata-truth.json') as { healthy: number[][]; lost: number[][] };
  const { lost_start_s: t0, lost_end_s: t1 } = meta.zones_s;
  // timed ground truth: the dataset's AprilTag rows (scripts/make-stata-truth.py), interpolated to any time inside either file's span
  const trueAt = (t: number) => {
    for (const seg of [timed.healthy, timed.lost]) {
      if (t < seg[0][0] || t > seg[seg.length - 1][0]) continue;
      let lo = 0, hi = seg.length - 1;
      while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (seg[mid][0] <= t) lo = mid; else hi = mid; }
      const a = (t - seg[lo][0]) / (seg[hi][0] - seg[lo][0]);
      return [seg[lo][1] + (seg[hi][1] - seg[lo][1]) * a, seg[lo][2] + (seg[hi][2] - seg[lo][2]) * a];
    }
    return null;
  };
  let keyIdx = 0;
  rep.poses.forEach((p, i) => { if (Math.abs(p[0] / 10 - keyT) < Math.abs(rep.poses[keyIdx][0] / 10 - keyT)) keyIdx = i; });
  const poses = rep.poses.map((p, i) => {
    let t = p[0] / 10;
    let x = cx + (p[1] / 32767) * sc, y = cy + (p[2] / 32767) * sc, sig = p[3] / 100;
    if (i === keyIdx) { t = keyT; x = keyRep[0]; y = keyRep[1]; sig = keySig; }
    const tr = trueAt(t);
    const d = tr ? Math.hypot(tr[0] - x, tr[1] - y) : null;
    return [r2(t), r2(x), r2(y), r3(sig), tr ? r2(tr[0]) : null, tr ? r2(tr[1]) : null, d === null ? null : r2(d)];
  });
  const every = (seg: number[][], n: number) => seg.filter((_, i) => i % n === 0 || i === seg.length - 1).map(([t, x, y]) => [r2(t), x, y]);
  const bin = readFileSync(`${DIR}/stata-walls.bin`);
  const walls: number[] = [];
  for (let i = 0; i + 3 < bin.length; i += 4) walls.push(r1(cx + (bin.readInt8(i) / 127) * sc), r1(cy + (bin.readInt8(i + 1) / 127) * sc));
  return {
    t_max: rep.t_max_s,
    poses,
    key: keyIdx,
    events: rep.events.map(([t, d]) => [t / 10, d]),
    detectors: rep.detectors,
    zones: { healthy_end: meta.zones_s.healthy_end_s, lost_start: t0, lost_end: t1 },
    truth: [every(timed.healthy, 5), every(timed.lost, 5)],
    key_stored: { t: keyT, err: keyErr, sigma: keySig, true_pose: [keyTrue[0], keyTrue[1]] },
    walls,
    credit: { dataset: meta.dataset, license: meta.license, platform: meta.platform, source: meta.source },
  };
}
