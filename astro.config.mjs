import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

const base = (process.env.PREVIEW_BASE || '/').replace(/\/$/, '');

export default defineConfig({
  redirects: {
    // slug renamed 2026-09-15: the page never described a digital twin
    '/projects/urban-digital-twin/': `${base}/projects/urban-morphometrics/`,
  },
  site: 'https://theoalessandro.com',
  base: base || '/',
  integrations: [mdx(), sitemap()],
  output: 'static',
  vite: {
    plugins: [tailwindcss()],
  },
  markdown: {
    shikiConfig: {
      theme: 'github-dark',
    },
  },
});
