# CLAUDE.md

Primary context for **theoalessandro.com**. Read at the start of every session. If a request conflicts with anything here, surface the conflict before acting.

This file is the canonical source for: brand brief, council framework, voice rules, visual system, code conventions, house rules, and the decisions log. Update it when the system evolves — not the system to match outdated docs.

Sections 1–4 are durable. Sections 5–8 describe what is **shipped today** (and a clearly-labeled "Deferred / next-up" inside each, for known targets). Sections 9–13 govern process.

---

## 1. Project north star

Personal site for **Théo Alessandro Hermann** — researcher and builder.

- **Spine** (lead with): MIT Senseable Rio research — favelas, urban science, environmental modeling.
- **Edge** (technical credibility): Robotics, VLA, open-source.
- **Foundation** (lighter weight): Builder bets — apps, Azimuth.
- **Horizon** (signal only): Education.

Built to last years. Adding a project or essay should take under 20 minutes. **Restraint reads as confidence.**

---

## 2. Brand brief (locked — do not re-derive)

### Identity

- Public name: **Théo Alessandro Hermann** (accent on Théo preserved, always)
- Technical handle: `thrmnn`
- Monogram: T·A·H — favicon and avatars only, never as on-page logo
- Monogram source (canonical): `monogram/Asset 1.svg` (hand-drawn, 5 paths, 377.88×102.37). Every favicon and the full monogram asset pack regenerates from this single source via `npm run monogram`. `monogram/THEO.svg` is a type-comparison spec sheet, not a mark. The previous Space Grotesk auto-generated version is superseded.
- Domain: `theoalessandro.com` (deploy still on `thrmnn.github.io` until launch cutover)
- Social, public: `@theoalessandro`
- Social, technical: `@thrmnn`

### Positioning (locked one-liner)

> Théo Alessandro Hermann — researcher and builder. MIT Senseable Rio. Urban science, robotics, and what comes next.

### Thesis

Franco-Brazilian engineer bringing frontier technical methods to systems others round off as too messy — favelas, real-world robotics, production businesses, eventually education. Cartesian rigor applied to tropical complexity.

### Audience priority

1. AI/ML research recruiters at top labs (Anthropic, Google, Nvidia)
2. Early investors and consulting clients in built-environment and AI infrastructure

### Track architecture (private — never stated on the site)

The Spine / Edge / Foundation / Horizon structure above is a strategic instrument, not website copy. Do not surface it.

---

## 3. The council (prompting technique, not a Claude Code feature)

These are personas to invoke explicitly when a decision warrants more friction than a single voice produces. They are _prompting devices_, not real review gates — Claude is one model speaking in different voices when asked. Treat their disagreement as instrument; treat Anna's veto as worth listening to.

**One unified council** — no primary / secondary tiers. Every member is in every conversation; what changes is which voices speak loudest on a given decision. Roughly ordered from broad lens to narrow lens, with the gatekeeper last:

- **Renata Vasconcellos** — Brand Strategist. Owns alignment with the positioning in § 2. Asks whether each page strengthens or muddies the one-line thesis.
- **Júlio Andrade** — Cultural Semiotician. Honest expression of the Franco-Brazilian hybrid — anti-pastiche, anti-cliché. Catches "exotic Brazil" tropes and "studied Parisian" affectation in equal measure.
- **Inês Carmo** — Digital & Interaction Designer. Owns site architecture, interaction patterns, layout systems, performance, stack choices. Lens: the medium.
- **Marina Werneck** — Art Director / Visual Identity Lead. Owns visual treatment of each page, image direction, layout decisions. Lens: visual system and rules.
- **Tomás Halberstadt** — Typographer. Owns all type decisions, spacing, hierarchy, pairing. Lens: type as voice. Believes that for a one-person identity, the typeface _is_ the identity.
- **Bruno Sayão** — Editorial & Content Director. Owns all written copy. Enforces § 4 anti-performative principles word by word.
- **Anna Lindqvist** — The Skeptic. Outsider. Pressure-tests every choice. Asks: "Is this true to you or aspirational pose? Would you maintain this in 6 months?" Has veto on ambition the system can't sustain.

