import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getCollection } from 'astro:content';
import { siteConfig } from '../data/site';

export async function GET(context: APIContext) {
  const publications = await getCollection('publications');
  const posts = await getCollection('posts').catch(() => []);

  const pubItems = publications.map((pub) => ({
    title: pub.data.title,
    description: pub.data.summary || pub.data.abstract,
    pubDate: pub.data.date,
    link: `/research/#${pub.id}`,
  }));

  const postItems = posts.map((post) => ({
    title: post.data.title,
    description: post.data.summary,
    pubDate: post.data.date,
    link: `/posts/${post.id}/`,
  }));

  const items = [...pubItems, ...postItems].sort(
    (a, b) => b.pubDate.getTime() - a.pubDate.getTime(),
  );

  return rss({
    title: siteConfig.title,
    description: siteConfig.description,
    site: context.site ?? siteConfig.url,
    items,
    customData: '<language>en-us</language>',
  });
}
