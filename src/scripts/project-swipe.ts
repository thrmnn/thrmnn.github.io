// Project pages: a sideways swipe, or the left and right arrow keys, go to the neighbouring project in the
// site's order (the pager's order, passed in data-prev and data-next). A vertical drag always scrolls; a swipe is
// ignored on canvases, figures and the rail, on tables and code blocks, and inside anything that scrolls
// sideways, so the replay's scrubbing is never taken. The pager at the end of the page stays for readers without touch.
const page = document.querySelector<HTMLElement>('.pj');
const prev = page?.dataset.prev, next = page?.dataset.next;
if (page && (prev || next)) {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let leaving = false;
  const go = (href?: string) => {
    if (!href || leaving) return;
    leaving = true;
    if (reduced) { location.href = href; return; }
    document.documentElement.setAttribute('data-leaving', '');
    setTimeout(() => { location.href = href; }, 180);
  };
  const typing = (t: EventTarget | null) => {
    const e = t as HTMLElement | null;
    return !!e && (/^(INPUT|TEXTAREA|SELECT)$/.test(e.tagName) || e.isContentEditable);
  };
  const swipeOk = (t: EventTarget | null) => {
    for (let n = t as HTMLElement | null; n && n !== document.body; n = n.parentElement) {
      if (/^(CANVAS|FIGURE|PRE|TABLE)$/.test(n.tagName) || n.classList.contains('pj-rail')) return false;
      if (n.scrollWidth > n.clientWidth + 2 && /(auto|scroll)/.test(getComputedStyle(n).overflowX)) return false;
    }
    return true;
  };
  document.addEventListener('keydown', (e) => {
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey || typing(e.target)) return;
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    const href = e.key === 'ArrowRight' ? next : prev;
    if (href) { e.preventDefault(); go(href); }
  });
  let sx: number | null = null, sy = 0, ok = false;
  window.addEventListener('touchstart', (e) => {
    if (e.touches.length !== 1) { sx = null; return; }
    sx = e.touches[0].clientX; sy = e.touches[0].clientY; ok = swipeOk(e.target);
  }, { passive: true });
  window.addEventListener('touchend', (e) => {
    if (sx === null || !ok) return;
    const t = e.changedTouches[0], dx = t.clientX - sx, dy = t.clientY - sy;
    sx = null;
    if (Math.abs(dx) > 90 && Math.abs(dx) > 2.2 * Math.abs(dy)) go(dx < 0 ? next : prev);
  }, { passive: true });
  window.addEventListener('touchcancel', () => { sx = null; }, { passive: true });
}
