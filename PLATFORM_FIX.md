# Platform Section Fix

## Issue
Hugo server was failing with error:
```
GetTerms is not a method but has arguments
```

This was caused by the `article-grid` view trying to use `GetTerms` on tags, which has compatibility issues with Hugo 0.152.2.

## Fix Applied

1. **Changed view from `article-grid` to `card`**
   - File: `content/_index.md` line 263
   - The `card` view is simpler and doesn't have the `GetTerms` issue

2. **Commented out tags in all platform files**
   - Tags were causing template errors
   - Tags are now commented out (like other platform files in the template)
   - Files updated:
     - `content/platform/borinot-drone/index.md`
     - `content/platform/roboat-autonomous-vessel/index.md`
     - `content/platform/thymio-robot/index.md`
     - `content/platform/f1tenth-autonomous-racing/index.md`

3. **Updated sync script**
   - `sync_platforms.py` now comments out tags by default
   - This prevents future syncs from reintroducing the issue

## Testing

Run:
```bash
cd /home/theo/thrmnn.github.io
hugo server --bind 0.0.0.0 --port 1313
```

The server should now start without errors and the platforms section should display correctly.

## Note

The `card` view will display platforms in a card format instead of article-grid. This is a simpler, more compatible view that works with all Hugo versions.
