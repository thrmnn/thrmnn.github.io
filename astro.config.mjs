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
    build: {
      // Every component <script> ships as an external file instead of being
      // inlined below Vite's default 4KB threshold — required so script-src
      // can drop 'unsafe-inline' (only the anti-FOUC script stays inline, hashed).
      assetsInlineLimit: 0,
    },
  },
  markdown: {
    shikiConfig: {
      theme: 'github-dark',
    },
  },
});
