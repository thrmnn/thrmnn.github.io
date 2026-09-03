// Procedural scene: Segway Loomo (EPFL VITA project) tracking a walking
// person — pose keypoints in green, and a LiDAR cone of light sweeping out
// of the follower's sensor; the detected joints flash as the cone crosses
// them. An illustration of the real person-following stack, not sensor
// data; positions are parametric.
//
// Retired from the homepage artifact band (cycle 6, 2026-09-03) in favor of
// a replay of a real recorded run. Kept, unimported — not bundled — as the
// only prior work preserving this render.
import { buildLut, type Cloud } from '../favela-scrubber';

export function buildLoomoScene(): Cloud {
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

    // --- joint flashes: intensity peaks as the sweep crosses the person ---
    const f = Math.max(0, 1 - Math.abs(sweep) / 0.14);
    cloud.flashF = f;
    const flashJoints = ['head', 'neck', 'shoulderL', 'shoulderR', 'hipL', 'hipR', 'kneeL', 'kneeR'];
    for (let k = 0; k < N_FLASH; k++) {
      if (f > 0) {
        const j = J[flashJoints[k]!]!;
        x[i] = j[0];
        y[i] = j[1];
        z[i] = j[2] + 0.014;
      } else {
        x[i] = 1e3; // parked off-canvas between detections
        y[i] = 1e3;
        z[i] = 0;
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
  const cloud: Cloud = {
    n,
    x,
    y,
    z,
    cat,
    phase,
    update,
    lut,
    sizes: [1.5, 1.5, 2.1],
    flashFrom: n - N_FLASH,
    flashF: 0,
  };
  update(0); // static tableau for reduced-motion users
  return cloud;
}
