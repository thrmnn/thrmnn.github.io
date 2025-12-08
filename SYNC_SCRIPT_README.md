# Personal Information Sync Script

## Overview

The `sync_personal_info.py` script automatically synchronizes your personal information from `PERSONAL_INFO.md` to all website configuration files. This ensures your information stays consistent across the entire website.

## How It Works

1. **Reads** `PERSONAL_INFO.md` (your centralized data source)
2. **Parses** all personal information from the markdown file
3. **Updates** the following configuration files automatically:
   - `config/_default/hugo.yaml` - Site title and base URL
   - `config/_default/params.yaml` - SEO description, navbar logo, Twitter handle
   - `content/authors/admin/_index.md` - Complete author profile
   - `content/_index.md` - Homepage contact buttons and hero section

## Usage

### Basic Usage

```bash
python3 sync_personal_info.py
```

Or if the script is executable:

```bash
./sync_personal_info.py
```

### Workflow

1. **Update** `PERSONAL_INFO.md` with your latest information
2. **Run** the sync script: `python3 sync_personal_info.py`
3. **Review** the updated files to ensure everything looks correct
4. **Test** locally: `hugo server`
5. **Commit** changes to git

## What Gets Updated

### From PERSONAL_INFO.md → Configuration Files

| Information | Updated Files |
|------------|---------------|
| Name (First, Last, Display) | `hugo.yaml`, `params.yaml`, `author/_index.md` |
| Email Address | `author/_index.md`, `_index.md` |
| Social Media Links | `author/_index.md`, `_index.md` |
| Role/Tagline | `author/_index.md`, `params.yaml` |
| Organizations | `author/_index.md` |
| Education | `author/_index.md` |
| Work Experience | `author/_index.md` |
| Research Interests | `author/_index.md` |
| Biography | `author/_index.md` |
| Site Title | `hugo.yaml` |
| Base URL | `hugo.yaml` |
| Site Description | `params.yaml` |

## Important Notes

### Before Running

- ⚠️ **Always update `PERSONAL_INFO.md` first** before running the script
- 💾 **Make a backup** or commit your changes to git before running
- ✏️ **Fill in all required fields** in `PERSONAL_INFO.md` for best results

### After Running

- 👀 **Review the updated files** - The script makes automated updates, so verify everything looks correct
- 🧪 **Test locally** with `hugo server` before deploying
- 📝 **Manual edits may be needed** for complex formatting or special cases

## Troubleshooting

### Script doesn't find a file

If you see warnings like `⚠️ Warning: file not found`, check:
- That you're running the script from the website root directory
- That the file structure matches the expected paths

### Information not updating

- Check that the format in `PERSONAL_INFO.md` matches the expected format
- Ensure there are no typos in the field names (they're case-sensitive)
- Remove any example text `(*e.g., ...*)` from fields you want to use

### Parsing errors

- Make sure dates are in the format `YYYY-MM-DD` (e.g., `2025-01-15`)
- URLs should be complete (e.g., `https://github.com/username`)
- Email addresses should be in format `user@domain.com`

## Advanced Usage

### Testing without modifying files

You can modify the script to print what would be changed instead of actually updating files. Look for the file writing sections and comment them out, then add print statements.

### Custom fields

To add support for additional fields:
1. Update `PERSONAL_INFO.md` template with your new field
2. Add extraction logic in `parse_personal_info()` function
3. Add update logic in the appropriate `update_*()` function

## Example

```bash
# 1. Edit PERSONAL_INFO.md with your information
nano PERSONAL_INFO.md

# 2. Run the sync script
python3 sync_personal_info.py

# Output:
# 🔍 Reading PERSONAL_INFO.md...
# ✓ Parsed personal information for Théo Hermann
# 
# 📝 Updating configuration files...
# 
# ✓ Updated config/_default/hugo.yaml
# ✓ Updated config/_default/params.yaml
# ✓ Updated content/authors/admin/_index.md
# ✓ Updated content/_index.md
# 
# ✅ Sync complete! All configuration files have been updated.

# 3. Review changes
git diff

# 4. Test locally
hugo server

# 5. Commit if everything looks good
git add .
git commit -m "Update personal information"
```

## Support

If you encounter issues:
1. Check that `PERSONAL_INFO.md` follows the expected format
2. Review the script output for any warnings or errors
3. Verify file paths are correct
4. Test with a backup of your files first

---

**Remember:** This script automates the process, but always review the changes before deploying!

