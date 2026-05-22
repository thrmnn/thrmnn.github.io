# thrmnn.github.io

Personal website of Théo Alessandro Hermann — robotics & perception engineer.
Built with [Astro](https://astro.build/).

## Stack

- **Astro 6** — static site generation
- **Tailwind CSS v4** — styling (via `@tailwindcss/vite`)
- **MDX** — project content
- Self-hosted variable fonts (Inter, Space Grotesk)
- Plausible analytics (production only)

## Develop

```bash
npm install
npm run dev        # dev server at http://localhost:4321
npm run build      # static build → dist/
npm run preview    # preview the production build
```

## Project structure

```
src/
├── content/projects/   # project entries (Markdown; schema in content.config.ts)
├── data/               # profile, navigation, news, skills, site config (.ts)
├── pages/              # routes (index, projects, cv, now, 404, rss)
├── components/         # layout + UI components
├── layouts/            # BaseLayout, PageLayout
└── styles/global.css   # design tokens + base styles
public/                 # static assets (fonts, images, resume, favicon)
```

To edit content:

- **Projects** — add/edit Markdown in `src/content/projects/`. Frontmatter is validated by the Zod schema in `src/content.config.ts`.
- **Profile, bio, navigation, news** — edit the `.ts` files in `src/data/`.

## Deploy

Static build output (`dist/`) deploys to GitHub Pages at <https://thrmnn.github.io>.
