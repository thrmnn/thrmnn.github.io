#!/usr/bin/env python3
"""
Cleanup script to remove old platform directories not in PLATFORMS.md
"""

import shutil
from pathlib import Path

BASE_DIR = Path(__file__).parent
PLATFORM_CONTENT_DIR = BASE_DIR / "content" / "platform"

# Platforms that should exist (from PLATFORMS.md)
VALID_PLATFORMS = {
    'thymio-robot',
    'f1tenth-autonomous-racing',
    'borinot-drone',
    'roboat-autonomous-vessel'
}

print("🧹 Cleaning up old platforms not in PLATFORMS.md...\n")

if not PLATFORM_CONTENT_DIR.exists():
    print("❌ Platform directory not found!")
    exit(1)

removed_count = 0
for item in PLATFORM_CONTENT_DIR.iterdir():
    # Skip _index.md and non-directories
    if item.name == '_index.md' or not item.is_dir():
        continue
    
    # If this platform is not in our valid list, remove it
    if item.name not in VALID_PLATFORMS:
        print(f"  🗑️  Removing: {item.name}")
        try:
            shutil.rmtree(item)
            removed_count += 1
        except Exception as e:
            print(f"     ⚠️  Error removing {item.name}: {e}")

print(f"\n✅ Cleanup complete! Removed {removed_count} old platform(s).")
print(f"✅ Keeping {len(VALID_PLATFORMS)} platform(s) from PLATFORMS.md")
