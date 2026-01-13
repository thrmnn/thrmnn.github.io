# Markdown-Only Workflow Guide

This guide explains how to manage your website content by editing only Markdown files.

---

## Overview

Your website uses a **Markdown-first workflow**. All content is managed through master Markdown files in the root directory:

- `PERSONAL_INFO.md` - Personal information, education, work experience, biography
- `PROJECTS.md` - All your research projects
- `EVENTS.md` - All your talks, presentations, and events
- `PLATFORMS.md` - All robotics platforms you've worked with

---

## How It Works

### 1. Personal Information (`PERSONAL_INFO.md`)

**Status:** ✅ Fully automated with sync script

- Edit `PERSONAL_INFO.md` to update:
  - Education
  - Work experience
  - Biography
  - Contact information
  - Research interests

- **Automatic sync:** When you commit `PERSONAL_INFO.md`, a git hook automatically runs `sync_personal_info.py` to update all Hugo config files.

**Usage:**
```bash
# Edit PERSONAL_INFO.md
git add PERSONAL_INFO.md
git commit -m "Update personal info"
# Sync happens automatically!
```

---

### 2. Projects (`PROJECTS.md`)

**Status:** Manual sync (script coming soon)

- Edit `PROJECTS.md` to add/update projects
- Each project follows this format:

```markdown
### Project Name
- **Title:** Your Project Title
- **Date:** YYYY-MM-DD
- **Summary:** One-line description
- **Description:** Detailed description (markdown supported)
- **External Link:** https://example.com (optional)
- **Image:** filename.jpg
- **Tags:** tag1, tag2, tag3
```

**Current Workflow:**
1. Edit `PROJECTS.md`
2. Manually create corresponding files in `content/project/` (for now)
3. Or wait for sync script to be created

**Future:** A `sync_projects.py` script will automatically convert `PROJECTS.md` entries to Hugo content files.

---

### 3. Events (`EVENTS.md`)

**Status:** Manual sync (script coming soon)

- Edit `EVENTS.md` to add/update talks and presentations
- Each event follows this format:

```markdown
### Event Name
- **Title:** Your Talk Title
- **Event Type:** Research Presentation / Invited Talk / Conference
- **Date:** YYYY-MM-DD or YYYY-MM-DDTHH:MM:SSZ
- **Location:** Venue Name
- **Summary:** One-line description
- **Abstract:** Detailed description
```

**Current Workflow:**
1. Edit `EVENTS.md`
2. Manually create corresponding files in `content/event/` (for now)
3. Or wait for sync script to be created

**Future:** A `sync_events.py` script will automatically convert `EVENTS.md` entries to Hugo content files.

---

### 4. Platforms (`PLATFORMS.md`)

**Status:** Manual sync (script coming soon)

- Edit `PLATFORMS.md` to add/update robotics platforms
- Each platform follows this format:

```markdown
### Platform Name
- **Title:** Platform Name
- **Date:** YYYY-MM-DD
- **Summary:** One-line description
- **Description:** Detailed description
- **External Link:** https://example.com
- **Image:** filename.jpg
- **Tags:** tag1, tag2, tag3
```

**Current Workflow:**
1. Edit `PLATFORMS.md`
2. Manually create corresponding files in `content/platform/` (for now)
3. Or wait for sync script to be created

**Future:** A `sync_platforms.py` script will automatically convert `PLATFORMS.md` entries to Hugo content files.

---

## File Locations

### Master Markdown Files (Edit These)
```
/
├── PERSONAL_INFO.md      ← Edit this
├── PROJECTS.md           ← Edit this
├── EVENTS.md             ← Edit this
└── PLATFORMS.md          ← Edit this
```

### Generated Hugo Content (Auto-updated)
```
content/
├── authors/admin/_index.md    ← Auto-synced from PERSONAL_INFO.md
├── _index.md                  ← Auto-synced from PERSONAL_INFO.md
├── project/                   ← Will be synced from PROJECTS.md
├── event/                     ← Will be synced from EVENTS.md
└── platform/                  ← Will be synced from PLATFORMS.md
```

---

## Quick Start

### Adding a New Project

1. Open `PROJECTS.md`
2. Copy the template at the top
3. Fill in your project details
4. Save the file
5. (For now) Manually create `content/project/your-project-name/index.md` with the Hugo front matter
6. (Future) Run `python3 sync_projects.py`

### Adding a New Event

1. Open `EVENTS.md`
2. Copy the template at the top
3. Fill in your event details
4. Save the file
5. (For now) Manually create `content/event/your-event-name/index.md` with the Hugo front matter
6. (Future) Run `python3 sync_events.py`

### Adding a New Platform

1. Open `PLATFORMS.md`
2. Copy the template at the top
3. Fill in your platform details
4. Save the file
5. (For now) Manually create `content/platform/your-platform-name/index.md` with the Hugo front matter
6. (Future) Run `python3 sync_platforms.py`

---

## Image Management

### Where to Place Images

- **Project images:** `assets/media/projects/`
- **Platform images:** `assets/media/platforms/`
- **Event images:** `assets/media/events/` (if needed)
- **Profile photo:** `content/authors/admin/avatar.png`

### How to Reference Images

In your Markdown files, just use the filename:
```markdown
- **Image:** my_project.jpg
```

The sync scripts will handle the full path conversion.

---

## Current Limitations

1. **Projects, Events, Platforms:** Currently require manual file creation in `content/` directories
2. **Sync Scripts:** Coming soon - will automate conversion from MD files to Hugo content

## Future Enhancements

- [ ] Create `sync_projects.py` script
- [ ] Create `sync_events.py` script
- [ ] Create `sync_platforms.py` script
- [ ] Add git hooks for automatic syncing (like `PERSONAL_INFO.md`)
- [ ] Add validation to ensure MD files are properly formatted

---

## Tips

1. **Keep it simple:** Use the templates provided in each MD file
2. **Be consistent:** Follow the same format for all entries
3. **Use markdown:** You can use markdown formatting in descriptions
4. **Test locally:** Run `hugo server` to preview changes
5. **Commit regularly:** Commit your MD file changes to git

---

## Need Help?

- See `PERSONAL_INFO.md` for an example of a fully automated sync
- Check `sync_personal_info.py` to understand how sync scripts work
- Review existing entries in `content/project/`, `content/event/`, `content/platform/` for Hugo format examples

---

**Last Updated:** 2025-01-13
