#!/usr/bin/env python3
"""Square card plate for perception-pipeline, drawn from a real run of the
pipeline (YOLOv8n + ByteTrack) on public footage: MOT17-04 from the MOTChallenge
MOT17 benchmark (https://motchallenge.net/data/MOT17/), 400 frames at 30 fps.
scripts/sample-pipeline-tracks.py produced scripts/assets/pipeline/tracks.json
(per track id, the foot point of each box per frame). Each tracked person is one
curve through space and time: the image plane on the ground, time rising, in
blue; the same curve flattened onto the ground in grey. Foot points are
smoothed with a centred moving average of 13 frames to take out box jitter. No overlay. Host
tooling (Pillow), run by hand; output committed.

    python3 scripts/make-pipeline-plate.py
"""
import json
import math
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).parent.parent
SRC = ROOT / "scripts" / "assets" / "pipeline" / "tracks.json"
OUT = ROOT / "public" / "projects" / "perception-pipeline" / "card-plate.webp"
S = 1200
BG = (14, 16, 22)
ACCENT = (86, 140, 246)
GROUND = (120, 124, 134)
ROT = 0.5
TILT = 0.85
T_LEN = 0.45
FILL = 0.86
MIN_POINTS = 40
K = 6

data = json.loads(SRC.read_text())
W, H, N = data["width"], data["height"], data["frames"]
c, s = math.cos(ROT), math.sin(ROT)
ct, st = math.cos(TILT), math.sin(TILT)


def project(x, y, z):
    rz = x * s + y * c
    return (x * c - y * s, z * ct - rz * st)


def smooth(pts):
    out = []
    for i, (f, _, _) in enumerate(pts):
        w = pts[max(0, i - K) : i + K + 1]
        out.append((f, sum(q[1] for q in w) / len(w), sum(q[2] for q in w) / len(w)))
    return out


curves = []
for pts in data["tracks"].values():
    if len(pts) < MIN_POINTS:
        continue
    pts = smooth(pts)
    flat = [project(x / W - 0.5, 0.5 - y / H, 0) for _, x, y in pts]
    rise = [project(x / W - 0.5, 0.5 - y / H, f / N * T_LEN) for f, x, y in pts]
    curves.append((flat, rise))

allp = [p for fl, ri in curves for p in fl + ri]
x0, x1 = min(p[0] for p in allp), max(p[0] for p in allp)
y0, y1 = min(p[1] for p in allp), max(p[1] for p in allp)
scale = S * FILL / max(x1 - x0, y1 - y0)
cx, cy = (x0 + x1) / 2, (y0 + y1) / 2


def px(p):
    return (S / 2 + (p[0] - cx) * scale, S / 2 - (p[1] - cy) * scale)


im = Image.new("RGB", (S, S), BG)
d = ImageDraw.Draw(im)
for flat, _ in curves:
    d.line([px(p) for p in flat], fill=tuple(int(BG[k] + (GROUND[k] - BG[k]) * 0.55) for k in range(3)), width=2, joint="curve")
for _, rise in curves:
    d.line([px(p) for p in rise], fill=ACCENT, width=3, joint="curve")
OUT.parent.mkdir(parents=True, exist_ok=True)
im.save(OUT, "WEBP", quality=82, method=6)
print(f"wrote {OUT} ({OUT.stat().st_size} B, {len(curves)} tracks of {len(data['tracks'])})")