### Invocation

There are no real `/council`, `/anti-perf`, or `/register-check` slash commands. When the user writes one of those tokens in a prompt, treat it as a request to:

- `/council [topic]` → walk the topic through the council in their voices, surfacing disagreement. Not every member needs to speak on every decision — surface the 2–4 whose lens applies, then close with Anna if scope is in question.
- `/anti-perf [text]` → Bruno audits the text against § 4. Returns specific flags and proposed rewrites.
- `/register-check [page]` → verify a page's register treatment is consistent with § 5.5.

### When to invoke the council

- Any decision changing layout, type, color, or copy on more than one page
- Any addition or removal from site architecture
- Any new project or essay page (Bruno + Anna at minimum)
- Any new dependency
- Anytime ambition pulls toward something the system doesn't currently support — Anna gets veto
- Anytime a positioning question is in play — Renata leads, others follow

---

## 4. Voice & copy principles (anti-performative)

Apply to every word on the site. Not suggestions.

- Lead with the artifact, not the announcement.
- **Banned in openers:** thrilled, proud, honored, humbled, excited, delighted, can't wait, blessed.
- **Banned closings:** "What do you think?", "Let me know in the comments", "Drop a like", "Subscribe for more".
- No personal-story-as-business-lesson template.
- No formatting theatrics (no scattered bold for emphasis, no caps lock for emotion, no emoji bullets).
- Show the work + one paragraph of context. Stop.
- Cite collaborators by name, including affiliation when relevant.
- Don't ask for likes / follows / signups in posts.
- Be willing to ship things that won't perform.
- French and Portuguese voice carry the same discipline; do not loosen the rules in translation.

---

## 5. Visual system

### 5.1 Type stack (shipped)

| Role              | Family             | Source                    | Notes                                                                             |
| ----------------- | ------------------ | ------------------------- | --------------------------------------------------------------------------------- |
| Cartesian display | **Space Grotesk**  | Google Fonts, self-hosted | Variable wght. Geometric grotesque.                                               |
| Tropical display  | **Fraunces**       | Google Fonts, self-hosted | Variable opsz + SOFT + wght (Latin `soft` variant). High-contrast humanist serif. |
| Body              | **Switzer**        | Fontshare, self-hosted    | Variable wght. Modern grotesque, neutral.                                         |
| Mono              | **JetBrains Mono** | Google Fonts, self-hosted | Variable wght. Captions, metadata, code, UI.                                      |

All fonts live in `public/fonts/` and load via `@font-face` in `src/styles/global.css`. The CSP forbids `fonts.googleapis.com` and `fonts.gstatic.com` — never reintroduce a runtime third-party font request.

### 5.2 Type scale (shipped)

Fluid scale via `clamp(min, viewport, max)`. Min/max are anchored to a named scale. **No raw `font-size` values in components** — every size derives from a named token defined in `global.css` or scoped per-component to one of these targets:

| Token target | Min  | Max  | Use                             |
| ------------ | ---- | ---- | ------------------------------- |
| mono-xs      | 11px | 12px | Eyebrow captions                |
| mono-sm      | 13px | 14px | Status, dates, captions         |
| body-sm      | 14px | 15px | Footnotes, dense meta           |
| body         | 16px | 17px | Default body (`html` base)      |
| body-lg      | 18px | 20px | Lede paragraphs, summary blocks |
| display-sm   | 22px | 26px | H3                              |
| display-md   | 30px | 44px | H2, About title                 |
| display-lg   | 36px | 56px | H1, project title               |
| display-xl   | 40px | 76px | Hero wordmark                   |

If a page needs a size not on this scale, the answer is no.

### 5.3 Color tokens (shipped)

