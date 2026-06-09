// Home isn't in the link row — the T·A·H monogram routes to /.
// One affordance per destination, no duplicates.
export const navLinks = [
  { label: 'Projects', href: '/projects/' },
  { label: 'Consulting', href: '/consulting/' },
  { label: 'CV', href: '/cv/' },
];

export const mobileNavLinks = [
  ...navLinks,
  { label: 'Now', href: '/now/' },
  { label: 'Contact', href: '/#contact' },
];

export const footerLinks = [
  { label: 'Now', href: '/now/' },
  { label: 'GitHub', href: 'https://github.com/thrmnn', external: true },
  { label: 'Contact', href: 'mailto:thermann@mit.edu' },
  { label: 'RSS', href: '/rss.xml' },
];
