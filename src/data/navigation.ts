import { base } from './base';
import { author } from './author';
import { getPublishedWriting } from './writing';

const hasWriting = (await getPublishedWriting()).length > 0;
const writingLink = hasWriting ? [{ label: 'Writing', href: '/writing/' }] : [];

// Home isn't in the link row — the T·A·H monogram routes to /.
export const navLinks = [
  { label: 'Work', href: '/projects/' },
  ...writingLink,
  { label: 'Contact', href: '/#contact' },
];

// The index lists the homepage blocks that exist: the project list and the contact block.
export const mobileNavLinks = [
  { label: 'Work', href: '/#projects' },
  ...writingLink,
  { label: 'Contact', href: '/#contact' },
];

export const footerLinks: { label: string; href: string; external?: boolean }[] = [
  ...mobileNavLinks.filter((l) => l.label !== 'Contact').map((l) => ({ label: l.label, href: `${base}${l.href}` })),
  { label: 'CV', href: `${base}/cv/` },
  { label: 'Now', href: `${base}/now/` },
  { label: 'GitHub', href: 'https://github.com/thrmnn', external: true },
  { label: 'Contact', href: `mailto:${author.email}` },
];
