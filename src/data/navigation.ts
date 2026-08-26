// Home isn't in the link row — the T·A·H monogram routes to /.
// Consulting isn't in desktop navLinks — the header's .header-cta consult
// pill is the desktop route to it (one affordance per destination there).
// Mobile has no separate pill, so mobileNavLinks keeps its own entry.
export const navLinks = [
  { label: 'Projects', href: '/projects/' },
  { label: 'CV', href: '/cv/' },
];

export const mobileNavLinks = [
  { label: 'Projects', href: '/projects/' },
  { label: 'Consulting', href: '/consulting/' },
  { label: 'CV', href: '/cv/' },
  { label: 'Now', href: '/now/' },
  { label: 'Contact', href: '/#contact' },
];

export const footerLinks = [
  { label: 'Now', href: '/now/' },
  { label: 'GitHub', href: 'https://github.com/thrmnn', external: true },
  { label: 'Contact', href: 'mailto:thermann@mit.edu' },
  { label: 'RSS', href: '/rss.xml' },
];
