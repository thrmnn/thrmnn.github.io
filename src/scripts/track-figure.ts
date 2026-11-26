// The filmed street of MOT17-04 redrawn as dots, with the pipeline's boxes and paths on top.
// The browser never receives a filmed frame, only a coarse brightness grid (scripts/make-film-grid.py).
// Time loops; moving across the figure sets the frame (mouse hover, touch drag; pan-y keeps vertical scroll).
const TRAIL = 45;

export async function initTrackFigure() {
  const canvas = document.querySelector<HTMLCanvasElement>('canvas[data-track-figure]');
  const count = document.querySelector<HTMLElement>('[data-track-count]');
  if (!canvas || !count) return;
  const [d, buf] = (await Promise.all([
    fetch(canvas.dataset.src!).then((r) => r.json()),
    fetch(canvas.dataset.grid!).then((r) => r.arrayBuffer()),
  ])) as [{ w: number; h: number; frames: number; runs: number[][] }, ArrayBuffer];
  const ctx = canvas.getContext('2d')!;

  const runs = d.runs.map((r) => {
    const pts: number[] = r.slice(2, 6);
    for (let i = 6; i < r.length; i += 4) for (let k = 0; k < 4; k++) pts.push(pts[pts.length - 4] + r[i + k]);
    return { id: r[0], f0: r[1], pts, n: pts.length / 4 };
  });
  const at = (frame: number) => runs.filter((r) => frame >= r.f0 && frame < r.f0 + r.n);
  let peak = 1, peakCount = 0;
  for (let f = 1; f <= d.frames; f++) { const c = at(f).length; if (c > peakCount) { peakCount = c; peak = f; } }

  // Header: cols, rows, stored frames, pitch, frame step (uint16 LE); then two 4-bit cells per byte, high nibble first.
  const [cols, rows, stored, pitch, step] = new Uint16Array(buf, 0, 5);
  const packed = new Uint8Array(buf, 10);
  const cells = new Uint8Array(packed.length * 2);
  for (let i = 0; i < packed.length; i++) { cells[2 * i] = (packed[i] >> 4) * 17; cells[2 * i + 1] = (packed[i] & 15) * 17; }
  const n = cols * rows;
  // tone range: 2nd to 99.5th percentile of the whole sequence
  const hist = new Uint32Array(256);
  for (let i = 0; i < cells.length; i++) hist[cells[i]]++;
  let lo = 255, hi = 0, acc = 0;
  for (let i = 0; i < 256; i++) { acc += hist[i]; if (acc < cells.length * 0.02) lo = i; if (acc < cells.length * 0.995) hi = i; }
  hi = Math.max(hi, lo + 1);
  // the street as it is when nobody stands there: each cell's median over the sequence
  const bg = new Uint8Array(n), cnt = new Uint16Array(256);
  for (let c = 0; c < n; c++) {
    cnt.fill(0);
    for (let f = 0; f < stored; f++) cnt[cells[f * n + c]]++;
    let v = 0;
    for (acc = 0; v < 256; v++) { acc += cnt[v]; if (acc * 2 >= stored) break; }
    bg[c] = v;
  }

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let frame = reduced ? peak : 1;
  let held = false;
  let dpr = 1, W = 0, H = 0, drawn = '';

  const css = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

  // Ink is the page's text colour on both grounds. Dark page: ink size follows brightness (light on night).
  // Light page: it follows darkness, as in a printed halftone, so lamps and the white car stay paper and the street is not a dark tile.
  const tone = (b: number, inv: boolean) => {
    let t = (b - lo) / (hi - lo);
    t = t <= 0 ? 0 : t >= 1 ? 1 : t;
    return Math.pow(inv ? 1 - t : t, 1.25);
  };
  // whatever differs from the cell's median over the sequence (people, whatever the clothes) is drawn heavier
  const val = (i: number, c: number, inv: boolean) => {
    const b = cells[i], dd = Math.abs(b - bg[c]), fg = dd <= 10 ? 0 : dd >= 50 ? 1 : (dd - 10) / 40;
    return Math.min(1, 0.5 * tone(b, inv) + 0.9 * fg);
  };
  const isLight = (ground: string) => {
    if (ground[0] !== '#') return false;
    const v = parseInt(ground.slice(1), 16);
    return (v >> 16) * 0.3 + ((v >> 8) & 255) * 0.59 + (v & 255) * 0.11 > 127;
  };

  function draw() {
    if (!W) return;
    const f = Math.round(frame);
    const ink = css('--color-text-primary'), accent = css('--color-accent'), ground = css('--color-bg-primary');
    const key = `${f}|${ink}|${accent}|${ground}|${W}x${H}`;
    if (key === drawn) return;
    drawn = key;

    ctx.fillStyle = ground;
    const inv = isLight(ctx.fillStyle);
    const zs = Math.max(W / d.w, H / d.h), ox = (W - d.w * zs) / 2, oy = (H - d.h * zs) / 2;
    const cw = pitch * zs, base0 = Math.floor((f - 1) / step) * n;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = ink;
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    const rmax = cw * 0.5;
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const r = rmax * Math.sqrt(val(base0 + y * cols + x, y * cols + x, inv));
      if (r < 0.35) continue;
      const cx = ox + (x + 0.5) * cw, cy = oy + (y + 0.5) * cw;
      ctx.moveTo(cx + r, cy);
      ctx.arc(cx, cy, r, 0, 6.2832);
    }
    ctx.fill();

    const live = at(f);
    const px = (v: number) => ox + v * zs, py = (v: number) => oy + v * zs;
    ctx.strokeStyle = accent;
    ctx.lineWidth = 1.25;
    for (const r of live) {
      const i = f - r.f0, from = Math.max(0, i - TRAIL);
      for (let k = from + 1; k <= i; k++) {
        ctx.globalAlpha = 0.95 * ((k - from) / (i - from + 1));
        ctx.beginPath();
        ctx.moveTo(px(r.pts[4 * (k - 1)]), py(r.pts[4 * (k - 1) + 1]));
        ctx.lineTo(px(r.pts[4 * k]), py(r.pts[4 * k + 1]));
        ctx.stroke();
      }
    }
    const numbers = W >= 640, fs = Math.max(9, W / 120);
    if (numbers) { ctx.font = `${fs}px 'DM Mono', ui-monospace, monospace`; ctx.textBaseline = 'bottom'; }
    ctx.lineWidth = 1.5;
    for (const r of live) {
      const i = f - r.f0;
      const x0 = px(r.pts[4 * i]), y0 = py(r.pts[4 * i + 1]), bw = r.pts[4 * i + 2] * 2 * zs, bh = r.pts[4 * i + 3] * 2 * zs;
      const l = Math.max(3, Math.min(10, Math.min(bw, bh) * 0.22)), L = x0 - bw / 2, R = x0 + bw / 2, T = y0 - bh, B = y0;
      ctx.globalAlpha = 1;
      ctx.beginPath();
      ctx.moveTo(L, T + l); ctx.lineTo(L, T); ctx.lineTo(L + l, T);
      ctx.moveTo(R - l, T); ctx.lineTo(R, T); ctx.lineTo(R, T + l);
      ctx.moveTo(L, B - l); ctx.lineTo(L, B); ctx.lineTo(L + l, B);
      ctx.moveTo(R - l, B); ctx.lineTo(R, B); ctx.lineTo(R, B - l);
      ctx.stroke();
      if (numbers) {
        const s = String(r.id), tw = ctx.measureText(s).width;
        ctx.globalAlpha = 0.85; ctx.fillStyle = ground; ctx.fillRect(R + 2, T + 1, tw + 4, fs + 2);
        ctx.globalAlpha = 1; ctx.fillStyle = accent; ctx.fillText(s, R + 4, T + 11);
      }
    }
    ctx.globalAlpha = 1;
    const label = `${live.length} people tracked`;
    if (count!.textContent !== label) count!.textContent = label;
  }

  function size() {
    const r = canvas!.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = r.width; H = r.height;
    canvas!.width = Math.round(W * dpr); canvas!.height = Math.round(H * dpr);
    drawn = '';
    draw();
  }
  new ResizeObserver(size).observe(canvas);
  new MutationObserver(draw).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', draw);

  const scrub = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
    frame = 1 + x * (d.frames - 1);
    held = true;
    draw();
  };
  canvas.addEventListener('pointermove', scrub);
  canvas.addEventListener('pointerdown', (e) => { canvas.setPointerCapture(e.pointerId); scrub(e); });
  const release = () => { held = false; };
  canvas.addEventListener('pointerleave', release);
  canvas.addEventListener('pointercancel', release);
  canvas.addEventListener('pointerup', (e) => { if (e.pointerType !== 'mouse') release(); });

  if (reduced) return;
  let visible = true, last = performance.now();
  new IntersectionObserver((es) => { visible = es[0].isIntersecting; }).observe(canvas);
  const tick = (now: number) => {
    if (visible && !held && !document.hidden) {
      frame += ((now - last) / 1000) * 30;
      if (frame > d.frames) frame = 1;
      draw();
    }
    last = now;
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
