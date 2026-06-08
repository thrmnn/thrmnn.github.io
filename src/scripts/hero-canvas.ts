(() => {
  const canvas = document.querySelector('.hero-canvas') as HTMLCanvasElement | null;
  const hero = canvas?.closest('.hero-section') as HTMLElement | null;
  if (!canvas || !hero) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(pointer: fine)');
  const coarsePointer = window.matchMedia('(pointer: coarse)');
  const mobileLite = coarsePointer.matches || window.innerWidth < 768;

  const T_SCAN = 4200, T_HOLD = 2000, T_FADE = 1100, T_GAP = 500;
  const CYCLE = T_SCAN + T_HOLD + T_FADE + T_GAP;
  const REVEAL_RAMP = 50;
  const CURSOR_R = 158;

  const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);

  function favelaModel() {
    const p: number[][] = [];
    const EDGE = 0.017;
    const rect = (x0: number, y0: number, x1: number, y1: number) => {
      for (let x = x0; x <= x1 + 1e-6; x += EDGE) { p.push([x, y0]); p.push([x, y1]); }
      for (let y = y0; y <= y1 + 1e-6; y += EDGE) { p.push([x0, y]); p.push([x1, y]); }
    };
    const win = (cx: number, cy: number, s: number) => {
      for (let x = -s; x <= s + 1e-6; x += s)
        for (let y = -s; y <= s + 1e-6; y += s) p.push([cx + x, cy + y]);
    };
    const cols = 13;
    for (let ci = 0; ci < cols; ci++) {
      const t = ci / (cols - 1);
      const cx = ci / cols;
      const cw = (1 / cols) * (0.88 + Math.random() * 0.62);
      const edgeTaper = Math.min(1, Math.min(t, 1 - t) * 2.6 + 0.3);
      const profile = Math.max(0.16, (0.45 + Math.random() * 0.46) * edgeTaper);
      let y = 0;
      while (y < profile - 0.05) {
        const remain = profile - y;
        const hh = Math.min(remain, 0.09 + Math.random() * 0.13);
        const jx = (Math.random() - 0.5) * 0.022;
        const jw = (Math.random() - 0.5) * 0.03;
        const x0 = cx + jx, x1 = cx + cw + jx + jw;
        rect(x0, y, x1, y + hh);
        const wins = hh > 0.13 ? 2 : 1;
        for (let k = 0; k < wins; k++) {
          const wx = x0 + (x1 - x0) * (0.28 + Math.random() * 0.44);
          const wy = y + hh * (0.3 + k * 0.34 + Math.random() * 0.08);
          win(wx, wy, 0.013);
        }
        y += hh + Math.random() * 0.012;
      }
    }
    return p;
  }

  function treeModel() {
    const p: number[][] = [];
    const PER = 0.022;
    for (let y = 0; y <= 0.42 + 1e-6; y += PER) {
      const flare = y < 0.06 ? (0.06 - y) * 0.6 : 0;
      const half = Math.max(0.012, 0.05 - y * 0.045 + flare);
      p.push([0.5 - half, y]); p.push([0.5 + half, y]);
      p.push([0.5, y]);
    }
    const branches = [[-0.2, 0.62], [0.22, 0.66], [-0.1, 0.8], [0.14, 0.82], [0.0, 0.7]];
    for (const [bx, by] of branches) {
      for (let s = 0; s <= 16; s++) {
        const f = s / 16;
        p.push([0.5 + bx * f, 0.4 + (by - 0.4) * f]);
      }
    }
    const circles = [
      [0.50, 0.70, 0.30], [0.32, 0.64, 0.21], [0.68, 0.66, 0.22],
      [0.50, 0.89, 0.19], [0.38, 0.82, 0.17], [0.63, 0.83, 0.17],
      [0.50, 0.60, 0.23],
    ];
    let tries = 0;
    while (p.length < 640 && tries < 24000) {
      tries++;
      const x = Math.random(), y = 0.40 + Math.random() * 0.62;
      for (const [cx, cy, r] of circles) {
        const dx = x - cx, dy = y - cy;
        if (dx * dx + dy * dy < r * r) { p.push([x, y]); break; }
      }
    }
    return p;
  }

  function robotModel() {
    const p: number[][] = [];
    const J: Record<string, number[]> = {
      head: [0.5, 0.93], neck: [0.5, 0.79], spine: [0.5, 0.6], pelvis: [0.5, 0.44],
      ls: [0.37, 0.77], rs: [0.63, 0.77],
      le: [0.28, 0.6], re: [0.72, 0.6],
      lw: [0.31, 0.42], rw: [0.69, 0.42],
      lh: [0.43, 0.44], rh: [0.57, 0.44],
      lk: [0.41, 0.23], rk: [0.59, 0.23],
      la: [0.40, 0.03], ra: [0.60, 0.03],
    };
    const bones = [
      ['neck', 'head'], ['neck', 'spine'], ['spine', 'pelvis'],
      ['neck', 'ls'], ['neck', 'rs'],
      ['ls', 'le'], ['le', 'lw'], ['rs', 're'], ['re', 'rw'],
      ['pelvis', 'lh'], ['pelvis', 'rh'],
      ['lh', 'lk'], ['lk', 'la'], ['rh', 'rk'], ['rk', 'ra'],
    ];
    for (const [a, b] of bones) {
      const [x0, y0] = J[a], [x1, y1] = J[b];
      const n = Math.max(7, Math.round(Math.hypot(x1 - x0, y1 - y0) / 0.013));
      for (let i = 0; i <= n; i++) {
        const f = i / n;
        p.push([x0 + (x1 - x0) * f, y0 + (y1 - y0) * f]);
      }
    }
    for (const k in J) {
      if (k === 'head') continue;
      const [jx, jy] = J[k];
      for (let a = 0; a < 11; a++) {
        const ang = (a / 11) * Math.PI * 2;
        p.push([jx + Math.cos(ang) * 0.015, jy + Math.sin(ang) * 0.015]);
      }
      p.push([jx, jy]);
    }
    const [hx, hy] = J.head;
    const hw = 0.072, hh = 0.082, EDGE = 0.012;
    for (let x = -hw; x <= hw + 1e-6; x += EDGE) { p.push([hx + x, hy - hh]); p.push([hx + x, hy + hh]); }
    for (let y = -hh; y <= hh + 1e-6; y += EDGE) { p.push([hx - hw, hy + y]); p.push([hx + hw, hy + y]); }
    for (let x = -hw * 0.6; x <= hw * 0.6 + 1e-6; x += EDGE) p.push([hx + x, hy + hh * 0.1]);
    return p;
  }

  function normalize(raw: number[][]) {
    let mnX = 1e9, mnY = 1e9, mxX = -1e9, mxY = -1e9;
    for (const [x, y] of raw) {
      if (x < mnX) mnX = x;
      if (x > mxX) mxX = x;
      if (y < mnY) mnY = y;
      if (y > mxY) mxY = y;
    }
    const sx = mxX - mnX || 1, sy = mxY - mnY || 1;
    return raw.map(([x, y]) => ({
      lx: (x - mnX) / sx,
      ly: (y - mnY) / sy,
      ph: Math.random() * Math.PI * 2,
      useB: Math.random() > 0.7,
    }));
  }

  const MODELS: any[] = [
    { pts: normalize(favelaModel()), aspect: 1.78, box: { x: 0, y: 0, w: 0, h: 0 } },
    { pts: normalize(treeModel()), aspect: 0.92, box: { x: 0, y: 0, w: 0, h: 0 } },
    { pts: normalize(robotModel()), aspect: 0.5, box: { x: 0, y: 0, w: 0, h: 0 } },
  ];

  let w = 0, h = 0, dpr = 1;
  let field: any[] = [];
  let raf = 0, running = false, t0 = performance.now();
  let pausedElapsed = 0;
  let settled = false;
  let lastModelIdx = -1;
  let settledDispatched = false;
  const onHome = window.location.pathname === '/';
  const MODEL_NAMES = ['favela', 'tree', 'pose'];
  let inView = true, visible = true;
  let lastStyle = '';
  const cursor = { x: -9999, y: -9999, active: false };
  let scanStrip: HTMLCanvasElement | null = null;
  let scanStripKey = '';

  function palette() {
    const dt = document.documentElement.getAttribute('data-theme');
    const light = dt === 'light' ||
      (!dt && window.matchMedia('(prefers-color-scheme: light)').matches);
    return light
      ? { a: '37,99,235', b: '124,58,237', base: 0.5, ray: '37,99,235', glow: 0.1, scan: '37,99,235' }
      : { a: '96,165,250', b: '150,120,246', base: 0.42, ray: '120,170,255', glow: 0.12, scan: '130,175,255' };
  }
  let pal = palette();

  function buildField() {
    const count = Math.max(24, Math.min(56, Math.round((w * h) / 38000)));
    field = [];
    for (let i = 0; i < count; i++) {
      const x = Math.random() * w, y = Math.random() * h;
      field.push({
        bx: x, by: y, x, y,
        r: 1 + Math.random() * 1.6,
        amp: 4 + Math.random() * 8,
        sp: 0.0002 + Math.random() * 0.0004,
        ph: Math.random() * Math.PI * 2,
        useB: Math.random() > 0.5,
      });
    }
  }

  function placeModels() {
    const maxH = Math.min(h * 0.66, 480);
    const maxW = w * 0.84;
    for (const m of MODELS) {
      let bw = maxH * m.aspect, bh = maxH;
      if (bw > maxW) { bw = maxW; bh = bw / m.aspect; }
      m.box.w = bw;
      m.box.h = bh;
      m.box.x = w / 2 - bw / 2;
      m.box.y = h * 0.54 - bh / 2;
    }
  }

  function resize() {
    const rect = hero!.getBoundingClientRect();
    w = rect.width; h = rect.height;
    if (!w || !h) return;
    const dprCap = mobileLite ? 1.5 : 2;
    dpr = Math.min(window.devicePixelRatio || 1, dprCap);
    canvas!.width = Math.round(w * dpr);
    canvas!.height = Math.round(h * dpr);
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    buildField();
    placeModels();
    if (!running) render(performance.now());
  }

  function ensureScanStrip(scanCol: string) {
    const key = `${scanCol}|${Math.round(h)}`;
    if (scanStrip && scanStripKey === key) return scanStrip;
    const c = document.createElement('canvas');
    const sw = 34, sh = Math.max(1, Math.round(h));
    c.width = sw;
    c.height = sh;
    const sctx = c.getContext('2d');
    if (!sctx) return null;
    const g = sctx.createLinearGradient(0, 0, sw, 0);
    g.addColorStop(0, `rgba(${scanCol},0)`);
    g.addColorStop(0.5, `rgba(${scanCol},0.85)`);
    g.addColorStop(1, `rgba(${scanCol},0)`);
    sctx.fillStyle = g;
    sctx.fillRect(0, 0, sw, sh);
    scanStrip = c;
    scanStripKey = key;
    return c;
  }

  function ray(x: number, y: number) {
    if (!cursor.active) return 0;
    const dx = x - cursor.x, dy = y - cursor.y;
    const dist = Math.hypot(dx, dy);
    if (dist >= CURSOR_R) return 0;
    const k = 1 - dist / CURSOR_R;
    ctx!.strokeStyle = `rgba(${pal.ray},${(k * 0.24).toFixed(3)})`;
    ctx!.lineWidth = 0.6;
    ctx!.beginPath();
    ctx!.moveTo(cursor.x, cursor.y);
    ctx!.lineTo(x, y);
    ctx!.stroke();
    lastStyle = '';
    return k;
  }

  function dot(x: number, y: number, r: number, col: string, alpha: number) {
    const s = `rgba(${col},${clamp(alpha, 0, 1).toFixed(2)})`;
    if (s !== lastStyle) { ctx!.fillStyle = s; lastStyle = s; }
    ctx!.fillRect(x - r * 0.5, y - r * 0.5, r, r);
  }

  function render(now: number) {
    const moving = !reduceMotion.matches;
    ctx!.clearRect(0, 0, w, h);
    lastStyle = '';

    let modelIdx = 0, phase = 'hold', pt = 0, scanX = -1;
    if (moving) {
      const el = now - t0;
      const passes = Math.floor(el / CYCLE);
      if (passes >= MODELS.length) {
        modelIdx = MODELS.length - 1;
        phase = 'hold';
        scanX = -1;
        settled = true;
      } else {
        modelIdx = passes % MODELS.length;
        const c = el % CYCLE;
        if (c < T_SCAN) { phase = 'scan'; pt = c / T_SCAN; scanX = pt * w; }
        else if (c < T_SCAN + T_HOLD) { phase = 'hold'; }
        else if (c < T_SCAN + T_HOLD + T_FADE) { phase = 'fade'; pt = (c - T_SCAN - T_HOLD) / T_FADE; }
        else { phase = 'gap'; }
      }
    }
    if (onHome && moving && !reduceMotion.matches) {
      if (modelIdx !== lastModelIdx && !settled) {
        lastModelIdx = modelIdx;
        window.dispatchEvent(new CustomEvent('hero:model', { detail: MODEL_NAMES[modelIdx] }));
      }
      if (settled && !settledDispatched) {
        settledDispatched = true;
        window.dispatchEvent(new CustomEvent('hero:settled'));
      }
    }
    const model = MODELS[modelIdx];
    const bx = model.box;

    for (const p of field) {
      if (moving) {
        p.x = p.bx + Math.cos(now * p.sp + p.ph) * p.amp;
        p.y = p.by + Math.sin(now * p.sp * 1.3 + p.ph) * p.amp * 0.7;
      } else { p.x = p.bx; p.y = p.by; }
      let bright = pal.base * 0.55, radius = p.r;
      if (scanX >= 0) {
        const d = Math.abs(p.x - scanX);
        if (d < 66) { const k = 1 - d / 66; bright += k * 0.34; radius += k * 1.2; }
      }
      const k = ray(p.x, p.y);
      if (k) { bright += k * 0.4; radius += k; }
      dot(p.x, p.y, radius, p.useB ? pal.b : pal.a, bright);
    }

    for (const mp of model.pts) {
      const sx = bx.x + mp.lx * bx.w;
      const sy = bx.y + (1 - mp.ly) * bx.h;
      const vib = moving ? 0.6 : 0;
      const x = sx + Math.cos(now * 0.0042 + mp.ph) * vib;
      const y = sy + Math.sin(now * 0.0049 + mp.ph * 1.7) * vib;

      let rv = 1;
      if (phase === 'scan') rv = clamp((scanX - sx) / REVEAL_RAMP, 0, 1);
      else if (phase === 'fade') rv = 1 - pt;
      else if (phase === 'gap') rv = 0;
      if (rv <= 0) continue;

      let bright = pal.base * rv, radius = 1.3 + 0.5 * rv;
      if (phase === 'scan' && scanX >= 0) {
        const d = Math.abs(x - scanX);
        if (d < 48) { const k = (1 - d / 48) * rv; bright += k * 0.62; radius += k * 1.7; }
      }
      const k = ray(x, y);
      if (k) { bright += k * 0.5 * rv; radius += k; }
      dot(x, y, radius, mp.useB ? pal.b : pal.a, bright);
    }

    if (scanX >= 0) {
      const strip = ensureScanStrip(pal.scan);
      if (strip) {
        ctx!.drawImage(strip, scanX - strip.width / 2, 0);
        lastStyle = '';
      }
    }

    if (cursor.active) {
      const g = ctx!.createRadialGradient(cursor.x, cursor.y, 0, cursor.x, cursor.y, CURSOR_R);
      g.addColorStop(0, `rgba(${pal.ray},${pal.glow})`);
      g.addColorStop(1, `rgba(${pal.ray},0)`);
      ctx!.fillStyle = g;
      ctx!.fillRect(cursor.x - CURSOR_R, cursor.y - CURSOR_R, CURSOR_R * 2, CURSOR_R * 2);
      lastStyle = '';
    }
  }

  function loop(now: number) {
    render(now);
    if (settled) {
      running = false;
      cancelAnimationFrame(raf);
      return;
    }
    if (running) raf = requestAnimationFrame(loop);
  }
  function sync() {
    if (mobileLite) return;
    const should = inView && visible && !reduceMotion.matches;
    if (should && !running) {
      running = true;
      t0 = performance.now() - pausedElapsed;
      if (!settled) { settledDispatched = false; lastModelIdx = -1; }
      raf = requestAnimationFrame(loop);
    } else if (!should && running) {
      running = false;
      pausedElapsed = performance.now() - t0;
      cancelAnimationFrame(raf);
    }
  }

  resize();

  if (mobileLite) {
    t0 = performance.now() - T_SCAN - T_HOLD / 2;
    render(performance.now());
    window.addEventListener('resize', () => { resize(); render(performance.now()); }, { passive: true });
    const onThemeStatic = () => { pal = palette(); scanStrip = null; render(performance.now()); };
    new MutationObserver(onThemeStatic).observe(document.documentElement, {
      attributes: true, attributeFilter: ['data-theme'],
    });
    window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', onThemeStatic);
    return;
  }

  window.addEventListener('resize', resize, { passive: true });
  document.addEventListener('visibilitychange', () => { visible = !document.hidden; sync(); });
  new IntersectionObserver((e) => { inView = e[0].isIntersecting; sync(); }, { threshold: 0 }).observe(hero);

  if (finePointer.matches) {
    hero.addEventListener('pointermove', (e) => {
      const rect = canvas.getBoundingClientRect();
      cursor.x = e.clientX - rect.left;
      cursor.y = e.clientY - rect.top;
      cursor.active = true;
      if (reduceMotion.matches) render(performance.now());
    }, { passive: true });
    hero.addEventListener('pointerleave', () => {
      cursor.active = false;
      if (reduceMotion.matches) render(performance.now());
    }, { passive: true });
  }

  const onTheme = () => { pal = palette(); scanStrip = null; if (!running) render(performance.now()); };
  new MutationObserver(onTheme).observe(document.documentElement, {
    attributes: true, attributeFilter: ['data-theme'],
  });
  window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', onTheme);
  reduceMotion.addEventListener('change', () => { sync(); render(performance.now()); });

  sync();
})();
