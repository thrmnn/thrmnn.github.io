// The homepage work grid, in the owner's card template (Acervo C-2026-10-22-06):
// what was hidden, how it was revealed, what it changed. Every line restates a
// fact already public on this site or in the owner's own notes; the research
// card stays method-only because the studies are unpublished and multi-author.
export interface WorkCard {
  id: string;
  label: string;
  title: string;
  hidden: string;
  revealed: string;
  changed: string;
  href: string;
  external?: boolean;
  /** One quiet line under the three rows: where the card leads, or what it builds on. */
  foot?: string;
}

export const practiceUrl = 'https://theohermann.ch';

export const workCards: WorkCard[] = [
  {
    id: 'practice',
    label: 'Practice · 2026',
    title: 'Making autonomous systems legible',
    hidden: "Robot failures the logs don't explain.",
    revealed: 'The real cause, found and proved independently.',
    changed: 'Evidence a team can act on, and that its safety assessors will ask for from 2027.',
    href: practiceUrl,
    external: true,
    foot: 'theohermann.ch →',
  },
  {
    id: 'roboat',
    label: 'Roboat, MIT spinoff · first intern, 2024',
    title: 'Camera perception for canal boats',
    hidden: 'An autonomous boat that read the canals through LiDAR alone.',
    revealed: "Camera detection and tracking, running on the boat's own edge computer.",
    changed: 'A second sense on board, and every model traceable to the recordings it learned from.',
    href: '/projects/autonomous-boat-perception/',
  },
  {
    id: 'research',
    label: 'MIT Senseable City Lab Rio · since 2025',
    title: 'How city form shapes light and air',
    hidden: 'How light and air move through a city built without plans, which measures made for street grids miss.',
    revealed: '3D models of the fabric, from the whole city down to a single alley, to study sunlight and airflow where people live.',
    changed: 'Measures that hold on a fabric the standard ones were not built for. The findings stay with the papers until they are out.',
    href: '/projects/urban-morphometrics/',
  },
  {
    id: 'stata',
    label: 'Open source · 2023 to now',
    title: 'Finding the moment a robot got lost',
    hidden: 'Robots that lose track of where they are while still reporting high confidence.',
    revealed: 'Four detectors that find those moments in the logs a fleet already records, run unchanged on recordings from five platforms.',
    changed: 'Published with what it missed, and nearly every number recomputes from the repository with one script.',
    foot: 'Built on: a ROS stack for a person-following robot at EPFL VITA Lab (2023), a modular perception pipeline',
    href: '/projects/ros2-localization-triage/',
  },
];
