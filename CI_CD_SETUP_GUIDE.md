# CI/CD and Development Workflow Setup Guide

This guide walks you through setting up and using the new CI/CD and development workflow components for your Hugo-based academic portfolio website.

## Overview

Three new systems have been implemented:

1. **GitHub Actions Build Check** - Validates Hugo builds on every push and pull request
2. **Pre-commit Hook** - Automatically syncs personal info when PERSONAL_INFO.md is committed
3. **Pinned Module Versions** - Locks Hugo module versions to prevent unexpected changes

## Quick Start

### For Local Development

#### Step 1: Configure Git Hooks

```bash
# Navigate to your repository root
cd ~/thrmnn.github.io

# Configure git to use the shared .githooks directory
git config core.hooksPath .githooks

# Verify configuration
git config core.hooksPath
# Should output: .githooks
```

#### Step 2: Make Hook Executable (if needed)

```bash
# Ensure the pre-commit hook is executable
chmod +x .githooks/pre-commit

# Verify
ls -la .githooks/pre-commit
# Should show: -rwxr-xr-x (with execute permission)
```

#### Step 3: Verify Python 3 is Available

```bash
python3 --version
# Should show Python 3.8 or later
```

#### Step 4: Test the Setup

```bash
# Test by staging PERSONAL_INFO.md
echo "" >> PERSONAL_INFO.md
git add PERSONAL_INFO.md

# Attempt a commit (the pre-commit hook will run automatically)
git commit -m "test: verify pre-commit hook

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"

# You should see:
# - "ℹ Detected PERSONAL_INFO.md in staged files"
# - "✓ Running sync_personal_info.py..."
# - Sync output showing what was updated
# - "✓ Personal info sync completed successfully"

# If everything worked, undo the test
git reset --soft HEAD~1
git restore --staged PERSONAL_INFO.md
git restore PERSONAL_INFO.md
```

### For CI/CD Pipeline

No additional setup needed! The GitHub Actions workflow (`.github/workflows/build-check.yml`) is automatically triggered on:
- Every push to `main` or `develop` branches
- Every pull request to `main` or `develop` branches

The workflow will:
- Check out your code
- Install Hugo 0.136.5
- Download module dependencies
- Build the site
- Validate the output
- Comment on PRs with results

## File Structure

```
.
├── .github/
│   └── workflows/
│       └── build-check.yml              # GitHub Actions workflow
├── .githooks/
│   ├── pre-commit                       # Git hook (syncs personal info)
│   └── README.md                        # Hook documentation
├── config/_default/
│   └── module.yaml                      # Pinned module versions (updated)
├── CI_CD_SETUP_GUIDE.md                 # This file
└── MODULES_GUIDE.md                     # Detailed module management guide
```

## Detailed Setup Instructions

### A. GitHub Actions Build Check

**Files involved:**
- `.github/workflows/build-check.yml` - The workflow definition

**What it does:**
1. Runs on every push and pull request
2. Sets up Ubuntu with Hugo 0.136.5 (extended)
3. Downloads module dependencies
4. Builds the entire site
5. Validates output
6. Adds comments to PRs about build status

**No setup required!** It works automatically once committed to GitHub.

**View results:**
- Go to your repository on GitHub
- Click "Actions" tab
- See all workflow runs and their status

### B. Pre-commit Hook

**Files involved:**
- `.githooks/pre-commit` - The hook script
- `.githooks/README.md` - Detailed hook documentation

**Setup on your local machine:**

