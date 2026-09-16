// Vidigal, drawn from the geometry this site already publishes: a digital
// terrain model and building footprints. It shows the shape of the settlement
// and nothing else. No derived quantity is computed or displayed here, because
// every number on a personal page is a claim someone can contest, and the
// study this geometry comes from is unpublished.
//
// It reveals back to front on first view and then turns slowly, so a reader
// can read the ridge and the valley rather than one flat silhouette.
// v2: int8 x, int8 y, uint8 z, uint8 cat (4 bytes); v3: int16 x, int16 y, uint8 z, uint8 cat|shade<<4 (6 bytes)
const ROT0 = 0.5;
const SPIN_RAD_PER_S = 0.055; // one turn in roughly two minutes
const TILT = 0.62;
const COS_T = Math.cos(TILT);
const SIN_T = Math.sin(TILT);
const Y_SQUASH = 0.7;
const FILL = 0.86; // air around the envelope, enough for the tilt to breathe
const REVEAL_MS = 1600;
// The camera flies a shot list on top of the slow turn: hold wide, dive to
// one end of the ridge dropping lower as it comes in, glide along the ridge
// to the other end, pull back up to the wide frame. At zoom 1 the framing is
// exactly the envelope; the look-at point only travels once the camera is in.
// Keyframes: [time s, zoom, along (-1..1 of the ridge's reach), tilt offset].
const SHOT: [number, number, number, number][] = [
  [0, 1, 0, 0],
  [9, 1, 0, 0],
  [16, 1.8, -0.8, -0.12],
  [34, 1.8, 0.8, -0.12],
  [42, 1, 0, 0],
];
const SHOT_PERIOD_S = 42;
const ALONG_REACH = 0.6;
const TILT_FLOOR = 0.45;
const smooth = (u: number) => u * u * (3 - 2 * u);
function camera(elapsed: number): { zoom: number; along: number; tiltOff: number } {
  const t = elapsed % SHOT_PERIOD_S;
  for (let k = 1; k < SHOT.length; k++) {
    const a = SHOT[k - 1]!;
    const b = SHOT[k]!;
    if (t <= b[0]) {
      const u = smooth((t - a[0]) / (b[0] - a[0]));
      return { zoom: a[1] + (b[1] - a[1]) * u, along: a[2] + (b[2] - a[2]) * u, tiltOff: a[3] + (b[3] - a[3]) * u };
    }
  }
  return { zoom: 1, along: 0, tiltOff: 0 };
}

