#!/bin/bash
# Cleanup old platforms and sync with PLATFORMS.md

cd /home/theo/thrmnn.github.io

echo "🧹 Cleaning up old platforms..."
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

echo "✅ Old platforms removed"
echo ""
echo "🔄 Syncing with PLATFORMS.md..."
python3 sync_platforms.py

echo ""
echo "✅ Cleanup and sync complete!"
