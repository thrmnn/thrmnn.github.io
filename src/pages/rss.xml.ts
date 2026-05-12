import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getCollection } from 'astro:content';
import { siteConfig } from '../data/site';

export async function GET(context: APIContext) {
  const [writing, projects] = await Promise.all([
    getCollection('writing'),
    getCollection('projects'),
  ]);

  const items = [
    ...writing.map((entry) => ({
      title: entry.data.title,
      description: entry.data.summary,
      pubDate: entry.data.date,
      link: `/writing/${entry.id}/`,
      categories: entry.data.tags,
    })),
    ...projects.map((project) => ({
      title: project.data.title,
      description: project.data.summary,
      pubDate: project.data.date,
      link: `/work/${project.id}/`,
      categories: project.data.tags,
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
