// Vidigal, drawn from the geometry this site already publishes: a digital
// terrain model and building footprints. It shows the shape of the settlement
// and nothing else. No derived quantity is computed or displayed here, because
// every number on a personal page is a claim someone can contest, and the
// study this geometry comes from is unpublished.
//
// It reveals back to front on first view and then turns slowly, so a reader
// can read the ridge and the valley rather than one flat silhouette.
const STRIDE = 4; // int8 x, int8 y, uint8 z, uint8 category (0=terrain, 1=building)
const ROT0 = 0.5;
const SPIN_RAD_PER_S = 0.055; // one turn in roughly two minutes
const TILT = 0.62;
const COS_T = Math.cos(TILT);
const SIN_T = Math.sin(TILT);
const Y_SQUASH = 0.7;
const FILL = 0.86; // air around the envelope, enough for the tilt to breathe
const REVEAL_MS = 1600;
// The camera flies: the view tilts, comes in close over the settlement and
// pulls back out, on periods that never line up with the turn so the flight
// does not repeat within a visit. At zoom 1 the framing is exactly the
// envelope; the pan only follows the ridge once the camera is in.
const TILT_SWING = 0.17;
const TILT_PERIOD_S = 47;
const ZOOM_MAX = 1.9;
const ZOOM_PERIOD_S = 71;
const PAN_PERIOD_S = 103;

interface Cloud {
  n: number;
  x: Float32Array;
  y: Float32Array;
  z: Float32Array;
  cat: Uint8Array;
  ax0: number;
  ax1: number;
  ay0: number;
  ay1: number;
  mx: number;
  my: number;
  mz: number;
  axis: { x: number; y: number };
  reach: number;
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

  const x = new Float32Array(n);
  const y = new Float32Array(n);
  const z = new Float32Array(n);
  const cat = new Uint8Array(n);

  for (let i = 0; i < n; i++) {
    const o = i * STRIDE;
    x[i] = view.getInt8(o) / 127;
    y[i] = view.getInt8(o + 1) / 127;
    z[i] = view.getUint8(o + 2) / 255;
    cat[i] = view.getUint8(o + 3);
  }

  // The view turns, so the frame has to hold the cloud at every angle without
  // breathing. The bounding radius is far too generous for an elongated ridge,
  // so take the actual envelope: project at a ring of angles and keep the 1st
  // and 99th percentile extremes across all of them.
  const ANGLES = 24;
  let ax0 = Infinity;
  let ax1 = -Infinity;
  let ay0 = Infinity;
  let ay1 = -Infinity;
  const bufX = new Float64Array(n);
  const bufY = new Float64Array(n);
  for (let a = 0; a < ANGLES; a++) {
    const th = (a / ANGLES) * Math.PI * 2;
    const c = Math.cos(th);
    const si = Math.sin(th);
    for (let i = 0; i < n; i++) {
      const rz = x[i]! * si + y[i]! * c;
      bufX[i] = x[i]! * c - y[i]! * si;
      bufY[i] = (z[i]! * COS_T - rz * SIN_T) * Y_SQUASH;
    }
    const sxs = Float64Array.from(bufX).sort();
    const sys = Float64Array.from(bufY).sort();
    ax0 = Math.min(ax0, pct(sxs, 0.01));
    ax1 = Math.max(ax1, pct(sxs, 0.99));
    ay0 = Math.min(ay0, pct(sys, 0.01));
    ay1 = Math.max(ay1, pct(sys, 0.99));
  }

  // Principal axis of the footprint, so the pan runs along the ridge.
  let mx = 0;
  let my = 0;
  for (let i = 0; i < n; i++) {
    mx += x[i]!;
    my += y[i]!;
  }
  mx /= n;
  my /= n;
  let sxx = 0;
  let sxy = 0;
  let syy = 0;
  for (let i = 0; i < n; i++) {
    const dx = x[i]! - mx;
    const dy = y[i]! - my;
    sxx += dx * dx;
    sxy += dx * dy;
    syy += dy * dy;
  }
  const theta = 0.5 * Math.atan2(2 * sxy, sxx - syy);
  const axis = { x: Math.cos(theta), y: Math.sin(theta) };
  let reach = 0;
  for (let i = 0; i < n; i++) {
    reach = Math.max(reach, Math.abs((x[i]! - mx) * axis.x + (y[i]! - my) * axis.y));
  }
  let mz = 0;
  for (let i = 0; i < n; i++) mz += z[i]!;
  mz /= n;

