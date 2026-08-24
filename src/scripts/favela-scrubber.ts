// Rotating point-cloud hero: real research datasets in one renderer.
// Binary format: int8 x, int8 y, uint8 z, uint8 category per point
// (0 = ground/terrain, 1 = structure, 2 = vegetation).
// Auto-rotates slowly; drag/touch scrubs rotation; hovering excites nearby
// points into a LiDAR-scan vibration; datasets cycle slowly (chips pin one).
// IO + tab-hidden gated. prefers-reduced-motion users get a still iso view.
import { EXCITE_T_SCALE, EXCITE_AMP, EXCITE_RGB } from './excite';

interface Cloud {
  n: number;
  x: Float32Array;
  y: Float32Array;
  z: Float32Array;
  cat: Uint8Array;
  phase: Float32Array;
  // Procedural scenes rewrite their point positions each frame.
  update?: (tSec: number) => void;
  // Per-dataset framing: multiplies the base projection scale.
  zoom?: number;
  // Per-scene render hints; fall back to the globals tuned for ~10k-point
  // datasets. lut is a function of theme because the palette rebuilds on
  // theme flips — the scene memoizes it.
  lut?: (dark: boolean) => string[];
  sizes?: number[];
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
const SIZES = [1.5, 1.5, 1.9]; // dot size per category

function detectDark(): boolean {
  const attr = document.documentElement.getAttribute('data-theme');
  if (attr === 'dark') return true;
  if (attr === 'light') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

// Procedural scene: Segway Loomo (EPFL VITA project) tracking a walking
// person — pose keypoints in green, and a LiDAR cone of light sweeping out
// of the follower's sensor; the detected joints flash as the cone crosses
// them. An illustration of the real person-following stack, not sensor
// data; positions are parametric.
function buildLoomoScene(): Cloud {
  // Ground: concentric scan rings (LiDAR-return idiom) — denser along each
  // arc than the old 150-point disc, so the floor reads as a surface.
  const RING_R = [0.18, 0.315, 0.45, 0.585, 0.72];
  const RING_STEP = 0.02; // arc length between ring points
  const ringPts = RING_R.map((r) => Math.round((Math.PI * 2 * r) / RING_STEP));
  const N_GROUND = ringPts.reduce((a, b) => a + b, 0);
  const BONES = 14;
  const PTS_PER_BONE = 20;
  const N_PERSON = BONES * PTS_PER_BONE;
  const N_SHELL_HEAD = 26;
  const N_SHELL_TORSO = 42;
  const N_SHELL = N_SHELL_HEAD + N_SHELL_TORSO;
  const N_EMITTER = 12;
  const CONE_RAYS = 22;
  const PTS_PER_RAY = 20;
  const N_CONE = CONE_RAYS * PTS_PER_RAY;
  const N_FLASH = 8;
  const n = N_GROUND + N_PERSON + N_SHELL + N_EMITTER + N_CONE + N_FLASH;
  const PERSON0 = N_GROUND;
  const SHELL0 = PERSON0 + N_PERSON;
  const EMIT0 = SHELL0 + N_SHELL;

  const x = new Float32Array(n);
  const y = new Float32Array(n);
  const z = new Float32Array(n);
  const cat = new Uint8Array(n);
  const phase = new Float32Array(n);
  for (let i = 0; i < n; i++) phase[i] = Math.random() * Math.PI * 2;

  // Static scan rings.
  {
    let gi = 0;
    for (let ri = 0; ri < RING_R.length; ri++) {
      const r = RING_R[ri]!;
      const m = ringPts[ri]!;
      for (let k = 0; k < m; k++) {
        const a = (k / m) * Math.PI * 2;
        x[gi] = r * Math.cos(a);
        y[gi] = r * Math.sin(a);
        z[gi] = 0;
        gi++;
      }
    }
  }
  cat.fill(2, PERSON0, EMIT0); // person + shells = vegetation green
  cat.fill(1, EMIT0, n); // emitter, cone, joint flashes = amber

  // Fixed per-point randomness so the reduced-motion tableau is stable:
  // perpendicular jitter along each bone, unit directions for the shells.
  const jit1 = new Float32Array(N_PERSON);
  const jit2 = new Float32Array(N_PERSON);
  for (let i = 0; i < N_PERSON; i++) {
    jit1[i] = (Math.random() - 0.5) * 0.024;
    jit2[i] = (Math.random() - 0.5) * 0.024;
  }
  const shellDir = new Float32Array(N_SHELL * 3);
  for (let i = 0; i < N_SHELL; i++) {
    const az = Math.random() * Math.PI * 2;
    const cz = Math.random() * 2 - 1;
    const sz = Math.sqrt(1 - cz * cz);
    shellDir[i * 3] = sz * Math.cos(az);
    shellDir[i * 3 + 1] = sz * Math.sin(az);
    shellDir[i * 3 + 2] = cz;
  }

  const PATH_R = 0.48;
  const H = 0.62; // person height (normalized scene units)
  const STRIDE = 0.09;
  const GAIT_HZ = 1.3; // step cycles per second
  // Path speed derived from the gait so the feet can't skate: each gait
  // cycle covers 2·STRIDE of ground, so v = 2·STRIDE·GAIT_HZ and w = v/R.
  const WALK_W = (2 * STRIDE * GAIT_HZ) / PATH_R; // rad/s around the path

  // Follower path angle: first-order lag toward its offset so tracking
  // reads as pursuit, not a rigid formation.
  let ra = -0.62;
  let tPrev = 0;

  const update = (t: number) => {
    const a = t * WALK_W;
    const px = PATH_R * Math.cos(a);
    const py = PATH_R * Math.sin(a);
    const hx = -Math.sin(a); // heading (tangent)
    const hy = Math.cos(a);
    const sx = Math.cos(a); // lateral (radial)
    const sy = Math.sin(a);

    // --- person: parametric gait ---
    const ph = t * Math.PI * 2 * GAIT_HZ;
    const J: Record<string, [number, number, number]> = {};
    const set = (name: string, f: number, s: number, zz: number) => {
      J[name] = [px + hx * f + sx * s, py + hy * f + sy * s, zz];
    };
    const bob = Math.abs(Math.sin(ph)) * 0.014;
    set('pelvis', 0, 0, H * 0.5 + bob);
    set('neck', 0, 0, H * 0.88 + bob);
    set('head', 0.012, 0, H * 0.97 + bob);
    for (const [side, sg] of [['L', 1], ['R', -1]] as const) {
      const legPh = ph + (sg === 1 ? 0 : Math.PI);
      const swing = Math.sin(legPh);
      const lift = Math.max(0, Math.cos(legPh)) * 0.026;
      set(`hip${side}`, 0, sg * 0.045, H * 0.5 + bob);
      set(`knee${side}`, swing * STRIDE * 0.5 + 0.016, sg * 0.045, H * 0.27 + lift * 0.6);
      set(`ankle${side}`, swing * STRIDE, sg * 0.05, 0.014 + lift);
      const armSwing = -swing;
      set(`shoulder${side}`, 0, sg * 0.058, H * 0.82 + bob);
      set(`elbow${side}`, armSwing * STRIDE * 0.45, sg * 0.066, H * 0.66 + bob);
      set(`wrist${side}`, armSwing * STRIDE * 0.8, sg * 0.066, H * 0.5 + bob);
    }
    const bones: Array<[string, string]> = [
      ['pelvis', 'neck'], ['neck', 'head'],
      ['pelvis', 'hipL'], ['hipL', 'kneeL'], ['kneeL', 'ankleL'],
      ['pelvis', 'hipR'], ['hipR', 'kneeR'], ['kneeR', 'ankleR'],
      ['neck', 'shoulderL'], ['shoulderL', 'elbowL'], ['elbowL', 'wristL'],
      ['neck', 'shoulderR'], ['shoulderR', 'elbowR'], ['elbowR', 'wristR'],
    ];
    let i = PERSON0;
    let jp = 0;
    for (const [from, to] of bones) {
      const A = J[from]!;
      const B = J[to]!;
      const bx = B[0] - A[0];
      const by = B[1] - A[1];
      const bz = B[2] - A[2];
      const bl = Math.hypot(bx, by, bz) || 1;
      const horiz = Math.hypot(bx, by);
      // u, v: unit perpendiculars to the bone axis (u horizontal).
      let ux = 1;
      let uy = 0;
      let vx = 0;
      let vy = 1;
      let vz = 0;
      if (horiz > 1e-6) {
        ux = -by / horiz;
        uy = bx / horiz;
        vx = -(bz / bl) * uy;
        vy = (bz / bl) * ux;
        vz = (bx / bl) * uy - (by / bl) * ux;
      }
      for (let k = 0; k < PTS_PER_BONE; k++, jp++) {
        const u = k / (PTS_PER_BONE - 1);
        const j1 = jit1[jp]!;
        const j2 = jit2[jp]!;
        x[i] = A[0] + bx * u + ux * j1 + vx * j2;
        y[i] = A[1] + by * u + uy * j1 + vy * j2;
        z[i] = A[2] + bz * u + vz * j2;
        i++;
      }
    }

    // Head + torso ellipsoid shells so the body reads volumetric.
    const head = J.head!;
    const pelvis = J.pelvis!;
    const neck = J.neck!;
    const tcx = (pelvis[0] + neck[0]) / 2;
    const tcy = (pelvis[1] + neck[1]) / 2;
    const tcz = (pelvis[2] + neck[2]) / 2;
    for (let k = 0; k < N_SHELL_HEAD; k++) {
      x[i] = head[0] + shellDir[k * 3]! * 0.026;
      y[i] = head[1] + shellDir[k * 3 + 1]! * 0.026;
      z[i] = head[2] + shellDir[k * 3 + 2]! * 0.032;
      i++;
    }
    for (let k = N_SHELL_HEAD; k < N_SHELL; k++) {
      const d0 = shellDir[k * 3]!;
      const d1 = shellDir[k * 3 + 1]!;
      const d2 = shellDir[k * 3 + 2]!;
      x[i] = tcx + hx * d0 * 0.03 + sx * d1 * 0.055;
      y[i] = tcy + hy * d0 * 0.03 + sy * d1 * 0.055;
      z[i] = tcz + d2 * 0.12;
      i++;
    }

    // --- follower sensor: a point of origin, trailing on the same path ---
    const dtu = Math.min(Math.max(t - tPrev, 0), 0.1);
    tPrev = t;
    ra += (a - 0.62 - ra) * Math.min(1, dtu * 2.5);
    const rx = PATH_R * Math.cos(ra);
    const ry = PATH_R * Math.sin(ra);
    const headZ = 0.2;
    for (let k = 0; k < N_EMITTER; k++) {
      const ea = (k / N_EMITTER) * Math.PI * 2;
      x[i] = rx + Math.cos(ea) * 0.025;
      y[i] = ry + Math.sin(ea) * 0.025;
      z[i] = headZ;
      i++;
    }

    // --- LiDAR cone: a fan of rays sweeping across the person ---
    const dirToPerson = Math.atan2(py - ry, px - rx);
    const sweep = Math.sin(t * 1.9) * 0.5; // scanning oscillation (rad)
    const dist = Math.hypot(px - rx, py - ry);
    const range = dist + 0.12;
    for (let ray = 0; ray < CONE_RAYS; ray++) {
      const rayA = dirToPerson + sweep + ((ray / (CONE_RAYS - 1)) - 0.5) * 0.55;
      const dx = Math.cos(rayA);
      const dy = Math.sin(rayA);
      const vSlope = (((ray * 7) % CONE_RAYS) / (CONE_RAYS - 1) - 0.5) * 0.18; // vertical fan
      for (let k = 0; k < PTS_PER_RAY; k++) {
        const u = Math.pow((k + 0.5) / PTS_PER_RAY, 1.6);
        x[i] = rx + dx * u * range;
        y[i] = ry + dy * u * range;
        z[i] = headZ + (H * 0.45 - headZ + vSlope) * u;
        i++;
      }
    }

    // --- joint flashes: the cone crossing the person = detection ---
    const hit = Math.abs(sweep) < 0.14;
    const flashJoints = ['head', 'neck', 'shoulderL', 'shoulderR', 'hipL', 'hipR', 'kneeL', 'kneeR'];
    for (let k = 0; k < N_FLASH; k++) {
      if (hit) {
        const j = J[flashJoints[k]!]!;
        x[i] = j[0];
        y[i] = j[1];
        z[i] = j[2] + 0.014;
      } else {
        x[i] = rx;
        y[i] = ry;
        z[i] = headZ; // parked inside the emitter between detections
      }
      i++;
    }
  };

  // Global ramps/sizes are tuned for ~10k points; at this scene's ~1.5k the
  // same alphas look anaemic. Boost alpha + person dot size, memoized per theme.
  let lutDark: boolean | null = null;
  let lutCache: string[] = [];
  const lut = (dark: boolean) => {
    if (lutDark !== dark) {
      lutCache = buildLut(dark, 1.55);
      lutDark = dark;
    }
    return lutCache;
  };
  const cloud: Cloud = { n, x, y, z, cat, phase, update, lut, sizes: [1.5, 1.5, 2.1] };
  update(0); // static tableau for reduced-motion users
  return cloud;
}

async function loadCloud(url: string): Promise<Cloud> {
  if (url === 'proc:loomo') return buildLoomoScene();
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
function buildLut(dark: boolean, alphaScale = 1): string[] {
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
            a = 0.45 + t * 0.4;
            r = 52 + Math.round(h * 18);
            g = 70 + Math.round(h * 24);
            b = 100 - Math.round(h * 16);
          }
        }
        a = Math.min(0.92, a * alphaScale);
        lut[c * 32 + (hq << 3) + dq] = `rgba(${r},${g},${b},${a.toFixed(3)})`;
      }
    }
  }
  return lut;
}

