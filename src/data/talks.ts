import limits from '../../scripts/talk-photos.json' with { type: 'json' };

export interface Talk {
  id: string;
  event: string;
  session?: string;
  place: string;
  date: string;
  href?: string;
  photo?: { src: string; alt: string; credit: string; w: number; h: number };
  essay?: string;
  fixture?: boolean;
}

export const MAX_EDGE: number = limits.maxEdge;

// Real entries only with the owner's photo, confirmed title and credit. Never invent one.
export const talks: Talk[] = [
  {
    id: 'stars-2026',
    event: 'Open Lab 2026 at STARS, Dubai Future Week',
    place: 'Dubai',
    date: '2026-11-19',
    href: 'https://www.linkedin.com/posts/senseablecitydubai-mitsenseablecitylab-dubaifuturefoundation-ugcPost-7530937078256406528-g0IA/',
    photo: { src: '/talks/stars-2026.webp', alt: 'A speaker on the STARS stage in Dubai, in front of a screen showing a building as a blue point cloud; the audience is seen from behind.', credit: 'Dubai Future Foundation', w: 1600, h: 1067 },
  },
  {
    id: 'fixture-landscape',
    event: 'Stand-in talk: layout only',
    session: 'Stand-in session title',
    place: 'Stand-in place',
    date: '2000-01-01',
    href: 'https://example.com/stand-in',
    photo: { src: '/talks/fixture-landscape.webp', alt: 'Stand-in photo: a flat grey plate.', credit: 'Stand-in credit', w: 1200, h: 800 },
    fixture: true,
  },
  {
    id: 'fixture-square',
    event: 'Stand-in talk: layout only',
    place: 'Stand-in place',
    date: '2000-01-02',
    photo: { src: '/talks/fixture-square.webp', alt: 'Stand-in photo: a flat grey plate.', credit: 'Stand-in credit', w: 900, h: 800 },
    fixture: true,
  },
];

const showFixtures = process.env.PREVIEW_FIXTURES === '1';

export const publishedTalks: Talk[] = talks.filter((t) => t.photo && (showFixtures || !t.fixture));
