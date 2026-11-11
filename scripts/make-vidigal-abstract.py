#!/usr/bin/env python3
"""The three panels of the Vidigal visual abstract (scan, model, measure), drawn
from public/data/vidigal-rooftops.bin only, at the resolution it already ships.
The third panel is an empty grid: no indicator is computed or coloured.
Host tooling (Pillow), run by hand; outputs committed.

    python3 scripts/make-vidigal-abstract.py
"""
import json
import math
import struct
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).parent.parent
OUT = ROOT / "public/projects/urban-morphometrics"
W, H = 1200, 800
BG = (14, 16, 22)
ACCENT = (86, 140, 246)
GREY = (150, 154, 164)

raw = (ROOT / "public/data/vidigal-rooftops.bin").read_bytes()
meta = json.loads((ROOT / "public/data/vidigal-rooftops.json").read_text())
assert meta["stride"] == 6 and meta["count"] * 6 == len(raw)
pts = []
for i in range(meta["count"]):
    x, y, z, c = struct.unpack_from("<hhBB", raw, i * 6)
    if c & 15 == 15:
        continue
    pts.append((x / 32767, y / 32767, z / 255, c & 15, (c >> 4) / 15))


def mix(a, b, t):
    return tuple(int(a[k] + (b[k] - a[k]) * t) for k in range(3))


def fit(proj, fill):
    xs = sorted(p[0] for p in proj)
    ys = sorted(p[1] for p in proj)
    lo, hi = int(len(xs) * 0.01), int(len(xs) * 0.99)
    x0, x1, y0, y1 = xs[lo], xs[hi], ys[lo], ys[hi]
    s = min(W * fill / (x1 - x0), H * fill / (y1 - y0))
    return s, (x0 + x1) / 2, (y0 + y1) / 2


def oblique(p, rot=0.5, tilt=0.62, squash=0.7):
    x, y, z = p[0], p[1], p[2]
    c, s = math.cos(rot), math.sin(rot)
    rz = x * s + y * c
    return (x * c - y * s, (z * math.cos(tilt) - rz * math.sin(tilt)) * squash,
            z * math.sin(tilt) + rz * math.cos(tilt))


def plan(p):
    return (p[0], p[1], p[2])


def draw(name, view, colour, radius, fill, grid=False):
    proj = sorted(((*view(p), p) for p in pts), key=lambda q: q[2])
    s, cx, cy = fit([(q[0], q[1]) for q in proj], fill)
    im = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(im)
    for sx, sy, _, p in proj:
        px, py = W / 2 + (sx - cx) * s, H / 2 - (sy - cy) * s
        r = radius(p)
        d.ellipse((px - r, py - r, px + r, py + r), fill=colour(p))
    if grid:
        n = 14
        gx0, gx1 = W * (1 - fill) / 2, W - W * (1 - fill) / 2
        gy0, gy1 = H * (1 - fill) / 2, H - H * (1 - fill) / 2
        for k in range(n + 1):
            x = gx0 + (gx1 - gx0) * k / n
            d.line((x, gy0, x, gy1), fill=(86, 140, 246), width=2)
        m = round(n * (gy1 - gy0) / (gx1 - gx0))
        for k in range(m + 1):
            y = gy0 + (gy1 - gy0) * k / m
            d.line((gx0, y, gx1, y), fill=(86, 140, 246), width=2)
    im.save(OUT / f"vidigal-abstract-{name}.webp", quality=88)


draw("scan", oblique, lambda p: GREY if True else GREY, lambda p: 1.5, 0.84)
draw("model", plan,
     lambda p: ACCENT if p[3] == 1 else mix(BG, GREY, 0.25 + 0.6 * p[4]),
     lambda p: 2.2 if p[3] == 1 else 1.8, 0.9)
draw("measure", plan,
     lambda p: mix(BG, ACCENT, 0.55) if p[3] == 1 else mix(BG, GREY, 0.2 + 0.3 * p[4]),
     lambda p: 2.0 if p[3] == 1 else 1.6, 0.9, grid=True)
