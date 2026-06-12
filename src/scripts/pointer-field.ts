// Site-wide pointer field — "latent lattice".
// An invisible document-anchored sampling grid under the whole page. At rest
// the page is pixel-identical to a page without it; dots within 120px of a
// fine pointer materialize, vibrate with the hero's exact jitter math and
// palette, and decay to nothing. Fine-pointer + motion-OK only; the render
// loop fully self-terminates when the field is dark.
import { EXCITE_T_SCALE, EXCITE_AMP, EXCITE_RGB } from './excite';

const GRID = 40; // px lattice spacing (document space)
const R = 120; // excite radius (sparser lattice than the hero → wider reach)
const CAP = 120; // live-node hard cap
const A_PEAK_LIGHT = 0.55;
const A_PEAK_DARK = 0.5;
const TAU_ATTACK = 100;
const TAU_RELEASE = 350;

interface Node {
  col: number;
  row: number;
  a: number;
  target: number;
}

function hash(col: number, row: number): number {
  let h = (Math.imul(col, 73856093) ^ Math.imul(row, 19349663)) >>> 0;
  h = Math.imul(h ^ (h >>> 16), 0x45d9f3b) >>> 0;
  return (h ^= h >>> 16) >>> 0;
}

function isDark(): boolean {
  const attr = document.documentElement.getAttribute('data-theme');
  if (attr === 'dark') return true;
  if (attr === 'light') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function initPointerField() {
  const fine = window.matchMedia('(pointer: fine) and (hover: hover)');
  const motion = window.matchMedia('(prefers-reduced-motion: no-preference)');
  if (!fine.matches) return; // phones/tablets: one matchMedia eval, nothing else

  let canvas: HTMLCanvasElement | null = null;
  let ctx: CanvasRenderingContext2D | null = null;
  let running = false;
  let rafId = 0;
  let dark = isDark();
  // pointer in viewport space; converted to document space per frame
  let pvx = -1e4;
  let pvy = -1e4;
  let hasPointer = false;
  let buttonHeld = false;
  let lastMove = 0;
  let lastFrame = 0;
  // previous frame's drawn bounds (CSS px, viewport space)
  let bx0 = 0, by0 = 0, bx1 = -1, by1 = -1;
  const live = new Map<number, Node>();

  const teardownFns: Array<() => void> = [];
  const on = <K extends keyof WindowEventMap>(
    target: Window | Document,
    ev: string,
    fn: (e: any) => void,
    opts?: AddEventListenerOptions,
  ) => {
    target.addEventListener(ev, fn, opts);
    teardownFns.push(() => target.removeEventListener(ev, fn));
  };

  const setup = () => {
    if (canvas) return;
    canvas = document.createElement('canvas');
    // Invariant: html paints the page background (global.css); body must never
    // gain an opaque background or a stacking context (transform/filter/etc.)
    // or this z-index:-1 layer silently disappears or pops above content.
    canvas.style.cssText = 'position:fixed;inset:0;z-index:-1;pointer-events:none;';
    canvas.setAttribute('aria-hidden', 'true');
    document.body.appendChild(canvas);
    ctx = canvas.getContext('2d', { alpha: true });
    resize();
  };

  const resize = () => {
    if (!canvas || !ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(window.innerWidth * dpr);
    canvas.height = Math.round(window.innerHeight * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    bx1 = -1; // bounds invalid after a clear-by-resize
  };

  const clearPrev = () => {
    if (!ctx || bx1 < bx0) return;
    ctx.clearRect(bx0 - 6, by0 - 6, bx1 - bx0 + 12, by1 - by0 + 12);
    bx1 = -1;
  };

  const frame = (now: number) => {
    if (!ctx) {
      running = false;
      return;
    }
    const dt = Math.min(now - lastFrame, 64);
    lastFrame = now;
    clearPrev();

    // (1) set targets for lattice cells around the cursor
    const aPeak = dark ? A_PEAK_DARK : A_PEAK_LIGHT;
    if (hasPointer && !buttonHeld) {
      const pdx = pvx + window.scrollX;
      const pdy = pvy + window.scrollY;
      const c0 = Math.floor((pdx - R - 13) / GRID);
      const c1 = Math.ceil((pdx + R + 13) / GRID);
      const r0 = Math.floor((pdy - R - 13) / GRID);
      const r1 = Math.ceil((pdy + R + 13) / GRID);
      for (let row = r0; row <= r1; row++) {
        for (let col = c0; col <= c1; col++) {
          const h = hash(col, row);
          const nx = col * GRID + (((h & 1023) / 1023 - 0.5) * 20);
          const ny = row * GRID + ((((h >>> 10) & 1023) / 1023 - 0.5) * 20);
          const dx = nx - pdx;
          const dy = ny - pdy;
          const d = Math.sqrt(dx * dx + dy * dy);
          const key = row * 65536 + col;
          const node = live.get(key);
          if (d < R) {
            const f = (1 - d / R) ** 2;
            if (node) node.target = f * aPeak;
            else if (live.size < CAP) live.set(key, { col, row, a: 0, target: f * aPeak });
          } else if (node) {
            node.target = 0;
          }
        }
      }
    } else {
      for (const node of live.values()) node.target = 0;
    }

    // (2) ease alphas, (3) draw, tracking bounds
    const t = now * EXCITE_T_SCALE;
    const rgb = EXCITE_RGB[dark ? 'dark' : 'light'];
    let minX = 1e9, minY = 1e9, maxX = -1e9, maxY = -1e9;
    for (const [key, node] of live) {
      const tau = node.target > node.a ? TAU_ATTACK : TAU_RELEASE;
      node.a += (node.target - node.a) * (1 - Math.exp(-dt / tau));
      if (node.a < 0.02 && node.target === 0) {
        live.delete(key);
        continue;
      }
      const h = hash(node.col, node.row);
      const nx = node.col * GRID + (((h & 1023) / 1023 - 0.5) * 20) - window.scrollX;
      const ny = node.row * GRID + ((((h >>> 10) & 1023) / 1023 - 0.5) * 20) - window.scrollY;
      const phase = (((h >>> 20) & 1023) / 1023) * Math.PI * 2;
      const roll = h % 100;
      const cat = roll < 88 ? 0 : roll < 95 ? 1 : 2;
      const aPk = dark ? A_PEAK_DARK : A_PEAK_LIGHT;
      const f = node.a / aPk;
      const jx = Math.sin(t + phase) * EXCITE_AMP * f;
      const jy = Math.cos(t * 1.13 + phase * 1.7) * EXCITE_AMP * f;
      const size = 1.6 + f * 1.0;
      const x = nx + jx;
      const y = ny + jy;
      ctx.globalAlpha = node.a;
      ctx.fillStyle = `rgb(${rgb[cat]})`;
      ctx.fillRect(x, y, size, size);
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x + size > maxX) maxX = x + size;
      if (y + size > maxY) maxY = y + size;
    }
    ctx.globalAlpha = 1;
    if (maxX >= minX) {
      bx0 = minX; by0 = minY; bx1 = maxX; by1 = maxY;
    }

    // (5) self-terminate when dark and idle
    if (live.size === 0 && now - lastMove > 100) {
      clearPrev();
      running = false;
      return;
    }
    rafId = requestAnimationFrame(frame);
  };

  const wake = () => {
    if (running || !motion.matches) return;
    setup();
    running = true;
    lastFrame = performance.now();
    rafId = requestAnimationFrame(frame);
  };

  const sleep = () => {
    for (const node of live.values()) node.target = 0;
  };

  on(document, 'pointermove', (e: PointerEvent) => {
    if (e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
    pvx = e.clientX;
    pvy = e.clientY;
    hasPointer = true;
    lastMove = performance.now();
    wake();
  }, { passive: true });
  on(document, 'pointerdown', () => (buttonHeld = true), { passive: true });
  on(document, 'pointerup', () => (buttonHeld = false), { passive: true });
  on(document, 'pointerleave', () => {
    hasPointer = false;
    sleep();
  });
  on(document, 'pointercancel', () => {
    hasPointer = false;
    sleep();
  });
  on(window, 'blur', sleep);
  on(document, 'visibilitychange', () => {
    if (document.hidden) sleep();
  });
  on(window, 'scroll', () => {
    if (hasPointer) {
      lastMove = performance.now();
      wake();
    }
  }, { passive: true });

  let resizeT = 0;
  on(window, 'resize', () => {
    clearTimeout(resizeT);
    resizeT = window.setTimeout(resize, 150);
  });

  // Theme swaps — mirror the hero scrubber's pattern.
  const mo = new MutationObserver(() => (dark = isDark()));
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  teardownFns.push(() => mo.disconnect());
  const osDark = window.matchMedia('(prefers-color-scheme: dark)');
  osDark.addEventListener?.('change', () => (dark = isDark()));

  // Reduced-motion flips mid-session: tear down fully; re-init on restore.
  motion.addEventListener?.('change', (e) => {
    if (!e.matches) {
      cancelAnimationFrame(rafId);
      running = false;
      live.clear();
      canvas?.remove();
      canvas = null;
      ctx = null;
    }
  });
}
