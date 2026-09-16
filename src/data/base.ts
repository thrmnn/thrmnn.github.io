// '' in production; '/t/<slug>' when a track is built for the review vitrine
// (PREVIEW_BASE). Every root-absolute path on the site goes through it.
export const base = import.meta.env.BASE_URL.replace(/\/$/, '');
