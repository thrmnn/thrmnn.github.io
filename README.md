# Théo Hermann - Personal Academic Website

Personal academic website built with [Hugo Blox Builder](https://hugoblox.com/), a Hugo-based static site generator.

## Quick Start

### Prerequisites

- [Hugo](https://gohugo.io/) installed (version 0.136.5 or compatible)
- Python 3.x (for sync script)
- Git

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/theoh-io/theoh-io.github.io.git
   cd theoh-io.github.io
   ```

2. Install Hugo (if not already installed):
   ```bash
   # macOS
   brew install hugo
   
   # Linux
   sudo apt-get install hugo
   
   # Or download from https://github.com/gohugoio/hugo/releases
   ```

## Development

### Local Development Server

To run the website locally for development:

```bash
hugo server
```

This will start a local server (usually at `http://localhost:1313`). The site will automatically reload when you make changes to the files.

**Options:**
- `hugo server --bind 0.0.0.0` - Make the server accessible from other devices on your network
- `hugo server --port 8080` - Run on a different port
- `hugo server --disableFastRender` - Disable fast rendering for debugging

### Building for Production

To generate the static site files:

```bash
hugo
```

The output will be in the `public/` directory, ready to deploy.

## Updating Personal Information

This repository uses a centralized information system for easy updates.

### Using the Sync Script

1. **Update `PERSONAL_INFO.md`** with your latest information (this is your single source of truth)

2. **Run the sync script** to automatically update all configuration files:
   ```bash
   python3 sync_personal_info.py
   ```

   This script automatically updates:
   - `config/_default/hugo.yaml` - Site title and base URL
   - `config/_default/params.yaml` - SEO description, navbar, social links
   - `content/authors/admin/_index.md` - Author profile
   - `content/_index.md` - Homepage contact buttons and hero section

3. **Review the changes**:
   ```bash
   git diff
   ```

4. **Test locally**:
   ```bash
   hugo server
   ```

5. **Commit and push** when satisfied:
   ```bash
   git add .
   git commit -m "Update personal information"
   git push
   ```

### Manual Updates

If you prefer to update files manually, the key files are:
- `PERSONAL_INFO.md` - Centralized personal information
- `config/_default/hugo.yaml` - Site configuration
- `config/_default/params.yaml` - Site parameters and SEO
- `content/authors/admin/_index.md` - Author profile and biography
- `content/_index.md` - Homepage layout

## Project Structure

```
.
├── assets/              # Media assets (images, icons)
├── config/              # Hugo configuration files
│   └── _default/
│       ├── hugo.yaml    # Main site configuration
│       ├── params.yaml  # Site parameters
│       └── menus.yaml   # Navigation menus
├── content/             # Site content
│   ├── authors/         # Author profiles
│   ├── publication/     # Publication entries
│   ├── post/            # Blog posts
│   ├── event/           # Events and talks
│   └── _index.md        # Homepage
├── static/              # Static files (PDFs, etc.)
├── sync_personal_info.py # Automated sync script
├── PERSONAL_INFO.md     # Centralized personal information
└── ROADMAP.md           # Publication roadmap checklist
```

## Deployment

This site is configured for GitHub Pages. The repository name `theoh-io.github.io` means it will automatically deploy to `https://theoh-io.github.io`.

### Automatic Deployment

1. Push changes to the `main` branch
2. GitHub Actions (if configured) will build and deploy automatically
3. Or use Netlify/Vercel for automatic deployments with previews

### Manual Deployment

1. Build the site: `hugo`
2. Push the `public/` directory to the `gh-pages` branch, or
3. Use a CI/CD service like GitHub Actions

## Documentation

- **`PERSONAL_INFO.md`** - Centralized personal information template
- **`ROADMAP.md`** - Step-by-step checklist for website publication
- **`SYNC_SCRIPT_README.md`** - Detailed sync script documentation

## Resources

- [Hugo Blox Builder Documentation](https://docs.hugoblox.com/)
- [Hugo Documentation](https://gohugo.io/documentation/)
- [Theme Documentation](https://github.com/HugoBlox/theme-academic-cv)

## License

This website template is based on the Hugo Academic CV theme. Check the LICENSE file for details.

---

**Maintained by:** Théo Hermann  
**Last Updated:** 2025-01-XX
