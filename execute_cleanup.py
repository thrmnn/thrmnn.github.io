#!/usr/bin/env python3
"""
Execute cleanup, sync, commit, and push directly
"""

import shutil
import subprocess
import sys
from pathlib import Path

BASE_DIR = Path(__file__).parent
PLATFORM_CONTENT_DIR = BASE_DIR / "content" / "platform"
PLATFORMS_FILE = BASE_DIR / "PLATFORMS.md"

# Import sync functions
sys.path.insert(0, str(BASE_DIR))
from sync_platforms import parse_platforms, create_platform_content, create_slug

print("=" * 70)
print("🧹 Cleaning up old platforms and syncing with PLATFORMS.md")
print("=" * 70)
print()

# Step 1: Parse PLATFORMS.md to get valid platforms
print("Step 1: Parsing PLATFORMS.md...")
platforms = parse_platforms(PLATFORMS_FILE)
print(f"✓ Found {len(platforms)} platform(s) in PLATFORMS.md\n")

# Step 2: Create/update platform files and get slugs
print("Step 2: Creating/updating platform files...")
created_slugs = []
for platform in platforms:
    slug = create_platform_content(platform)
    created_slugs.append(slug)
    print(f"✓ {platform['title']} ({slug})")

# Step 3: Remove old platforms
print("\nStep 3: Removing old platforms not in PLATFORMS.md...")
removed_count = 0
if PLATFORM_CONTENT_DIR.exists():
    for item in PLATFORM_CONTENT_DIR.iterdir():
        if item.name == '_index.md' or not item.is_dir():
            continue
        if item.name not in created_slugs:
            print(f"  🗑️  Removing: {item.name}")
            try:
                shutil.rmtree(item)
                removed_count += 1
            except Exception as e:
                print(f"     ⚠️  Error: {e}")

print(f"\n✅ Cleanup complete! Removed {removed_count} old platform(s)")

# Step 4: Git operations
print("\n" + "=" * 70)
print("📦 Git operations...")
print("=" * 70)

# Git add
print("\nStaging files...")
result = subprocess.run(["git", "add", "-A"], cwd=str(BASE_DIR), capture_output=True, text=True)
if result.returncode == 0:
    print("✅ Files staged")
else:
    print(f"⚠️  Git add failed: {result.stderr}")

# Git status
result = subprocess.run(["git", "status", "--short"], cwd=str(BASE_DIR), capture_output=True, text=True)
if result.stdout.strip():
    print("\nChanged files:")
    print(result.stdout)
else:
    print("\n(no changes to commit)")

# Git commit
print("\nCommitting...")
result = subprocess.run(
    ["git", "commit", "-m", "Clean up old platforms: sync with PLATFORMS.md - only show 4 platforms from master file"],
    cwd=str(BASE_DIR),
    capture_output=True,
    text=True
)
if result.returncode == 0:
    print("✅ Commit successful")
    if result.stdout:
        print(result.stdout)
elif "nothing to commit" in result.stdout.lower():
    print("ℹ️  No changes to commit")
else:
    print(f"⚠️  Commit failed: {result.stderr}")

# Git push
print("\nPushing to remote...")
result = subprocess.run(["git", "push"], cwd=str(BASE_DIR), capture_output=True, text=True)
if result.returncode == 0:
    print("✅ Push successful")
    if result.stdout:
        print(result.stdout)
else:
    print(f"⚠️  Push failed: {result.stderr}")
    if result.stdout:
        print(result.stdout)

print("\n" + "=" * 70)
print("✅ All done!")
print("=" * 70)
