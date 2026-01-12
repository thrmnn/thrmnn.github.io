# Hugo Modules Version Pinning Guide

This guide explains how to manage and pin Hugo module versions for your Hugo Blox academic portfolio website.

## Why Pin Module Versions?

Version pinning provides several benefits:

- **Reproducibility**: Ensures consistent builds across different machines and CI/CD environments
- **Stability**: Prevents unexpected breaking changes from module updates
- **Predictability**: Makes it explicit when dependencies are updated
- **Control**: Allows you to test updates before deploying to production
- **Debugging**: Helps identify which version change caused an issue

## Current Module Versions

Your site currently uses the following pinned module versions in `config/_default/module.yaml`:

| Module | Version | Purpose |
|--------|---------|---------|
| `blox-plugin-netlify` | `v1.1.2-0.20231209203044-d31adfedd40b` | Netlify integration and deployment features |
| `blox-tailwind` | `v0.3.1` | CSS framework and styling system |

### Version Format Explanation

- **Standard semver** (e.g., `v0.3.1`): Standard semantic versioning format
  - `0` = major version (breaking changes possible)
  - `3` = minor version (new features, backward compatible)
  - `1` = patch version (bug fixes)

- **Pseudo-version** (e.g., `v1.1.2-0.20231209203044-d31adfedd40b`): Git-based version
  - `v1.1.2` = based on latest tag
  - `-0` = 0 commits since that tag
  - `.20231209203044` = date and time of commit
  - `d31adfedd40b` = short commit hash

## How to Identify Current Versions

### Method 1: Check `go.mod` (Easiest)

The `go.mod` file in the repository root shows all module versions currently installed:

```bash
cat go.mod
```

Look for the `require` section:

```
require (
    github.com/HugoBlox/hugo-blox-builder/modules/blox-plugin-netlify v1.1.2-0.20231209203044-d31adfedd40b
    github.com/HugoBlox/hugo-blox-builder/modules/blox-tailwind v0.3.1
)
```

### Method 2: Check Installed Module Versions

```bash
# List all installed Hugo modules with their versions
hugo mod graph
```

Example output:
```
github.com/HugoBlox/hugo-blox-builder/starters/academic-cv
github.com/HugoBlox/hugo-blox-builder/starters/academic-cv → github.com/HugoBlox/hugo-blox-builder/modules/blox-plugin-netlify v1.1.2-0.20231209203044-d31adfedd40b
github.com/HugoBlox/hugo-blox-builder/starters/academic-cv → github.com/HugoBlox/hugo-blox-builder/modules/blox-tailwind v0.3.1
```

### Method 3: Check Module Directories

```bash
# List module versions from the module cache
ls -la hugo_modules/github.com/HugoBlox/hugo-blox-builder/modules/
```

### Method 4: Get Latest Available Versions

To see what newer versions are available (without updating):

```bash
# Check for latest versions of all modules
hugo mod get -u --dry-run
```

This shows what would be updated without actually making changes.

## How to Update Modules

### Safe Update Workflow

Always follow this process when updating modules:

#### Step 1: Check Current Versions

```bash
hugo mod graph
```

Note the current versions before making changes.

#### Step 2: Update to Latest Patch Version (Recommended)

This updates within the same major.minor version (safer):

```bash
# Update all modules to their latest patch versions
hugo mod get -u

# Or update a specific module
hugo mod get -u github.com/HugoBlox/hugo-blox-builder/modules/blox-tailwind
```

#### Step 3: Update go.mod and module.yaml

After running `hugo mod get -u`, two things happen:

1. **go.mod** is automatically updated with new versions
2. **You must manually update** `config/_default/module.yaml` to match

Compare `go.mod` with `config/_default/module.yaml`:

```bash
# View updated versions in go.mod
grep "github.com/HugoBlox" go.mod

# Update the versions in module.yaml to match
# Edit config/_default/module.yaml and update version: fields
```

#### Step 4: Test Locally

```bash
# Clear the module cache to force re-download
rm -rf hugo_modules/
hugo mod clean

# Run Hugo development server to test
hugo server

# Check for any build warnings or errors
```

#### Step 5: Verify Build

```bash
# Build the production site to ensure everything works
hugo --logLevel=warn --minify

# Check the output
ls -la public/
find public -name "*.html" | head -5
```

#### Step 6: Commit the Changes

```bash
# Stage both files
git add config/_default/module.yaml go.mod go.sum

# Create a descriptive commit
git commit -m "chore: update Hugo modules to latest versions

- blox-plugin-netlify: v1.1.2-xxx → vX.X.X
- blox-tailwind: v0.3.1 → vX.X.X

All tests pass locally. Site builds successfully."

# Push to trigger CI/CD
git push
```

### Update Specific Module to Specific Version

If you need a specific version (e.g., to test a pre-release):

```bash
# Update to a specific version
hugo mod get -u github.com/HugoBlox/hugo-blox-builder/modules/blox-tailwind@v0.4.0

# Or get the latest pre-release
hugo mod get -u github.com/HugoBlox/hugo-blox-builder/modules/blox-tailwind@latest
```

## Module Configuration Details

### In `config/_default/module.yaml`

The configuration file serves as documentation and explicit version declaration:

```yaml
imports:
  # Each module should have:
  # 1. A comment explaining its purpose
  # 2. The path to the module
  # 3. The exact pinned version

  - path: github.com/HugoBlox/hugo-blox-builder/modules/blox-plugin-netlify
    version: v1.1.2-0.20231209203044-d31adfedd40b
```

**Important**: Both `go.mod` and `config/_default/module.yaml` must stay in sync for version pinning to work correctly.

## Mounts Configuration

The `mounts` section in `module.yaml` connects module components to your site structure. These don't have versions but define the file mappings:

```yaml
mounts:
  # Maps Hugo Blox community components to your layouts
  - source: hugo-blox/blox/community
    target: layouts/partials/blox/community/
    includeFiles: '**.html'

  # Maps Tailwind CSS files to your assets
  - source: hugo-blox/blox
    target: assets/dist/community/blox/
    includeFiles: '**.css'
```

These are automatically managed by the modules and usually don't need manual changes.

## Troubleshooting Module Issues

### Modules won't download

```bash
# Clear Hugo module cache
hugo mod clean

# Verify module paths are correct
hugo mod get -u

# Check if Go modules are initialized
cat go.mod
```

### Build fails after module update

```bash
# Revert to previous go.mod
git checkout go.mod go.sum

# Clear cache
hugo mod clean

# Get previous versions
hugo mod get -u
```

### Mismatch between go.mod and module.yaml

Always ensure both files reference the same versions. The `go.mod` file is the source of truth; `module.yaml` should document it.

## References

- [Hugo Modules Documentation](https://gohugo.io/hugo-modules/)
- [Go Modules Reference](https://golang.org/ref/mod)
- [Hugo Blox Documentation](https://docs.hugoblox.com/)
- [Semantic Versioning](https://semver.org/)

## Updating This Guide

If you discover new version management patterns or encounter issues, please update this guide so the team has the most current information.