interface Cloud {
  n: number;
  x: Float32Array;
  y: Float32Array;
  z: Float32Array;
  cat: Uint8Array;
  shade: Float32Array;
  terrain: Uint32Array; // 4 point indices per terrain cell, context ring first, then the core
  cellFade: Float32Array; // 1 inside, falling to 0 at the context ring's outer edge
  nCtxCells: number;
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

// grid rings: "nx,ny,offset;nx,ny,offset" (row-major rectangles of terrain
// points, void cells carry category 15)
// Sidecar order is core first, context second; drawing order is the reverse:
// the coarse context surface goes down first and fades at its outer edge, the
// core is painted over it, so the two never seam and the clip never shows.
function terrainCells(rings: string, cat: Uint8Array): { cells: Uint32Array; fade: Float32Array; nCtx: number } {
  const out: number[] = [];
  const fade: number[] = [];
  const parsed = rings.split(';').map((r) => r.split(',').map(Number) as [number, number, number]);
  const EDGE = 5; // cells over which the context ring dissolves
  let nCtx = 0;
  [...parsed].reverse().forEach(([nx, ny, off], k) => {
    const isCtx = parsed.length > 1 && k === 0;
    for (let j = 0; j < ny - 1; j++) {
      for (let i = 0; i < nx - 1; i++) {
        const a = off + j * nx + i;
        const b = a + 1;
        const c = a + nx + 1;
        const d = a + nx;
        if (cat[a] === 15 || cat[b] === 15 || cat[c] === 15 || cat[d] === 15) continue;
        out.push(a, b, c, d);
        fade.push(isCtx ? Math.min(1, Math.min(i, nx - 2 - i, j, ny - 2 - j) / EDGE) : 1);
      }
    }
    if (isCtx) nCtx = out.length / 4;
  });
  return { cells: Uint32Array.from(out), fade: Float32Array.from(fade), nCtx };
}

async function load(url: string, stride: number, rings: string): Promise<Cloud> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`vidigal-panel: ${url} -> ${res.status}`);
  const buf = await res.arrayBuffer();
  const view = new DataView(buf);
  const n = Math.floor(buf.byteLength / stride);

  const x = new Float32Array(n);
  const y = new Float32Array(n);
  const z = new Float32Array(n);
  const cat = new Uint8Array(n);
  const shade = new Float32Array(n);

  for (let i = 0; i < n; i++) {
    const o = i * stride;
    if (stride === 6) {
      x[i] = view.getInt16(o, true) / 32767;
      y[i] = view.getInt16(o + 2, true) / 32767;
      z[i] = view.getUint8(o + 4) / 255;
      const c = view.getUint8(o + 5);
      cat[i] = c & 15;
      shade[i] = (c >> 4) / 15;
    } else {
      x[i] = view.getInt8(o) / 127;
      y[i] = view.getInt8(o + 1) / 127;
      z[i] = view.getUint8(o + 2) / 255;
      cat[i] = view.getUint8(o + 3);
    }
  }
  const { cells: terrain, fade: cellFade, nCtx: nCtxCells } = rings ? terrainCells(rings, cat) : { cells: new Uint32Array(0), fade: new Float32Array(0), nCtx: 0 };
  // framing, centre and axis come from the subject and its own ground (0, 1, 2);
  // the context ring (3) runs past the frame on purpose and void (15) is nothing
  const core: number[] = [];
  for (let i = 0; i < n; i++) if (cat[i]! < 3) core.push(i);

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
    for (let k = 0; k < core.length; k++) {
      const i = core[k]!;
      const rz = x[i]! * si + y[i]! * c;
      bufX[k] = x[i]! * c - y[i]! * si;
      bufY[k] = (z[i]! * COS_T - rz * SIN_T) * Y_SQUASH;
    }
    const sxs = bufX.slice(0, core.length).sort();
    const sys = bufY.slice(0, core.length).sort();
    ax0 = Math.min(ax0, pct(sxs, 0.01));
    ax1 = Math.max(ax1, pct(sxs, 0.99));
    ay0 = Math.min(ay0, pct(sys, 0.01));
    ay1 = Math.max(ay1, pct(sys, 0.99));
  }

  // Principal axis of the footprint, so the pan runs along the ridge.
  let mx = 0;
  let my = 0;
  for (const i of core) {
    mx += x[i]!;
    my += y[i]!;
  }
  mx /= core.length;
  my /= core.length;
  let sxx = 0;
  let sxy = 0;
  let syy = 0;
  for (const i of core) {
    const dx = x[i]! - mx;
    const dy = y[i]! - my;
    sxx += dx * dx;
    sxy += dx * dy;
    syy += dy * dy;
  }
  const theta = 0.5 * Math.atan2(2 * sxy, sxx - syy);
  const axis = { x: Math.cos(theta), y: Math.sin(theta) };
  let reach = 0;
  for (const i of core) {
    reach = Math.max(reach, Math.abs((x[i]! - mx) * axis.x + (y[i]! - my) * axis.y));
  }
  let mz = 0;
  for (const i of core) mz += z[i]!;
  mz /= core.length;

  return { n, x, y, z, cat, shade, terrain, cellFade, nCtxCells, ax0, ax1, ay0, ay1, mx, my, mz, axis, reach };
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

// opaque mix of two hex colours; the terrain surface must hide what is behind it
function mix(hexA: string, hexB: string, t: number): string {
  const c = (h: string) => {
    const f = h.replace('#', '');
    const g = f.length === 3 ? f.split('').map((x) => x + x).join('') : f.slice(0, 6);
    return [0, 2, 4].map((i) => parseInt(g.slice(i, i + 2), 16));
  };
  const a = c(hexA);
  const b = c(hexB);
  if ([...a, ...b].some(Number.isNaN)) return hexB;
  const m = a.map((v, i) => Math.round(v + (b[i]! - v) * t));
  return `rgb(${m[0]},${m[1]},${m[2]})`;
}

function luminance(hex: string): number {
  const f = hex.replace('#', '');
  const g = f.length === 3 ? f.split('').map((x) => x + x).join('') : f.slice(0, 6);
  const [r, gg, b] = [0, 2, 4].map((i) => parseInt(g.slice(i, i + 2), 16) / 255);
  return Number.isNaN(r! + gg! + b!) ? 1 : 0.2126 * r! + 0.7152 * gg! + 0.0722 * b!;
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
    bg: pick(['--color-bg-primary', '--bg-primary'], '#ffffff'),
  };
}

