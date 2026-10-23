// The hero-to-corner hand-off (owner locks L-3 and L-6): one object, never two.
// Past half the hero the Vidigal plate leaves the hero, shrinks and lands on
// Rio in the corner map in 0.6 s; back near the top it flies home. Scroll is
// read, never drives (ruling15 principle 3): one hysteresis boolean decides,
// a time-based tween moves. Rects are read only while a flight is running.

const DURATION = 600;
const LEAVE_AT = 0.5; // of the hero's height
const RETURN_AT = 0.25;
const DOT = 8; // px, the landed size: the plate becomes the dot

const ease = (t: number) => 1 - Math.pow(1 - t, 3);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export function initHandoff(strip: HTMLElement) {
  const plate = document.querySelector<HTMLElement>('[data-handoff-plate]');
  const hero = document.getElementById('home');
  const dot = strip.querySelector<HTMLElement>('[data-dot="rio"]');
  if (!plate || !hero || !dot) return;
  if (!window.matchMedia('(prefers-reduced-motion: no-preference)').matches) return;

  const img = plate.querySelector('img');
  if (!img) return;
  const flyer = document.createElement('div');
  flyer.className = 'handoff-flyer';
  flyer.setAttribute('aria-hidden', 'true');
  flyer.append(img.cloneNode(true));
  document.body.append(flyer);

  let heroH = hero.offsetHeight;
  addEventListener('resize', () => { heroH = hero.offsetHeight; }, { passive: true });

  let past = false;
  let raf = 0;
  let running = false;
  // Where the flyer is right now, so a reversed flight starts from there.
  let at = { x: 0, y: 0, w: 0, h: 0 };

  const place = (r: { x: number; y: number; w: number; h: number }, opacity: number) => {
    at = r;
    flyer.style.width = `${r.w}px`;
    flyer.style.height = `${r.h}px`;
    flyer.style.transform = `translate3d(${r.x.toFixed(1)}px, ${r.y.toFixed(1)}px, 0)`;
    flyer.style.opacity = String(opacity);
  };
  const plateRect = () => {
    const r = plate.getBoundingClientRect();
    return { x: r.left, y: r.top, w: r.width, h: r.height };
  };
  const dotRect = (aspect: number) => {
    const r = dot.getBoundingClientRect();
    const w = DOT, h = DOT / aspect;
    return { x: r.left + r.width / 2 - w / 2, y: r.top + r.height / 2 - h / 2, w, h };
  };

  const fly = (out: boolean, from: typeof at | null) => {
    cancelAnimationFrame(raf);
    strip.classList.remove('is-landed');
    const start = from ?? plateRect();
    const aspect = start.w / start.h || 1.6;
    plate.classList.add('is-away');
    running = true;
    const t0 = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - t0) / DURATION);
      const e = ease(t);
      // Both ends are read every frame: the page keeps scrolling under a flight.
      const a = out ? (from ?? plateRect()) : from!;
      const b = out ? dotRect(aspect) : plateRect();
      const fade = out ? (t < 0.8 ? 1 : 1 - (t - 0.8) / 0.2) : 1;
      place({ x: lerp(a.x, b.x, e), y: lerp(a.y, b.y, e), w: lerp(a.w, b.w, e), h: lerp(a.h, b.h, e) }, fade);
      if (t < 1) { raf = requestAnimationFrame(step); return; }
      running = false;
      if (out) {
        flyer.style.opacity = '0';
        if (strip.dataset.state === 'full') strip.classList.add('is-landed');
      } else {
        plate.classList.remove('is-away');
        flyer.style.opacity = '0';
      }
    };
    raf = requestAnimationFrame(step);
  };

  const onScroll = () => {
    const y = window.scrollY;
    if (!past && y > heroH * LEAVE_AT) {
      past = true;
      fly(true, running ? at : null);
    } else if (past && y < heroH * RETURN_AT) {
      past = false;
      // From the dot if the plate had landed, from mid-air if it had not.
      const from = flyer.style.opacity === '0' ? dotRect(at.w / at.h || 1.6) : at;
      flyer.style.opacity = '1';
      fly(false, from);
    }
  };

  // A page restored mid-scroll starts in the settled state, without a flight.
  if (window.scrollY > heroH * LEAVE_AT) {
    past = true;
    plate.classList.add('is-away');
  }
  addEventListener('scroll', onScroll, { passive: true });
}
