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
// The control stack owns the bottom of the frame and its height differs between
// the desktop and phone layouts, so the reserved band is declared in CSS as
// --rail-safe and read here. Hardcoding it let the cloud cover the sunset label
// on phones twice.
const RAIL_SAFE_FALLBACK = 34;
const LIT_STEPS = SWEEP_LAST - SWEEP_FIRST + 1;

function litFraction(word: number): number {
  let c = 0;
  for (let i = SWEEP_FIRST; i <= SWEEP_LAST; i++) if (word & (1 << i)) c++;
  return c / LIT_STEPS;
}

interface Points {
  litByStep: Float32Array;
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

  const litByStep = new Float32Array(16);
  let nBuild = 0;
  for (let i = 0; i < n; i++) if (cat[i] === 1) nBuild++;
  for (let st = 0; st < 16; st++) {
    const bit = 1 << st;
    let c = 0;
    for (let i = 0; i < n; i++) if (cat[i] === 1 && (sun[i]! & bit) !== 0) c++;
    litByStep[st] = nBuild ? c / nBuild : 0;
  }

  return { n, x, y, z, cat, sun, order, ax0, ax1, ay0, ay1, litByStep };
}

function toRgb(c: string): [number, number, number] {
  const h = c.replace('#', '').trim();
  const f = h.length === 3 ? h.split('').map((x) => x + x).join('') : h;
  return [parseInt(f.slice(0, 2), 16), parseInt(f.slice(2, 4), 16), parseInt(f.slice(4, 6), 16)];
}

// Shadowed ground is the same surface under less light, not a different kind of
// thing. Drawing it in a second hue read as two categories of dot; drawing it in
// a pale tint read as absent. A desaturated, dimmed accent reads as shadow in
// both themes, because the muted token is mid-tone in both.
function readColors(canvas: HTMLCanvasElement): { accent: string; shadow: string } {
  const cs = getComputedStyle(canvas);
  const accent = cs.getPropertyValue('--color-accent').trim() || '#3b82f6';
  const muted = cs.getPropertyValue('--color-text-secondary').trim() || '#525252';
  let shadow = muted;
  try {
    const a = toRgb(accent);
    const m = toRgb(muted);
    const mix = a.map((v, i) => Math.round(v * 0.3 + m[i]! * 0.7));
    shadow = `rgb(${mix[0]}, ${mix[1]}, ${mix[2]})`;
  } catch {
    /* keep the muted token if either value is not a plain hex */
  }
  return { accent, shadow };
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
  let { accent, shadow } = readColors(canvas);

  let cssW = canvas.clientWidth;
  let cssH = canvas.clientHeight;
  let currentStep = REST_STEP;
  let lastScale = 1;
  let lastCx = 0;
  let lastCy = 0;
  let pinned = -1;
  let sweeping = false;
  let sweepStart = 0;
  let needsRender = true;
  let visible = false;
  let rafOn = false;

  const track = canvas.closest('.artifact-frame')?.querySelector('.sun-track') as HTMLElement | null;
  const readout = canvas.closest('.artifact-frame')?.querySelector('.sun-readout') as HTMLElement | null;
  function publishProgress() {
    if (track) {
      const t = (currentStep - SWEEP_FIRST) / (SWEEP_LAST - SWEEP_FIRST);
      track.style.setProperty('--sun-t', String(Math.max(0, Math.min(1, t))));
    }
    if (readout) {
      readout.textContent =
        pinned >= 0
          ? `this rooftop: ${Math.round(litFraction(pts.sun[pinned]!) * 100)}% of the day in sun (this page's sun model, not a study result)`
          : `${Math.round(pts.litByStep[currentStep]! * 100)}% of the built fabric in sun (this page's sun model, not a study result)`;
    }
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
    const safe = parseFloat(getComputedStyle(canvas).getPropertyValue('--rail-safe')) || RAIL_SAFE_FALLBACK;
    const topSafe = parseFloat(getComputedStyle(canvas).getPropertyValue('--top-safe')) || 0;
    const drawH = Math.max(40, cssH - safe - topSafe);
    const scale = Math.min(cssW / (ax1 - ax0), drawH / (ay1 - ay0)) * FILL;
    const cx = cssW / 2 - ((ax0 + ax1) / 2) * scale;
    const cy = topSafe + drawH / 2 + ((ay0 + ay1) / 2) * scale;
    const bit = 1 << currentStep;
    const dotScale = Math.max(0.85, Math.min(2.1, scale / 260));

    lastScale = scale;
    lastCx = cx;
    lastCy = cy;
    for (let k = 0; k < n; k++) {
      const i = order[k]!;
      const rx = x[i]! * COS_R - y[i]! * SIN_R;
      const rz = x[i]! * SIN_R + y[i]! * COS_R;
      const vy = (z[i]! * COS_T - rz * SIN_T) * Y_SQUASH;
      const sx = cx + rx * scale;
      const sy = cy - vy * scale;
      const lit = (sun[i]! & bit) !== 0;
      const isBuilding = cat[i] === 1;
      ctx!.fillStyle = lit ? accent : shadow;
      ctx!.globalAlpha = isBuilding ? (lit ? 0.95 : 0.82) : lit ? 0.42 : 0.32;
      const size = (isBuilding ? 1.8 : 0.9) * dotScale;
      ctx!.fillRect(sx - size / 2, sy - size / 2, size, size);
    }
    ctx!.globalAlpha = 1;

    if (pinned >= 0) {
      const px = cx + (x[pinned]! * COS_R - y[pinned]! * SIN_R) * scale;
      const rzp = x[pinned]! * SIN_R + y[pinned]! * COS_R;
      const py = cy - (z[pinned]! * COS_T - rzp * SIN_T) * Y_SQUASH * scale;
      ctx!.strokeStyle = accent;
      ctx!.lineWidth = 1.5;
      ctx!.beginPath();
      ctx!.arc(px, py, 9, 0, Math.PI * 2);
      ctx!.stroke();
    }
  }

  function pinAt(clientX: number, clientY: number) {
    const rect = canvas.getBoundingClientRect();
    const mx = clientX - rect.left;
    const my = clientY - rect.top;
    const { n, x, y, z, cat } = pts;
    let best = -1;
    let bestD = 24 * 24;
    for (let i = 0; i < n; i++) {
      if (cat[i] !== 1) continue; // only the built fabric carries a useful number
      const sx = lastCx + (x[i]! * COS_R - y[i]! * SIN_R) * lastScale;
      const rz = x[i]! * SIN_R + y[i]! * COS_R;
      const sy = lastCy - (z[i]! * COS_T - rz * SIN_T) * Y_SQUASH * lastScale;
      const d = (sx - mx) * (sx - mx) + (sy - my) * (sy - my);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    }
    pinned = best;
    needsRender = true;
    kick();
    return best;
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
  const runBtn = frame?.querySelector('.sun-run') as HTMLButtonElement | null;
  runBtn?.addEventListener('click', activate);
  // the rail looks like a slider but is a position readout; making the whole
  // strip run the day means a thumb never has to land on the dot
  (frame?.querySelector('.sun-track') as HTMLElement | null)?.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).closest('.sun-run')) return;
    activate();
  });
  canvas.addEventListener('click', (e) => {
    const hit = pinAt(e.clientX, e.clientY);
    if (hit < 0 && readout) needsRender = true;
  });

  reduceMotion.addEventListener?.('change', (e) => {
    motionOK = !e.matches;
    sweeping = false;
    currentStep = REST_STEP;
    needsRender = true;
    kick();
  });

  const retheme = () => {
    ({ accent, shadow } = readColors(canvas));
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
