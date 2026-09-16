// Source of truth for every `is:inline` <script> on the site. Each script
// must run before hydration/paint, so it can't be an external file — but CSP
// script-src can't carry 'unsafe-inline' either. Keeping the exact source
// text here, imported by both the component that renders it and the layout
// that hashes it for the CSP meta, means the rendered bytes and the hashed
// bytes can never drift apart.

export const themeScript = `(function () {
  var stored = localStorage.getItem('theme');
  if (stored === 'light' || stored === 'dark') {
    document.documentElement.setAttribute('data-theme', stored);
  }
  // When no stored preference, let :root / @media (prefers-color-scheme)
  // in CSS handle it — no data-theme attribute needed.
  // Arm the scroll-reveal system (CSS only hides [data-reveal] once set).
  document.documentElement.classList.add('reveal-ready');
})();`;

export const introScript = `(() => {
  if (localStorage.getItem('intro-played') === '1') return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    localStorage.setItem('intro-played', '1');
    return;
  }
  const el = document.getElementById('intro');
  if (!el) return;
  // Hold while assets paint, then play. dock's transform transition is
  // 520ms (see .intro-mark below); fade is scheduled right as it completes
  // so there's no dead air. Total settle->hidden stays under 1s.
  requestAnimationFrame(() => {
    el.setAttribute('data-stage', 'settle');
    setTimeout(() => el.setAttribute('data-stage', 'dock'), 150);
    setTimeout(() => el.setAttribute('data-stage', 'fade'), 670);
    setTimeout(() => {
      el.setAttribute('data-stage', 'hidden');
      localStorage.setItem('intro-played', '1');
    }, 990);
  });
})();`;