// Optional surface over the subject category: points sampled on a grid are
// stitched into quads with their right, up and diagonal neighbours when all
// four sit at nearly the same height, so a crown reads as a solid dome and
// the gap between two crowns stays a gap. Returns quads as index quadruples.
function buildQuads(cloud: Cloud, cell: number): Uint32Array {
  const { n, x, y, z, cat } = cloud;
  const ZR = 0.11;
  const key = (i: number, j: number) => i * 65536 + j;
  const grid = new Map<number, number>();
  const gx = new Int32Array(n);
  const gy = new Int32Array(n);
  for (let i = 0; i < n; i++) {
    if (cat[i] !== 1) continue;
    // cell centres sit at half-integers of the cell, so floor lands each
    // point in its own cell despite the int8 quantisation noise
    gx[i] = Math.floor(x[i]! / cell);
    gy[i] = Math.floor(y[i]! / cell);
    grid.set(key(gx[i]! + 32768, gy[i]! + 32768), i);
  }
  const out: number[] = [];
  const near = (a: number, b: number) => Math.abs(z[a]! - z[b]!) <= ZR;
  for (let i = 0; i < n; i++) {
    if (cat[i] !== 1) continue;
    const r = grid.get(key(gx[i]! + 1 + 32768, gy[i]! + 32768));
    const u = grid.get(key(gx[i]! + 32768, gy[i]! + 1 + 32768));
    const d = grid.get(key(gx[i]! + 1 + 32768, gy[i]! + 1 + 32768));
    if (r === undefined || u === undefined || d === undefined) continue;
    if (near(i, r) && near(i, u) && near(i, d) && near(r, d) && near(u, d)) out.push(i, r, d, u);
  }
  return Uint32Array.from(out);
}

