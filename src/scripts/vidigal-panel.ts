// Fixed oblique view of the Vidigal cloud, sorted back-to-front once (the
// geometry never moves; only which points read as sunlit changes per sun
// step). Rest is the raking-light frame, not midday: at noon 92% of points
// are sunlit and the relief flattens out. The sweep skips steps 0 and 15,
// which sit below the horizon and render black.
const STRIDE = 4; // int8 x, int8 y, uint8 z, uint8 category (0=terrain, 1=building)
const REST_STEP = 11;
const HIGH_STEP = 6;
const SWEEP_MS = 2500;
const SWEEP_FIRST = 1;
const SWEEP_LAST = 14;
const ROT = 0.5;
const TILT = 0.62;
const COS_R = Math.cos(ROT);
const SIN_R = Math.sin(ROT);
const COS_T = Math.cos(TILT);
const SIN_T = Math.sin(TILT);
const Y_SQUASH = 0.7;
const FILL = 0.94;

interface Points {
  ax0: number;
  ax1: number;
  ay0: number;
  ay1: number;
  n: number;
  x: Float32Array;
  y: Float32Array;
  z: Float32Array;
  cat: Uint8Array;
  sun: Uint16Array;
  order: Uint32Array;
}

async function loadPoints(rooftopsUrl: string, sunUrl: string): Promise<Points> {
  const [rr, sr] = await Promise.all([fetch(rooftopsUrl), fetch(sunUrl)]);
  if (!rr.ok) throw new Error(`vidigal-panel: ${rooftopsUrl} → ${rr.status}`);
  if (!sr.ok) throw new Error(`vidigal-panel: ${sunUrl} → ${sr.status}`);
  const rBuf = await rr.arrayBuffer();
  const sBuf = await sr.arrayBuffer();

  const n = Math.floor(rBuf.byteLength / STRIDE);
  const view = new DataView(rBuf);
  const x = new Float32Array(n);
  const y = new Float32Array(n);
  const z = new Float32Array(n);
  const cat = new Uint8Array(n);
  const depth = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const o = i * STRIDE;
    const px = view.getInt8(o) / 127;
    const py = view.getInt8(o + 1) / 127;
    const pz = view.getUint8(o + 2) / 255;
    x[i] = px;
    y[i] = py;
    z[i] = pz;
    cat[i] = view.getUint8(o + 3);
    const rz = px * SIN_R + py * COS_R;
    depth[i] = pz * SIN_T + rz * COS_T;
  }

  const sunView = new DataView(sBuf);
  const nSun = Math.min(n, sBuf.byteLength >> 1);
  const sun = new Uint16Array(n);
  for (let i = 0; i < nSun; i++) sun[i] = sunView.getUint16(i * 2, true);

  const idx: number[] = new Array(n);
  for (let i = 0; i < n; i++) idx[i] = i;
  idx.sort((a, b) => depth[a]! - depth[b]!);
  const order = Uint32Array.from(idx);

  // The projection is fixed, so its extent can be measured once and used to
  // fit the cloud to whatever box the frame gives us.
  const pxs = new Float64Array(n);
  const pys = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const rx = x[i]! * COS_R - y[i]! * SIN_R;
    const rz = x[i]! * SIN_R + y[i]! * COS_R;
    pxs[i] = rx;
    pys[i] = (z[i]! * COS_T - rz * SIN_T) * Y_SQUASH;
  }
  // Frame the fabric, not the dust: a few hundred scattered terrain samples
  // otherwise set the extent and shrink the settlement to a smudge.
  const pct = (arr: Float64Array, q: number) => {
    const c = Array.from(arr).sort((a, b) => a - b);
    return c[Math.min(c.length - 1, Math.max(0, Math.round(q * (c.length - 1))))]!;
  };
  const ax0 = pct(pxs, 0.01), ax1 = pct(pxs, 0.99);
  const ay0 = pct(pys, 0.01), ay1 = pct(pys, 0.99);

  return { n, x, y, z, cat, sun, order, ax0, ax1, ay0, ay1 };
}

function readColors(canvas: HTMLCanvasElement): { accent: string; muted: string } {
  const cs = getComputedStyle(canvas);
  const accent = cs.getPropertyValue('--color-accent').trim();
  const muted = cs.getPropertyValue('--color-text-muted').trim();
  return { accent: accent || '#3b82f6', muted: muted || '#6b6b6b' };
}