```css
/* Constants — both registers */
--paper: #f5f2ec; /* ground */
--paper-deep: #ece7dd; /* secondary fill, ~5% darker */
--ink: #1a1815; /* text */
--ink-soft: #4a4640; /* secondary text */
--ink-muted: #7a7570; /* tertiary / captions */

/* Cartesian accents */
--graphite: #3b4252;
--cool-grey: #9ca3ae;

/* Tropical accents */
--terra: #b95c3e;
--oxblood: #7a2e2a;
--sand: #e4c896;
```

**No other colors.** No "almost the same beige" drift. New color = council decision, not a styling tweak.

### 5.4 Spacing scale (4px baseline)

All margins, paddings, line-heights, and component heights are multiples of 4px from this scale:

```css
--s-1: 4px --s-2: 8px --s-3: 12px --s-4: 16px --s-6: 24px --s-8: 32px --s-12: 48px --s-16: 64px
  --s-20: 80px --s-32: 128px;
```

Same rule as type. If a custom value seems necessary, it isn't.

### 5.5 Two-register logic (shipped)

Each page declares its register on `<html data-register="cartesian | tropical">` via the `register` prop on `PageLayout.astro`. The attribute switches accent palette and heading font face.

**Cartesian** (default — research, projects, methodology, technical pages, homepage, Now)

- Space Grotesk for display, Switzer body, JetBrains Mono captions
- Graphite + cool-grey accents
- Diagrammatic imagery primary; captions in mono, uppercase tracked

**Tropical** (essays, About, longform, cultural / field writing)

- Fraunces display (opsz + SOFT axis tuned per size), Switzer body
- Terra / oxblood / sand accents
- Photography-forward; captions in Fraunces italic

**Shared:** wordmark in Fraunces (always, regardless of register), navigation, body type family, paper ground, ink, footer structure, monogram favicon.

### 5.6 Motion (shipped)

- Subtle fade transitions, ~250ms, `cubic-bezier(0.4, 0, 0.2, 1)`
- Hovers reveal **information**, not decoration
- `prefers-reduced-motion: reduce` collapses transitions to 0.01ms (already in `global.css`)
- Nothing autoplays
- Native CSS transitions only — **no GSAP, no Framer Motion, no animation libraries**

### 5.7 Image treatment

**Photography** — receives a subtle paper-grain overlay (8% opacity, multiply blend mode) to unify across the site. _Deferred — `PaperGrainOverlay` component not built yet; add to first essay page that uses photography._

**Technical imagery** (LiDAR, CFD, solar maps, plots, diagrams) — does **not** receive the overlay. Their precision is the point. Render at native resolution; crop to grid rather than scaling.

### 5.8 Deferred / next-up

- `PaperGrainOverlay` component (§ 5.7)
- Tropical register has tokens defined but no page actively uses it yet. First essay will surface gaps — expect a polish pass when that lands.

---

## 6. Reference moves (with attribution)

Documented adaptations from reference sites. Follow the principle, not the visual.

### From alexandremonceau.com (Studio Indice, Paris)

1. **Uppercase H3 labels in mono** — captions/eyebrows use JetBrains Mono uppercase with tracked letter-spacing. **Shipped** via `.mono-caption` / `.eyebrow` classes in `global.css`.
2. **Footer as structured credit card** on project pages. List collaborators (name + affiliation), location, dates, link credits. _Deferred — currently project pages list only collaborator names as a flat string._
3. **Title + context couplet** for project list items. Model: "Ciel Aubergine / Batignolles, Paris". For us: "Amsterdam Tree-Shade Study / Submitted to Nature Cities, May 2026". **Shipped** — `ProjectCard.astro` displays status above title.
4. **`./` filesystem reference** in navigation — a subtle technical signal. _Deferred._

### From gardinex.com (Aino, Sweden)

1. **Restraint as posture.** Two-sentence maximum for category copy. Trust imagery. **Shipped** — applied to homepage positioning, work index lede, contact lede.
2. **Paper-grain overlay** on photographic imagery for material cohesion (see § 5.7). _Deferred._
3. **Small mono tags** alongside larger labels as structural metadata. **Shipped** via `.mono-caption`.

