#!/usr/bin/env python3
"""Square card thumbnail for the ROS 2 triage project, drawn from the data
kept as generator input, not shipped: scripts/assets/stata/stata-walls.bin (int8 x, y per point) and
scripts/assets/stata/stata-replay.json (AMCL poses, int16, same frame). Walls in grey,
the estimated path in green, nothing else. Host tooling (Pillow), run by hand
like the resume; the output is committed.

    python3 scripts/make-stata-plate.py
"""
import json
import struct
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).parent.parent
WALLS = ROOT / "scripts" / "assets" / "stata" / "stata-walls.bin"
REPLAY = ROOT / "scripts" / "assets" / "stata" / "stata-replay.json"
OUT = ROOT / "public" / "projects" / "ros2-localization-triage" / "stata-plate.webp"

S = 1200
PAD = 0.08
BG = (14, 16, 22)
WALL = (150, 156, 168)
TRAIL = (70, 200, 120)

raw = WALLS.read_bytes()
walls = [struct.unpack_from("bbBB", raw, i * 4)[:2] for i in range(len(raw) // 4)]
poses = json.loads(REPLAY.read_text())["poses"]
trail = [(p[1] / 32767, p[2] / 32767) for p in poses]
wx = [x / 127 for x, _ in walls]
wy = [y / 127 for _, y in walls]

xs = wx + [x for x, _ in trail]
ys = wy + [y for _, y in trail]
x0, x1, y0, y1 = min(xs), max(xs), min(ys), max(ys)
span = max(x1 - x0, y1 - y0)
scale = S * (1 - 2 * PAD) / span
cx, cy = (x0 + x1) / 2, (y0 + y1) / 2


def to_px(x, y):
    return (S / 2 + (x - cx) * scale, S / 2 - (y - cy) * scale)


im = Image.new("RGB", (S, S), BG)
d = ImageDraw.Draw(im)
for x, y in zip(wx, wy):
    px, py = to_px(x, y)
    d.ellipse([px - 1.6, py - 1.6, px + 1.6, py + 1.6], fill=WALL)
d.line([to_px(x, y) for x, y in trail], fill=TRAIL, width=4, joint="curve")
OUT.parent.mkdir(parents=True, exist_ok=True)
im.save(OUT, "WEBP", quality=82, method=6)
print(f"wrote {OUT} ({OUT.stat().st_size} B, {len(walls)} wall points, {len(trail)} poses)")
