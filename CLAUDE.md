# CLAUDE.md

Primary context for **theo's personal site** on the `main` branch (active live site at `thrmnn.github.io`). Read at the start of every session. If a request conflicts with anything here, surface the conflict before acting.

A parallel rebrand exploration lives on `design-sprint-2026-05-14` (Astro + Fraunces + Cartesian/Tropical registers, `theoalessandro.com` brand). **Don't cross-pollinate without explicit user direction.**

---

## 1. Project north star

Personal site for **Théo Alessandro Hermann** — researcher and builder.

- **Primary research line:** MIT Senseable City Lab Rio — 3D digital twins of favelas from LiDAR for public health research.
- **Side build:** Open-source robotics software.
- **Past marquee credit:** Roboat (MIT spinoff), first engineering hire — past tense.

Tech portfolio first. Researcher-and-builder hybrid identity. The site exists to land senior perception/CV/robotics roles (full-time or freelance) and to anchor research credibility.

---

## 2. Brand brief (locked)

### Identity

- Public name: **Théo Alessandro Hermann** (accent on Théo preserved, always)
- Monogram: `T·A·H` (lives in `author.monogram`; surfaced in the header instrument console)
- Main GitHub: **`@thrmnn`** — NEVER use `@theoh-io` (that's a work account; outdated for personal portfolio)
- Domain: `thrmnn.github.io` (active; no domain cutover planned on this branch)

### Positioning (one-liner)

> Researcher and builder. Urban science at MIT Senseable City Lab Rio — 3D digital twins of favelas for public health. Open-source robotics on the side.

### Hero tag triplet

`Robotics · Urban Science · What Comes Next` (also appears in `site.ts` description verbatim).

### Audience priority

1. Hiring managers at frontier physical-AI companies (Anduril, Figure AI, Waymo) — perception / CV / robotics roles
2. Freelance clients in computer vision and robotics consulting
3. Research collaborators across urban science + perception

### Tenure

3 years of professional experience (EPFL VITA → IRI → Roboat → Senseable Rio).

---

## 3. The council (4 voices, prompting device)

Lighter than the rebrand's 7-voice council. Personas to invoke when a decision warrants more friction than a single voice produces.

- **Designer** — composition, hierarchy, motion discipline. "Does this earn its complexity?"
- **Frontend engineer** — perf, a11y, view transitions, Lighthouse. "Will this still pass at 95+?"
- **Hiring-manager lens** — "Would a recruiter at Anduril skim this and want to email?"
- **Skeptic** — pressure-tests every choice. Veto on ambition the system can't sustain.

### Invocation

When the user writes `/council [topic]`, walk it through these four voices and surface disagreement.

---

## 4. Visual system (locked — document-as-shipped)

### 4.1 Color & theme

- **Dark default**, explicit light toggle via `[data-theme]` + anti-FOUC inline script in `BaseLayout.astro`
- Tokens in `src/styles/global.css` (`@theme inline` for theme-overridable, `@theme` for static)
- AA contrast ratios documented inline in the light-mode block
- Blue accent on near-black (dark) / blue accent on near-white (light). **No third palette.**

### 4.2 Type stack

- **Display + body:** Space Grotesk (single variable woff2, latin + latin-ext via unicode-range)
- **Mono:** JetBrains Mono (variable wght, self-hosted — added 2026-05-27)
- Self-hosted only — CSP forbids third-party font fetches.

### 4.3 Motion — scroll-reveal system

The site ships a deliberate `[data-reveal]` motion layer:

- Timing tokens (`--dur-1`, `--dur-2`, `--ease-out`, etc.) in `global.css`
- `data-reveal` attribute on any element triggers staggered entry on viewport intersection
- `--reveal-d: N` controls stagger order (delay = N × base)
- Gated behind `@media (prefers-reduced-motion: no-preference)` — no-JS and reduced-motion loads see the static layout
- Reveal JS lives in `BaseLayout.astro` (small IntersectionObserver, no library)

### 4.4 Instrument-console header (`src/components/layout/Header.astro`)

The header is a deliberate "instrument" idiom, not a generic top bar:

- Monogram (`T·A·H` per-letter spans) + live readout (named section in view, updated on scroll)
- Monospace nav with an accent keypoint marker on the active route
- Condensed-on-scroll state via `.condensed` class
- Scan-progress line at the bottom edge, width = scroll position
- Mobile: keyboard-operable burger (Enter/Space toggles aria-expanded)

Treat this as identity, not decoration. Don't replace with a "normal" nav without explicit user direction.

### 4.5 Layout

- `--max-w-content: 1100px` content columns
- `--max-w-prose: 65ch` prose body
- `--max-w-wide: 1280px` hero/wide composition
- Named spacing tokens: `--space-section`, `--space-block`, `--space-element`, `--space-tight`

### 4.6 Convention: Tailwind utility-first in components

Tailwind utility classes are the chosen convention on `main`. Don't refactor components into scoped `<style>` blocks for the sake of it. Token references go through Tailwind's `@theme` system. The header is an exception — its instrument vocabulary lives in a scoped `<style>` block because Tailwind utilities can't express the choreography cleanly.

---

## 5. Site architecture (current — 2026-05-27)

| Path             | Purpose                                                                   |
| ---------------- | ------------------------------------------------------------------------- |
| `/`              | Long-page: Hero → Bio → News → Featured Work → Contact (single document) |
| `/projects`      | Project index                                                             |
| `/projects/[id]` | Project detail                                                            |
| `/cv`            | Full CV                                                                   |
| `/now`           | Sivers-style current state + timeline                                     |
| `/404`           | Not found                                                                 |
| `/rss.xml`       | Projects feed                                                             |

### Deliberately removed

- `/research` route and `publications` collection were removed before 2026-05-27. **`scripts/check-build.mjs` actively forbids `/research` from coming back and forbids the strings `Nature Cities` and `AGU Fall` from appearing in rendered HTML.** Anything referencing those terms — copy, project markdown summaries, navigation, JSON-LD — will fail `npm test` and block deploy.

---

## 6. Code conventions

### Stack

- Astro 6 (`^6.0.7`)
- Tailwind 4 — utility-class convention (see §4.6)
- npm (`package-lock.json`)
- MDX (via `@astrojs/mdx`) — currently only `.md` content but MDX configured
- Self-hosted fonts in `public/fonts/`
- GitHub Pages via `.github/workflows/deploy.yml`

### Naming

- Components: `PascalCase.astro` in `src/components/{layout,ui}/`
- Data: `camelCase.ts` in `src/data/`
- Content files: `kebab-case.md`

### npm scripts

```
npm run dev            # astro dev
npm run build          # astro build
npm run preview        # astro preview (serves dist/)
npm run check          # astro check — typecheck routes + content schemas
npm test               # astro check && node scripts/check-build.mjs
                       #   — the project's test suite. Verifies dist/ has
                       #     expected pages/assets, no forbidden terms or
                       #     removed routes, canonical name on homepage,
                       #     and every internal link resolves to a built file.
```

---

## 7. CI/CD pipeline

Two workflows under `.github/workflows/`:

- **`ci.yml`** — runs on every PR + every push to non-main branches. One `verify` job: `npm ci`, `npm run build`, `npm test`. Concurrency group cancels in-progress runs on the same branch.
- **`deploy.yml`** — runs only on push to `main`. Build → `npm test` (post-build verify) → upload artifact → `deploy-pages`. If any step fails, the deploy job never executes and the live site stays at the last successful deploy.

`main` should only receive merged PRs that passed CI. **Enable branch protection on `main` (manual UI step):** require `verify` to pass + require PR before merge.

---

## 8. House rules

### Do

- Pin dependency major versions; allow caret minor/patch
- Self-host fonts
- Run `npm test` locally before pushing
- Use `@thrmnn` everywhere a GitHub link appears
- Update §10 decisions log when meaningful choices are made

### Do not

- Use `@theoh-io` anywhere on the site
- Re-introduce `/research`, `publications`, `Nature Cities`, or `AGU Fall` to rendered HTML — `npm test` will block
- Surface "Roboat" as currently-active work — it's past
- Add Fraunces, Tropical/Cartesian registers, monogram swaps, or any rebrand-branch element without explicit direction
- Push to `main` without `npm test` green
- Skip the `prefers-reduced-motion` gate when adding new animations

---

## 9. Definition of done (per change)

A change ships only when:

1. `npm test` passes locally (typecheck + build verify)
2. `npm run build` succeeds locally
3. Visual sanity at 375 / 768 / 1280
4. No new dependency without explicit user approval
5. The user has reviewed the diff before merge to `main`

---

## 10. Decisions log

Format: `YYYY-MM-DD — decision — rationale.`

- 2026-05-27 — Work on `main` going forward; `design-sprint-2026-05-14` preserved as a parallel design exploration (separate brand, separate site). Don't cross-pollinate.
- 2026-05-27 — Identity locked: Théo Alessandro Hermann, GitHub `@thrmnn` (not theoh-io), 3 years tenure, current = Senseable Rio research + open-source robotics on the side, Roboat is past.
- 2026-05-27 — `/research` route and `publications` collection removed; `scripts/check-build.mjs` enforces this going forward.
- 2026-05-27 — Instrument-console header shipped (monogram + live readout + scan progress + condensed-on-scroll). Treat as identity.
- 2026-05-27 — Scroll-reveal motion system shipped via `[data-reveal]` + `--reveal-d` stagger token. Gated behind prefers-reduced-motion: no-preference.
- 2026-05-27 — JetBrains Mono self-hosted (woff2 + `@font-face`). The token referenced it for months; the font was missing.
- 2026-05-27 — CI/CD gated deploys: `npm test` runs as the post-build verifier in both workflows. Branch protection to be enabled manually in GitHub UI.

---

## 11. Out of scope (deliberately)

- Everything from `design-sprint-2026-05-14`: Fraunces, Tropical/Cartesian registers, Marginalia, VerticalLabel, PullQuote, SectionRule, anti-performative copy rules, TAH monogram pack, `theoalessandro.com` domain
- The `/research` route and `publications` collection — actively forbidden by `check-build.mjs`
- Removing dark mode
- Removing the instrument-console header
- Removing the scroll-reveal motion system
- Adding a third color palette
- CRM, newsletter, analytics dashboards (beyond Plausible)
- Comments, reactions, social sharing widgets
- Prettier (not adopted on `main`; the codebase formats by hand-convention)
