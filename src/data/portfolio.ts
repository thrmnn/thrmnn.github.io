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
  /** Who, where, when: from author.ts or the project's own README. */
  role?: string;
  /** How it works, from the project's public README; method only on research. */
  steps?: string[];
}

/** A page each. */
export const portfolio: PortfolioEntry[] = [
  { card: 'roboat', role: 'Computer vision and MLOps intern, the first · Amsterdam · March to August 2024' },
  {
    card: 'research',
    role: 'Research fellow since January 2025, there from the Rio branch’s first week',
    // MorphoFavela README, pipeline order. No indicator values, no findings.
    steps: [
      'Clip the building footprints and terrain model to each site, then compute each indicator on its own: sky view, solar access, sectional porosity, occupancy density, urban form.',
      'Stratify the fabric on sky view, slope and built density to choose where airflow is simulated (OpenFOAM, on MIT’s cluster, in a separate pipeline).',
      'Weight the results by the site’s wind rose, built from public weather-station records.',
    ],
  },
  {
    slug: 'aerial-lidar-tree-census',
    hidden: 'How much leaf a city’s trees carry. Registers record where each tree stands, not how much shade it gives.',
    revealed: 'Leaf area per tree, recovered by a physical inversion from the aerial LiDAR survey the city already flies.',
    changed: 'An estimate that can be argued with on its own terms, from data that already exists. The numbers stay with the paper until it is out.',
  },
  {
    card: 'stata',
    // README and docs/how-this-was-graded.md.
    role: 'Mine end to end: I recorded the faults, ran the tool and graded the results myself',
  },
];

/** A page each, after a More work divider. */
export const moreWork: PortfolioEntry[] = [
  {
    slug: 'autonomous-mobile-robot',
    role: 'Research assistant, EPFL VITA Lab, under Alexandre Alahi · Lausanne · June 2022 to June 2023',
    hidden: 'Where the people around a robot are and where they are heading, in a crowded indoor space.',
    revealed: 'A modular ROS pipeline on a Segway Loomo: person detection and tracking, trajectory prediction, path planning and model predictive control.',
    changed: 'Validated end to end on the physical robot among real pedestrians, not only in simulation; the code is public.',
  },
  {
    slug: 'perception-pipeline',
    hidden: 'Four versions of the same detection and tracking work, built 2022 to 2023, sharing no interface and pinned to stacks that aged out.',
    revealed: 'One modular stack behind narrow interfaces. Version 0.1 ships detection and tracking; re-identification and pose follow.',
    changed: 'A module can be swapped without touching the rest, and every module reports its own latency. Open source, MIT licensed.',
  },
  {
    slug: 'event-cameras-drone',
    role: 'Visiting research fellow, IRI (CSIC-UPC), with Juan Andrade-Cetto · Barcelona · October 2023 to February 2024',
    hidden: 'Where a drone is during aggressive flight, once frame cameras blur and standard visual-inertial odometry diverges.',
    revealed: 'A PyTorch network that estimates 6-DOF pose from event-camera, RGB and IMU streams, trained on high-speed drone flights.',
    changed: 'A pose estimator built for flight above 5 g, the regime where frame-based pipelines fail; the training framework is open source.',
  },
  {
    // From Acervo C-2026-10-27-01 and the owner's words; owner, 27 Oct: ship as drafted, Maré named (the study lead agreed).
    slug: 'octopus',
    role: 'Research fellow in the Rio lab: projects and deployment, research meetings, talks',
    hidden: 'Heat, humidity and fine particles at street level, where people actually walk and live.',
    revealed: 'A sensor anyone can build: an Arduino board, a fine-particle sensor and GPS in a 3D-printed case, assembled in about 20 minutes, logging a line every 5 seconds.',
    changed: 'Street-level air and heat can be mapped without a lab’s equipment; in Maré, the measurements are being linked to urban form.',
  },
  {
    slug: 'agent-harness',
    hidden: 'Agent failures nobody sees: a tool call breaks, nothing traces it, and a user finds out first.',
    revealed: 'A typed tool layer with one structured trace line per call, and a regression suite wired into CI.',
    changed: 'A bad prompt change fails the build instead of reaching the user.',
  },
];

/** Section order by audience; the default follows the homepage's spotlights. */
export const sections: { name: string; slugs: string[] }[] = [
  { name: 'Favela research', slugs: ['urban-morphometrics', 'octopus'] },
  { name: 'Robotics', slugs: ['autonomous-mobile-robot', 'autonomous-boat-perception', 'event-cameras-drone', 'perception-pipeline'] },
  { name: 'Practice: Making autonomous systems legible', slugs: ['ros2-localization-triage', 'agent-harness'] },
  { name: 'More work', slugs: ['aerial-lidar-tree-census'] },
];

export const audienceOrder: Record<string, string[]> = {
  cto: ['Practice: Making autonomous systems legible', 'Robotics', 'Favela research', 'More work'],
};
