// Rotating point-cloud hero: real research datasets in one renderer.
// Binary format: int8 x, int8 y, uint8 z, uint8 category per point
// (0 = ground/terrain, 1 = structure, 2 = vegetation).
// Auto-rotates slowly; drag/touch scrubs rotation; hovering excites nearby
// points into a LiDAR-scan vibration; datasets cycle slowly (chips pin one).
// IO + tab-hidden gated. prefers-reduced-motion users get a still iso view.

interface Cloud {
  n: number;
  x: Float32Array;
  y: Float32Array;
  z: Float32Array;
  cat: Uint8Array;
  phase: Float32Array;
}

interface Scrubber {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  cloud: Cloud;
  rotation: number;
  autoRotate: boolean;
  motionOK: boolean;
  dragging: boolean;
  lastX: number;
  visible: boolean;
  isDark: boolean;
  lut: string[];
  exciteStyle: [string, string, string];
  // pointer-excite state (CSS px, canvas-local)
  px: number;
  py: number;
  hovering: boolean;
  // preallocated per-frame buffers (sized to the largest dataset)
  sx: Float32Array;
  sy: Float32Array;
  key: Uint8Array;
  bucketCount: Uint32Array;
  bucketStart: Uint32Array;
  order: Uint32Array;
  exciteIdx: Uint32Array;
  exciteF: Float32Array;
}

const N_BUCKETS = 96; // cat(3) × height(4) × depth(8)
const EXCITE_R = 64; // px
const EXCITE_CAP = 800;
const CYCLE_MS = 14000;
const SIZES = [1.4, 1.3, 1.7]; // dot size per category

function detectDark(): boolean {
  const attr = document.documentElement.getAttribute('data-theme');
  if (attr === 'dark') return true;
  if (attr === 'light') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

async function loadCloud(url: string): Promise<Cloud> {
  const buf = await fetch(url).then((r) => r.arrayBuffer());
  const view = new DataView(buf);
  const stride = 4; // v2: int8 x, int8 y, uint8 z, uint8 cat
  const n = buf.byteLength / stride;
  const x = new Float32Array(n);
  const y = new Float32Array(n);
  const z = new Float32Array(n);
  const cat = new Uint8Array(n);
  const phase = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const o = i * stride;
    x[i] = view.getInt8(o) / 127;
    y[i] = view.getInt8(o + 1) / 127;
    z[i] = view.getUint8(o + 2) / 255;
    cat[i] = view.getUint8(o + 3);
    phase[i] = Math.random() * Math.PI * 2;
  }
  return { n, x, y, z, cat, phase };
}

// Bucket colors evaluated at (height, depth) bucket centres — mirrors the
// previous per-point palette but lets a frame run on ≤96 fillStyle sets.
function buildLut(dark: boolean): string[] {
  const lut = new Array<string>(N_BUCKETS);
  for (let c = 0; c < 3; c++) {
    for (let hq = 0; hq < 4; hq++) {
      const h = (hq + 0.5) / 4;
      for (let dq = 0; dq < 8; dq++) {
        const t = (dq + 0.5) / 8;
        let r: number, g: number, b: number, a: number;
        // Alphas tuned for ~10k structure points: low enough that dense
        // fabric shades by overlap instead of saturating into a blob.
        if (dark) {
          if (c === 1) {
            a = 0.22 + t * 0.4;
            r = 255;
            g = 210 + Math.round(h * 30);
            b = 130 - Math.round(h * 30);
          } else if (c === 2) {
            a = 0.3 + t * 0.45;
            r = 52 + Math.round(h * 40);
            g = 211 + Math.round(h * 20);
            b = 153;
          } else {
            a = 0.16 + t * 0.45;
            r = 59 + Math.round(h * 60);
            g = 130 + Math.round(h * 80);
            b = 246 - Math.round(h * 30);
          }
        } else {
          if (c === 1) {
            a = 0.3 + t * 0.34;
            r = 196 - Math.round(h * 30);
            g = 86 + Math.round(h * 30);
            b = 30 + Math.round(h * 10);
          } else if (c === 2) {
            a = 0.42 + t * 0.4;
            r = 22 + Math.round(h * 20);
            g = 122 + Math.round(h * 45);
            b = 61 + Math.round(h * 15);
          } else {
            a = 0.32 + t * 0.45;
            r = 60 + Math.round(h * 25);
            g = 80 + Math.round(h * 30);
            b = 120 - Math.round(h * 20);
          }
        }
        lut[c * 32 + (hq << 3) + dq] = `rgba(${r},${g},${b},${a.toFixed(3)})`;
      }
    }
  }
  return lut;
}

function applyTheme(s: Scrubber) {
  s.isDark = detectDark();
  s.lut = buildLut(s.isDark);
  s.exciteStyle = s.isDark
    ? ['rgba(147,197,253,0.95)', 'rgba(255,236,179,0.98)', 'rgba(110,231,183,0.95)'] // [ground, structure, vegetation]
    : ['rgba(37,99,235,0.92)', 'rgba(234,88,12,0.95)', 'rgba(5,150,105,0.95)'];
}

