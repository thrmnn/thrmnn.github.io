// Real Vidigal-DTM point cloud renderer for the home hero.
// 3000 points loaded from /data/vidigal-rooftops.bin (int8 x, int8 y, uint8 z).
// Auto-rotates slowly; drag/touch scrubs rotation. IO + tab-hidden gated.
// prefers-reduced-motion users get a still iso view (no rotation).

type Point = { x: number; y: number; z: number; cat: number };

interface Scrubber {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  points: Point[];
  rotation: number;
  autoRotate: boolean;
  dragging: boolean;
  lastX: number;
  visible: boolean;
  rafId: number;
}

async function loadPoints(url: string): Promise<Point[]> {
  const buf = await fetch(url).then((r) => r.arrayBuffer());
  const view = new DataView(buf);
  const stride = 4; // v2: int8 x, int8 y, uint8 z, uint8 cat
  const n = buf.byteLength / stride;
  const out: Point[] = new Array(n);
  for (let i = 0; i < n; i++) {
    const o = i * stride;
    out[i] = {
      x: view.getInt8(o) / 127,
      y: view.getInt8(o + 1) / 127,
      z: view.getUint8(o + 2) / 255,
      cat: view.getUint8(o + 3),
    };
  }
  return out;
}

function render(s: Scrubber) {
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

  const screen: Array<{ sx: number; sy: number; depth: number; h: number; cat: number }> = new Array(s.points.length);
  for (let i = 0; i < s.points.length; i++) {
    const p = s.points[i];
    const rx = p.x * cosR - p.y * sinR;
    const rz = p.x * sinR + p.y * cosR;
    const sy = p.z * cosT - rz * sinT;
    const depth = p.z * sinT + rz * cosT;
    screen[i] = { sx: cx + rx * scale, sy: cy - sy * scale * 0.7, depth, h: p.z, cat: p.cat };
  }
  screen.sort((a, b) => a.depth - b.depth);

  for (let i = 0; i < screen.length; i++) {
    const pt = screen[i];
    const tDepth = (pt.depth + 1) * 0.5; // [0,1]
    if (pt.cat === 1) {
      // Building voxel — warm accent, slightly brighter, larger dot so structure reads.
      const alpha = 0.45 + tDepth * 0.5;
      const r = 255;
      const g = 210 + Math.round(pt.h * 30);
      const b = 130 - Math.round(pt.h * 30);
      s.ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
      s.ctx.fillRect(pt.sx, pt.sy, 1.9, 1.9);
    } else {
      // Terrain — cool blue, faded; lets the buildings sit on top visually.
      const alpha = 0.16 + tDepth * 0.45;
      const r = 59 + Math.round(pt.h * 60);
      const g = 130 + Math.round(pt.h * 80);
      const b = 246 - Math.round(pt.h * 30);
      s.ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
      s.ctx.fillRect(pt.sx, pt.sy, 1.4, 1.4);
    }
  }
}

function attachInteraction(s: Scrubber) {
  const onDown = (e: PointerEvent) => {
    s.dragging = true;
    s.lastX = e.clientX;
    s.canvas.setPointerCapture(e.pointerId);
    s.canvas.classList.add('is-dragging');
  };
  const onMove = (e: PointerEvent) => {
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
  s.canvas.addEventListener('pointerdown', onDown);
  s.canvas.addEventListener('pointermove', onMove);
  s.canvas.addEventListener('pointerup', onUp);
  s.canvas.addEventListener('pointercancel', onUp);
}

export async function initFavelaScrubber(canvas: HTMLCanvasElement, dataUrl = '/data/vidigal-rooftops.bin') {
  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return;

  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let points: Point[];
  try {
    points = await loadPoints(dataUrl);
  } catch {
    return;
  }

  const s: Scrubber = {
    canvas,
    ctx,
    points,
    rotation: 0.35,
    autoRotate: !reduceMotion.matches,
    dragging: false,
    lastX: 0,
    visible: true,
    rafId: 0,
  };

  reduceMotion.addEventListener?.('change', (e) => {
    s.autoRotate = !e.matches;
  });

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
      render(s);
    }
    s.rafId = requestAnimationFrame(tick);
  };
  s.rafId = requestAnimationFrame(tick);
}
