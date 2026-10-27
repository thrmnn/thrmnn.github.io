// The PDF portfolio (public/portfolio.pdf, scripts/make-portfolio.mjs): which
// case pages it details, in order. Projects with a homepage card take their
// Hidden / Revealed / Changed text from cards.ts; the others carry it here,
// drafted from their own case page for the owner to correct.
export interface PortfolioEntry {
  /** A workCards id; its href names the case page. */
  card?: string;
  slug?: string;
  hidden?: string;
  revealed?: string;
  changed?: string;
  /** Case pages shown under this one as what it builds on: label, title, summary. */
  builtOn?: string[];
}

export const portfolio: PortfolioEntry[] = [
  { card: 'roboat' },
  { card: 'research' },
  {
    slug: 'aerial-lidar-tree-census',
    hidden: 'How much leaf a city’s trees carry. Registers record where each tree stands, not how much shade it gives.',
    revealed: 'Leaf area per tree, recovered by a physical inversion from the aerial LiDAR survey the city already flies.',
    changed: 'An estimate that can be argued with on its own terms, from data that already exists. The numbers stay with the paper until it is out.',
  },
  { card: 'stata', builtOn: ['autonomous-mobile-robot', 'perception-pipeline'] },
];
