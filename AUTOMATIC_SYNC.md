# Automatic Sync Setup

## Overview

Your website now has **automatic synchronization** set up! Whenever you modify `PERSONAL_INFO.md` and commit it, the system will automatically:

1. Run the sync script (`sync_personal_info.py`)
2. Update all related configuration files
3. Stage the updated files for commit
4. Complete the commit with all synchronized changes

## How It Works

A **Git pre-commit hook** (`.git/hooks/pre-commit`) automatically detects when `PERSONAL_INFO.md` is being committed and:

1. Runs `sync_personal_info.py` to parse your personal information
2. Updates the following files automatically:
   - `config/_default/hugo.yaml` - Site title and base URL
   - `config/_default/params.yaml` - SEO description and social links
   - `content/authors/admin/_index.md` - Author profile (education, work, biography)
   - `content/_index.md` - Homepage contact buttons and hero section
3. Stages all modified files for the commit
4. Proceeds with the commit

## Usage

Simply edit `PERSONAL_INFO.md` and commit as usual:

```bash
git add PERSONAL_INFO.md
git commit -m "Update my personal information"
```

The hook will automatically:
- Run the sync script
- Update all related files
- Stage them for commit
- Complete the commit

You'll see output like:
```
ℹ️  Detected PERSONAL_INFO.md in staged files
ℹ️  Running sync_personal_info.py...
✓ Updated config/_default/hugo.yaml
✓ Updated config/_default/params.yaml
✓ Updated content/authors/admin/_index.md
✓ Updated content/_index.md
ℹ️  Modified files detected from sync:
 M content/authors/admin/_index.md
 M content/_index.md
✓ Updated files staged for commit
✓ Personal info sync completed successfully
```

## Manual Sync

If you need to sync manually without committing, you can still run:

```bash
python3 sync_personal_info.py
```

## Troubleshooting

### Hook Not Running

If the hook doesn't seem to be running:

1. Check that the hook is executable:
   ```bash
   ls -l .git/hooks/pre-commit
   ```
   Should show `-rwxr-xr-x` (executable)

2. If not executable, make it executable:
   ```bash
   chmod +x .git/hooks/pre-commit
   ```

### Sync Script Errors

If the sync script encounters errors:

1. The hook will show a warning but won't block the commit
2. Review the error message
3. Fix any issues in `PERSONAL_INFO.md`
4. Run `python3 sync_personal_info.py` manually to test

### Education Section Not Updating

If the education section isn't updating correctly:

1. Check that your `PERSONAL_INFO.md` follows the correct format
2. Ensure each education entry has:
   - `**Degree/Area:**`
   - `**Institution:**`
   - `**Start Date:**` (YYYY-MM-DD format)
   - `**End Date:**` (YYYY-MM-DD format or empty)
   - `**Summary:**` (optional)

3. Run the sync script manually to see any parsing errors:
   ```bash
   python3 sync_personal_info.py
   ```

## Disabling the Hook (if needed)

If you need to commit `PERSONAL_INFO.md` without running the sync:

```bash
git commit --no-verify -m "Your message"
```

**Note:** This bypasses the hook, so you'll need to run `sync_personal_info.py` manually afterward.

## Files Updated by Sync

The sync script updates these files based on `PERSONAL_INFO.md`:

| PERSONAL_INFO.md Section | Updated Files |
|-------------------------|---------------|
| Basic Information | `config/_default/hugo.yaml`, `content/authors/admin/_index.md` |
| Contact Information | `content/authors/admin/_index.md`, `content/_index.md` |
| Professional Information | `content/authors/admin/_index.md` |
| Education | `content/authors/admin/_index.md` |
| Work Experience | `content/authors/admin/_index.md` |
| Research Interests | `content/authors/admin/_index.md` |
| Biography | `content/authors/admin/_index.md` |
| Website Configuration | `config/_default/hugo.yaml`, `config/_default/params.yaml`, `content/_index.md` |

## Best Practices

1. **Always edit `PERSONAL_INFO.md` first** - It's your single source of truth
2. **Review the sync output** - Check that all files were updated correctly
3. **Test locally** - Run `hugo server` to preview changes before pushing
4. **Commit regularly** - Don't let `PERSONAL_INFO.md` get out of sync with the website files

---

**Last Updated:** 2025-01-13
