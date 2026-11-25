import raw from '../../scripts/assets/pipeline/tracks.json';

type Raw = { width: number; height: number; frames: number; tracks: Record<string, number[][]> };
const src = raw as unknown as Raw;

// One run per unbroken stretch of a track, delta-coded per frame:
// [trackId, firstFrame, x, y, w, h, dx, dy, dw, dh, ...]. Foot point at half resolution,
// box size at quarter resolution, which keeps the page's copy of tracks.json small.
function slim(d: Raw) {
  const runs: number[][] = [];
  for (const [id, rows] of Object.entries(d.tracks)) {
    let run: number[] | null = null;
    let cur = [0, 0, 0, 0], last = -2;
    for (const [f, x, y, w, h] of rows) {
      const q = [Math.round(x / 2), Math.round(y / 2), Math.round(w / 4), Math.round(h / 4)];
      if (run && f === last + 1) run.push(...q.map((v, i) => v - cur[i]));
      else { run = [Number(id), f, ...q]; runs.push(run); }
      cur = q; last = f;
    }
  }
  return { w: d.width / 2, h: d.height / 2, frames: d.frames, runs };
}

export function trackFigure() {
  const data = slim(src);
  const perFrame = new Array(src.frames + 1).fill(0);
  for (const r of data.runs) {
    const len = (r.length - 6) / 4 + 1;
    for (let f = r[1]; f < r[1] + len; f++) perFrame[f]++;
  }
  const stats = {
    frames: src.frames,
    tracks: Object.keys(src.tracks).length,
    peak: Math.max(...perFrame),
  };
  return { data, stats };
}

export function fillFacts(facts: { label: string; value: string }[], stats: Record<string, number>) {
  return facts.map((f) => ({
    label: f.label,
    value: f.value.replace(/\{(\w+)\}/g, (_, k) => {
      if (!(k in stats)) throw new Error(`facts: unknown placeholder {${k}}`);
      return String(stats[k]);
    }),
  }));
}
