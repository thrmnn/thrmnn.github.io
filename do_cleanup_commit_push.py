#!/usr/bin/env python3
"""
Do cleanup, sync, commit, and push in one go
"""

import subprocess
import sys
import shutil
from pathlib import Path

BASE_DIR = Path(__file__).parent
PLATFORM_CONTENT_DIR = BASE_DIR / "content" / "platform"

print("=" * 70)
print("🧹 Cleaning up old platforms and syncing with PLATFORMS.md")
print("=" * 70)
print()

# Step 1: Run sync_platforms.py (which includes cleanup)
print("Step 1: Running sync_platforms.py (includes cleanup)...")
print("-" * 70)
try:
    result = subprocess.run(
        [sys.executable, str(BASE_DIR / "sync_platforms.py")],
        cwd=str(BASE_DIR),
        capture_output=False,  # Show output in real-time
        text=True
    )
    if result.returncode != 0:
        print(f"⚠️  Sync script returned code {result.returncode}")
except Exception as e:
    print(f"⚠️  Error running sync: {e}")

print()
print("=" * 70)
print("📦 Staging changes for git...")
print("=" * 70)

# Step 2: Git add
try:
    result = subprocess.run(
        ["git", "add", "-A"],
        cwd=str(BASE_DIR),
        capture_output=True,
        text=True
    )
    if result.returncode == 0:
        print("✅ Files staged")
    else:
        print(f"⚠️  Git add returned code {result.returncode}")
        if result.stderr:
            print(result.stderr)
except Exception as e:
    print(f"⚠️  Error staging files: {e}")

# Step 3: Git status
print()
print("Changed files:")
try:
    result = subprocess.run(
        ["git", "status", "--short"],
        cwd=str(BASE_DIR),
        capture_output=True,
        text=True
    )
    if result.stdout:
        print(result.stdout)
    else:
        print("  (no changes)")
except Exception as e:
    print(f"⚠️  Error checking status: {e}")

# Step 4: Git commit
print()
print("=" * 70)
print("💾 Committing changes...")
print("=" * 70)
try:
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
    else:
        print(f"⚠️  Commit returned code {result.returncode}")
        if result.stderr:
            print(result.stderr)
        if "nothing to commit" in result.stdout.lower():
            print("ℹ️  No changes to commit")
except Exception as e:
    print(f"⚠️  Error committing: {e}")

# Step 5: Git push
print()
print("=" * 70)
print("🚀 Pushing to remote...")
print("=" * 70)
try:
    result = subprocess.run(
        ["git", "push"],
        cwd=str(BASE_DIR),
        capture_output=True,
        text=True
    )
    if result.returncode == 0:
        print("✅ Push successful")
        if result.stdout:
            print(result.stdout)
    else:
        print(f"⚠️  Push returned code {result.returncode}")
        if result.stderr:
            print(result.stderr)
except Exception as e:
    print(f"⚠️  Error pushing: {e}")

print()
print("=" * 70)
print("✅ All done!")
print("=" * 70)