```bash
# Step 1: Clone the repository (if you haven't already)
git clone https://github.com/thrmnn/thrmnn.github.io.git
cd thrmnn.github.io

# Step 2: Configure git to use the shared hooks directory
git config core.hooksPath .githooks

# Step 3: Verify the hook is executable
chmod +x .githooks/pre-commit

# Step 4: (Optional) Test locally
# Edit PERSONAL_INFO.md
nano PERSONAL_INFO.md
# Make a small change and save

# Stage the file
git add PERSONAL_INFO.md

# Try to commit - the hook will run automatically
git commit -m "chore: update personal info

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

**What happens when you commit PERSONAL_INFO.md:**

1. Hook detects `PERSONAL_INFO.md` in staged files
2. Runs `python3 sync_personal_info.py`
3. Script parses PERSONAL_INFO.md
4. Updates config files automatically:
   - `config/_default/hugo.yaml` (site title, base URL)
   - `config/_default/params.yaml` (description, social handles)
   - `content/authors/admin/_index.md` (profile info, education, work)
   - `content/_index.md` (hero section, contact buttons)
5. Auto-stages modified files
6. Allows commit to proceed

**If the sync script fails:**

```
✗ Sync script failed with exit code 1
Script output:
[error message here]
✗ Commit aborted. Fix the issues above and try again.
```

**Fix and retry:**
```bash
# Fix the issue in PERSONAL_INFO.md
nano PERSONAL_INFO.md

# Stage again
git add PERSONAL_INFO.md

# Try commit again
git commit -m "..."
```

**To bypass the hook (use only when necessary):**

```bash
git commit --no-verify
```

### C. Pinned Module Versions

**Files involved:**
- `config/_default/module.yaml` - Module configuration with pinned versions
- `go.mod` - Go module dependencies (automatically managed)
- `MODULES_GUIDE.md` - Detailed module management guide

**Current pinned versions:**

```yaml
imports:
  - path: github.com/HugoBlox/hugo-blox-builder/modules/blox-plugin-netlify
    version: v1.1.2-0.20231209203044-d31adfedd40b
  - path: github.com/HugoBlox/hugo-blox-builder/modules/blox-tailwind
    version: v0.3.1
```

**Why this matters:**

- ✅ **Reproducible builds**: Same versions on all machines
- ✅ **Prevents breaking changes**: Updates are opt-in, not automatic
- ✅ **Consistent CI/CD**: GitHub Actions uses the same versions locally
- ✅ **Documentation**: Clear about what versions are in use

**Check current versions:**

```bash
# See installed module versions
hugo mod graph

# See available updates (without installing)
hugo mod get -u --dry-run
```

**Update modules safely:**

```bash
# 1. Update locally (development)
hugo mod get -u

# 2. Test thoroughly
hugo server

# 3. Build production site
hugo --logLevel=warn --minify

# 4. Update module.yaml to match go.mod
# Edit config/_default/module.yaml

# 5. Commit changes
git add config/_default/module.yaml go.mod go.sum
git commit -m "chore: update Hugo modules to latest versions"

# 6. Push - GitHub Actions will validate the build
git push
```

For detailed version management, see `MODULES_GUIDE.md`.

## Workflow Integration

### Local Development Workflow

```bash
# 1. Pull latest changes
git pull

# 2. Ensure git hooks are configured
git config core.hooksPath .githooks

# 3. Work on your changes
# Make edits to content, config, etc.

# 4. If updating personal info:
nano PERSONAL_INFO.md
git add PERSONAL_INFO.md

# 5. Commit (hook runs automatically)
git commit -m "update: refresh personal information

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"

# 6. Push to trigger GitHub Actions
git push

# 7. Monitor GitHub Actions (optional)
# Go to https://github.com/thrmnn/thrmnn.github.io/actions
```

### CI/CD Pipeline Workflow

1. **Push to GitHub** → GitHub Actions triggered
2. **Build Check** → Hugo builds site
3. **Validation** → Output verified
4. **PR Comments** → Build status posted (for PRs)
5. **Merge** → Site builds, ready for deployment

## Troubleshooting

### Hook Not Running

```bash
# Verify configuration
git config core.hooksPath
# Should show: .githooks

# If not set, configure it
git config core.hooksPath .githooks

# Check permissions
ls -la .githooks/pre-commit
# Should have execute permission (rwx)

