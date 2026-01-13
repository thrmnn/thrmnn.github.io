# Cleanup Old Platforms

## Problem
The platforms section is showing old template platforms that aren't in `PLATFORMS.md`.

## Solution

I've updated the `sync_platforms.py` script to automatically remove platforms not in `PLATFORMS.md`. 

### To clean up now, run:

```bash
cd /home/theo/thrmnn.github.io

# Remove old platform directories manually
rm -rf content/platform/agnathax
rm -rf content/platform/aibo
rm -rf content/platform/alma
rm -rf content/platform/anymal
rm -rf content/platform/anymal_on_wheels
rm -rf content/platform/mini_cheetah
rm -rf content/platform/mit_humanoid
rm -rf content/platform/solo
rm -rf content/platform/spot
rm -rf content/platform/supermegabot
rm -rf content/platform/unitree_b2-w

# Or run the cleanup script
python3 cleanup_old_platforms.py

# Then sync to ensure everything is up to date
python3 sync_platforms.py
```

### Expected Result

After cleanup, you should only have:
- `_index.md` (platform index page)
- `thymio-robot/`
- `f1tenth-autonomous-racing/`
- `borinot-drone/`
- `roboat-autonomous-vessel/`

### Future Updates

From now on, whenever you run `sync_platforms.py` (or commit `PLATFORMS.md`), it will automatically:
1. Create/update platforms from `PLATFORMS.md`
2. Remove any platforms not in `PLATFORMS.md`

This keeps your website in perfect sync with `PLATFORMS.md`!