  return { n, x, y, z, cat, ax0, ax1, ay0, ay1, mx, my, mz, axis, reach };
}

// getComputedStyle returns unregistered custom properties as the token stream
// they were declared with, so --color-accent comes back as the literal string
// "var(--accent)" rather than a colour. Resolve by asking the canvas to parse
// each candidate and keeping the first one it accepts.
function resolveColor(ctx: CanvasRenderingContext2D, candidates: string[], fallback: string): string {
  for (const c of candidates) {
    const v = c.trim();
    if (!v || v.startsWith('var(')) continue;
    ctx.fillStyle = '#000000';
    ctx.fillStyle = v;
    if (ctx.fillStyle !== '#000000' || v === '#000000' || v === 'black') return ctx.fillStyle as string;
  }
  return fallback;
}

function withAlpha(rgbHex: string, a: number): string {
  const h = rgbHex.replace('#', '');
  const f = h.length === 3 ? h.split('').map((x) => x + x).join('') : h.slice(0, 6);
  const r = parseInt(f.slice(0, 2), 16);
  const g = parseInt(f.slice(2, 4), 16);
  const b = parseInt(f.slice(4, 6), 16);
  if ([r, g, b].some(Number.isNaN)) return rgbHex;
  return `rgba(${r}, ${g}, ${b}, ${a.toFixed(3)})`;
}

