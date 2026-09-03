import { author } from './author';

// Home isn't in the link row — the T·A·H monogram routes to /.
export const navLinks = [
  { label: 'Work', href: '/projects/' },
  { label: 'Consulting', href: '/consulting/' },
];

export const mobileNavLinks = [
  { label: 'Work', href: '/projects/' },
  { label: 'Consulting', href: '/consulting/' },
  { label: 'Contact', href: '/#contact' },
];

export const footerLinks = [
  { label: 'GitHub', href: 'https://github.com/thrmnn', external: true },
  { label: 'Contact', href: `mailto:${author.email}` },
];
