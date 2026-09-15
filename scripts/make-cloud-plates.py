#!/usr/bin/env python3
"""Square card plates for the two research projects, drawn from the point
clouds the site already ships (public/data/*.bin, int8 x, int8 y, uint8 z,
uint8 category) with the same oblique projection the live panel uses. No
overlay, no readout. Host tooling (Pillow), run by hand; outputs committed.

    python3 scripts/make-cloud-plates.py
"""
import math
import struct
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).parent.parent
PLATES = {
    "vidigal-rooftops": ROOT / "public/projects/urban-morphometrics/vidigal-plate.webp",
    "amsterdam-canopy": ROOT / "public/projects/aerial-lidar-tree-census/jordaan-plate.webp",
}
S = 1200
BG = (14, 16, 22)
ACCENT = (86, 140, 246)
GROUND = (120, 124, 134)
ROT = 0.5
TILT = 0.62
Y_SQUASH = 0.7
FILL = 0.86


def project(pts):
    c, s = math.cos(ROT), math.sin(ROT)
    ct, st = math.cos(TILT), math.sin(TILT)
    out = []
    for x, y, z, cat in pts:
        rz = x * s + y * c
        sx = x * c - y * s
        sy = (z * ct - rz * st) * Y_SQUASH
        depth = z * st + rz * ct
        out.append((sx, sy, depth, cat))
    return out


for stem, out in PLATES.items():
    raw = (ROOT / "public/data" / f"{stem}.bin").read_bytes()
    pts = []
    for i in range(len(raw) // 4):
        x, y, z, cat = struct.unpack_from("bbBB", raw, i * 4)
        pts.append((x / 127, y / 127, z / 255, cat))
    proj = sorted(project(pts), key=lambda p: p[2])
    xs = sorted(p[0] for p in proj)
    ys = sorted(p[1] for p in proj)
    lo, hi = int(len(xs) * 0.01), int(len(xs) * 0.99)
    x0, x1, y0, y1 = xs[lo], xs[hi], ys[lo], ys[hi]
    scale = S * FILL / max(x1 - x0, y1 - y0)
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    dmin, dmax = proj[0][2], proj[-1][2]

    im = Image.new("RGB", (S, S), BG)
    d = ImageDraw.Draw(im)
    for sx, sy, depth, cat in proj:
        px = S / 2 + (sx - cx) * scale
        py = S / 2 - (sy - cy) * scale
        t = (depth - dmin) / (dmax - dmin or 1)
        if cat == 1:
            col = tuple(int(BG[k] + (ACCENT[k] - BG[k]) * (0.45 + 0.55 * t)) for k in range(3))
            r = 2.2
        else:
            col = tuple(int(BG[k] + (GROUND[k] - BG[k]) * (0.25 + 0.35 * t)) for k in range(3))
            r = 1.3
        d.ellipse([px - r, py - r, px + r, py + r], fill=col)
    out.parent.mkdir(parents=True, exist_ok=True)
    im.save(out, "WEBP", quality=82, method=6)
    print(f"wrote {out} ({out.stat().st_size} B, {len(pts)} points)")
