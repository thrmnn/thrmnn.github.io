#!/usr/bin/env python3
"""Card plates, hero tiles and loops for the two research clouds, drawn in the house
point-cloud look (grey dots fading with depth on a dark ground, the subject lit,
a scan front with afterglow as in make-roboat-plate.py). No overlay, no readout.
Host tooling (numpy, scipy, matplotlib, Pillow), run by hand; outputs committed.

REAL: every point is a point of a cloud the site ships or shipped, drawn as is.
  Vidigal: public/data/vidigal-rooftops.bin (the public quantised derivative; terrain
  is a block-mean DTM, buildings are footprint outlines; see its .json).
  Jordaan: the AHN5 clip written by sample-canopy-pointcloud.py (AHN5, Rijkswaterstaat,
  CC BY 4.0, source "AHN"); the .bin was retired from public/data with the live panel,
  so it is read from git (commit 59f80d5^) when public/data no longer has it.
  Categories: Jordaan 0 ground, 1 canopy (green), 2 roof; Vidigal 0/3 terrain, 1 building (blue).
DRAWN: the Vidigal hillside is drawn as contour lines: the shipped terrain points are
  interpolated linearly to a grid, level sets are taken at 34 fixed elevation steps, and
  each line is drawn as grey dots at even screen spacing. The lines come from the
  quantised public terrain, so they carry its resolution (16 m core, 32 m context) and no
  more. The moving front (rising with elevation, afterglow) is an effect, not a
  measurement of any kind. Frames: 36 at 80 ms.

    python3 scripts/make-cloud-plates.py              # card plates, hero tiles, loops for both clouds
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


N_FRAMES = 36
FRAME_MS = 80
SPAN = 1.0
TAU = 0.25
LEVELS = 34
RADIUS = 2.5
SPACING = 11.0


def glow_at(zn, head):
    lag = ((head - zn) % SPAN + SPAN) % SPAN
    return np.clip(1 - lag / TAU, 0, 1) ** 2


def save_loop(frames, path):
    frames[0].save(path, "WEBP", save_all=True, append_images=frames[1:], duration=FRAME_MS, loop=0, quality=42, method=6)
    with Image.open(path) as a:
        assert a.n_frames == len(frames), (path, a.n_frames)


def contour_lines(p, cat):
    """Level sets of the shipped terrain at fixed elevation steps: [(N,3) x, y, z] polylines."""
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    from scipy.interpolate import griddata
    from scipy.spatial import cKDTree

    t = (cat == 0) | (cat == 3)
    xy, z = p[t, :2], p[t, 2]
    n = 420
    gx = np.linspace(xy[:, 0].min(), xy[:, 0].max(), n)
    gy = np.linspace(xy[:, 1].min(), xy[:, 1].max(), n)
    GX, GY = np.meshgrid(gx, gy)
    Z = griddata(xy, z, (GX, GY), method="linear")
    far = cKDTree(xy).query(np.c_[GX.ravel(), GY.ravel()])[0].reshape(GX.shape) > 0.03
    Z = np.ma.masked_where(far | np.isnan(Z), Z)
    levels = np.linspace(z.min(), z.max(), LEVELS + 2)[1:-1]
    fig, ax = plt.subplots()
    cs = ax.contour(GX, GY, Z, levels=levels)
    out = []
    for lv, segs in zip(levels, cs.allsegs):
        for sg in segs:
            if len(sg) > 3:
                out.append(np.c_[sg, np.full(len(sg), lv)])
    plt.close(fig)
    return out, (z.min(), z.max())


def dots_on(lines, view, spacing):
    """Even screen spacing along each projected line. view(P)->(X, Y, depth)."""
    X, Y, D, Z = [], [], [], []
    for ln in lines:
        x, y, d = view(ln)
        seg = np.hypot(np.diff(x), np.diff(y))
        cum = np.r_[0, np.cumsum(seg)]
        if cum[-1] < spacing:
            continue
        s = np.arange(0, cum[-1], spacing)
        X.append(np.interp(s, cum, x)); Y.append(np.interp(s, cum, y))
        D.append(np.interp(s, cum, d)); Z.append(np.full(len(s), ln[0, 2]))
    return np.concatenate(X), np.concatenate(Y), np.concatenate(D), np.concatenate(Z)


class VidigalView:
    """Oblique or plan view of the quantised cloud with the contour dots of its terrain."""

    def __init__(self, rot=None, tilt=0.7, ysq=0.8, fill=0.86, cy=0.4, zex=1.0, size=S, spacing=SPACING):
        self.p, self.cat, self.shade = load("vidigal-rooftops")
        p, cat = self.p, self.cat
        b = cat == 1
        if rot is None:
            _, evec = np.linalg.eigh(np.cov(p[b, :2].T))
            rot = math.atan2(-evec[1, 1], evec[0, 1]) + 0.35
        self.rot, self.tilt, self.ysq, self.zex = rot, tilt, ysq, zex
        sx, sy, dp = self._proj(p)
        lo, hi = lambda v: np.percentile(v[b], 1), lambda v: np.percentile(v[b], 99)
        self.scale = size * fill / max(hi(sx) - lo(sx), hi(sy) - lo(sy))
        self.cx, self.cy_ = (lo(sx) + hi(sx)) / 2, (lo(sy) + hi(sy)) / 2
        self.size, self.cyf = size, cy
        self.dmin, self.dmax = dp.min(), dp.max()
        lines, (self.z0, self.z1) = contour_lines(p, cat)
        self.cx_, self.cy2 = self.cx, self.cy_
        self.T = dots_on(lines, self.view, spacing * size / S)
        self.B = self.view(p[b])
        self.bz = p[b, 2]
        self.b = b

    def _proj(self, P):
        c, s = math.cos(self.rot), math.sin(self.rot)
        ct, st = math.cos(self.tilt), math.sin(self.tilt)
        x, y, z = P[:, 0], P[:, 1], P[:, 2] * self.zex
        rz = x * s + y * c
        return x * c - y * s, (z * ct - rz * st) * self.ysq, z * st + rz * ct

    def view(self, P):
        sx, sy, dp = self._proj(P)
        X = self.size / 2 + (sx - self.cx) * self.scale
        Y = self.size * self.cyf - (sy - self.cy_) * self.scale
        return X, Y, (dp - self.dmin) / (self.dmax - self.dmin)

    def zn(self, z):
        """Elevation as its rank among all drawn dots: the front then meets about the same number of dots at every height."""
        if not hasattr(self, "_rank"):
            self._rank = np.sort(np.r_[self.T[3], self.bz])
        return np.searchsorted(self._rank, z) / len(self._rank)

    def layers(self, head=None, radius=RADIUS, floor=0.2, bld_rgb=ACCENT, pulse=1.0):
        TX, TY, TD, TZ = self.T
        BX, BY, BD = self.B
        gt = np.zeros(len(TX)) if head is None else glow_at(self.zn(TZ), head)
        gb = np.zeros(len(BX)) if head is None else glow_at(self.zn(self.bz), head)
        wt = np.clip(floor + 0.5 * TD ** 0.9 + 0.55 * gt * (0.5 + 0.5 * TD), 0, 1)
        wb = np.clip(0.55 + 0.35 * BD + 0.15 * gb, 0, 1)
        wt = np.clip(wt * pulse, 0, 1)
        grey = GREY + (LIGHT - GREY) * gt[:, None]
        blue = bld_rgb + (np.array((178, 208, 255)) - bld_rgb) * (0.8 * gb)[:, None]
        X = np.r_[TX, BX]; Y = np.r_[TY, BY]; D = np.r_[TD, BD]
        isb = np.r_[np.zeros(len(TX), bool), np.ones(len(BX), bool)]
        rgb = np.vstack([grey, blue]); w = np.r_[wt, wb]
        layers = [(~isb, rgb, w, radius), (isb, rgb, w, radius + 0.4)]
        return X, Y, D, layers


def vidigal(out_dir=VID):
    v = VidigalView()
    im = draw(*v.layers()[:3], v.layers()[3])
    im.save(out_dir / "vidigal-plate.webp", "WEBP", quality=84, method=6)
    vs = v
    frames = []
    for i in range(N_FRAMES):
        head = SPAN * i / N_FRAMES
        X, Y, D, L = vs.layers(head, pulse=1 + 0.1 * math.sin(2 * math.pi * i / N_FRAMES))
        frames.append(draw(X, Y, D, L, 600))
    save_loop(frames, out_dir / "vidigal-anim.webp")
    crop_tile(im, v).save(out_dir / "vidigal-tile.webp", quality=88)
    save_loop([crop_tile(f, v).resize((300, 400), Image.LANCZOS) for f in frames], out_dir / "vidigal-tile-anim.webp")
    save_loop([f.crop((0, 75, 600, 525)).resize((520, 390), Image.LANCZOS) for f in frames], out_dir / "vidigal-hero-anim.webp")
    for f in ("vidigal-plate.webp", "vidigal-anim.webp", "vidigal-tile.webp", "vidigal-tile-anim.webp", "vidigal-hero-anim.webp"):
        print(f, (out_dir / f).stat().st_size, "B")


def crop_tile(im, v):
    """3:4 phone crop (about 110 x 145 on the page) around the densest buildings."""
    k = im.width / S
    BX, BY, _ = v.B
    X, Y = BX * k, BY * k
    x0, x1, y0, y1 = np.percentile(X, 15), np.percentile(X, 85), np.percentile(Y, 15), np.percentile(Y, 85)
    w = min(im.width * 0.62, max(x1 - x0 + 0.1 * im.width, 0.75 * (y1 - y0 + 0.1 * im.width)))
    h = w * 4 / 3
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    bx = int(max(0, min(im.width - w, cx - w / 2)))
    by = int(max(0, min(im.height - h, cy - h / 2)))
    return im.crop((bx, by, bx + int(w), by + int(h))).resize((450, 600), Image.LANCZOS)


def jordaan():
    p, cat, _ = load("amsterdam-canopy")
    X, Y, t, _ = frame(p, 0.5, 0.62, 0.7, 0.86, 0.4)
    canopy = cat == 1
    h = np.clip(p[:, 2], 0, 1)
    green = GREEN_DEEP + (GREEN - GREEN_DEEP) * np.clip(0.35 + 0.65 * t + 0.25 * h, 0, 1)[:, None]
    grey = np.where((cat == 2)[:, None], GREY * 0.8, GREY)
    w = np.where(canopy, 0.55 + 0.45 * t, np.where(cat == 2, 0.3 + 0.35 * t, 0.28 + 0.5 * t))
    w = np.maximum(w, 0.2)

    def render(head, size):
        g = np.zeros(len(p)) if head is None else glow_at(h / max(h[canopy].max(), 1e-6), head)
        rgb = np.where(canopy[:, None], green + (np.array((190, 245, 205)) - green) * (0.7 * g)[:, None], grey + (LIGHT - grey) * g[:, None])
        ww = np.clip(w + 0.45 * g * (0.5 + 0.5 * t), 0, 1)
        return draw(X, Y, t, [(~canopy, rgb, ww, 1.7), (canopy, rgb, ww, 2.5)], size)

    render(None, S).save(JOR, "WEBP", quality=84, method=6)
    print(JOR, JOR.stat().st_size, "B")
    out = JOR.parent / "jordaan-anim.webp"
    save_loop([render(SPAN * i / N_FRAMES, 600) for i in range(N_FRAMES)], out)
    print(out, out.stat().st_size, "B")


def vidigal_alt():
    v = VidigalView(rot=0.9, tilt=1.1, ysq=0.9, fill=0.98, cy=0.45)
    ALT_OUT.mkdir(parents=True, exist_ok=True)
    out = ALT_OUT / "vidigal-alt-plan.webp"
    draw(*v.layers()[:3], v.layers()[3]).save(out, "WEBP", quality=84, method=6)
    print(out)


if __name__ == "__main__":
    if "--alt" in sys.argv:
        vidigal_alt()
    else:
        jordaan()
        vidigal()
