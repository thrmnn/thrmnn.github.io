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
    changed: 'An estimate that can be argued with on its own terms, from data that already exists.',
    href: '/projects/aerial-lidar-tree-census/',
    foot: 'Case page →',
  },
];

// The homepage's three spotlights (owner, 2026-10-28, L-8). The PDF's sections
// and the one-page leave-behind read the same list, so the three stay one story.
export interface Spotlight {
  id: string;
  label: string;
  title: string;
  lead?: string;
  slugs: string[];
}

export const spotlights: Spotlight[] = [
  {
    id: 'favela',
    label: 'Favela research',
    title: 'A city that was never drawn.',
    lead: 'Favelas are built without plans, and the usual urban measurements assume a street grid that is not there.',
    slugs: ['urban-morphometrics', 'octopus'],
  },
  {
    id: 'robotics',
    label: 'Robotics',
    title: 'Perception on real robots.',
    slugs: ['autonomous-mobile-robot', 'autonomous-boat-perception', 'event-cameras-drone', 'perception-pipeline'],
  },
  {
    id: 'legible',
    label: 'Practice',
    title: 'Making autonomous systems legible',
    lead: "Robot failures the logs don't explain: the real cause, found and proved independently. Agentic systems fail the way robots do.",
    slugs: ['ros2-localization-triage', 'agent-harness'],
  },
];

// Robotics spotlight figure: 'dots' (Loomo halftone), 'strip' (four project plates), 'pipeline' (perception-pipeline plate)
export type RoboticsFigure = 'dots' | 'strip' | 'pipeline';
export const roboticsFigure: RoboticsFigure = 'strip';

export const roboticsTiles = [
  { slug: 'autonomous-mobile-robot', src: '/projects/autonomous-mobile-robot/loomo-tile.webp', pos: '50% 100%', label: 'EPFL VITA Lab · 2022–23', title: 'Segway Loomo' },
  { slug: 'autonomous-boat-perception', src: '/projects/autonomous-boat-perception/card-plate.webp', pos: '50% 50%', label: 'Roboat, MIT spinoff · 2024', title: 'Roboat' },
  { slug: 'event-cameras-drone', src: '/projects/event-cameras-drone/card-plate.webp', pos: '50% 50%', label: 'IRI (CSIC-UPC, Barcelona) · 2023–24', title: 'Event cameras' },
  { slug: 'perception-pipeline', src: '/projects/perception-pipeline/card-plate.webp', pos: '50% 50%', label: 'Open source · 2026', title: 'Vision pipeline' },
];