export async function initVidigalPanel(canvas: HTMLCanvasElement): Promise<void> {
  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return;

  const rooftopsUrl = canvas.dataset.rooftops;
  const sunUrl = canvas.dataset.sun;
  if (!rooftopsUrl || !sunUrl) return;

  let pts: Points;
  try {
    pts = await loadPoints(rooftopsUrl, sunUrl);
  } catch (err) {
    console.error(err);
    return;
  }
  if (pts.n === 0) return;

  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let motionOK = !reduceMotion.matches;
  let { accent, muted } = readColors(canvas);

  let cssW = canvas.clientWidth;
  let cssH = canvas.clientHeight;
  let currentStep = REST_STEP;
  let sweeping = false;
  let sweepStart = 0;
  let needsRender = true;
  let visible = false;
  let rafOn = false;

  const track = canvas.closest('.artifact-frame')?.querySelector('.sun-track') as HTMLElement | null;
  function publishProgress() {
    if (!track) return;
    const t = (currentStep - SWEEP_FIRST) / (SWEEP_LAST - SWEEP_FIRST);
    track.style.setProperty('--sun-t', String(Math.max(0, Math.min(1, t))));
  }

  function render() {
    publishProgress();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(1, Math.round(cssW * dpr));
    const h = Math.max(1, Math.round(cssH * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx!.clearRect(0, 0, cssW, cssH);

    const { n, x, y, z, cat, sun, order, ax0, ax1, ay0, ay1 } = pts;
    const scale = Math.min(cssW / (ax1 - ax0), cssH / (ay1 - ay0)) * FILL;
    const cx = cssW / 2 - ((ax0 + ax1) / 2) * scale;
    const cy = cssH / 2 + ((ay0 + ay1) / 2) * scale;
    const bit = 1 << currentStep;
    const dotScale = Math.max(0.85, Math.min(2.1, scale / 260));

    for (let k = 0; k < n; k++) {
      const i = order[k]!;
      const rx = x[i]! * COS_R - y[i]! * SIN_R;
      const rz = x[i]! * SIN_R + y[i]! * COS_R;
      const vy = (z[i]! * COS_T - rz * SIN_T) * Y_SQUASH;
      const sx = cx + rx * scale;
      const sy = cy - vy * scale;
      const lit = (sun[i]! & bit) !== 0;
      const isBuilding = cat[i] === 1;
      ctx!.fillStyle = lit ? accent : muted;
      ctx!.globalAlpha = isBuilding ? (lit ? 0.95 : 0.2) : lit ? 0.3 : 0.08;
      const size = (isBuilding ? 1.8 : 0.9) * dotScale;
      ctx!.fillRect(sx - size / 2, sy - size / 2, size, size);
    }
    ctx!.globalAlpha = 1;
  }

  function kick() {
    if (!visible || rafOn) return;
    rafOn = true;
    requestAnimationFrame(tick);
  }

  function tick(now: number) {
    if (!visible) {
      rafOn = false;
      return;
    }
    if (sweeping) {
      const t = Math.min((now - sweepStart) / SWEEP_MS, 1);
      currentStep = Math.min(SWEEP_LAST, SWEEP_FIRST + Math.floor(t * (SWEEP_LAST - SWEEP_FIRST + 1)));
      needsRender = true;
      if (t >= 1) {
        sweeping = false;
        currentStep = REST_STEP;
      }
    }
    if (needsRender) {
      render();
      needsRender = false;
    }
    if (sweeping) {
      requestAnimationFrame(tick);
    } else {
      rafOn = false;
    }
  }

  function activate() {
    if (motionOK) {
      if (sweeping) return; // one sweep at a time
      sweeping = true;
      sweepStart = performance.now();
      needsRender = true;
      kick();
    } else {
      currentStep = currentStep === REST_STEP ? HIGH_STEP : REST_STEP;
      needsRender = true;
      kick();
    }
  }

  const frame = canvas.closest('.artifact-frame') as HTMLElement | null;
  if (frame) {
    frame.addEventListener('click', activate);
    frame.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        activate();
      }
    });
  }

  reduceMotion.addEventListener?.('change', (e) => {
    motionOK = !e.matches;
    sweeping = false;
    currentStep = REST_STEP;
    needsRender = true;
    kick();
  });

  const retheme = () => {
    ({ accent, muted } = readColors(canvas));
    needsRender = true;
    kick();
  };
  new MutationObserver(retheme).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme'],
  });
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', retheme);

  new ResizeObserver((entries) => {
    const r = entries[0]!.contentRect;
    cssW = r.width;
    cssH = r.height;
    needsRender = true;
    kick();
  }).observe(canvas);

  const syncVisible = () => {
    visible = ioVisible && !document.hidden;
    if (visible) {
      needsRender = true;
      kick();
    }
  };
  let ioVisible = false;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(
      (entries) => {
        ioVisible = entries[0]!.isIntersecting;
        syncVisible();
      },
      { threshold: 0.05 },
    ).observe(canvas);
  } else {
    ioVisible = true;
    syncVisible();
  }
  document.addEventListener('visibilitychange', syncVisible);
}
