import { base } from './base';
import { author } from './author';

// Home isn't in the link row — the T·A·H monogram routes to /.
export const navLinks = [
  { label: 'Work', href: '/projects/' },
  { label: 'Contact', href: '/#contact' },
];

// The burger is a jump list: the labels are the homepage section labels.
export const mobileNavLinks = [
  { label: 'Favela research', href: '/#favela' },
  { label: 'Robotics', href: '/#robotics' },
  { label: 'Practice', href: '/#legible' },
  { label: 'Work', href: '/projects/' },
  { label: 'Contact', href: '/#contact' },
];

export const footerLinks: { label: string; href: string; external?: boolean }[] = [
  ...mobileNavLinks.filter((l) => l.label !== 'Contact').map((l) => ({ label: l.label, href: `${base}${l.href}` })),
  { label: 'CV', href: `${base}/cv/` },
  { label: 'Now', href: `${base}/now/` },
  { label: 'GitHub', href: 'https://github.com/thrmnn', external: true },
  { label: 'Contact', href: `mailto:${author.email}` },
];
