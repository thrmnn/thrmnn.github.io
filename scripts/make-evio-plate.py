#!/usr/bin/env python3
"""Square card plate for the event-camera drone project, drawn from real
events: a 30 ms window of the public UZH-FPV drone dataset (Delmerico et al.,
ICRA 2019, https://fpv.ifi.uzh.ch/), sequence indoor_forward_3_davis_with_gt,
the dataset the EVIO project trains on. Events are (x, y, t, polarity) from the
346x260 DAVIS camera, cut by scripts/sample-uzh-events.py into
scripts/assets/evio/events.bin (centred on the peak ground-truth speed). Time
runs along the depth axis in an oblique projection; positive events in blue,
negative in grey. No overlay. Host tooling (Pillow), run by hand; output committed.

    python3 scripts/make-evio-plate.py
"""
import math
import struct
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).parent.parent
SRC = ROOT / "scripts" / "assets" / "evio" / "events.bin"
OUT = ROOT / "public" / "projects" / "event-cameras-drone" / "card-plate.webp"
S = 1200
BG = (14, 16, 22)
ACCENT = (86, 140, 246)
GROUND = (120, 124, 134)
W, H, T_SPAN = 346, 260, 30000
ROT = 0.5
TILT = 0.62
T_LEN = 1.5
FILL = 0.86

raw = SRC.read_bytes()
ev = [e for e in (struct.unpack_from("<hhIB", raw, i * 9) for i in range(len(raw) // 9)) if e[2] < T_SPAN]
c, s = math.cos(ROT), math.sin(ROT)
ct, st = math.cos(TILT), math.sin(TILT)
pts = []
for x, y, dt, p in ev:
    px, py, pz = x / W - 0.5, 0.5 - y / H, dt / T_SPAN * T_LEN
    rz = px * s + pz * c
    sx = px * c - pz * s
    sy = py * ct - rz * st
    pts.append((sx, sy, py * st + rz * ct, p))
pts.sort(key=lambda q: q[2])
xs = sorted(q[0] for q in pts)
ys = sorted(q[1] for q in pts)
x0, x1, y0, y1 = xs[0], xs[-1], ys[0], ys[-1]
scale = S * FILL / max(x1 - x0, y1 - y0)
cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
dmin, dmax = pts[0][2], pts[-1][2]

im = Image.new("RGB", (S, S), BG)
d = ImageDraw.Draw(im)
for sx, sy, depth, p in pts:
    t = (depth - dmin) / (dmax - dmin or 1)
    base = ACCENT if p else GROUND
    col = tuple(int(BG[k] + (base[k] - BG[k]) * (0.4 + 0.6 * t)) for k in range(3))
    px, py = S / 2 + (sx - cx) * scale, S / 2 - (sy - cy) * scale
    r = 1.5
    d.ellipse([px - r, py - r, px + r, py + r], fill=col)
OUT.parent.mkdir(parents=True, exist_ok=True)
im.save(OUT, "WEBP", quality=82, method=6)
print(f"wrote {OUT} ({OUT.stat().st_size} B, {len(ev)} events)")