# If not, make executable
chmod +x .githooks/pre-commit
```

### Hook Runs But Python Script Fails

```bash
# Verify Python 3 is installed
python3 --version

# Test script directly
python3 sync_personal_info.py

# Check for errors in the script output
```

### GitHub Actions Build Fails

1. Check GitHub Actions tab: https://github.com/thrmnn/thrmnn.github.io/actions
2. Click the failed workflow run
3. See detailed error logs
4. Common issues:
   - Hugo module download failed: Run `hugo mod get -u` locally and push `go.mod`
   - Build errors: Run `hugo --logLevel=warn` locally to see the issue
   - Syntax errors in YAML: Validate `config/_default/module.yaml`

### Modules Not Downloading in GitHub Actions

This usually means `go.mod` or `go.sum` is out of sync.

```bash
# Locally, get the latest module state
hugo mod get -u

# Commit the updated go.mod and go.sum
git add go.mod go.sum
git commit -m "chore: update module checksums"
git push
```

## For Team Members

If you're new to the repository:

1. **Clone the repo**
   ```bash
   git clone https://github.com/thrmnn/thrmnn.github.io.git
   cd thrmnn.github.io
   ```

2. **Configure git hooks** (one-time setup)
   ```bash
   git config core.hooksPath .githooks
   chmod +x .githooks/pre-commit
   ```

3. **Start developing**
   ```bash
   # Make your changes
   git add ...

   # Commit (hooks run automatically)
   git commit -m "..."

   # Push
   git push
   ```

4. **Check if CI passes**
   - Go to GitHub Actions tab
   - Verify your build check passed

## Environment Requirements

### For Local Development

- **Git**: v2.9+ (for `core.hooksPath` support)
- **Hugo**: 0.136.5 (extended version)
- **Python**: 3.8+ (for sync script)
- **Go**: v1.19+ (for Hugo modules, required by Hugo)

### For CI/CD

- **GitHub Actions**: No special requirements
- Uses: Ubuntu 22.04, Hugo 0.136.5, Python 3.x

## Documentation References

- [GitHub Actions Workflow](.github/workflows/build-check.yml) - Build validation
- [Pre-commit Hook](.githooks/pre-commit) - Auto-sync documentation
- [Git Hooks README](.githooks/README.md) - Hook setup and troubleshooting
- [Modules Guide](MODULES_GUIDE.md) - Detailed module version management
- [Sync Script](sync_personal_info.py) - Personal info synchronization

## Getting Help

### Common Questions

**Q: I edited PERSONAL_INFO.md but the hook didn't run.**
A: Make sure PERSONAL_INFO.md is staged: `git add PERSONAL_INFO.md`

**Q: Can I update modules manually?**
A: Yes, but follow the process in MODULES_GUIDE.md to keep go.mod and module.yaml in sync.

**Q: What if GitHub Actions build fails but my local build works?**
A: Usually means go.mod is out of sync. Run `hugo mod get -u` locally and push the changes.

**Q: Can I disable the pre-commit hook?**
A: Yes, use `git commit --no-verify`, but this should only be for emergencies.

## Next Steps

1. ✅ Configure git hooks locally: `git config core.hooksPath .githooks`
2. ✅ Test the pre-commit hook with PERSONAL_INFO.md
3. ✅ Verify GitHub Actions works on the next push
4. ✅ Review module versions: `hugo mod graph`
5. 📖 Read detailed guides: MODULES_GUIDE.md, .githooks/README.md

## Version History

- **2026-01-12**: Initial implementation
  - GitHub Actions build check (Hugo 0.136.5)
  - Pre-commit hook for personal info sync
  - Pinned module versions in config/_default/module.yaml

## Support and Feedback

If you encounter issues or have suggestions:

1. Check the troubleshooting section above
2. Review the detailed documentation files
3. For GitHub Actions issues: Check GitHub Actions logs
4. For hook issues: Test manually with `python3 sync_personal_info.py`
5. For module issues: See MODULES_GUIDE.md