function applyTheme(s: Scrubber) {
  s.isDark = detectDark();
  s.lut = buildLut(s.isDark);
  const rgb = EXCITE_RGB[s.isDark ? 'dark' : 'light'];
  const alphas = s.isDark ? [0.95, 0.98, 0.95] : [0.92, 0.95, 0.95];
  s.exciteStyle = [0, 1, 2].map((c) => `rgba(${rgb[c]},${alphas[c]})`) as [string, string, string];
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

  if (s.cloud.update && s.motionOK) s.cloud.update(now / 1000);

  const cx = cssW / 2;
  const cy = cssH * 0.55;
  const scale = Math.min(cssW, cssH) * 0.42 * (s.cloud.zoom ?? 1);
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
  const lut = s.cloud.lut?.(s.isDark) ?? s.lut;
  const sizes = s.cloud.sizes ?? SIZES;
  let nExcite = 0;
  const wantExcite = s.hovering && !s.dragging && s.motionOK;
  for (let dq = 0; dq < 8; dq++) {
    for (let c = 0; c < 3; c++) {
      const size = sizes[c];
      for (let hq = 0; hq < 4; hq++) {
        const k = c * 32 + (hq << 3) + dq;
        const from = bucketStart[k];
        const to = bucketStart[k + 1];
        if (from === to) continue;
        s.ctx.fillStyle = lut[k]!;
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
    const t = now * EXCITE_T_SCALE;
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
      const amp = EXCITE_AMP * f;
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
  const zooms = chips.length ? chips.map((c) => Number(c.dataset.zoom) || 1) : [1];
  const clouds = new Map<string, Cloud>();

  const loadAt = async (idx: number): Promise<Cloud> => {
    const c = await loadCloud(urls[idx]!);
    c.zoom = zooms[idx];
    return c;
  };

  let cloud: Cloud;
  try {
    cloud = await loadAt(0);
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
    visible: false, // stays false until the IO callback proves intersection
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

  const getCloud = async (idx: number): Promise<Cloud | null> => {
    const url = urls[idx]!;
    const hit = clouds.get(url);
    if (hit) return hit;
    try {
      const c = await loadAt(idx);
      clouds.set(url, c);
      return c;
    } catch {
      return null;
    }
  };

  const captionEl = document.querySelector<HTMLElement>('[data-artifact-caption]');
  const setActiveChip = (idx: number) => {
    chips.forEach((c, i) => {
      c.setAttribute('aria-pressed', String(i === idx));
      c.classList.toggle('is-active', i === idx);
    });
    const caption = chips[idx]?.dataset.caption;
    if (captionEl && caption) captionEl.textContent = caption;
  };

  const switchTo = async (idx: number) => {
    if (switching || idx === active || !urls[idx]) return;
    switching = true;
    const next = await getCloud(idx);
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
    const prefetch = () => urls.slice(1).forEach((_, k) => void getCloud(k + 1));
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

  // IO state and tab visibility tracked separately: IO doesn't re-fire on
  // tab restore, so visible must be recomputed from both in both handlers.
  let ioVisible = false;
  let rafOn = false;
  let last = performance.now();
  const tick = (now: number) => {
    if (!s.visible) {
      rafOn = false; // loop parks off-screen; syncVisible restarts it
      return;
    }
    const dt = Math.min(now - last, 64);
    last = now;
    // Choreographed scenes carry their own motion — damp the idle spin.
    if (s.autoRotate && !s.dragging) s.rotation += dt * 0.00016 * (s.cloud.update ? 0.25 : 1);
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
    requestAnimationFrame(tick);
  };
  const syncVisible = () => {
    s.visible = ioVisible && !document.hidden;
    if (s.visible && !rafOn) {
      rafOn = true;
      last = performance.now(); // dt clamp alone can't absorb a long park
      requestAnimationFrame(tick);
    }
  };
  const io = new IntersectionObserver(
    (entries) => {
      ioVisible = entries[0]!.isIntersecting;
      syncVisible();
    },
    { threshold: 0.05 },
  );
  io.observe(canvas);
  document.addEventListener('visibilitychange', syncVisible);
}
