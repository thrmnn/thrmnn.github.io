// Drag across a dot picture to move its scan line. A touch screen keeps vertical scrolling
// (touch-action: pan-y in CSS; a vertical pan ends in pointercancel, which releases the scan).
export function initScanPlay() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  document.querySelectorAll<HTMLElement>('.scan-box[data-scan-play]').forEach((box) => {
    let timer: number | undefined;
    const at = (e: PointerEvent) => {
      const r = box.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
      clearTimeout(timer);
      box.classList.remove('releasing');
      box.classList.add('scanning');
      box.style.setProperty('--scan-x', `${(x * 100).toFixed(2)}%`);
    };
    const release = () => {
      if (!box.classList.contains('scanning')) return;
      box.classList.remove('scanning');
      box.classList.add('releasing');
      box.style.setProperty('--scan-x', '100%');
      timer = window.setTimeout(() => box.classList.remove('releasing'), 750);
    };
    box.addEventListener('pointermove', at);
    box.addEventListener('pointerdown', at);
    box.addEventListener('pointerleave', release);
    box.addEventListener('pointerup', (e) => { if (e.pointerType !== 'mouse') release(); });
    box.addEventListener('pointercancel', release);
  });
}
