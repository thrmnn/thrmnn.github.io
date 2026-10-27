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
}

/** A page each. */
export const portfolio: PortfolioEntry[] = [
  { card: 'roboat' },
  { card: 'research' },
  {
    slug: 'aerial-lidar-tree-census',
    hidden: 'How much leaf a city’s trees carry. Registers record where each tree stands, not how much shade it gives.',
    revealed: 'Leaf area per tree, recovered by a physical inversion from the aerial LiDAR survey the city already flies.',
    changed: 'An estimate that can be argued with on its own terms, from data that already exists. The numbers stay with the paper until it is out.',
  },
  { card: 'stata' },
];

/** Shorter entries, two to a page. */
export const moreWork: PortfolioEntry[] = [
  {
    slug: 'autonomous-mobile-robot',
    hidden: 'Where the people around a robot are and where they are heading, in a crowded indoor space.',
    revealed: 'A full ROS autonomy stack on a Segway Loomo: mapping, planning, obstacle avoidance, and person-following with detection, tracking and trajectory prediction.',
    changed: 'Validated end to end on the physical robot among real pedestrians, not only in simulation, and open-sourced.',
  },
  {
    slug: 'perception-pipeline',
    hidden: 'Four versions of the same detection and tracking work, built 2022 to 2023, sharing no interface and pinned to stacks that aged out.',
    revealed: 'One modular stack behind narrow interfaces. Version 0.1 ships detection and tracking; re-identification and pose follow.',
    changed: 'A module can be swapped without touching the rest, and every module reports its own latency. Open source, MIT licensed.',
  },
  {
    slug: 'event-cameras-drone',
    hidden: 'Where a drone is during aggressive flight, once frame cameras blur and standard visual-inertial odometry diverges.',
    revealed: '6-DOF pose from event-camera streams fused with RGB and IMU data, in a PyTorch network trained on high-speed drone flights.',
    changed: 'Pose tracking held through maneuvers above 5 g, the regime where the frame-based pipelines fail.',
  },
  {
    slug: 'agent-harness',
    hidden: 'Agent failures nobody sees: a tool call breaks, nothing traces it, and a user finds out first.',
    revealed: 'A typed tool layer with one structured trace line per call, and a regression suite wired into CI.',
    changed: 'A bad prompt change fails the build instead of reaching the user.',
  },
];
