// Site-wide configuration.
// `url` stays on thrmnn.github.io until the launch-day cutover to theoalessandro.com.
export const siteConfig = {
  title: 'Théo Alessandro Hermann',
  positioning:
    'Researcher and builder. MIT Senseable Rio. Urban science, robotics, and what comes next.',
  description:
    'Théo Alessandro Hermann — researcher and builder. MIT Senseable Rio. Urban science, robotics, and what comes next.',
  url: 'https://thrmnn.github.io',
  repo: 'https://github.com/thrmnn/thrmnn.github.io',
  ogImage: '/og-default.png',
  analytics: {
    plausible: { enabled: false, domain: 'theoalessandro.com' },
  },
} as const;

// Last meaningful shipping event. Hand-maintained — update when something
// actually ships. Footer surfaces this as a life signal.
export const lastShipped = {
  title: 'Amsterdam tree-shade submission',
  date: '2026-05-08',
} as const;