export async function initVidigalPanel(canvas: HTMLCanvasElement): Promise<void> {
  const ctx = canvas.getContext('2d', { alpha: true });
  const src = canvas.dataset.rooftops;
  if (!ctx || !src) return;

  let cloud: Cloud;
  try {
    cloud = await load(src, parseInt(canvas.dataset.stride || '4', 10), canvas.dataset.grid || '');
  } catch (err) {
    console.error(err);
    return;
  }
  if (cloud.n === 0) return;

  let { accent, ground, bg } = readColors(canvas, ctx);
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

  // Optional wire surface over the subject category: each point is joined to
  // its neighbours within data-wire (in scene units), so a canopy sampled on
  // a grid reads as a continuous crown surface instead of loose dots.
  const wireR = parseFloat(canvas.dataset.wire || '0') || 0;
  // how close the flight comes: a settlement on a ridge takes a deeper dive
  // than a 120 m clip, which is already close
  const zoomMax = parseFloat(canvas.dataset.zoom || '') || 1.3;
  const quads = wireR > 0 ? buildQuads(cloud, wireR) : new Uint32Array(0);
  // Splat mode: the subject's points are drawn as soft discs of this radius
  // (scene units) that accumulate into one blob per crown.
  const splatR = parseFloat(canvas.dataset.splat || '0') || 0;
  // viewing angle: a settlement on a slope wants an oblique view; a canal
  // between overhanging quay trees wants a steeper one or the gap closes
  const tilt0 = parseFloat(canvas.dataset.tilt || '') || TILT;
  // a full turn passes through the angle where a canal is seen end-on and
  // vanishes for a beat; a swing keeps a linear feature oblique at all times
  const swing = parseFloat(canvas.dataset.swing || '0') || 0;
  const SWING_PERIOD_S = 97;

  // Painter's order changes every frame while the view turns. A bucket sort is
  // O(n) and visually identical to a comparison sort at this point count.
  const BUCKETS = 384;
  const { n } = cloud;
  const sxArr = new Float32Array(n);
  const syArr = new Float32Array(n);
  const dArr = new Float32Array(n);
  const counts = new Uint32Array(BUCKETS + 1);
  const order = new Uint32Array(n);
  let cellDepth = new Float32Array(0);
  let cellOrder = new Uint32Array(0);
  let tCanvas: HTMLCanvasElement | null = null;
  let frameNo = 0;

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
    const rot = ROT0 + (flying ? (swing > 0 ? swing * Math.sin((elapsed * 2 * Math.PI) / SWING_PERIOD_S) : elapsed * SPIN_RAD_PER_S) : 0);
    const cosR = Math.cos(rot);
    const sinR = Math.sin(rot);
    const cam = flying ? camera(elapsed) : { zoom: 1, along: 0, tiltOff: 0 };
    cam.zoom = 1 + (cam.zoom - 1) * (zoomMax - 1) / 0.8;
    const tilt = Math.max(TILT_FLOOR, tilt0 + cam.tiltOff);
    const cosT = Math.cos(tilt);
    const sinT = Math.sin(tilt);
    const zoom = cam.zoom;
    const zoomT = Math.min(1, (zoom - 1) / 0.5); // look-at hand-over finishes early in the dive

    const base = Math.min(cssW / (ax1 - ax0), cssH / (ay1 - ay0)) * FILL;
    const scale = base * zoom;
    // Where the camera looks: the envelope centre when out, a point sliding
    // along the ridge when in. Project that point with the frame's own maths.
    const along = reach * ALONG_REACH * cam.along;
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
    // dots keep their screen size while the camera zooms; only the subject
    // grows, gently, so a close view resolves rather than floods
    const dot = Math.max(0.85, Math.min(2.4, base / 260));

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

    // surface first, under the dots: back to front by mean depth, shaded
    // by height so the top of a crown sits lighter than its flank
    if (quads.length) {
      const lim = Math.round(reveal * n);
      const nq = quads.length / 4;
      const qd = new Float32Array(nq);
      const qi = new Uint32Array(nq);
      for (let q = 0; q < nq; q++) {
        const o = q * 4;
        qd[q] = (dArr[quads[o]!]! + dArr[quads[o + 2]!]!) / 2;
        qi[q] = q;
      }
      qi.sort((a, b) => qd[a]! - qd[b]!);
      for (let k = 0; k < nq; k++) {
        const o = qi[k]! * 4;
        const a = quads[o]!;
        const b = quads[o + 1]!;
        const c2 = quads[o + 2]!;
        const dd = quads[o + 3]!;
        if (a >= lim || b >= lim || c2 >= lim || dd >= lim) continue;
        const depth = (qd[qi[k]!]! - dmin) / span;
        const zt = (z[a]! + z[c2]!) / 2;
        ctx!.fillStyle = withAlpha(accent, Math.min(0.9, (0.18 + 0.3 * depth + 0.3 * zt) * emphasis));
        ctx!.beginPath();
        ctx!.moveTo(sxArr[a]!, syArr[a]!);
        ctx!.lineTo(sxArr[b]!, syArr[b]!);
        ctx!.lineTo(sxArr[c2]!, syArr[c2]!);
        ctx!.lineTo(sxArr[dd]!, syArr[dd]!);
        ctx!.closePath();
        ctx!.fill();
      }
    }
    const { terrain, shade, cellFade, nCtxCells } = cloud;
    // The surface is the expensive pass (about 12k cells). It goes to its own
    // canvas every other frame and is blitted every frame; a one-frame lag
    // between the ground and the points is below what an eye can see.
    if (terrain.length && (frameNo++ & 1) === 0) {
      if (!tCanvas) tCanvas = document.createElement('canvas');
      if (tCanvas.width !== w || tCanvas.height !== h) {
        tCanvas.width = w;
        tCanvas.height = h;
      }
      const tc = tCanvas.getContext('2d')!;
      tc.setTransform(dpr, 0, 0, dpr, 0, 0);
      tc.clearRect(0, 0, cssW, cssH);
      // the ink tone is the shadow on a light page and the light on a dark one
      const inkIsLight = luminance(bg) < 0.5;
      tc.lineWidth = 0.7;
      tc.lineJoin = 'round';
      const nc = terrain.length / 4;
      const cd = cellDepth.length === nc ? cellDepth : (cellDepth = new Float32Array(nc));
      counts.fill(0);
      for (let q = 0; q < nc; q++) {
        const o = q * 4;
        cd[q] = (dArr[terrain[o]!]! + dArr[terrain[o + 2]!]!) * 0.5;
        counts[Math.min(BUCKETS - 1, ((cd[q]! - dmin) / span * BUCKETS) | 0) + 1]!++;
      }
      for (let b = 1; b <= BUCKETS; b++) counts[b]! += counts[b - 1]!;
      const cur = counts.slice();
      const co = cellOrder.length === nc ? cellOrder : (cellOrder = new Uint32Array(nc));
      for (let q = 0; q < nc; q++) co[cur[Math.min(BUCKETS - 1, ((cd[q]! - dmin) / span * BUCKETS) | 0)]!++] = q;
      // Two passes, each back to front: the context ring, dissolving at its
      // outer edge, then the core over it. Shade is a colour between the page
      // and the ground tone, opaque, so the far slope never shows through.
      tc.globalAlpha = reveal;
      for (let pass = 0; pass < 2; pass++) {
      for (let k = 0; k < nc; k++) {
        const q = co[k]!;
        if ((q < nCtxCells) !== (pass === 0)) continue;
        const o = q * 4;
        const a = terrain[o]!;
        const sh = (shade[a]! + shade[terrain[o + 2]!]!) * 0.5;
        const f = cellFade[q]!;
        if (f <= 0) continue;
        const tone = 0.05 + 0.6 * (inkIsLight ? sh : 1 - sh) * (pass === 0 ? 0.75 : 1);
        const col = mix(bg, ground, tone);
        tc.fillStyle = col;
        tc.strokeStyle = col; // the stroke closes the hairline seams between cells
        tc.globalAlpha = reveal * f;
        tc.beginPath();
        tc.moveTo(sxArr[a]!, syArr[a]!);
        tc.lineTo(sxArr[terrain[o + 1]!]!, syArr[terrain[o + 1]!]!);
        tc.lineTo(sxArr[terrain[o + 2]!]!, syArr[terrain[o + 2]!]!);
        tc.lineTo(sxArr[terrain[o + 3]!]!, syArr[terrain[o + 3]!]!);
        tc.closePath();
        tc.fill();
        tc.stroke();
      }
      }
      tc.globalAlpha = 1;
    }
    if (tCanvas) {
      ctx!.setTransform(1, 0, 0, 1, 0, 0);
      ctx!.drawImage(tCanvas, 0, 0);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    const shown = Math.round(reveal * n);
    for (let k = 0; k < shown; k++) {
      const i = order[k]!;
      const c = cat[i]!;
      if (c === 15 || (terrain.length && (c === 0 || c === 3))) continue;
      const d = (dArr[i]! - dmin) / span;
      // nearer points sit slightly stronger, which gives the cloud its form;
      // category 1 is the subject (rooftops, or crowns) in the accent, 0 is
      // the ground as a surface, 2 is built context in the ground's colour
      // the subject's dots grow with the square root of the zoom, and fade a
      // little as the camera comes in, so a close view resolves into
      // footprints instead of flooding into one fill
      // built context (2) sits heavier than bare ground (0) in the same grey,
      // so roofs read as houses rather than as pavement
      const a = c === 1 ? Math.min(1, (quads.length ? 0.5 : 1) * (0.26 + 0.36 * d + 0.2 * z[i]!) * emphasis / (0.75 + 0.25 * zoom)) : c === 2 ? 0.55 + 0.35 * d : 0.2 + 0.24 * d;
      ctx!.fillStyle = withAlpha(c === 1 ? accent : ground, a);
      if (c === 1 && splatR > 0) {
        const rr = splatR * scale;
        ctx!.fillStyle = withAlpha(accent, Math.min(0.4, (0.06 + 0.08 * d + 0.1 * z[i]!) * emphasis));
        ctx!.beginPath();
        ctx!.arc(sxArr[i]!, syArr[i]!, rr, 0, 6.2832);
        ctx!.fill();
        continue;
      }
      const size = (c === 1 ? (quads.length ? 0.7 : 1.35) * emphasis * Math.sqrt(zoom) : c === 2 ? 2.1 : 1.05) * dot;
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
    ({ accent, ground, bg } = readColors(canvas, ctx));
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

  if ('IntersectionObserver' in window) {
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
  } else {
    // No IO: nothing will ever flip `visible`, so start the panel now.
    visible = true;
    kick();
  }

  // Paint once, immediately, without waiting for any observer. The reveal and
  // the rotation are enhancements on top of a frame that is already correct;
  // making the first paint depend on an observer firing meant a reduced-motion
  // or headless render could show an empty frame.
  measure();
  if (reduceMotion.matches) reveal = 1;
  render(0);
}
