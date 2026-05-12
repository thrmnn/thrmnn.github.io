// Site-wide configuration.
// `url` stays on thrmnn.github.io until the launch-day cutover to theoalessandro.com.
export const siteConfig = {
  title: 'Théo Alessandro Hermann',
  positioning:
    'Researcher and builder. MIT Senseable Rio. Urban science, robotics, and what comes next.',
  description:
    'Théo Alessandro Hermann — researcher and builder. MIT Senseable Rio. Urban science, robotics, and what comes next.',
  url: 'https://thrmnn.github.io',
  ogImage: '/og-default.png',
  analytics: {
    plausible: { enabled: false, domain: 'theoalessandro.com' },
  },
} as const;
