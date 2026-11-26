// The whole run of the lost-robot recording on one map: the building's walls as dots, the run the robot reported
// (faint, with a trail), the true path in blue once it is known, the line between the two positions, and under it a
// time bar with its three zones and the detector events. Plays once when it comes into view and stops on the key
// moment; a tap replays, a horizontal drag scrubs (a vertical drag scrolls the page), arrow keys scrub; reduced
// motion shows the still at the key moment. Every number comes from the data file.
type Pose = (number | null)[];
type Replay = {
  t_max: number;
  poses: Pose[];
  key: number;
  events: number[][];
  zones: { healthy_end: number; lost_start: number; lost_end: number };
  truth: number[][][];
  walls: number[];
};

// What a frame knows, handed to an extra after the two positions are drawn (screen pixels; tx, ty only when both are known).
export type ReplayFrame = { t: number; pose: Pose; both: boolean; rx: number; ry: number; tx: number; ty: number; small: boolean; W: number; ink: string; ground: string };
// An extra draws on top of the figure. None is installed: the labels and the distance number can be passed here later.
export type ReplayExtra = (ctx: CanvasRenderingContext2D, f: ReplayFrame) => void;
export type ReplayOptions = { extras?: ReplayExtra[] };

export async function initReplayFigure(options: ReplayOptions = {}) {
  const canvas = document.querySelector<HTMLCanvasElement>('canvas[data-replay-figure]');
  const cap = document.querySelector<HTMLElement>('[data-replay-caption]');
  if (!canvas || !cap) return;
  const d = (await (await fetch(canvas.dataset.src!)).json()) as Replay;
  const ctx = canvas.getContext('2d')!;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const css = (n: string) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  const MONO = "'DM Mono', ui-monospace, monospace";
  const extras = options.extras ?? [];

  const P = d.poses, K = P[d.key], tmax = d.t_max, Z = d.zones, tp = d.truth[1], keyT = K[0] as number;
  let minx = 1e9, maxx = -1e9, miny = 1e9, maxy = -1e9;
  for (let i = 0; i < d.walls.length; i += 2) {
    minx = Math.min(minx, d.walls[i]); maxx = Math.max(maxx, d.walls[i]);
    miny = Math.min(miny, d.walls[i + 1]); maxy = Math.max(maxy, d.walls[i + 1]);
  }
  P.forEach((p) => {
    minx = Math.min(minx, p[1] as number); maxx = Math.max(maxx, p[1] as number);
    miny = Math.min(miny, p[2] as number); maxy = Math.max(maxy, p[2] as number);
  });

  let t = reduced ? keyT : 0, running = false, inspect = reduced;
  let drag: { x: number; y: number; on: boolean; mouse: boolean } | null = null;
  let W = 0, H = 0, dpr = 1, sc = 1, ax = 0, ay = 0, bx0 = 0, bx1 = 0, bY = 0;
  let walls: HTMLCanvasElement | null = null;
  const X = (x: number) => ax + (x - minx) * sc;
  const Y = (y: number) => ay + (maxy - y) * sc;
  const TX = (tt: number) => bx0 + ((bx1 - bx0) * tt) / tmax;
  const at = (tt: number) => {
    let lo = 0, hi = P.length - 1;
    while (lo < hi) { const mid = (lo + hi + 1) >> 1; if ((P[mid][0] as number) <= tt) lo = mid; else hi = mid - 1; }
    return lo;
  };

  function layout() {
    const r = canvas!.getBoundingClientRect(), small = r.width < 640;
    dpr = Math.min(window.devicePixelRatio || 1, 2); W = r.width; H = r.height;
    if (!W) return;
    canvas!.width = Math.round(W * dpr); canvas!.height = Math.round(H * dpr);
    const pad = small ? 14 : 32, barH = small ? 58 : 66;
    bx0 = pad; bx1 = W - pad; bY = H - (small ? 30 : 34);
    const aw = W - 2 * pad, ah = H - barH - pad;
    sc = Math.min(aw / (maxx - minx), ah / (maxy - miny));
    ax = pad + (aw - (maxx - minx) * sc) / 2; ay = pad * 0.6 + (ah - (maxy - miny) * sc) / 2;
    walls = document.createElement('canvas'); walls.width = canvas!.width; walls.height = canvas!.height;
    const w = walls.getContext('2d')!;
    w.setTransform(dpr, 0, 0, dpr, 0, 0);
    w.fillStyle = css('--color-text-muted'); w.globalAlpha = 0.5;
    const s = Math.max(1, Math.min(1.8, sc * 0.2));
    for (let j = 0; j < d.walls.length; j += 2) w.fillRect(X(d.walls[j]) - s / 2, Y(d.walls[j + 1]) - s / 2, s, s);
    draw();
  }

  function caption(p: Pose, lost: boolean) {
    let s = 't ' + t.toFixed(1) + ' s · reported uncertainty ' + (p[3] as number).toFixed(2) + ' m';
    if (lost && p[6] !== null) s += ' · ' + (p[6] as number).toFixed(1) + ' m between true and reported position';
    if (cap!.textContent !== s) cap!.textContent = s;
  }

  function draw() {
    if (!W || !walls) return;
    const ink = css('--color-text-primary'), acc = css('--color-accent'), faint = css('--color-border'), muted = css('--color-text-muted');
    const small = W < 640, lost = t >= Z.lost_start;
    const ci = at(t), p = P[ci];
    let i: number;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
    ctx.font = (small ? 9 : 10.5) + 'px ' + MONO; ctx.textBaseline = 'alphabetic';
    ctx.drawImage(walls, 0, 0, W, H);
    // the run the robot reported, faint
    ctx.strokeStyle = ink; ctx.lineWidth = 1; ctx.globalAlpha = 0.1; ctx.beginPath();
    P.forEach((q, k) => (k ? ctx.lineTo(X(q[1] as number), Y(q[2] as number)) : ctx.moveTo(X(q[1] as number), Y(q[2] as number))));
    ctx.stroke();
    // the true path, faint, and strong up to now once the window is lost
    ctx.strokeStyle = acc; ctx.globalAlpha = 0.28; ctx.lineWidth = 1.25; ctx.beginPath();
    tp.forEach((q, k) => (k ? ctx.lineTo(X(q[1]), Y(q[2])) : ctx.moveTo(X(q[1]), Y(q[2]))));
    ctx.stroke();
    if (lost) {
      ctx.globalAlpha = 0.95; ctx.lineWidth = 1.75; ctx.beginPath();
      for (i = 0; i < tp.length && tp[i][0] <= t; i++) i ? ctx.lineTo(X(tp[i][1]), Y(tp[i][2])) : ctx.moveTo(X(tp[i][1]), Y(tp[i][2]));
      ctx.stroke();
    }
    // the trail behind the reported position
    const k0 = at(Math.max(0, t - 30)), n = ci - k0;
    ctx.strokeStyle = ink; ctx.lineWidth = 1.5;
    for (i = k0 + 1; i <= ci; i++) {
      ctx.globalAlpha = (0.75 * (i - k0)) / (n + 1);
      ctx.beginPath(); ctx.moveTo(X(P[i - 1][1] as number), Y(P[i - 1][2] as number)); ctx.lineTo(X(P[i][1] as number), Y(P[i][2] as number)); ctx.stroke();
    }
    const rx = X(p[1] as number), ry = Y(p[2] as number), both = lost && p[4] !== null;
    let tx = 0, ty = 0;
    if (both) {
      tx = X(p[4] as number); ty = Y(p[5] as number);
      ctx.globalAlpha = 0.7; ctx.strokeStyle = ink; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(rx, ry); ctx.stroke();
      ctx.globalAlpha = 1; ctx.fillStyle = acc; ctx.beginPath(); ctx.arc(tx, ty, small ? 3 : 4, 0, 6.2832); ctx.fill();
    }
    ctx.globalAlpha = 1; ctx.strokeStyle = ink; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(rx, ry, (p[3] as number) * sc, 0, 6.2832); ctx.stroke();
    ctx.fillStyle = ink; ctx.beginPath(); ctx.arc(rx, ry, small ? 2.2 : 2.8, 0, 6.2832); ctx.fill();
    for (const extra of extras) extra(ctx, { t, pose: p, both, rx, ry, tx, ty, small, W, ink, ground: css('--color-bg-primary') });
    // the time bar: detector events, the three zones, the playhead
    ctx.fillStyle = ink; ctx.globalAlpha = 0.5;
    d.events.forEach((e) => ctx.fillRect(Math.round(TX(e[0])) - 0.5, bY - 12, 1, 12));
    ctx.globalAlpha = 1; ctx.fillStyle = faint; ctx.fillRect(bx0, bY, bx1 - bx0, 1);
    const zs: [number, number, string, number][] = [[0, Z.healthy_end, 'healthy', 0.18], [Z.healthy_end, Z.lost_start, 'no ground truth', 0.07], [Z.lost_start, Z.lost_end, 'lost window', 0]];
    zs.forEach((z, k) => {
      const a = TX(z[0]), b = TX(z[1]);
      ctx.globalAlpha = 1;
      if (k === 2) { ctx.fillStyle = acc; ctx.globalAlpha = 0.85; } else { ctx.fillStyle = ink; ctx.globalAlpha = z[3]; }
      ctx.fillRect(a, bY + 5, b - a - 2, 4);
      ctx.globalAlpha = k === 2 ? 1 : 0.75; ctx.fillStyle = k === 2 ? acc : muted;
      ctx.fillText(z[2], a, bY + 22);
    });
    ctx.globalAlpha = 1; ctx.fillStyle = ink; ctx.fillRect(Math.round(TX(t)) - 0.5, bY - 16, 1.5, 28);
    ctx.globalAlpha = 1;
    caption(p, lost);
  }

  const timeAt = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect();
    return Math.max(0, Math.min(tmax, ((e.clientX - r.left - bx0) / (bx1 - bx0)) * tmax));
  };
  const replay = () => { if (reduced) return; t = 0; inspect = false; running = true; draw(); };
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
      t = Math.max(0, Math.min(tmax, t + (e.key === 'ArrowRight' ? 4 : -4))); draw();
    } else return;
    e.preventDefault();
  });
  new ResizeObserver(layout).observe(canvas);
  new MutationObserver(layout).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
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
      const nxt = t + dt * (tmax / 40);
      if (nxt >= keyT) { t = keyT; running = false; } else t = nxt;
      draw();
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
