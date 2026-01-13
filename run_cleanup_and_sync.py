#!/usr/bin/env python3
"""
Run cleanup and sync in one go
"""

import subprocess
import sys
from pathlib import Path

BASE_DIR = Path(__file__).parent

print("=" * 60)
print("🧹 Cleaning up old platforms and syncing with PLATFORMS.md")
print("=" * 60)
print()

# Step 1: Run cleanup
print("Step 1: Cleaning up old platforms...")
try:
    result = subprocess.run(
        [sys.executable, str(BASE_DIR / "cleanup_old_platforms.py")],
        cwd=str(BASE_DIR),
        capture_output=True,
        text=True
    )
    print(result.stdout)
    if result.stderr:
        print(result.stderr, file=sys.stderr)
except Exception as e:
    print(f"⚠️  Error running cleanup: {e}")

print()
print("Step 2: Syncing with PLATFORMS.md...")
try:
    result = subprocess.run(
        [sys.executable, str(BASE_DIR / "sync_platforms.py")],
        cwd=str(BASE_DIR),
        capture_output=True,
        text=True
    )
    print(result.stdout)
    if result.stderr:
        print(result.stderr, file=sys.stderr)
except Exception as e:
    print(f"⚠️  Error running sync: {e}")

print()
print("=" * 60)
print("✅ Cleanup and sync complete!")
print("=" * 60)
