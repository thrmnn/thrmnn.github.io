import type { WorkCard } from './cards';

// The homepage's single card. Separate from cards.ts so the PDFs, which hash
// cards.ts, stay as generated. Text is the LAI entry of portfolio.ts.
export const homeCards: WorkCard[] = [
  {
    id: 'trees',
    label: 'Senseable City Lab, MIT and AMS Institute · since 2024',
    title: 'Leaf area from an aerial scan',
    hidden: 'How much leaf a city’s trees carry. Registers record where each tree stands, not how much shade it gives.',
    revealed: 'Leaf area per tree, recovered by a physical inversion from the aerial LiDAR survey the city already flies.',
    changed: 'An estimate that can be argued with on its own terms, from data that already exists. The numbers stay with the paper until it is out.',
    href: '/projects/aerial-lidar-tree-census/',
    foot: 'Case page →',
  },
];
