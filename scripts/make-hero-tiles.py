#!/usr/bin/env python3
"""Phone crop of the Vidigal card plate for the hero's Model tile: the full square plate
reads as a black chip at about 110 px wide, so the phone tile is cropped to the blue
footprints (3:4). Run by hand after make-cloud-plates.py; the output is committed.

    python3 scripts/make-hero-tiles.py
"""
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).parent.parent
SRC = ROOT / "public/projects/urban-morphometrics/vidigal-plate.webp"
OUT = ROOT / "public/projects/urban-morphometrics/vidigal-tile.webp"
PAD = 60

im = Image.open(SRC).convert("RGB")
a = np.asarray(im).astype(int)
ys, xs = np.nonzero((a[:, :, 2] > 150) & (a[:, :, 2] - a[:, :, 0] > 60))
cx, cy = (xs.min() + xs.max()) // 2, (ys.min() + ys.max()) // 2
w = min(im.width * 3 // 4, max(xs.max() - xs.min() + 2 * PAD, 3 * (ys.max() - ys.min() + 2 * PAD) // 4))
h = w * 4 // 3
x0 = max(0, min(im.width - w, cx - w // 2))
y0 = max(0, min(im.height - h, cy - h // 2))
im.crop((x0, y0, x0 + w, y0 + h)).resize((450, 600), Image.LANCZOS).save(OUT, quality=88)
print(OUT, (x0, y0, w, h))
