import raw from '../../scripts/assets/pipeline/tracks.json';

type Raw = { width: number; height: number; frames: number; tracks: Record<string, number[][]> };
const src = raw as unknown as Raw;

// Half-resolution foot points, one run per unbroken stretch of a track, delta-coded:
// [firstFrame, x0, y0, dx, dy, dx, dy, ...]. Keeps the page's copy of tracks.json small.
function slim(d: Raw) {
  const runs: number[][] = [];
  for (const rows of Object.values(d.tracks)) {
    let run: number[] | null = null;
    let px = 0, py = 0, last = -2;
    for (const [f, x, y] of rows) {
      const qx = Math.round(x / 2), qy = Math.round(y / 2);
      if (run && f === last + 1) run.push(qx - px, qy - py);
      else { run = [f, qx, qy]; runs.push(run); }
      px = qx; py = qy; last = f;
    }
  }
  return { w: d.width / 2, h: d.height / 2, frames: d.frames, runs };
}

export function trackFigure() {
  const data = slim(src);
  const perFrame = new Array(src.frames + 1).fill(0);
  for (const r of data.runs) {
    const len = (r.length - 3) / 2 + 1;
    for (let f = r[0]; f < r[0] + len; f++) perFrame[f]++;
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
