# Website Status — thrmnn.github.io

**Last updated:** 2026-03-18

## What's Done

### Homepage (`content/_index.md`)
- **Hero section**: Compelling title + subtitle with description text, darkened background image
- **About/Bio**: Concise, impact-focused bio with clear career narrative (MIT, Roboat, IRI, EPFL)
- **News timeline**: Populated 2021-2025 with real career milestones (was mostly empty placeholders)
- **Experience**: All positions with accurate dates and improved summaries
- **Projects collection**: 6 research projects displayed in card view
- **Platforms collection**: 4 robotic platforms displayed
- **Contact section**: Email + LinkedIn buttons

### Author Profile (`content/authors/admin/_index.md`)
- Role simplified to "Robotics AI Engineer" (was overly long tagline)
- Fixed "Massachussetts" typo
- Expanded interests from 3 to 6 research areas
- Work experience dates corrected (Roboat: March-August 2024, not 2023)
- All position summaries rewritten to be achievement-focused

### Content Sections — Populated
| Section      | Count | Status |
|-------------|-------|--------|
| Projects     | 6     | Well populated with descriptions |
| Events/Talks | 11    | Populated (lab visits, conferences) |
| Platforms    | 4     | Borinot, F1Tenth, Roboat, Thymio |
| Posts        | 1     | Learning from Demonstration |
| Teaching     | 2     | JS, Python |
| Publication  | 0     | Empty |

### Technical
- Hugo builds clean (168 pages, no errors)
- Fixed `compact` view warnings (event + post index pages)
- SEO description improved in `params.yaml`

## What Needs Work

### High Priority
- **Publications section**: Currently empty — add AGU 2025 abstract and any other papers
- **Resume PDF**: Referenced in bio (`uploads/resume.pdf`) — ensure it's current
- **Project images**: Some projects reference images (`projects/roboat_perception.jpg`, etc.) that may be missing from `assets/media/`

### Medium Priority
- **Skills & Languages**: Commented out in author profile — could enable with real data
- **Duplicate project folders**: Multiple folders for same projects (e.g., `aerial-lidar-tree-census` and `aerial-lidar-tree-census-masters-thesis-mit-scl`) — consolidate
- **Placeholder projects**: `pandas`, `pytorch`, `scikit`, `challenge`, `impact`, `links`, `solution`, `technologies` look like template/placeholder content — consider removing

### Low Priority
- **Hugo deprecation warnings**: Theme uses deprecated `_build` key and goldmark config — will resolve when Hugo Blox theme updates
- **Projects landing page** (`content/projects.md`): Shows "coming soon" placeholder — could re-enable collection block
- **Awards section**: Commented out — add if relevant awards exist
- **Google Analytics**: Not configured (fine for now)
