import { getCollection } from 'astro:content';

const showFixtures = process.env.PREVIEW_FIXTURES === '1';

export async function getPublishedWriting() {
  const pieces = await getCollection('writing', ({ data }) => !data.draft && (showFixtures || !data.fixture));
  return pieces.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

export const formatWritingDate = (d: Date) =>
  d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
