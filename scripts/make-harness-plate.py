#!/usr/bin/env python3
"""Square card plate for the agent-harness project, drawn from
scripts/assets/agent-harness/eval-run.json (scripts/capture-harness-run.py):
the repo's own eval suite, run as committed and again after the one change its
comment describes. Each run is a path of tool calls in order (blue, joined in
green), each call carries its checks (grey, stacked above it); the one failing
check is an open ring. Same oblique projection as the cloud plates. No text.
Host tooling (Pillow), run by hand; output committed.

    python3 scripts/make-harness-plate.py
"""
import json
import math
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).parent.parent
RUN = json.loads((ROOT / "scripts/assets/agent-harness/eval-run.json").read_text())
OUT = ROOT / "public/projects/agent-harness/card-plate.webp"
S = 1200
SS = 2
BG = (14, 16, 22)
ACCENT = (86, 140, 246)
GROUND = (120, 124, 134)
WALL = (150, 156, 168)
TRAIL = (70, 200, 120)
ROT, TILT, Y_SQUASH = 0.5, 0.62, 0.7
GAP_RUN, GAP_CALL, GAP_CHECK = 2.2, 1.0, 0.42


def project(x, y, z):
    c, s = math.cos(ROT), math.sin(ROT)
    ct, st = math.cos(TILT), math.sin(TILT)
    rz = x * s + y * c
    return x * c - y * s, (z * ct - rz * st) * Y_SQUASH


geo = []
for r, key in enumerate(("committed", "changed")):
    calls = []
    for i, case in enumerate(RUN[key]):
        base = (i * GAP_CALL, r * GAP_RUN, 0.0)
        checks = [(base[0], base[1], (k + 1) * GAP_CHECK, ok) for k, ok in enumerate(case["checks"])]
        calls.append((base, checks))
    geo.append(calls)

pts = [project(*b) for run in geo for b, _ in run] + [project(*c[:3]) for run in geo for _, cs in run for c in cs]
x0, x1 = min(p[0] for p in pts), max(p[0] for p in pts)
y0, y1 = min(p[1] for p in pts), max(p[1] for p in pts)
scale = S * SS * 0.88 / max(x1 - x0, y1 - y0)
cx, cy = (x0 + x1) / 2, (y0 + y1) / 2


def px(p3):
    sx, sy = project(*p3[:3])
    return ((S * SS) / 2 + (sx - cx) * scale, (S * SS) / 2 - (sy - cy) * scale)


im = Image.new("RGB", (S * SS, S * SS), BG)
d = ImageDraw.Draw(im)


def dot(p, r, fill):
    d.ellipse([p[0] - r, p[1] - r, p[0] + r, p[1] + r], fill=fill)


for run in geo:
    d.line([px(b) for b, _ in run], fill=TRAIL, width=4 * SS, joint="curve")
for run in geo:
    for base, checks in run:
        top = checks[-1][:3] if checks else base
        d.line([px(base), px(top)], fill=GROUND, width=2 * SS)
for run in geo:
    for base, checks in run:
        for c in checks:
            p = px(c)
            if c[3]:
                dot(p, 11 * SS, WALL)
            else:
                dot(p, 17 * SS, WALL)
                dot(p, 10 * SS, BG)
        dot(px(base), 15 * SS, ACCENT)
im = im.resize((S, S), Image.LANCZOS)
OUT.parent.mkdir(parents=True, exist_ok=True)
im.save(OUT, "WEBP", quality=82, method=6)
print(f"wrote {OUT} ({OUT.stat().st_size} B)")