### Explicitly NOT taken

- No cursor-follow effects.
- No marquee text.
- No dark mode — paper + ink is the only mode.
- No big-typography hero ("look how big my name is"). The hero wordmark caps at display-xl, not larger.

---

## 7. Site architecture

### Top navigation

`Work · Writing · Now · About · Contact`

### Routes (shipped)

| Path                 | Purpose                                         |
| -------------------- | ----------------------------------------------- |
| `/`                  | Homepage                                        |
| `/work`              | Projects index                                  |
| `/work/[id]`         | Project page                                    |
| `/writing`           | Essays index                                    |
| `/writing/[id]`      | Essay page (route exists; no entries yet)       |
| `/now`               | Current state, monthly refresh                  |
| `/about`             | Franco-Brazilian trajectory, languages, CV link |
| `/contact`           | Email + handles                                 |
| `/404`               | Not found                                       |
| `/rss.xml`           | Combined writing + work feed                    |
| `/sitemap-index.xml` | Auto-generated via `@astrojs/sitemap`           |

### i18n

_Deferred._ `astro:i18n` not configured yet. `/fr/` and `/pt/` will be added when there is published content in those languages. **Do not create empty FR or PT shells.**

### Homepage above the fold (shipped)

1. Wordmark — _Théo Alessandro Hermann_, Fraunces, accent preserved
2. One-line positioning (the locked text in § 2, verbatim)
3. Featured strip — current projects with visual previews. 1–4 tiles, driven by `featured: true` + `featuredOrder` in project frontmatter. **Never padded with placeholders.**
4. Most recent writing entry — or rendered nothing if no writing exists (no fake date, no fake teaser).
5. _Deferred:_ "Last shipped: [thing] on [date]" footer line.

### Project page structure (shipped)

1. Hero visual (full-width) — falls back to typographic Fraunces placeholder if `heroImage` not set
2. One-paragraph summary (target ≤ 60 words)
3. Status indicator (e.g., _"Submitted to Nature Cities · May 2026"_)
4. Meta block: date, collaborators, links (paper / preprint / repo / app / site), updated
5. Methods + content via MDX body. _Deferred:_ dedicated `<MethodsList>` mono-styled component; currently methods render as prose under H3.
6. Related work (2 items, ranked by tag overlap)

### Writing page structure (shipped)

1. Date · language tag (mono caption row)
2. Title (Fraunces display when register=tropical)
3. Summary
4. Body (Switzer, generous line-height)
5. _Deferred:_ footnotes component, "Updated [date]" line, reading-time.

### Now page structure

_Currently a single dated entry per the brief._ Target Sivers structure (_Where I am · What I'm working on · What I'm reading · Last shipped_) is **deferred**; the current page is one prose block with monthly refresh.

### Life signals (shipped where noted)

- Project pages: "Updated [date]" in meta block (shipped; currently hand-maintained — see § 11 for the git-derived target)
- Now: dated header (shipped)
- Site footer: location · year (shipped); "Last shipped: [thing]" line (deferred)
- Dates: `DD MMM YYYY` in body via `toLocaleDateString`; `YYYY-MM-DD` in frontmatter

---

## 8. Code conventions

### Stack (shipped)

- **Astro 6.x** (pinned to `^6.0.7`; upgrade only with intent)
- **TypeScript** strict (`astro/tsconfigs/strict`)
- **npm** (package-lock.json)
- **Tailwind 4** — used **only** for token wiring via `@theme` and base resets via `@layer base` in `src/styles/global.css`. **No utility classes in `.astro` components.** Component styles are plain CSS with custom properties in `<style>` blocks.
- **MDX** for content with embedded components (`@astrojs/mdx`)
- **GitHub Pages** hosting via `.github/workflows/deploy.yml`
- **Sharp** for image rasterization (already shipped with Astro)

### Tooling (shipped)

