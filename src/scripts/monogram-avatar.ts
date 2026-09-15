// The avatar is the monogram as a point cloud: the letters are rasterised in
// the site's own display face and sampled into scattered dots. At rest it is
// a still, face-on, legible dotted TAH. Once per page view it leans into
// perspective, its five sheets fan apart until they can be counted, close, and it
// turns back to face: the flat mark is shown to be a volume, the same story
// the Vidigal panel tells.
const LAYERS = 5;
const RASTER = 220;
const STEP = 3;
const JITTER = 0.3;
const YAW = 0.5;
const TILT = 0.25;
// adjacent sheet spacing at the peak, in stem widths, on screen: the word
// stays whole below about 0.5 and the sheets become countable above 1. The
// owner asked for the layers to unshuffle like dimensions, so they fan until
// they can be counted and the word blurs for half a second at the peak.
const SEP_STEMS = 1.1;
const HOLD = 400;
const RAMP = 700;
const LAG = 250;
const CLOSE = 2 * RAMP - LAG;
const END = CLOSE + LAG + RAMP;
// per-sheet alpha at rest such that the five coincident sheets cover 0.95
const A0 = 1 - Math.pow(0.05, 1 / LAYERS);

function sample(text: string, size: number): { pts: Float32Array; stem: number } {
  const c = document.createElement('canvas');
  const S = RASTER;
  c.width = S;
  c.height = S;
  const g = c.getContext('2d', { willReadFrequently: true });
  if (!g) return { pts: new Float32Array(0), stem: 0 };
  g.fillStyle = '#fff';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.font = `700 ${size}px "Space Grotesk", system-ui, sans-serif`;
  g.fillText(text, S / 2, S / 2);
  const { data } = g.getImageData(0, 0, S, S);
  const lit = (x: number, y: number) => data[(y * S + x) * 4 + 3]! >= 128;
  const out: number[] = [];
  for (let y = 0; y < S; y += STEP) {
    for (let x = 0; x < S; x += STEP) {
      if (!lit(x, y)) continue;
      // deterministic scatter: no lattice, so fanned sheets cannot moire,
      // and the rest frame is identical on every load
      const h = ((x * 73856093) ^ (y * 19349663)) >>> 0;
      const jx = ((h & 255) / 255 - 0.5) * 2 * JITTER * STEP;
      const jy = (((h >> 8) & 255) / 255 - 0.5) * 2 * JITTER * STEP;
      out.push((x + jx - S / 2) / (S / 2), (y + jy - S / 2) / (S / 2));
    }
  }
  // stem width = shortest lit run on a row below the letters' middle, in
  // normalised units; the sheet spacing is keyed to it, not to a literal
  let stem = S;
  const yr = Math.round(S / 2 + size * 0.2);
  for (let x = 0, run = 0; x <= S; x++) {
    if (x < S && lit(x, yr)) run++;
    else {
      if (run > 2 && run < stem) stem = run;
      run = 0;
    }
  }
  return { pts: Float32Array.from(out), stem: stem / (S / 2) };
}

const ease = (u: number) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);
const ramp = (t: number, at: number) => ease(Math.max(0, Math.min(1, (t - at) / RAMP)));

export async function initMonogramAvatar(canvas: HTMLCanvasElement): Promise<void> {
  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return;
  const text = canvas.dataset.monogram || 'TAH';
  try {
    await (document as Document & { fonts?: FontFaceSet }).fonts?.ready;
  } catch {
    /* the fallback stack is fine if the face never resolves */
  }
  const { pts, stem } = sample(text, 86);
  if (!pts.length) return;
  const SPREAD =
    (2 * SEP_STEMS * stem) / Math.hypot(Math.sin(YAW), Math.cos(YAW) * Math.sin(TILT));

  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let accent = '#3b82f6';
  let cssW = canvas.clientWidth || 180;
  let cssH = canvas.clientHeight || 180;
  let t0 = 0;
  let playing = false;
  let played = false;

  const readAccent = () => {
    accent = getComputedStyle(canvas).getPropertyValue('--color-accent').trim() || accent;
  };
  readAccent();

  // yaw and tilt lead on the way out and the sheets follow; the sheets close
  // first on the way back, then the slab turns to face. state(Infinity) is
  // rest, and so is state(t <= 0).
  function state(t: number) {
    const y = ramp(t, 0) - ramp(t, CLOSE + LAG);
    const s = ramp(t, LAG) - ramp(t, CLOSE);
    return { yaw: YAW * y, tilt: TILT * y, spread: SPREAD * s, s };
  }

  function render(st: { yaw: number; tilt: number; spread: number; s: number }) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(1, Math.round(cssW * dpr));
    const h = Math.max(1, Math.round(cssH * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx!.clearRect(0, 0, cssW, cssH);
    const scale = Math.min(cssW, cssH) * 0.42;
    const dot = (0.58 * STEP * scale) / (RASTER / 2);
    const cY = Math.cos(st.yaw);
    const sY = Math.sin(st.yaw);
    const cT = Math.cos(st.tilt);
    const sT = Math.sin(st.tilt);
    const ax = cY * scale;
    const ay = cT * scale;
    const bx = -sY * sT * scale;
    ctx!.fillStyle = accent;
    // back to front; yaw stays under a quarter turn so the order is fixed
    for (let l = 0; l < LAYERS; l++) {
      const zn = (l / (LAYERS - 1) - 0.5) * 2;
      const z = zn * st.spread;
      const ox = cssW / 2 - z * sY * scale - dot / 2;
      const oy = cssH / 2 - z * cY * sT * scale - dot / 2;
      ctx!.globalAlpha = A0 * (1 - st.s) + st.s * (0.72 + 0.23 * zn);
      for (let i = 0; i < pts.length; i += 2) {
        const x = pts[i]!;
        ctx!.fillRect(ox + x * ax, oy + pts[i + 1]! * ay + x * bx, dot, dot);
      }
    }
    ctx!.globalAlpha = 1;
  }

  const rest = () => render(state(Infinity));

  function frame(now: number) {
    if (!t0) t0 = now;
    const t = now - t0;
    if (t < END) {
      render(state(t));
      requestAnimationFrame(frame);
    } else {
      playing = false;
      rest();
    }
  }

  function start() {
    if (played || reduceMotion.matches) return;
    played = true;
    playing = true;
    setTimeout(() => requestAnimationFrame(frame), HOLD);
  }

  // dev hook for the walk harness: a fixed timeline instant, no observers
  if (canvas.dataset.t !== undefined) {
    render(state(+canvas.dataset.t));
    return;
  }
  rest();

  new ResizeObserver(() => {
    const r = canvas.getBoundingClientRect();
    cssW = r.width || cssW;
    cssH = r.height || cssH;
    if (!playing) rest();
  }).observe(canvas);

  new MutationObserver(() => {
    readAccent();
    if (!playing) rest();
  }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  const io: IntersectionObserver = new IntersectionObserver(
    (entries) => {
      if (!entries[0]!.isIntersecting) return;
      io.disconnect();
      // the wrapper's scroll-reveal owns the entry; the gesture waits for it
      const wrap = canvas.closest('[data-reveal]');
      if (wrap && getComputedStyle(wrap).opacity !== '1') {
        wrap.addEventListener('transitionend', start, { once: true });
      } else start();
    },
    { threshold: 0.6 },
  );
  io.observe(canvas);
}