function render(s: Scrubber, now: number) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const cssW = s.canvas.clientWidth;
  const cssH = s.canvas.clientHeight;
  const targetW = Math.max(1, Math.round(cssW * dpr));
  const targetH = Math.max(1, Math.round(cssH * dpr));
  if (s.canvas.width !== targetW || s.canvas.height !== targetH) {
    s.canvas.width = targetW;
    s.canvas.height = targetH;
  }
  s.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  s.ctx.clearRect(0, 0, cssW, cssH);

  const cx = cssW / 2;
  const cy = cssH * 0.55;
  const scale = Math.min(cssW, cssH) * 0.42;
  const tilt = 0.62;
  const cosT = Math.cos(tilt);
  const sinT = Math.sin(tilt);
  const cosR = Math.cos(s.rotation);
  const sinR = Math.sin(s.rotation);

  const { n, x, y, z, cat } = s.cloud;
  const { sx, sy, key, bucketCount, bucketStart, order } = s;

  bucketCount.fill(0);
  for (let i = 0; i < n; i++) {
    const rx = x[i] * cosR - y[i] * sinR;
    const rz = x[i] * sinR + y[i] * cosR;
    const syw = z[i] * cosT - rz * sinT;
    const depth = z[i] * sinT + rz * cosT;
    sx[i] = cx + rx * scale;
    sy[i] = cy - syw * scale * 0.7;
    let dq = (((depth + 1) * 0.5) * 8) | 0;
    if (dq > 7) dq = 7;
    else if (dq < 0) dq = 0;
    let hq = (z[i] * 4) | 0;
    if (hq > 3) hq = 3;
    const k = cat[i] * 32 + (hq << 3) + dq;
    key[i] = k;
    bucketCount[k]++;
  }

  bucketStart[0] = 0;
  for (let k = 0; k < N_BUCKETS; k++) bucketStart[k + 1] = bucketStart[k] + bucketCount[k];
  bucketCount.fill(0);
  for (let i = 0; i < n; i++) {
    const k = key[i];
    order[bucketStart[k] + bucketCount[k]++] = i;
  }

  // Far → near by depth bucket; coarse painter's order is plenty at dot scale.
  let nExcite = 0;
  const wantExcite = s.hovering && !s.dragging && s.motionOK;
  for (let dq = 0; dq < 8; dq++) {
    for (let c = 0; c < 3; c++) {
      const size = SIZES[c];
      for (let hq = 0; hq < 4; hq++) {
        const k = c * 32 + (hq << 3) + dq;
        const from = bucketStart[k];
        const to = bucketStart[k + 1];
        if (from === to) continue;
        s.ctx.fillStyle = s.lut[k];
        for (let j = from; j < to; j++) {
          const i = order[j];
          s.ctx.fillRect(sx[i], sy[i], size, size);
          if (wantExcite && nExcite < EXCITE_CAP) {
            const dx = sx[i] - s.px;
            const dy = sy[i] - s.py;
            const d2 = dx * dx + dy * dy;
            if (d2 < EXCITE_R * EXCITE_R) {
              s.exciteIdx[nExcite] = i;
              s.exciteF[nExcite] = 1 - Math.sqrt(d2) / EXCITE_R;
              nExcite++;
            }
          }
        }
      }
    }
  }

  // LiDAR-scan excite pass — points near the pointer vibrate and flash.
  if (nExcite > 0) {
    const t = now * 0.02;
    const { phase, cat: cats } = s.cloud;
    let prevCat = -1;
    for (let e = 0; e < nExcite; e++) {
      const i = s.exciteIdx[e];
      const f = s.exciteF[e];
      const c = cats[i];
      if (c !== prevCat) {
        s.ctx.fillStyle = s.exciteStyle[c];
        prevCat = c;
      }
      const amp = 2.4 * f;
      const jx = Math.sin(t + phase[i]) * amp;
      const jy = Math.cos(t * 1.13 + phase[i] * 1.7) * amp;
      const size = 1.6 + f * 1.0;
      s.ctx.fillRect(sx[i] + jx, sy[i] + jy, size, size);
    }
  }
}

function attachInteraction(s: Scrubber) {
  const local = (e: PointerEvent) => {
    const r = s.canvas.getBoundingClientRect();
    s.px = e.clientX - r.left;
    s.py = e.clientY - r.top;
  };
  const onDown = (e: PointerEvent) => {
    s.dragging = true;
    s.lastX = e.clientX;
    s.canvas.setPointerCapture(e.pointerId);
    s.canvas.classList.add('is-dragging');
  };
  const onMove = (e: PointerEvent) => {
    local(e);
    s.hovering = true;
    if (!s.dragging) return;
    const dx = e.clientX - s.lastX;
    s.lastX = e.clientX;
    s.rotation += dx * 0.009;
  };
  const onUp = (e: PointerEvent) => {
    if (!s.dragging) return;
    s.dragging = false;
    try {
      s.canvas.releasePointerCapture(e.pointerId);
    } catch {}
    s.canvas.classList.remove('is-dragging');
  };
  const onLeave = () => {
    s.hovering = false;
  };
  s.canvas.addEventListener('pointerdown', onDown);
  s.canvas.addEventListener('pointermove', onMove);
  s.canvas.addEventListener('pointerup', onUp);
  s.canvas.addEventListener('pointercancel', (e) => {
    onUp(e);
    onLeave();
  });
  s.canvas.addEventListener('pointerleave', onLeave);
}