- `@astrojs/check` + `typescript` — `npm run check` typechecks content collections, routes, schemas before build
- `prettier` + `prettier-plugin-astro` — `npm run format` (write) / `npm run format:check` (CI). Config: 100-col, single quotes, trailing commas, semicolons.
- `@astrojs/sitemap` — auto-generated `sitemap-index.xml`
- `@astrojs/rss` — combined writing + work feed at `/rss.xml`

### Markdown pipeline (shipped)

Configured in `astro.config.mjs`. Every MDX / markdown file gets:

- `remark-smartypants` — `"x"` → curly quotes, `--` → em-dash, `...` → ellipsis. Editorial baseline.
- `rehype-slug` — `id` on every heading
- `rehype-autolink-headings` — clickable anchor on h2/h3 (subtle `#` on hover; hidden ≤720px)
- `rehype-external-links` — `target="_blank" rel="noopener noreferrer"` on outbound links

Shiki theme: `min-light` (warm Paper palette would burn against `github-dark`).

### npm scripts

```
npm run dev            # astro dev
npm run build          # astro build
npm run preview        # astro preview
npm run check          # astro check — typecheck content collections + routes
npm run format         # prettier --write
npm run format:check   # prettier --check  (use in CI)
npm run brand-assets   # regenerate favicon / apple-touch / avatar / OG card
```

### File structure (shipped)

```
src/
  content.config.ts        # typed schemas for collections (Zod)
  content/
    projects/              # .md / .mdx
    writing/               # .md / .mdx (empty for now)
  layouts/
    BaseLayout.astro       # head, JSON-LD, font preloads, register on <html>
    PageLayout.astro       # BaseLayout + Header + Footer wrapper
  components/
    Header.astro           # sticky nav, active state, mobile collapse
    Footer.astro           # 4-column contact / handles / location
    Wordmark.astro         # Fraunces wordmark, 3 sizes with per-size opsz
    ProjectCard.astro      # card with hero or typographic placeholder
    FeaturedStrip.astro    # homepage 3-4 project layout
  data/
    site.ts                # title, positioning, URL, analytics
    author.ts              # name, handles, email, links
    navigation.ts          # nav items
  pages/
    index.astro
    about.astro
    contact.astro
    now.astro
    404.astro
    rss.xml.ts
    work/index.astro
    work/[id].astro
    writing/index.astro
    writing/[id].astro
  styles/
    global.css             # @font-face, tokens, base, prose, components
  utils/
    readingTime.ts         # available but not wired into writing template yet
public/
  fonts/                   # self-hosted variable woff2 files
  resume.pdf
  favicon.svg / .png, apple-touch-icon.png, avatar.webp, og-default.png
scripts/
  generate-brand-assets.mjs  # raster brand assets from SVG via Sharp/Pango
```

### Naming

- Components: `PascalCase.astro`
- Utilities: `camelCase.ts`
- Content files: `kebab-case.md` / `.mdx`
- CSS custom properties: `--kebab-case`
- Folders: `kebab-case`

### Component rules

- Components receive props, not global state.
- Single, clear responsibility per component.
- More than 4 props means the component is doing too much — split it.

### 8.1 Content schemas (shipped)

Defined in `src/content.config.ts`. All collections typed via Zod.

**Project frontmatter — shipped**

```yaml
title: string
subtitle: string?
date: ISO date                                # primary sort
status: string?                               # freeform, e.g. "Submitted to Nature Cities · May 2026"
summary: string
register: "cartesian" | "tropical"            # default cartesian
featured: boolean                             # homepage strip
featuredOrder: number?                        # ordering within strip
heroImage: string?
heroAlt: string?
collaborators: string[]                       # default []
links:
  paper: url?
  preprint: url?
  repo: url?
  app: url?
  site: url?
tags: string[]                                # kebab-case by convention
updated: ISO date?
```

**Writing frontmatter — shipped**

```yaml
title: string
date: ISO date
summary: string
register: "cartesian" | "tropical"            # default tropical
language: "en" | "fr" | "pt"                  # default "en"
tags: string[]
updated: ISO date?
```

