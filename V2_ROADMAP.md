# Website v2 — Roadmap & Next Steps

> Astro rebuild on branch `v2-astro`. Targeting senior perception/robotics roles at Waymo, Figure AI, Anduril.

---

## Current state

- **Branch:** `v2-astro`
- **Stack:** Astro 6 + Tailwind 4 + MDX
- **Pages:** 12 (home, projects, 6 project details, research, CV, now, 404)
- **Build:** 1.7s, 12 pages, 62KB CSS, 15KB JS (view transitions only)
- **Deploy:** GitHub Actions workflow at `.github/workflows/deploy.yml`

---

## Phase 1 — First stable deploy (blocked on assets)

### You provide (4 items):

| Asset | Spec | Where it goes | How to create |
|---|---|---|---|
| **Hero image** | 1920×1080+ JPG/PNG, dark-friendly | `public/hero.jpg` | Export a LiDAR point cloud render from CloudCompare/Open3D at a dramatic angle. Color by elevation or species. OR a Blender render of the favela digital twin mesh. |
| **Avatar** | 400×400+ PNG, square crop | Replace `public/avatar.png` | Professional headshot or photo of you working with hardware/in the field. Not casual/vacation. |
| **3 project images** | 800×600+ JPG each | `public/projects/digital-twin.jpg`, `tree-census.jpg`, `roboat.jpg` | Screenshots: point cloud visualization, detection overlay on canal image, 3D mesh render. |
| **OG social card** | 1200×630 PNG | `public/og-default.png` | Use Figma/Canva: dark background, your name, "Perception & Robotics Engineer", MIT logo. This is what shows when you share on LinkedIn/Slack. |

### I do (once you provide assets):

1. Wire hero image into the hero section (background-image with brightness filter)
2. Update project cards to use real images instead of gradient placeholders
3. Verify all images render correctly across pages
4. Final build and visual review
5. Merge `v2-astro` → `main` and push to deploy

### Deploy flow:

```bash
git checkout main
git merge v2-astro
git push origin main
# GitHub Actions builds and deploys to GitHub Pages automatically
```

---

## Phase 2 — Post-deploy polish (week 1-2)

| Task | Effort | Impact |
|---|---|---|
| Migrate LfD blog post to MDX | Medium | Adds depth to /research, shows technical writing ability |
| Stagger-animate hero domain tags on load | Small | Instant polish, 3 lines of CSS |
| Audit project tags against real job postings | Small | Better keyword matching for ATS/recruiter search |
| Add dark/light mode toggle | Small | Some recruiters browse in light mode |
| GitHub pinned repos or contribution graph on CV | Medium | Shows you code publicly |
| Analytics (Plausible or Umami) | Small | Understand which pages recruiters visit |

---

## Phase 3 — Content growth (month 1-2)

| Task | Why |
|---|---|
| Write 2-3 more technical blog posts | Demonstrates thinking depth. Topics: "Building perception for maritime environments", "LiDAR processing at scale", "Event cameras vs frame cameras" |
| Add real talks when they happen | Currently all event content is draft (fake). Create new entries from scratch when real talks occur |
| Testimonial from Carlo Ratti or a Roboat colleague | One line of social proof from a known name is worth more than any design improvement |
| Interactive project demos | Embed a 3D point cloud viewer (potree/three.js) for the tree census — lets recruiters explore your actual data |

---

## Phase 4 — V2.5 features (month 2-3)

| Feature | Effort | Value |
|---|---|---|
| PDF resume auto-generation from CV data | Medium | CV page and PDF never go out of sync |
| Custom 404 with suggested pages | Small | Better UX for broken links |
| Project image galleries (lightbox) | Medium | Multiple visuals per project when available |
| Reading time on blog posts | Small | Polish |
| RSS feed for blog | Small | Discoverability |
| Performance budget CI check | Small | Prevent accidental bloat |

---

## Architecture reference

```
src/
├── assets/images/          # Astro-optimized images
├── components/
│   ├── layout/             # Header, Footer
│   ├── ui/                 # ProjectCard, NewsItem, Button, SocialIcon, PublicationEntry
│   ├── blocks/             # (future: reusable page sections)
│   └── seo/                # (future: JsonLd, OpenGraph components)
├── content/
│   ├── projects/           # 6 project .md files
│   └── publications/       # 2 publication .md files
├── data/                   # author.ts, news.ts, skills.ts, navigation.ts, site.ts
├── layouts/                # BaseLayout, PageLayout
├── pages/                  # All routes
│   ├── index.astro         # Homepage
│   ├── projects/           # Grid + [id] detail
│   ├── research.astro
│   ├── cv.astro
│   ├── now.astro
│   └── 404.astro
└── styles/
    └── global.css          # Design system: colors, typography, prose

public/
├── favicon.svg             # TH monogram (dark bg)
├── apple-touch-icon.png    # 180×180 fallback
├── resume.pdf
├── robots.txt
├── avatar.png              # ← REPLACE with professional photo
└── og-default.png          # ← CREATE (1200×630 social card)
```

## Design system

| Token | Value | Usage |
|---|---|---|
| `--font-display` | Space Grotesk | Headings, buttons, nav brand |
| `--font-sans` | Inter | Body text, descriptions |
| `--color-bg-primary` | `#0a0a0a` | Page background |
| `--color-text-primary` | `#f5f5f5` | Headings |
| `--color-text-secondary` | `#a1a1a1` | Body text |
| `--color-text-muted` | `#666666` | Dates, labels |
| `--color-accent` | `#3b82f6` | Buttons (bg) |
| `--color-link` | `#93c5fd` | Inline text links |
| `--color-border` | `rgba(255,255,255,0.08)` | Borders, dividers |

---

## Key decisions log

| Decision | Reasoning |
|---|---|
| Space Grotesk + Inter | Sharp, geometric, engineering-credible. Syne was rejected as too decorative. |
| Dark-first, no light mode (yet) | Technical/premium feel for robotics audience. Light mode is Phase 2. |
| Name as hero headline, not tagline | Recruiter needs to know WHO in 1 second, not read a slogan. |
| "Perception & Robotics Engineer" not "Research Fellow" | Industry language for industry roles. "Fellow" reads academic. |
| Talks section removed | Content was fake. Will add real talks when they happen. |
| Blog post deferred | MDX migration of 400-line post with shortcodes is effort. Ship site first, migrate later. |
| 4 nav items (Home, Research, Projects, CV) | Minimal decision space for recruiters. /now accessible via footer. |