function resizeBuffers(s: Scrubber, n: number) {
  if (s.sx.length >= n) return;
  s.sx = new Float32Array(n);
  s.sy = new Float32Array(n);
  s.key = new Uint8Array(n);
  s.order = new Uint32Array(n);
}

export async function initFavelaScrubber(canvas: HTMLCanvasElement, dataUrl = '/data/vidigal-rooftops.bin') {
  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return;

  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');

  // Dataset registry — chips in the page define the rotation; the canvas's
  // own dataUrl is the fallback when no chips exist.
  const chips = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-artifact-chip]'));
  const urls = chips.length ? chips.map((c) => c.dataset.url!) : [dataUrl];
  const clouds = new Map<string, Cloud>();

  let cloud: Cloud;
  try {
    cloud = await loadCloud(urls[0]!);
    clouds.set(urls[0]!, cloud);
  } catch {
    return;
  }

  const s: Scrubber = {
    canvas,
    ctx,
    cloud,
    rotation: 0.35,
    autoRotate: !reduceMotion.matches,
    motionOK: !reduceMotion.matches,
    dragging: false,
    lastX: 0,
    visible: true,
    isDark: false,
    lut: [],
    exciteStyle: ['', '', ''],
    px: -1e4,
    py: -1e4,
    hovering: false,
    sx: new Float32Array(cloud.n),
    sy: new Float32Array(cloud.n),
    key: new Uint8Array(cloud.n),
    bucketCount: new Uint32Array(N_BUCKETS),
    bucketStart: new Uint32Array(N_BUCKETS + 1),
    order: new Uint32Array(cloud.n),
    exciteIdx: new Uint32Array(EXCITE_CAP),
    exciteF: new Float32Array(EXCITE_CAP),
  };
  applyTheme(s);

  // --- dataset switching ---
  let active = 0;
  let pinned = false;
  let lastSwitch = performance.now();
  let switching = false;

  const getCloud = async (url: string): Promise<Cloud | null> => {
    const hit = clouds.get(url);
    if (hit) return hit;
    try {
      const c = await loadCloud(url);
      clouds.set(url, c);
      return c;
    } catch {
      return null;
    }
  };

  const setActiveChip = (idx: number) => {
    chips.forEach((c, i) => {
      c.setAttribute('aria-pressed', String(i === idx));
      c.classList.toggle('is-active', i === idx);
    });
  };

  const switchTo = async (idx: number) => {
    if (switching || idx === active || !urls[idx]) return;
    switching = true;
    const next = await getCloud(urls[idx]!);
    if (!next) {
      switching = false;
      return;
    }
    canvas.classList.add('is-switching');
    setTimeout(() => {
      resizeBuffers(s, next.n);
      s.cloud = next;
      active = idx;
      lastSwitch = performance.now();
      setActiveChip(idx);
      canvas.classList.remove('is-switching');
      switching = false;
    }, 220);
  };

  chips.forEach((chip, i) => {
    chip.addEventListener('click', () => {
      pinned = true; // a deliberate pick ends the auto-cycle
      switchTo(i);
    });
  });
  setActiveChip(0);

  // Prefetch the rest once the page is idle so the first cycle is seamless.
  if (urls.length > 1) {
    const prefetch = () => urls.slice(1).forEach((u) => void getCloud(u));
    'requestIdleCallback' in window
      ? (window as any).requestIdleCallback(prefetch, { timeout: 4000 })
      : setTimeout(prefetch, 3000);
  }

  reduceMotion.addEventListener?.('change', (e) => {
    s.autoRotate = !e.matches;
    s.motionOK = !e.matches;
  });

  // Re-read the theme whenever it changes (toggle click or OS-pref flip).
  const themeObserver = new MutationObserver(() => applyTheme(s));
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme'],
  });
  const osDarkMq = window.matchMedia('(prefers-color-scheme: dark)');
  osDarkMq.addEventListener?.('change', () => applyTheme(s));

  attachInteraction(s);

  const io = new IntersectionObserver(
    (entries) => {
      s.visible = entries[0]!.isIntersecting;
    },
    { threshold: 0.05 },
  );
  io.observe(canvas);
  document.addEventListener('visibilitychange', () => {
    s.visible = s.visible && !document.hidden;
  });

  let last = performance.now();
  const tick = (now: number) => {
    const dt = Math.min(now - last, 64);
    last = now;
    if (s.visible) {
      if (s.autoRotate && !s.dragging) s.rotation += dt * 0.00016;
      render(s, now);
      if (
        !pinned &&
        s.motionOK &&
        urls.length > 1 &&
        !s.hovering &&
        !s.dragging &&
        now - lastSwitch > CYCLE_MS
      ) {
        void switchTo((active + 1) % urls.length);
        lastSwitch = now; // debounce while the async swap is in flight
      }
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
