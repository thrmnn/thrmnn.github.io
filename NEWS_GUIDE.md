# How to Add News Content to Your Website

## Overview

The news section is located in `content/_index.md` and uses HTML with collapsible details sections organized by year. This is a **manual process** - you edit the file directly, and Hugo will automatically rebuild the site when you deploy.

## How It Works

### Static Site Generation (Hugo)

Your website uses **Hugo**, a static site generator. Here's how it works:

1. **You edit source files** (like `content/_index.md`) - these are your "source code"
2. **Hugo builds the site** - when you run `hugo` or deploy, Hugo reads your source files and generates static HTML
3. **The generated site** goes into the `public/` directory
4. **You deploy** the `public/` directory to GitHub Pages (or your hosting)

**Important:** Changes to `content/_index.md` are NOT automatically synced. You need to:
- Edit the file
- Build the site (`hugo`)
- Deploy (push to GitHub, or use your CI/CD)

## Adding News Entries

### Location
Edit: `content/_index.md` (around line 86-238)

### Structure

The news section uses HTML with collapsible `<details>` elements. Here's the structure:

```html
<details open>
  <summary>
    <strong>2025</strong>
  </summary>
  <div style="margin-left:6px; padding-left:20px; border-left:1px solid;">
    <p></p>
    
    <!-- Add your news entry here -->
    <details open>
      <summary>
        <strong>Jan 15: Your news title here</strong>
      </summary>
      Your news content here. You can use HTML links, formatting, etc.
    </details>
    
  </div>
</details>
```

### Example News Entry

Here's a complete example you can copy and modify:

```html
<details open>
  <summary>
    <strong>Jan 15: Started new research position at MIT</strong>
  </summary>
    I'm excited to announce that I've started as a Research Fellow at 
    <a href="https://senseablerio.mit.edu/" target="_blank" rel="noopener">MIT Senseable City Rio</a>, 
    working on LiDar-informed 3D modeling of favelas. This research focuses on 
    Computational Fluid Dynamics and Urban Planning.
</details>
```

### Adding Multiple Entries

Add multiple entries within the same year's `<div>`:

```html
<div style="margin-left:6px; padding-left:20px; border-left:1px solid;">
  <p></p>
  
  <!-- Entry 1 -->
  <details open>
    <summary>
      <strong>Jan 15: First news item</strong>
    </summary>
    Content for first item...
  </details>
  
  <!-- Entry 2 -->
  <details open>
    <summary>
      <strong>Feb 20: Second news item</strong>
    </summary>
    Content for second item...
  </details>
  
</div>
```

### Styling Options

- **Red highlight for important news:** Add `style="color:rgb(255,0,0);"` to the summary:
  ```html
  <summary>
    <strong style="color:rgb(255,0,0);">Jan 15: Important announcement</strong>
  </summary>
  ```

- **Links:** Use standard HTML anchor tags:
  ```html
  <a href="https://example.com" target="_blank" rel="noopener">Link text</a>
  ```

- **Bold/Italic:** Use `<strong>` and `<em>` tags

### Adding a New Year

If you need to add a new year (e.g., 2026), add it before the existing years:

```html
<details open>
  <summary>
    <strong>2026</strong>
  </summary>
  <div style="margin-left:6px; padding-left:20px; border-left:1px solid;">
    <p></p>
    <!-- Your 2026 news entries here -->
  </div>
</details>
```

## Workflow: Making Changes Live

### Option 1: Local Development (Recommended for Testing)

1. **Edit** `content/_index.md` with your news
2. **Test locally:**
   ```bash
   hugo server
   ```
   Visit `http://localhost:1313` to preview
3. **Build the site:**
   ```bash
   hugo
   ```
4. **Deploy:**
   ```bash
   git add .
   git commit -m "Add news entry"
   git push
   ```

### Option 2: Direct Edit & Deploy (If using GitHub Pages with Actions)

1. **Edit** `content/_index.md` directly on GitHub or locally
2. **Commit and push:**
   ```bash
   git add content/_index.md
   git commit -m "Add news entry"
   git push
   ```
3. **GitHub Actions** (if configured) will automatically:
   - Build the site with Hugo
   - Deploy to GitHub Pages
   - Your changes appear live in a few minutes

### Option 3: Manual Build & Deploy

1. **Edit** `content/_index.md`
2. **Build:**
   ```bash
   hugo
   ```
3. **Deploy the `public/` directory** to your hosting

## Important Notes

- **No automatic sync:** Unlike the `sync_personal_info.py` script for personal info, news entries are **manually edited** in the HTML
- **HTML required:** The news section uses raw HTML, not Markdown
- **Order matters:** Newer entries typically go at the top of each year
- **Test before deploying:** Always test locally with `hugo server` before pushing changes

## Quick Reference

**File to edit:** `content/_index.md` (lines ~86-238)

**Test locally:**
```bash
hugo server
```

**Build for production:**
```bash
hugo
```

**Deploy:**
```bash
git add content/_index.md
git commit -m "Update news"
git push
```

---

**Need help?** Check the Hugo documentation: https://gohugo.io/documentation/
