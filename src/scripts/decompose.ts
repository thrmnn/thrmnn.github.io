// Decompose-on-hover: an element marked [data-decompose] dissolves into a
// vibrating point cloud under the pointer and reassembles on leave. Glyphs
// are sampled per character (Range rects + offscreen fillText), so wrapped
// lines and letter-spacing survive. Display typography only — body text and
// images never get this. Fine-pointer + motion-OK only.
import { EXCITE_T_SCALE, EXCITE_RGB } from './excite';

const MAX_POINTS = 1400;
const CURSOR_R = 90;

interface Pt {
  ox: number;
  oy: number;
  sx: number; // scatter direction
  sy: number;
  phase: number;
  cat: number;
}

interface Active {
  el: HTMLElement;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  pts: Pt[];
  w: number;
  h: number;
  p: number; // 0 assembled … 1 dissolved
  hovering: boolean;
  raf: number;
  last: number;
  px: number;
  py: number;
  prevColor: string;
}

function isDark(): boolean {
  const attr = document.documentElement.getAttribute('data-theme');
  if (attr === 'dark') return true;
  if (attr === 'light') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function samplePoints(el: HTMLElement): { pts: Pt[]; w: number; h: number } | null {
  const elRect = el.getBoundingClientRect();
  const w = Math.ceil(elRect.width);
  const h = Math.ceil(elRect.height);
  if (!w || !h) return null;

  const cs = getComputedStyle(el);
  const fontPx = parseFloat(cs.fontSize);
  const off = document.createElement('canvas');
  off.width = w;
  off.height = h;
  const octx = off.getContext('2d', { willReadFrequently: true });
  if (!octx) return null;
  octx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
  octx.textBaseline = 'bottom';
  octx.fillStyle = '#fff';

  // Per-character rects survive wrapping and tracking exactly.
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const range = document.createRange();
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const text = node.textContent || '';
    for (let i = 0; i < text.length; i++) {
      if (text[i] === ' ' || text[i] === '\n') continue;
      range.setStart(node, i);
      range.setEnd(node, i + 1);
      const r = range.getBoundingClientRect();
      if (!r.width) continue;
      octx.fillText(text[i]!, r.left - elRect.left, r.bottom - elRect.top);
    }
  }

  let step = Math.max(3, Math.round(fontPx / 11));
  for (;;) {
    const data = octx.getImageData(0, 0, w, h).data;
    const pts: Pt[] = [];
    for (let y = 0; y < h; y += step) {
      for (let x = 0; x < w; x += step) {
        if (data[(y * w + x) * 4 + 3]! > 100) {
          const a = Math.random() * Math.PI * 2;
          const roll = Math.random() * 100;
          pts.push({
            ox: x,
            oy: y,
            sx: Math.cos(a),
            sy: Math.sin(a),
            phase: Math.random() * Math.PI * 2,
            cat: roll < 80 ? 0 : roll < 93 ? 1 : 2,
          });
        }
      }
    }
    if (pts.length <= MAX_POINTS || step > 12) return { pts, w, h };
    step += 1;
  }
}

export function initDecompose() {
  const fine = window.matchMedia('(pointer: fine) and (hover: hover)');
  const motion = window.matchMedia('(prefers-reduced-motion: no-preference)');
  if (!fine.matches || !motion.matches) return;

  const actives = new Map<HTMLElement, Active>();

  const frame = (a: Active, now: number) => {
    const dt = Math.min(now - a.last, 64);
    a.last = now;
    const target = a.hovering ? 1 : 0;
    const tau = a.hovering ? 160 : 260;
    a.p += (target - a.p) * (1 - Math.exp(-dt / tau));

    if (!a.hovering && a.p < 0.02) {
      a.canvas.remove();
      a.el.style.color = a.prevColor;
      actives.delete(a.el);
      return;
    }

    const rect = a.el.getBoundingClientRect();
    a.canvas.style.transform = `translate(${rect.left}px, ${rect.top}px)`;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (a.canvas.width !== a.w * dpr) {
      a.canvas.width = a.w * dpr;
      a.canvas.height = a.h * dpr;
    }
    a.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    a.ctx.clearRect(0, 0, a.w, a.h);

    const t = now * EXCITE_T_SCALE;
    const rgb = EXCITE_RGB[isDark() ? 'dark' : 'light'];
    const lx = a.px - rect.left;
    const ly = a.py - rect.top;
    for (const pt of a.pts) {
      const dx = pt.ox - lx;
      const dy = pt.oy - ly;
      const d = Math.sqrt(dx * dx + dy * dy);
      const near = d < CURSOR_R ? (1 - d / CURSOR_R) ** 2 : 0;
      const scatter = a.p * (2.2 + near * 9);
      const jx = Math.sin(t + pt.phase) * 1.2 * a.p;
      const jy = Math.cos(t * 1.13 + pt.phase * 1.7) * 1.2 * a.p;
      const x = pt.ox + pt.sx * scatter + jx;
      const y = pt.oy + pt.sy * scatter + jy;
      a.ctx.globalAlpha = 0.7 + near * 0.3;
      a.ctx.fillStyle = `rgb(${rgb[pt.cat]})`;
      const size = 1.9 + near * 0.9;
      a.ctx.fillRect(x, y, size, size);
    }
    a.ctx.globalAlpha = 1;
    a.raf = requestAnimationFrame((n) => frame(a, n));
  };

  const enter = (el: HTMLElement, e: PointerEvent) => {
    let a = actives.get(el);
    if (!a) {
      const sampled = samplePoints(el);
      if (!sampled || sampled.pts.length < 20) return;
      const canvas = document.createElement('canvas');
      canvas.style.cssText =
        'position:fixed;left:0;top:0;pointer-events:none;z-index:5;';
      canvas.style.width = `${sampled.w}px`;
      canvas.style.height = `${sampled.h}px`;
      canvas.setAttribute('aria-hidden', 'true');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      document.body.appendChild(canvas);
      a = {
        el,
        canvas,
        ctx,
        pts: sampled.pts,
        w: sampled.w,
        h: sampled.h,
        p: 0,
        hovering: true,
        raf: 0,
        last: performance.now(),
        px: e.clientX,
        py: e.clientY,
        prevColor: el.style.color,
      };
      actives.set(el, a);
      el.style.color = 'transparent';
      a.raf = requestAnimationFrame((n) => frame(a!, n));
    } else {
      a.hovering = true;
    }
  };

  for (const el of document.querySelectorAll<HTMLElement>('[data-decompose]')) {
    el.addEventListener('pointerenter', (e) => enter(el, e as PointerEvent));
    el.addEventListener('pointermove', (e) => {
      const a = actives.get(el);
      if (a) {
        a.px = (e as PointerEvent).clientX;
        a.py = (e as PointerEvent).clientY;
      }
    }, { passive: true });
    el.addEventListener('pointerleave', () => {
      const a = actives.get(el);
      if (a) a.hovering = false;
    });
  }
}
