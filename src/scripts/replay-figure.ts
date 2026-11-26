// One map of the lost window, the true path and the reported path, and the one moment that matters.
// Plays once when it comes into view, settles on that moment; a tap replays, a horizontal drag scrubs
// (a vertical drag scrolls the page), arrow keys scrub; reduced motion shows the still at the moment.
type Pose = (number | null)[];
type Replay = {
  poses: Pose[];
  key: number;
  zones: { lost_start: number; lost_end: number };
  truth: number[][][];
  walls: number[];
};

export async function initReplayFigure() {
  const canvas = document.querySelector<HTMLCanvasElement>('canvas[data-replay-figure]');
  if (!canvas) return;
  const d = (await (await fetch(canvas.dataset.src!)).json()) as Replay;
  const ctx = canvas.getContext('2d')!;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const root = document.documentElement;
  const css = (n: string) => getComputedStyle(root).getPropertyValue(n).trim();
  const MONO = "'DM Mono', ui-monospace, monospace";

  const Z = d.zones, T = d.truth[1], keyT = d.poses[d.key][0] as number;
  const L = d.poses.filter((p) => (p[0] as number) >= Z.lost_start && (p[0] as number) <= Z.lost_end) as number[][];
  const t0 = Z.lost_start, t1 = Z.lost_end, PADM = 3;
  const pts: number[][] = [];
  L.forEach((p) => pts.push([p[1], p[2]]));
  T.forEach((p) => pts.push([p[1], p[2]]));

  // The footprint of the lost window runs diagonally; on a wide stage the map is turned to lie along it, and says so.
  let mx0 = 0, my0 = 0, sxx = 0, syy = 0, sxy = 0;
  pts.forEach((p) => { mx0 += p[0]; my0 += p[1]; });
  mx0 /= pts.length; my0 /= pts.length;
  pts.forEach((p) => { const a = p[0] - mx0, b = p[1] - my0; sxx += a * a; syy += b * b; sxy += a * b; });
  let th0 = 0.5 * Math.atan2(2 * sxy, sxx - syy);
  if (Math.cos(th0) < 0) th0 += Math.PI;
  let th = 0, cs = 1, sn = 0, u0 = 0, u1 = 0, v0 = 0, v1 = 0;
  const turn = (a: number) => {
    th = a; cs = Math.cos(a); sn = Math.sin(a); u0 = v0 = 1e9; u1 = v1 = -1e9;
    pts.forEach((p) => {
      const u = p[0] * cs + p[1] * sn, v = -p[0] * sn + p[1] * cs;
      u0 = Math.min(u0, u); u1 = Math.max(u1, u); v0 = Math.min(v0, v); v1 = Math.max(v1, v);
    });
    u0 -= PADM; u1 += PADM; v0 -= PADM; v1 += PADM;
  };

  let t = reduced ? keyT : t0, running = false, inspect = reduced;
  let drag: { x: number; y: number; on: boolean; mouse: boolean } | null = null;
  let W = 0, H = 0, dpr = 1, sc = 1, ox = 0, oy = 0, bx0 = 0, bx1 = 0, by = 0;
  let walls: HTMLCanvasElement | null = null;
  const X = (x: number, y: number) => ox + (x * cs + y * sn - u0) * sc;
  const Y = (x: number, y: number) => oy + (v1 - (-x * sn + y * cs)) * sc;
  const TX = (tt: number) => bx0 + ((bx1 - bx0) * (tt - t0)) / (t1 - t0);

  const at = (tt: number) => {
    let lo = 0, hi = L.length - 1;
    while (lo < hi) { const m = (lo + hi + 1) >> 1; if (L[m][0] <= tt) lo = m; else hi = m - 1; }
    return lo;
  };
  const now = (tt: number) => {
    const k = at(tt), a = L[k], b = L[Math.min(L.length - 1, k + 1)];
    const f = b[0] > a[0] ? Math.max(0, Math.min(1, (tt - a[0]) / (b[0] - a[0]))) : 0;
    const o = { x: a[1] + (b[1] - a[1]) * f, y: a[2] + (b[2] - a[2]) * f, sig: a[3] + (b[3] - a[3]) * f, err: null as number | null, tr: null as number[] | null };
    if (a[6] !== null) o.err = f === 0 || b[6] === null ? a[6] : a[6] + (b[6] - a[6]) * f;
    if (tt >= T[0][0] && tt <= T[T.length - 1][0]) {
      let l = 0, h = T.length - 1;
      while (h - l > 1) { const mid = (l + h) >> 1; if (T[mid][0] <= tt) l = mid; else h = mid; }
      const g = (tt - T[l][0]) / (T[h][0] - T[l][0]);
      o.tr = [T[l][1] + (T[h][1] - T[l][1]) * g, T[l][2] + (T[h][2] - T[l][2]) * g];
    }
    return o;
  };

  function layout() {
    const r = canvas!.getBoundingClientRect(), small = r.width < 520;
    dpr = Math.min(window.devicePixelRatio || 1, 2); W = r.width; H = r.height;
    if (!W) return;
    canvas!.width = Math.round(W * dpr); canvas!.height = Math.round(H * dpr);
    const pad = small ? 16 : 28, foot = 34;
    bx0 = pad; bx1 = W - pad; by = H - 16;
    const aw = W - 2 * pad, ah = H - foot - pad;
    turn(0); const s0 = Math.min(aw / (u1 - u0), ah / (v1 - v0));
    turn(th0); const s1 = Math.min(aw / (u1 - u0), ah / (v1 - v0));
    if (s1 < s0 * 1.2) turn(0);
    sc = Math.min(aw / (u1 - u0), ah / (v1 - v0));
    ox = pad + (aw - (u1 - u0) * sc) / 2; oy = pad + (ah - (v1 - v0) * sc) / 2;
    walls = document.createElement('canvas'); walls.width = canvas!.width; walls.height = canvas!.height;
    const w = walls.getContext('2d')!;
    w.setTransform(dpr, 0, 0, dpr, 0, 0);
    w.fillStyle = css('--color-text-muted'); w.globalAlpha = 0.5;
    const s = Math.max(1, Math.min(2, sc * 0.2));
    for (let j = 0; j < d.walls.length; j += 2) {
      const wx = d.walls[j], wy = d.walls[j + 1], u = wx * cs + wy * sn, v = -wx * sn + wy * cs;
      if (u >= u0 && u <= u1 && v >= v0 && v <= v1) w.fillRect(X(wx, wy) - s / 2, Y(wx, wy) - s / 2, s, s);
    }
    draw();
  }

  // a label sits on a plate of the page ground, so the paths under it never cut through the letters
  function halo(str: string, x: number, y: number, bg: string) {
    const w = ctx.measureText(str).width, col = ctx.fillStyle;
    ctx.fillStyle = bg; ctx.globalAlpha = 0.9; ctx.fillRect(x - 4, y - 11, w + 8, 15);
    ctx.globalAlpha = 1; ctx.fillStyle = col; ctx.fillText(str, x, y);
  }

  function draw() {
    if (!W || !walls) return;
    const ink = css('--color-text-primary'), acc = css('--color-accent'), faint = css('--color-border'), bg = css('--color-bg-primary');
    const small = W < 520, q = now(t);
    let i: number;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
    ctx.drawImage(walls, 0, 0, W, H);
    ctx.lineJoin = 'round';
    // what the robot reported, so far
    ctx.strokeStyle = ink; ctx.lineWidth = 1; ctx.globalAlpha = 0.3; ctx.beginPath();
    for (i = 0; i < L.length && L[i][0] <= t; i++) i ? ctx.lineTo(X(L[i][1], L[i][2]), Y(L[i][1], L[i][2])) : ctx.moveTo(X(L[i][1], L[i][2]), Y(L[i][1], L[i][2]));
    ctx.lineTo(X(q.x, q.y), Y(q.x, q.y)); ctx.stroke();
    // where it really was, so far
    ctx.strokeStyle = acc; ctx.lineWidth = 2; ctx.globalAlpha = 0.95; ctx.beginPath();
    for (i = 0; i < T.length && T[i][0] <= t; i++) i ? ctx.lineTo(X(T[i][1], T[i][2]), Y(T[i][1], T[i][2])) : ctx.moveTo(X(T[i][1], T[i][2]), Y(T[i][1], T[i][2]));
    if (q.tr) ctx.lineTo(X(q.tr[0], q.tr[1]), Y(q.tr[0], q.tr[1]));
    ctx.stroke();
    const rx = X(q.x, q.y), ry = Y(q.x, q.y);
    let tx = 0, ty = 0;
    ctx.globalAlpha = 1;
    if (q.tr) {
      tx = X(q.tr[0], q.tr[1]); ty = Y(q.tr[0], q.tr[1]);
      ctx.strokeStyle = ink; ctx.globalAlpha = 0.55; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(rx, ry); ctx.stroke();
      ctx.globalAlpha = 1; ctx.fillStyle = acc; ctx.beginPath(); ctx.arc(tx, ty, small ? 4 : 5, 0, 6.2832); ctx.fill();
    }
    ctx.strokeStyle = ink; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(rx, ry, q.sig * sc, 0, 6.2832); ctx.stroke();
    ctx.fillStyle = ink; ctx.beginPath(); ctx.arc(rx, ry, small ? 3 : 3.5, 0, 6.2832); ctx.fill();

    // the one moment: three labels, only when the run has settled or the reader is looking
    const settled = inspect || t >= keyT - 0.05;
    if (settled && q.tr) {
      ctx.font = (small ? 9.5 : 11) + 'px ' + MONO; ctx.textBaseline = 'alphabetic';
      let dx = rx - tx, dy = ry - ty;
      const dl = Math.hypot(dx, dy) || 1; dx /= dl; dy /= dl;
      const put = (str: string, x: number, y: number, ax: number, col: string) => {
        const w = ctx.measureText(str).width, a = ax > 0 ? 'left' : 'right';
        const xx = Math.max(6, Math.min(W - 6 - w, a === 'left' ? x : x - w));
        ctx.fillStyle = col; ctx.textAlign = 'left'; halo(str, xx, y, bg);
      };
      put('true position', tx - dx * 12, ty - dy * 12 + 4, -Math.sign(dx || 1), ink);
      put('reported uncertainty ' + q.sig.toFixed(2) + ' m', rx + dx * 12, ry + dy * 12 + 4, Math.sign(dx || 1), ink);
      if (q.err !== null) {
        const mx = (tx + rx) / 2, my = (ty + ry) / 2, txt = q.err.toFixed(1) + ' m';
        ctx.fillStyle = acc; ctx.font = (small ? 10.5 : 12.5) + 'px ' + MONO;
        const tw = ctx.measureText(txt).width;
        halo(txt, Math.max(6, Math.min(W - 6 - tw, mx - tw / 2)), my + 4, bg);
      }
      ctx.textAlign = 'left';
    }

    if (th) {
      const ax = sn, ay = -cs, cx = W - 22, cy = 24;
      ctx.strokeStyle = ink; ctx.globalAlpha = 0.5; ctx.lineWidth = 1; ctx.beginPath();
      ctx.moveTo(cx - ax * 8, cy - ay * 8); ctx.lineTo(cx + ax * 8, cy + ay * 8);
      ctx.moveTo(cx + ax * 8, cy + ay * 8); ctx.lineTo(cx + ax * 8 - ax * 5 - ay * 3.5, cy + ay * 8 - ay * 5 + ax * 3.5);
      ctx.moveTo(cx + ax * 8, cy + ay * 8); ctx.lineTo(cx + ax * 8 - ax * 5 + ay * 3.5, cy + ay * 8 - ay * 5 - ax * 3.5); ctx.stroke();
      ctx.font = (small ? 9.5 : 10.5) + 'px ' + MONO; ctx.fillStyle = ink; ctx.textAlign = 'right'; ctx.fillText('map y', cx - 14, cy + 4); ctx.textAlign = 'left';
    }
    // the one secondary element: time
    ctx.globalAlpha = 1; ctx.fillStyle = faint; ctx.fillRect(bx0, by, bx1 - bx0, 1);
    ctx.fillStyle = ink; ctx.globalAlpha = 0.9; ctx.fillRect(bx0, by - 0.5, TX(t) - bx0, 2);
    ctx.globalAlpha = 0.5; ctx.fillRect(Math.round(TX(keyT)) - 0.5, by - 4, 1, 9);
    ctx.globalAlpha = 1; ctx.beginPath(); ctx.arc(TX(t), by + 0.5, 4, 0, 6.2832); ctx.fillStyle = bg; ctx.fill(); ctx.strokeStyle = ink; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.globalAlpha = 1;
  }

  const timeAt = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect();
    return t0 + Math.max(0, Math.min(1, (e.clientX - r.left - bx0) / (bx1 - bx0))) * (t1 - t0);
  };
  const replay = () => { if (reduced) return; t = t0; inspect = false; running = true; draw(); };
  canvas.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, y: e.clientY, on: false, mouse: e.pointerType === 'mouse' }; });
  canvas.addEventListener('pointermove', (e) => {
    if (!drag) return;
    if (!drag.on) {
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (Math.abs(dx) > (drag.mouse ? 3 : 6) && Math.abs(dx) > Math.abs(dy)) {
        drag.on = true; running = false; inspect = true;
        try { canvas.setPointerCapture(e.pointerId); } catch {}
      } else return;
    }
    t = timeAt(e); draw();
  });
  canvas.addEventListener('pointerup', (e) => {
    if (drag && !drag.on && Math.abs(e.clientX - drag.x) < 6 && Math.abs(e.clientY - drag.y) < 6) replay();
    drag = null;
  });
  canvas.addEventListener('pointercancel', () => { drag = null; });
  canvas.tabIndex = 0;
  canvas.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') replay();
    else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      running = false; inspect = true;
      t = Math.max(t0, Math.min(t1, t + (e.key === 'ArrowRight' ? 2 : -2))); draw();
    } else return;
    e.preventDefault();
  });
  new ResizeObserver(layout).observe(canvas);
  new MutationObserver(layout).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', layout);

  let vis = false, last = performance.now();
  new IntersectionObserver((es) => {
    const on = es[0].isIntersecting && canvas.offsetParent !== null;
    if (on && !vis && !inspect) replay();
    vis = on;
  }, { threshold: 0.4 }).observe(canvas);
  const tick = (now: number) => {
    const dt = Math.min(0.1, (now - last) / 1000); last = now;
    if (running && vis && !document.hidden && !drag) {
      t += (dt * (keyT - t0)) / 12;
      if (t >= keyT) { t = keyT; running = false; }
      draw();
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