**Schema enrichments — deferred (see § 11 decisions log):**

- `status` → enum + separate `statusDetail` text field
- `collaborators` → `{ name: string, affiliation?: string, url?: string }[]`
- `draft: boolean` on both collections
- `readingTime: number` on writing (utility exists in `src/utils/readingTime.ts`)
- `slug: string` only if we move away from filename-derived IDs

### 8.2 Performance budget

_Not yet measured against these targets — verify before adopting as DoD._

- Homepage: < 100kb total (excluding fonts), < 1.5s LCP on 4G
- Project page: < 200kb (excluding hero), < 2s LCP
- Images: WebP or AVIF, lazy-loaded below the fold, served at 2x DPR
- Astro islands only where interactivity is required — most pages ship zero JS

### 8.3 Deploy

`.github/workflows/deploy.yml` builds and publishes to GitHub Pages on push to `main`. Custom domain via `public/CNAME` (added at launch cutover, not before). No preview environments yet.

---

## 9. House rules

### Do

- Pin dependency major versions; allow caret minor/patch (current `package.json` uses caret ranges — keep that).
- Self-host all fonts.
- Write CSS that reads cleanly in 6 months.
- Cite collaborators by name + affiliation.
- Test at 375px, 768px, 1280px before merging.
- Audit copy against § 4 before merging (invoke `/anti-perf` as a prompting hook).
- Keep this file (`CLAUDE.md`) up to date as the system evolves.
- Update the decisions log (§ 11) when a meaningful choice is made.

### Do not

- Add a UI library, CSS framework other than Tailwind 4 (already in), or animation library.
- Use Tailwind utility classes in components — tokens via `@theme` only.
- Use placeholder content past day one of any build session.
- Surface stealth apps on the site until launch is public.
- Create empty `/fr/` or `/pt/` routes.
- Add a project to the homepage strip without a real visual (typographic placeholder is acceptable interim, but flag it).
- Use the words "thrilled," "proud," "honored," "humbled," "excited," "delighted," "blessed" anywhere on the site or in commit messages.
- Push directly to `main` after launch — PRs only.
- Surface **Azimuth** on this site. Azimuth has its own brand and site.

---

## 10. Definition of done (per page)

A page ships only when all of the following hold:

1. Content is real (no placeholder, no lorem)
2. At least one real visual asset, or a designed typographic empty state
3. Register declared on `<html data-register>`, consistent throughout
4. Copy audited against § 4
5. Type sizes drawn from the scale in § 5.2, no exceptions
6. Spacing from § 5.4 where applicable, no exceptions
7. Tested at 375 / 768 / 1280
8. Lighthouse performance ≥ 90, accessibility ≥ 95 _(targets — verify before declaring DoD strict)_
9. Council sign-off invoked, or explicit waiver logged in § 11, for any new pattern

---

## 11. Decisions log

Format: `YYYY-MM-DD — decision — rationale.`

