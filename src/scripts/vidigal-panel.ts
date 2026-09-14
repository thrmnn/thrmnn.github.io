// Vidigal, drawn from the geometry this site already publishes: a digital
// terrain model and building footprints. It shows the shape of the settlement
// and nothing else. No derived quantity is computed or displayed here, because
// every number on a personal page is a claim someone can contest, and the
// study this geometry comes from is unpublished.
//
// The only motion is a one-shot reveal, back to front, when the panel first
// comes into view.
const STRIDE = 4; // int8 x, int8 y, uint8 z, uint8 category (0=terrain, 1=building)
const ROT = 0.5;
const TILT = 0.62;
const COS_R = Math.cos(ROT);
const SIN_R = Math.sin(ROT);
const COS_T = Math.cos(TILT);
const SIN_T = Math.sin(TILT);
const Y_SQUASH = 0.7;
const FILL = 0.94;
const REVEAL_MS = 1600;

interface Cloud {
  n: number;
  px: Float32Array; // projected, before scale
  py: Float32Array;
  depth: Float32Array; // 0 at the back, 1 at the front
  cat: Uint8Array;
  order: Uint32Array;
  ax0: number;
  ax1: number;
  ay0: number;
  ay1: number;
}

function pct(sorted: Float64Array, q: number): number {
  const i = Math.round(q * (sorted.length - 1));
  return sorted[Math.min(sorted.length - 1, Math.max(0, i))]!;
}

async function load(url: string): Promise<Cloud> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`vidigal-panel: ${url} -> ${res.status}`);
  const buf = await res.arrayBuffer();
  const view = new DataView(buf);
  const n = Math.floor(buf.byteLength / STRIDE);

  const px = new Float32Array(n);
  const py = new Float32Array(n);
  const depth = new Float32Array(n);
  const cat = new Uint8Array(n);

  for (let i = 0; i < n; i++) {
    const o = i * STRIDE;
    const x = view.getInt8(o) / 127;
    const y = view.getInt8(o + 1) / 127;
    const z = view.getUint8(o + 2) / 255;
    const rz = x * SIN_R + y * COS_R;
    px[i] = x * COS_R - y * SIN_R;
    py[i] = (z * COS_T - rz * SIN_T) * Y_SQUASH;
    depth[i] = z * SIN_T + rz * COS_T;
    cat[i] = view.getUint8(o + 3);
  }

  const idx: number[] = new Array(n);
  for (let i = 0; i < n; i++) idx[i] = i;
  idx.sort((a, b) => depth[a]! - depth[b]!);
  const order = Uint32Array.from(idx);

  // normalise depth to 0..1 so nearer points can carry a little more weight
  const dmin = depth[order[0]!]!;
  const dmax = depth[order[n - 1]!]!;
  const dspan = dmax - dmin || 1;
  for (let i = 0; i < n; i++) depth[i] = (depth[i]! - dmin) / dspan;

  // Frame the fabric, not the dust: a few hundred scattered terrain samples
  // otherwise set the extent and shrink the settlement to a smudge.
  const sx = Float64Array.from(px).sort();
  const sy = Float64Array.from(py).sort();

  return {
    n,
    px,
    py,
    depth,
    cat,
    order,
    ax0: pct(sx, 0.01),
    ax1: pct(sx, 0.99),
    ay0: pct(sy, 0.01),
    ay1: pct(sy, 0.99),
  };
}

function toRgb(c: string): [number, number, number] {
  const h = c.replace('#', '').trim();
  const f = h.length === 3 ? h.split('').map((x) => x + x).join('') : h;
  return [parseInt(f.slice(0, 2), 16), parseInt(f.slice(2, 4), 16), parseInt(f.slice(4, 6), 16)];
}

function readColors(canvas: HTMLCanvasElement) {
  const cs = getComputedStyle(canvas);
  const accent = cs.getPropertyValue('--color-accent').trim() || '#3b82f6';
  const ground = cs.getPropertyValue('--color-text-muted').trim() || '#6b6b6b';
  return { accent: toRgb(accent), ground: toRgb(ground) };
}

export async function initVidigalPanel(canvas: HTMLCanvasElement): Promise<void> {
  const ctx = canvas.getContext('2d', { alpha: true });
  const src = canvas.dataset.rooftops;
  if (!ctx || !src) return;

  let cloud: Cloud;
  try {
    cloud = await load(src);
  } catch (err) {
    console.error(err);
    return;
  }
  if (cloud.n === 0) return;

  let { accent, ground } = readColors(canvas);
  let cssW = canvas.clientWidth || 1;
  let cssH = canvas.clientHeight || 1;
  let revealStart = 0;
  let reveal = 0; // 0..1
  let running = false;
  let seen = false;
  let visible = false;

  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');

  function render() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(1, Math.round(cssW * dpr));
    const h = Math.max(1, Math.round(cssH * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx!.clearRect(0, 0, cssW, cssH);

    const { n, px, py, depth, cat, order, ax0, ax1, ay0, ay1 } = cloud;
    const scale = Math.min(cssW / (ax1 - ax0), cssH / (ay1 - ay0)) * FILL;
    const cx = cssW / 2 - ((ax0 + ax1) / 2) * scale;
    const cy = cssH / 2 + ((ay0 + ay1) / 2) * scale;
    const dot = Math.max(0.85, Math.min(2.1, scale / 260));
    const shown = Math.round(reveal * n);

    for (let k = 0; k < shown; k++) {
      const i = order[k]!;
      const d = depth[i]!;
      const building = cat[i] === 1;
      const [r, g, b] = building ? accent : ground;
      // nearer points sit slightly stronger, which gives the cloud its form
      const a = building ? 0.42 + 0.5 * d : 0.16 + 0.2 * d;
      ctx!.fillStyle = `rgba(${r}, ${g}, ${b}, ${a.toFixed(3)})`;
      const size = (building ? 1.75 : 0.95) * dot;
      ctx!.fillRect(cx + px[i]! * scale - size / 2, cy - py[i]! * scale - size / 2, size, size);
    }
  }

  function frame(now: number) {
    const t = Math.min((now - revealStart) / REVEAL_MS, 1);
    // ease out, so the last points settle rather than stop
    reveal = 1 - Math.pow(1 - t, 3);
    render();
    if (t < 1 && visible) requestAnimationFrame(frame);
    else {
      reveal = 1;
      running = false;
      render();
    }
  }

  function start() {
    if (seen) return;
    seen = true;
    if (reduceMotion.matches) {
      reveal = 1;
      render();
      return;
    }
    revealStart = performance.now();
    running = true;
    requestAnimationFrame(frame);
  }

  const measure = () => {
    const r = canvas.getBoundingClientRect();
    cssW = r.width || cssW;
    cssH = r.height || cssH;
  };

  new ResizeObserver(() => {
    measure();
    if (seen && !running) render();
  }).observe(canvas);

  const retheme = () => {
    ({ accent, ground } = readColors(canvas));
    if (seen && !running) render();
  };
  new MutationObserver(retheme).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme'],
  });
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', retheme);

  new IntersectionObserver(
    (entries) => {
      visible = entries[0]!.isIntersecting;
      if (visible) {
        measure();
        start();
      }
    },
    { threshold: 0.15 },
  ).observe(canvas);
}
