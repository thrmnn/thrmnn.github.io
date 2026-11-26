// Project pages: each section of the text is a row that opens on a tap (a button in the heading,
// aria-expanded on it). The first section is open on arrival, a link to any anchor inside a section
// opens it, and print shows everything (styles in project-page.css). The text before the first
// heading is folded away. Nothing is rewritten.
const body = document.querySelector<HTMLElement>('.pj-body');
if (body) {
  const kids = Array.from(body.children) as HTMLElement[];
  const rows: HTMLElement[] = [];
  let row: HTMLElement | null = null, panel: HTMLElement | null = null, n = 0;
  for (const el of kids) {
    if (el.tagName === 'H2') {
      row = document.createElement('section'); row.className = 'pj-row';
      panel = document.createElement('div'); panel.className = 'pj-panel'; panel.id = `pj-panel-${++n}`;
      const btn = document.createElement('button');
      btn.type = 'button'; btn.className = 'pj-toggle'; btn.setAttribute('aria-expanded', 'false'); btn.setAttribute('aria-controls', panel.id);
      while (el.firstChild) btn.appendChild(el.firstChild);
      el.appendChild(btn);
      body.insertBefore(row, el);
      row.append(el, panel);
      rows.push(row);
    } else if (row && panel) panel.appendChild(el);
    else el.classList.add('pj-intro-folded');
  }
  const set = (r: HTMLElement, open: boolean) => {
    if (open) r.setAttribute('data-open', ''); else r.removeAttribute('data-open');
    r.querySelector('.pj-toggle')!.setAttribute('aria-expanded', String(open));
  };
  rows.forEach((r) => r.querySelector('.pj-toggle')!.addEventListener('click', () => set(r, !r.hasAttribute('data-open'))));
  if (rows[0]) set(rows[0], true);
  const reveal = () => {
    if (!location.hash) return;
    let target: Element | null = null;
    try { target = document.getElementById(decodeURIComponent(location.hash.slice(1))); } catch {}
    const r = target?.closest<HTMLElement>('.pj-row');
    if (r) { set(r, true); target!.scrollIntoView(); }
  };
  reveal();
  addEventListener('hashchange', reveal);
}
