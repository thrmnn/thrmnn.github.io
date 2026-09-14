// The avatar is the monogram as a point cloud: the letters are rasterised in
// the site's own display face, sampled into 3D points, given a little depth,
// and turned slowly. Same visual language as the Vidigal panel, and it makes
// no claim about anything, which a photograph of a person on a research page
// quietly does.
const DEPTH = 0.16;
const LAYERS = 5;
const SPIN_RAD_PER_S = 0.42;
const TILT = 0.38;
const COS_T = Math.cos(TILT);
const SIN_T = Math.sin(TILT);

interface Pt {
  x: number;
  y: number;
  z: number;
}

function samplePoints(text: string, size: number): Pt[] {
  const c = document.createElement('canvas');
  const S = 220;
  c.width = S;
  c.height = S;
  const g = c.getContext('2d', { willReadFrequently: true });
  if (!g) return [];
  g.fillStyle = '#fff';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.font = `700 ${size}px "Space Grotesk", system-ui, sans-serif`;
  g.fillText(text, S / 2, S / 2);

  const { data } = g.getImageData(0, 0, S, S);
  const pts: Pt[] = [];
  const step = 2;
  for (let y = 0; y < S; y += step) {
    for (let x = 0; x < S; x += step) {
      if (data[(y * S + x) * 4 + 3]! < 128) continue;
      const nx = (x - S / 2) / (S / 2);
      const ny = (y - S / 2) / (S / 2);
      for (let l = 0; l < LAYERS; l++) {
        pts.push({ x: nx, y: ny, z: (l / (LAYERS - 1) - 0.5) * 2 * DEPTH });
      }
    }
  }
  return pts;
}

export async function initMonogramAvatar(canvas: HTMLCanvasElement): Promise<void> {
  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return;
  const text = canvas.dataset.monogram || 'TAH';

  try {
    await (document as Document & { fonts?: FontFaceSet }).fonts?.ready;
  } catch {
    /* the fallback stack is fine if the face never resolves */
  }

  const pts = samplePoints(text, 86);
  if (!pts.length) return;

  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let accent = '#3b82f6';
  let cssW = canvas.clientWidth || 180;
  let cssH = canvas.clientHeight || 180;
  let t0 = 0;
  let rafOn = false;
  let visible = false;

  const readAccent = () => {
    accent = getComputedStyle(canvas).getPropertyValue('--color-accent').trim() || accent;
  };
  readAccent();

  function render(elapsed: number) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(1, Math.round(cssW * dpr));
    const h = Math.max(1, Math.round(cssH * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx!.clearRect(0, 0, cssW, cssH);

    const rot = reduceMotion.matches ? -0.5 : elapsed * SPIN_RAD_PER_S;
    const cosR = Math.cos(rot);
    const sinR = Math.sin(rot);
    const scale = Math.min(cssW, cssH) * 0.42;
    const cx = cssW / 2;
    const cy = cssH / 2;

    // back to front, so the near face of the letters reads solid
    const drawn = pts
      .map((p) => {
        const rz = p.x * sinR + p.z * cosR;
        return {
          sx: cx + (p.x * cosR - p.z * sinR) * scale,
          sy: cy + (p.y * COS_T - rz * SIN_T) * scale,
          d: rz,
        };
      })
      .sort((a, b) => a.d - b.d);

    for (const q of drawn) {
      const a = 0.25 + 0.6 * (q.d + 1) / 2;
      ctx!.fillStyle = accent;
      ctx!.globalAlpha = Math.max(0, Math.min(1, a));
      ctx!.fillRect(q.sx - 1, q.sy - 1, 2, 2);
    }
    ctx!.globalAlpha = 1;
  }

  function frame(now: number) {
    if (!t0) t0 = now;
    render((now - t0) / 1000);
    if (visible && !reduceMotion.matches) requestAnimationFrame(frame);
    else rafOn = false;
  }

  function kick() {
    if (rafOn || !visible) return;
    if (reduceMotion.matches) {
      render(0);
      return;
    }
    rafOn = true;
    requestAnimationFrame(frame);
  }

  new ResizeObserver(() => {
    const r = canvas.getBoundingClientRect();
    cssW = r.width || cssW;
    cssH = r.height || cssH;
    if (!rafOn) render(0);
  }).observe(canvas);

  new MutationObserver(() => {
    readAccent();
    if (!rafOn) render(0);
  }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  new IntersectionObserver(
    (entries) => {
      visible = entries[0]!.isIntersecting;
      kick();
    },
    { threshold: 0.2 },
  ).observe(canvas);
}
