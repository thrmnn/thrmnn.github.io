// Authoritative identity record. Single source of truth for name, monogram,
// handles, affiliation, and contact surfaces.
export const author = {
  name: 'Théo Alessandro Hermann',
  shortName: 'Théo',
  monogram: 'T·A·H',
  role: 'Research Fellow, MIT Senseable City Lab — Rio',
  affiliation: 'MIT Senseable City Lab — Rio',
  location: 'Rio de Janeiro',
  email: 'thermann.ai@gmail.com',
  languages: ['Français', 'Português', 'English'],
  handles: {
    public: 'theoalessandro',
    technical: 'thrmnn',
  },
  links: {
    github: 'https://github.com/thrmnn',
    twitter: 'https://x.com/theoalessandro',
    linkedin: 'https://www.linkedin.com/in/theoalessandro',
    scholar: undefined as string | undefined,
  },
} as const;
