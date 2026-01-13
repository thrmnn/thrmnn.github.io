# Run Cleanup and Sync Now

## Quick Command

Just run this single command - it will clean up old platforms and sync with PLATFORMS.md:

```bash
cd /home/theo/thrmnn.github.io && python3 sync_platforms.py
```

The `sync_platforms.py` script now automatically:
1. ✅ Creates/updates platforms from PLATFORMS.md
2. ✅ Removes any platforms NOT in PLATFORMS.md

## What Will Happen

**Platforms that will be KEPT** (from PLATFORMS.md):
- thymio-robot
- f1tenth-autonomous-racing
- borinot-drone
- roboat-autonomous-vessel

**Platforms that will be REMOVED** (old template platforms):
- agnathax
- aibo
- alma
- anymal
- anymal_on_wheels
- mini_cheetah
- mit_humanoid
- solo
- spot
- supermegabot
- unitree_b2-w

## After Running

After the script completes, your website will only show the 4 platforms you've actually worked with, as defined in PLATFORMS.md.

## Future Updates

From now on, whenever you:
- Edit PLATFORMS.md and commit (git hook auto-runs sync)
- Or manually run `python3 sync_platforms.py`

The website will automatically stay in sync with PLATFORMS.md!