- 2026-05-12 — Stack: **Astro 6** over Next.js / Eleventy / Hugo. Content collections + MDX + islands fit the content shape; lower maintenance than Next; better component model than Eleventy/Hugo. Hugo previously tried and abandoned (template bugs, no design control).
- 2026-05-12 — **Tailwind 4 kept, but only for `@theme` token wiring and `@layer base` resets.** No utility classes in components. The discipline is enforced by convention, not tooling.
- 2026-05-12 — **No animation library.** Native CSS transitions only.
- 2026-05-12 — **GitHub Pages** hosting (current); revisit Cloudflare Pages only if image egress, preview deploys, or build-on-PR become real needs.
- 2026-05-12 — Repo stays at `github.com/thrmnn/thrmnn.github.io`. Custom domain via `CNAME` handles the URL — no rename needed.
- 2026-05-12 — i18n configured later, not at launch. No empty FR / PT shells.
- 2026-05-12 — Reference adaptations approved (some shipped, some deferred — see § 6): Monceau (uppercase mono labels ✓, credited footer ☐, title+context couplet ✓, `./` nav signal ☐); Gardinex (restraint ✓, paper-grain overlay ☐, small mono tags ✓).
- 2026-05-12 — Brand assets generated via `scripts/generate-brand-assets.mjs`: favicon.png (64), apple-touch-icon.png (180), avatar.webp (512), og-default.png (1200×630). Fraunces rendered through fontconfig + Sharp/Pango, not Georgia fallback.
- 2026-05-12 — **Schema enrichment queued, not blocking launch:** structured `collaborators[]`, `draft`, `status` enum + `statusDetail`, `readingTime`. Defer until first essay or first project page needs them.
- 2026-05-12 — **Git-derived `updated` timestamps queued.** Currently hand-maintained; move to build-time `git log -1 --format=%cI` derivation before the doc-maintenance lie becomes a habit.
- 2026-05-12 — **License: MIT for code, CC BY-NC 4.0 for written content.** _Action item:_ current `LICENSE.md` still attributes Hugo Blox template author (George Cushen); replace with the correct two-license setup before public-repo announcement.
- 2026-05-12 — **Tooling added:** `@astrojs/check` for typechecking, `prettier` + `prettier-plugin-astro` for formatting, and a markdown pipeline (`remark-smartypants`, `rehype-slug`, `rehype-autolink-headings`, `rehype-external-links`). All editorial niceties (curly quotes, em-dashes, heading anchors, safe external links) are now automatic. Shiki theme moved to `min-light` to suit Paper ground.
- 2026-05-12 — **Brand mark canonical source: `monogram/Asset 1.svg`.** User's Illustrator export, single hand-drawn T·A·H wordmark. All site favicons (`public/favicon.svg`, `favicon.png`, `favicon.ico`, `apple-touch-icon.png`, `avatar.webp`) and the full monogram asset pack (3 color variants × 9 raster sizes + 3 master SVGs + multi-size .ico) regenerate from this source via `npm run monogram`. Rasterization is native per target size (no supersample + Lanczos downscale) — crisp edges down to 16 px. The previous auto-generated Space Grotesk monogram (`scripts/generate-monogram.py`) is superseded and not invoked by the `monogram` script; kept in repo only as historical reference.
- 2026-05-12 — **Phase 4.5 UX/nav upgrade shipped** on `phase-4.5-ux-upgrade` branch (14 commits). Adds: header auxiliary row (RIO · 2026), `./` filesystem nav link, Breadcrumb component, two-row footer credit card with `lastShipped`, MonoRow above titles, StatusPill, ExternalLink, view transitions for shared chrome, project tile hover/focus reveal, `heroKind` schema + PaperGrainOverlay stub, Updated-date life signal. Spacing scale `--s-1`…`--s-32` now instantiated. Mono type tokens `--text-mono-{xs,sm}` instantiated. Body + display tokens still pending.

---

## 12. Working with Claude Code in this repo

A few practical notes for prompting:

- Default to invoking the council (§ 3) on anything visual, structural, or copy-related. Don't ask Claude to "just style it."
- `/council`, `/anti-perf`, `/register-check` are **prompting hooks, not Claude Code slash commands.** When you type them, Claude treats them per § 3.
- When asking for a new page or component, name the register explicitly. Don't make Claude guess.
- Reject any suggestion that introduces a dependency not already listed in § 8. The discipline is the point.
- If Claude proposes a "small tweak" to type or color, ask whether it's drawn from § 5.2 or § 5.3. If it isn't, the answer is no.
- Anna's voice is yours to use too. Channel it when a session starts drifting toward ambition without maintenance plan.

---

## 13. Out of scope (deliberately)

- **Azimuth** (separate brand, separate site, separate conversation)
- Stealth apps shipping May–June (not surfaced until public launch)
- CRM, newsletter, analytics dashboards
- Comments, reactions, social sharing widgets
- Dark mode
- A blog in the listicle sense — writing is essays, not posts
