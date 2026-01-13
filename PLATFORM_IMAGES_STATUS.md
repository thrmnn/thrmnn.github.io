# Platform Images Status

**Last Updated:** 2025-01-13

## Image Status

| Platform | Image File | Status | Location |
|----------|-----------|--------|----------|
| Thymio Robot | - | ⚠️ Missing | `assets/media/platforms/` |
| F1TENTH | - | ⚠️ Missing | `assets/media/platforms/` |
| Borinot Drone | `borinot_agile.png` | ✅ Added | `assets/media/platforms/borinot_agile.png` |
| Roboat Vessel | `roboat.jpg` | ✅ Added | `assets/media/platforms/roboat.jpg` |

## How Images Work

Images are referenced in `PLATFORMS.md` and automatically synced to Hugo content files via `sync_platforms.py`.

The sync script sets the image path as:
```yaml
image:
  caption: Platform Name
  filename: platforms/borinot_agile.png
  focal_point: Smart
```

Hugo Blox looks for images in `assets/media/`, so `platforms/filename.png` resolves to `assets/media/platforms/filename.png`.

## To Add Missing Images

1. Place image files in `assets/media/platforms/`
2. Update `PLATFORMS.md` with the image filename
3. Commit - the sync script will automatically update the Hugo content files

Example:
```markdown
- **Image:** thymio_robot.jpg
```

Then commit:
```bash
git add PLATFORMS.md
git commit -m "Add Thymio image"
# Auto-syncs via git hook!
```
