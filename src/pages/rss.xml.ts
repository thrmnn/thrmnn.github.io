import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getCollection } from 'astro:content';
import { siteConfig } from '../data/site';
import { getPublishedWriting } from '../data/writing';

export async function GET(context: APIContext) {
  const projects = await getCollection('projects', ({ data }) => !data.draft);

  const writing = await getPublishedWriting();

  const items = [
    ...writing.map((piece) => ({
      title: piece.data.title,
      description: piece.data.summary,
      pubDate: piece.data.date,
      link: `/writing/${piece.id}/`,
    })),
    ...projects.map((project) => ({
      title: project.data.title,
      description: project.data.summary,
      pubDate: project.data.date,
      link: project.data.externalLink || `/projects/${project.id}/`,
    })),
  ].sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime());

  return rss({
    title: siteConfig.title,
    description: siteConfig.description,
    site: context.site ?? siteConfig.url,
    items,
    customData: '<language>en-us</language>',
  });
}
