#!/usr/bin/env python3
"""Card plates, hero tile and loop for the two research clouds, drawn in the house
point-cloud look (grey dots fading with depth on a dark ground, the subject lit,
a scan front with afterglow as in make-roboat-plate.py). No overlay, no readout.
Host tooling (numpy, Pillow), run by hand; outputs committed.

REAL: every point is a point of a cloud the site ships or shipped, drawn as is.
  Vidigal: public/data/vidigal-rooftops.bin (the public quantised derivative; terrain
  is a block-mean DTM, buildings are footprint outlines; see its .json).
  Jordaan: the AHN5 clip written by sample-canopy-pointcloud.py (AHN5, Rijkswaterstaat,
  CC BY 4.0, source "AHN"); the .bin was retired from public/data with the live panel,
  so it is read from git (commit 59f80d5^) when public/data no longer has it.
  Categories: Jordaan 0 ground, 1 canopy (green), 2 roof; Vidigal 0/3 terrain, 1 building (blue).
DRAWN: the loop's moving front is an effect, not a measurement of any kind.

    python3 scripts/make-cloud-plates.py              # card plates, hero tile, Vidigal loops
    python3 scripts/make-cloud-plates.py --alt        # alternative Vidigal still to ~/Perso/site-review/files
"""
import json
import math
import struct
import subprocess
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).parent.parent
VID = ROOT / "public/projects/urban-morphometrics"
JOR = ROOT / "public/projects/aerial-lidar-tree-census/jordaan-plate.webp"
ALT_OUT = Path.home() / "Perso/site-review/files"
S = 1200
BG = np.array((14, 16, 22), float)
ACCENT = np.array((86, 140, 246), float)
GREY = np.array((120, 124, 134), float)
LIGHT = np.array((150, 156, 168), float)
GREEN = np.array((70, 200, 120), float)
GREEN_DEEP = np.array((38, 120, 74), float)


def load(stem):
    p = ROOT / "public/data"
    try:
        raw = (p / f"{stem}.bin").read_bytes()
        meta = json.loads((p / f"{stem}.json").read_text())
    except FileNotFoundError:
        g = lambda f: subprocess.check_output(["git", "-C", str(ROOT), "show", f"59f80d5^:public/data/{f}"])
        raw, meta = g(f"{stem}.bin"), json.loads(g(f"{stem}.json"))
    assert meta.get("stride", 4) == 6
    a = np.frombuffer(raw, dtype=np.dtype([("x", "<i2"), ("y", "<i2"), ("z", "u1"), ("c", "u1")]))
    cat = a["c"] & 15
    k = cat != 15
    return np.c_[a["x"][k] / 32767, a["y"][k] / 32767, a["z"][k] / 255], cat[k], (a["c"][k] >> 4) / 15


def project(p, rot, tilt, ysq):
    c, s = math.cos(rot), math.sin(rot)
    ct, st = math.cos(tilt), math.sin(tilt)
    x, y, z = p[:, 0], p[:, 1], p[:, 2]
    rz = x * s + y * c
    return x * c - y * s, (z * ct - rz * st) * ysq, z * st + rz * ct


def frame(p, rot, tilt, ysq, fill, cy_frac, on=None):
    sx, sy, dp = project(p, rot, tilt, ysq)
    q = slice(None) if on is None else on
    lo, hi = lambda v: np.percentile(v[q], 1), lambda v: np.percentile(v[q], 99)
    scale = S * fill / max(hi(sx) - lo(sx), hi(sy) - lo(sy))
    cx, cy = (lo(sx) + hi(sx)) / 2, (lo(sy) + hi(sy)) / 2
    X = S / 2 + (sx - cx) * scale
    Y = S * cy_frac - (sy - cy) * scale
    t = (dp - dp.min()) / (np.ptp(dp) or 1)
    return X, Y, t, sx


def draw(X, Y, t, layers, size=S):
    """layers: list of (mask, rgb Nx3, weight N, radius)."""
    k = size / S
    im = Image.new("RGB", (size, size), tuple(int(v) for v in BG))
    d = ImageDraw.Draw(im)
    order = np.argsort(t)
    col = np.zeros((len(X), 3))
    rad = np.zeros(len(X))
    for m, rgb, w, r in layers:
        col[m] = BG + (rgb[m] - BG) * np.clip(w[m], 0, 1)[:, None]
        rad[m] = r
    for i in order:
        r = rad[i] * k
        if r <= 0:
            continue
        x, y = X[i] * k, Y[i] * k
        d.ellipse([x - r, y - r, x + r, y + r], fill=tuple(int(v) for v in col[i]))
    return im


