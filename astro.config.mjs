import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import smartypants from 'remark-smartypants';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeExternalLinks from 'rehype-external-links';

export default defineConfig({
  site: 'https://theoalessandro.com',
  integrations: [mdx(), sitemap()],
  output: 'static',
  vite: {
    plugins: [tailwindcss()],
  },
  markdown: {
    // Light theme matches the Paper ground; dark themes burn against #F5F2EC.
    shikiConfig: { theme: 'min-light' },
    remarkPlugins: [smartypants],
    rehypePlugins: [
      rehypeSlug,
      [
        rehypeAutolinkHeadings,
        {
          behavior: 'append',
          properties: { className: ['heading-anchor'], 'aria-label': 'Link to this heading' },
        },
      ],
      [rehypeExternalLinks, { target: '_blank', rel: ['noopener', 'noreferrer'] }],
    ],
  },
});
