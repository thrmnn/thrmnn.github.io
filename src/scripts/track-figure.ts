// A canvas drawn from the tracked people of one sequence: a dot per person, a short trail behind it.
// Time loops; moving across the figure sets the frame (mouse hover, touch drag; pan-y keeps vertical scroll).
const TRAIL = 45;

export async function initTrackFigure() {
  const canvas = document.querySelector<HTMLCanvasElement>('canvas[data-track-figure]');
  const cap = document.querySelector<HTMLElement>('[data-track-caption]');
  if (!canvas || !cap) return;
  const d = (await (await fetch(canvas.dataset.src!)).json()) as { w: number; h: number; frames: number; runs: number[][] };
  const ctx = canvas.getContext('2d')!;

  const runs = d.runs.map((r) => {
    const pts: number[] = [r[1], r[2]];
    for (let i = 3; i < r.length; i += 2) pts.push(pts[pts.length - 2] + r[i], pts[pts.length - 1] + r[i + 1]);
    return { f0: r[0], pts, n: pts.length / 2 };
  });
  const at = (frame: number) => runs.filter((r) => frame >= r.f0 && frame < r.f0 + r.n);
  let peak = 1, peakCount = 0;
  for (let f = 1; f <= d.frames; f++) { const c = at(f).length; if (c > peakCount) { peakCount = c; peak = f; } }

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let frame = reduced ? peak : 1;
  let held = false;
  let dpr = 1, W = 0, H = 0;

  const css = (n: string) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  const px = (x: number) => (x / d.w) * W;
  const py = (y: number) => (y / d.h) * H;

  function draw() {
    const ink = css('--color-text-primary'), accent = css('--color-accent'), faint = css('--color-border');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = faint;
    const step = W / 48;
    for (let x = step / 2; x < W; x += step) for (let y = step / 2; y < H; y += step) ctx.fillRect(x - 0.5, y - 0.5, 1, 1);
    const live = at(Math.round(frame));
    const f = Math.round(frame);
    ctx.lineWidth = 1;
    ctx.strokeStyle = ink;
    for (const r of live) {
      const i = f - r.f0, from = Math.max(0, i - TRAIL);
      ctx.globalAlpha = 0.55;
      ctx.beginPath();
      for (let k = from; k <= i; k++) {
        const x = px(r.pts[2 * k]), y = py(r.pts[2 * k + 1]);
        k === from ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = accent;
    const rad = Math.max(2, W / 260);
    for (const r of live) {
      const i = f - r.f0;
      ctx.beginPath();
      ctx.arc(px(r.pts[2 * i]), py(r.pts[2 * i + 1]), rad, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = faint;
    ctx.fillRect(0, H - 2, W, 1);
    ctx.fillStyle = accent;
    ctx.fillRect((frame / d.frames) * W - 1, H - 5, 2, 5);
    const label = `MOT17-04 · frame ${String(f).padStart(3, '0')} / ${d.frames} · ${live.length} people tracked`;
    if (cap!.textContent !== label) cap!.textContent = label;
  }

  function size() {
    const r = canvas!.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = r.width; H = r.height;
    canvas!.width = Math.round(W * dpr); canvas!.height = Math.round(H * dpr);
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