def jordaan():
    p, cat, _ = load("amsterdam-canopy")
    X, Y, t, _ = frame(p, 0.5, 0.62, 0.7, 0.86, 0.5)
    n = len(p)
    canopy = cat == 1
    h = np.clip(p[:, 2], 0, 1)
    green = GREEN_DEEP + (GREEN - GREEN_DEEP) * np.clip(0.35 + 0.65 * t + 0.25 * h, 0, 1)[:, None]
    grey = np.where((cat == 2)[:, None], GREY * 0.8, GREY)
    rgb = np.where(canopy[:, None], green, grey)
    w = np.where(canopy, 0.55 + 0.45 * t, np.where(cat == 2, 0.3 + 0.35 * t, 0.28 + 0.5 * t))
    layers = [(~canopy, rgb, w, 1.5), (canopy, rgb, w, 2.3)]
    im = draw(X, Y, t, layers)
    im.save(JOR, "WEBP", quality=82, method=6)
    print(JOR, JOR.stat().st_size, "B")


def vidigal_scene(rot=None, tilt=0.7, ysq=0.8, fill=0.86, cy=0.36):
    p, cat, shade = load("vidigal-rooftops")
    b = cat == 1
    if rot is None:
        ev, evec = np.linalg.eigh(np.cov(p[b, :2].T))
        major = evec[:, 1]
        rot = math.atan2(-major[1], major[0]) + 0.35
    X, Y, t, sx = frame(p, rot, tilt, ysq, fill, cy, on=b)
    return dict(X=X, Y=Y, t=t, u=(sx - sx.min()) / np.ptp(sx), bld=cat == 1, shade=shade, cat=cat)


def vidigal_layers(sc, glow=None, alt=False):
    t, bld, shade = sc["t"], sc["bld"], sc["shade"]
    g = np.zeros(len(t)) if glow is None else glow
    depth = 0.2 + 0.8 * t ** 0.8
    base_t = depth * (0.55 + 0.45 * shade)
    wt = np.clip(base_t * 0.72 + 0.95 * g * (0.4 + 0.6 * depth), 0, 1)
    wb = np.clip(0.42 + 0.5 * depth + 0.2 * g, 0, 1)
    terr_rgb = np.broadcast_to(GREY + (LIGHT - GREY) * g[:, None], (len(t), 3))
    ctx = sc["cat"] == 3
    wt = np.where(ctx, wt * 0.7, wt)
    bld_rgb = ACCENT + (np.array((178, 208, 255)) - ACCENT) * (g * 0.8)[:, None]
    return [(~bld, terr_rgb, wt, 1.5), (bld, bld_rgb, wb, 2.3)]


def front(u, head, tau=0.13):
    return np.exp(-((head - u) % 1.35) / tau) * (((head - u) % 1.35) < 1.35)


def vidigal():
    sc = vidigal_scene()
    im = draw(sc["X"], sc["Y"], sc["t"], vidigal_layers(sc))
    im.save(VID / "vidigal-plate.webp", "WEBP", quality=82, method=6)
    frames = []
    n = 36
    for i in range(n):
        head = -0.2 + 1.35 * i / n
        frames.append(draw(sc["X"], sc["Y"], sc["t"], vidigal_layers(sc, front(sc["u"], head)), 600))
    frames[0].save(VID / "vidigal-anim.webp", "WEBP", save_all=True, append_images=frames[1:], duration=80, loop=0, quality=32, method=6)
    tile_frames = [crop_tile(f) for f in frames]
    crop_tile(im).save(VID / "vidigal-tile.webp", quality=88)
    tile_frames[0].save(VID / "vidigal-tile-anim.webp", "WEBP", save_all=True, append_images=tile_frames[1:], duration=80, loop=0, quality=32, method=6)
    for f in ("vidigal-plate.webp", "vidigal-anim.webp", "vidigal-tile.webp", "vidigal-tile-anim.webp"):
        print(f, (VID / f).stat().st_size, "B")


def crop_tile(im):
    """3:4 phone crop around the buildings (the full square reads as a dark chip at 110 px)."""
    sc = vidigal_scene()
    X, Y = sc["X"][sc["bld"]] * im.width / S, sc["Y"][sc["bld"]] * im.width / S
    x0, x1, y0, y1 = np.percentile(X, 15), np.percentile(X, 85), np.percentile(Y, 15), np.percentile(Y, 85)
    pad = 0.04 * im.width
    w = min(im.width * 0.7, max(x1 - x0 + 2 * pad, 0.75 * (y1 - y0 + 2 * pad)))
    h = w * 4 / 3
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    bx = int(max(0, min(im.width - w, cx - w / 2)))
    by = int(max(0, min(im.height - h, cy - h / 2)))
    return im.crop((bx, by, bx + int(w), by + int(h))).resize((450, 600), Image.LANCZOS)


def vidigal_alt():
    sc = vidigal_scene(rot=0.9, tilt=0.95, ysq=0.9, fill=0.98, cy=0.45)
    ALT_OUT.mkdir(parents=True, exist_ok=True)
    out = ALT_OUT / "vidigal-alt-plan.webp"
    draw(sc["X"], sc["Y"], sc["t"], vidigal_layers(sc, alt=True)).save(out, "WEBP", quality=82, method=6)
    print(out)


if __name__ == "__main__":
    if "--alt" in sys.argv:
        vidigal_alt()
    else:
        jordaan()
        vidigal()
