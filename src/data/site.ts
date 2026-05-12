// Site-wide configuration.
// `url` matches astro.config.mjs `site` — both are theoalessandro.com.
// Deployed at thrmnn.github.io until the launch-day CNAME cutover; the
// canonical/OG/JSON-LD URLs already point at the production domain so
// indexing converges on the right host.
export const siteConfig = {
  title: 'Théo Alessandro Hermann',
  positioning:
    'Researcher and builder. MIT Senseable Rio. Urban science, robotics, and what comes next.',
  description:
    'Théo Alessandro Hermann — researcher and builder. MIT Senseable Rio. Urban science, robotics, and what comes next.',
  url: 'https://theoalessandro.com',
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
