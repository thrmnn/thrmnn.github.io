// The avatar is the monogram drawn in the site's own display face as five
// coincident sheets. At rest it is a still, face-on, crisp TAH. Once per page
// view it leans into perspective, its sheets fan apart by less than a stem
// width, close, and it turns back to face: the flat mark is shown to be a
// volume, the same story the point-cloud panels tell.
const LAYERS = 5;
const RASTER = 220;
const FONT_PX = 86;
const YAW = 0.5;
const TILT = 0.25;
// adjacent sheet spacing at the peak, in stem widths, on screen: the word
// stays whole below about 0.5 and the sheets become countable above 1
const SEP_STEMS = 0.4;
const HOLD = 400;
const RAMP = 700;
const LAG = 250;
const CLOSE = 2 * RAMP - LAG;
const END = CLOSE + LAG + RAMP;
// per-sheet alpha at rest such that the five coincident sheets cover 0.95
const A0 = 1 - Math.pow(0.05, 1 / LAYERS);
const FONT = `700 ${FONT_PX}px "Space Grotesk", system-ui, sans-serif`;

// Stem width in normalised units, measured from a raster of the word: the
// sheet spacing is keyed to it, not to a literal.
function measureStem(text: string): number {
  const c = document.createElement('canvas');
  const S = RASTER;
  c.width = S;
  c.height = S;
  const g = c.getContext('2d', { willReadFrequently: true });
  if (!g) return 0.1;
  g.fillStyle = '#fff';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.font = FONT;
  g.fillText(text, S / 2, S / 2);
  const { data } = g.getImageData(0, 0, S, S);
  const yr = Math.round(S / 2 + FONT_PX * 0.2);
  let stem = S;
  for (let x = 0, run = 0; x <= S; x++) {
    if (x < S && data[(yr * S + x) * 4 + 3]! >= 128) run++;
    else {
      if (run > 2 && run < stem) stem = run;
      run = 0;
    }
  }
  return stem / (S / 2);
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
  const stem = measureStem(text);
  const SPREAD = (2 * SEP_STEMS * stem) / Math.hypot(Math.sin(YAW), Math.cos(YAW) * Math.sin(TILT));

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
    const k = scale / (RASTER / 2); // raster px -> css px
    const cY = Math.cos(st.yaw);
    const sY = Math.sin(st.yaw);
    const cT = Math.cos(st.tilt);
    const sT = Math.sin(st.tilt);
    ctx!.fillStyle = accent;
    ctx!.font = FONT;
    ctx!.textAlign = 'center';
    ctx!.textBaseline = 'middle';
    // back to front; yaw stays under a quarter turn so the order is fixed.
    // Each sheet is the word itself under the frame's affine: x scaled by the
    // yaw, y by the tilt, and a shear that leans the top away.
    for (let l = 0; l < LAYERS; l++) {
      const zn = (l / (LAYERS - 1) - 0.5) * 2;
      const z = zn * st.spread;
      const ox = cssW / 2 - z * sY * scale;
      const oy = cssH / 2 - z * cY * sT * scale;
      ctx!.setTransform(dpr * cY * k, dpr * -sY * sT * k, 0, dpr * cT * k, dpr * ox, dpr * oy);
      ctx!.globalAlpha = A0 * (1 - st.s) + st.s * (0.72 + 0.23 * zn);
      ctx!.fillText(text, 0, 0);
    }
    ctx!.globalAlpha = 1;
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
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