function readColors(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
  const cs = getComputedStyle(canvas);
  const pick = (names: string[], fallback: string) =>
    resolveColor(ctx, names.map((n) => cs.getPropertyValue(n)), fallback);
  return {
    accent: pick(['--color-accent', '--accent'], '#3b82f6'),
    ground: pick(['--color-text-muted', '--text-muted'], '#6b6b6b'),
  };
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

  let { accent, ground } = readColors(canvas, ctx);
  // How much the subject category stands off its context: crowns among roofs
  // need more than rooftops on bare terrain.
  const emphasis = parseFloat(canvas.dataset.emphasis || '1') || 1;
  let cssW = canvas.clientWidth || 1;
  let cssH = canvas.clientHeight || 1;
  let t0 = 0;
  let reveal = 0; // 0..1
  let rafOn = false;
  let visible = false;

  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');

  // Painter's order changes every frame while the view turns. A bucket sort is
  // O(n) and visually identical to a comparison sort at this point count.
  const BUCKETS = 384;
  const { n } = cloud;
  const sxArr = new Float32Array(n);
  const syArr = new Float32Array(n);
  const dArr = new Float32Array(n);
  const counts = new Uint32Array(BUCKETS + 1);
  const order = new Uint32Array(n);

  function render(elapsed: number) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(1, Math.round(cssW * dpr));
    const h = Math.max(1, Math.round(cssH * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx!.clearRect(0, 0, cssW, cssH);

    const { x, y, z, cat, ax0, ax1, ay0, ay1, mx, my, mz, axis, reach } = cloud;
    const flying = !reduceMotion.matches;
    const rot = ROT0 + (flying ? elapsed * SPIN_RAD_PER_S : 0);
    const cosR = Math.cos(rot);
    const sinR = Math.sin(rot);
    const tilt = TILT + (flying ? TILT_SWING * Math.sin((elapsed * 2 * Math.PI) / TILT_PERIOD_S) : 0);
    const cosT = Math.cos(tilt);
    const sinT = Math.sin(tilt);
    const zoomT = flying ? (1 - Math.cos((elapsed * 2 * Math.PI) / ZOOM_PERIOD_S)) / 2 : 0;
    const zoom = 1 + (ZOOM_MAX - 1) * zoomT;

    const base = Math.min(cssW / (ax1 - ax0), cssH / (ay1 - ay0)) * FILL;
    const scale = base * zoom;
    // Where the camera looks: the envelope centre when out, a point sliding
    // along the ridge when in. Project that point with the frame's own maths.
    const along = flying ? reach * 0.55 * Math.sin((elapsed * 2 * Math.PI) / PAN_PERIOD_S) : 0;
    const px = mx + axis.x * along;
    const py = my + axis.y * along;
    const prz = px * sinR + py * cosR;
    const tgtX = px * cosR - py * sinR;
    const tgtY = (mz * cosT - prz * sinT) * Y_SQUASH;
    const envX = (ax0 + ax1) / 2;
    const envY = (ay0 + ay1) / 2;
    const lookX = envX + (tgtX - envX) * zoomT;
    const lookY = envY + (tgtY - envY) * zoomT;
    const cx = cssW / 2 - lookX * scale;
    const cy = cssH / 2 + lookY * scale;
    const dot = Math.max(0.85, Math.min(2.4, scale / 260));

    let dmin = Infinity;
    let dmax = -Infinity;
    for (let i = 0; i < n; i++) {
      const rz = x[i]! * sinR + y[i]! * cosR;
      sxArr[i] = cx + (x[i]! * cosR - y[i]! * sinR) * scale;
      syArr[i] = cy - (z[i]! * cosT - rz * sinT) * Y_SQUASH * scale;
      const d = z[i]! * sinT + rz * cosT;
      dArr[i] = d;
      if (d < dmin) dmin = d;
      if (d > dmax) dmax = d;
    }
    const span = dmax - dmin || 1;

    counts.fill(0);
    for (let i = 0; i < n; i++) {
      const b = Math.min(BUCKETS - 1, ((dArr[i]! - dmin) / span * BUCKETS) | 0);
      counts[b + 1]!++;
    }
    for (let b = 1; b <= BUCKETS; b++) counts[b]! += counts[b - 1]!;
    const cursor = counts.slice();
    for (let i = 0; i < n; i++) {
      const b = Math.min(BUCKETS - 1, ((dArr[i]! - dmin) / span * BUCKETS) | 0);
      order[cursor[b]!++] = i;
    }

    const shown = Math.round(reveal * n);
    for (let k = 0; k < shown; k++) {
      const i = order[k]!;
      const d = (dArr[i]! - dmin) / span;
      const c = cat[i]!;
      // nearer points sit slightly stronger, which gives the cloud its form;
      // category 1 is the subject (rooftops, or crowns) in the accent, 0 is
      // the ground as a surface, 2 is built context in the ground's colour
      // the subject's dots grow with the square root of the zoom, and fade a
      // little as the camera comes in, so a close view resolves into
      // footprints instead of flooding into one fill
      const a = c === 1 ? Math.min(1, (0.26 + 0.36 * d) * emphasis / (0.75 + 0.25 * zoom)) : c === 2 ? 0.24 + 0.3 * d : 0.3 + 0.3 * d;
      ctx!.fillStyle = withAlpha(c === 1 ? accent : ground, a);
      const size = (c === 1 ? 1.35 * emphasis * Math.sqrt(zoom) / zoom : c === 2 ? 1.1 : 1.15) * dot;
      ctx!.fillRect(sxArr[i]! - size / 2, syArr[i]! - size / 2, size, size);
    }
  }

  function frame(now: number) {
    if (!t0) t0 = now;
    const elapsed = (now - t0) / 1000;
    const rt = Math.min((now - t0) / REVEAL_MS, 1);
    reveal = 1 - Math.pow(1 - rt, 3);
    render(elapsed);
    if (visible && !reduceMotion.matches) requestAnimationFrame(frame);
    else rafOn = false;
  }

  function kick() {
    if (rafOn || !visible) return;
    if (reduceMotion.matches) {
      // no reveal animation, but the cloud must still be fully drawn
      reveal = 1;
      render(0);
      return;
    }
    rafOn = true;
    requestAnimationFrame(frame);
  }

  const measure = () => {
    const r = canvas.getBoundingClientRect();
    cssW = r.width || cssW;
    cssH = r.height || cssH;
  };

  new ResizeObserver(() => {
    measure();
    if (!rafOn) {
      reveal = reveal || 1;
      render(0);
    }
  }).observe(canvas);

  const retheme = () => {
    ({ accent, ground } = readColors(canvas, ctx));
    if (!rafOn) render(0);
  };
  new MutationObserver(retheme).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme'],
  });
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', retheme);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      rafOn = false;
    } else {
      kick();
    }
  });

  new IntersectionObserver(
    (entries) => {
      // document.hidden gates the animation loop, never whether we draw:
      // a headless or background render must still paint the cloud
      visible = entries[0]!.isIntersecting;
      if (visible) {
        measure();
        kick();
      }
    },
    { threshold: 0.15 },
  ).observe(canvas);

  // Paint once, immediately, without waiting for any observer. The reveal and
  // the rotation are enhancements on top of a frame that is already correct;
  // making the first paint depend on an observer firing meant a reduced-motion
  // or headless render could show an empty frame.
  measure();
  if (reduceMotion.matches) reveal = 1;
  render(0);
}
