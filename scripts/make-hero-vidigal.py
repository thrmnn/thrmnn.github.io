#!/usr/bin/env python3
"""Render scripts/assets/hero/vidigal-plan.webp, the portfolio PDF's cover plate
(owner lock L-2, 2026-10-23: "Vidigal, terrain and roofs"; off the homepage
hero since 2026-10-28, so it no longer ships with the site).

Every mark comes from public/data/vidigal-rooftops.{bin,json}, the quantised
derivative already published on this site (no new data, see the Vidigal
disclosure ruling): the 16 m terrain grid as its own hillshade and 25 m
contours, and the rooftop outline points in the accent. Background is
transparent so the plate sits on either theme and can fly as one object.
"""
import json
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter, zoom

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "public/data"
OUT = ROOT / "scripts/assets/hero/vidigal-plan.webp"
ACCENT = "#2563eb"
UP = 4  # upsampling of the 16 m grid before shading, for a smooth surface


def load():
    meta = json.loads((DATA / "vidigal-rooftops.json").read_text())
    raw = np.fromfile(DATA / "vidigal-rooftops.bin", dtype=np.uint8).reshape(-1, 6)
    xy = raw[:, :4].copy().view(np.int16).reshape(-1, 2) / 32767
    z0, z1 = meta["z_meters"]["min"], meta["z_meters"]["max"]
    z = z0 + raw[:, 4] / 255 * (z1 - z0)
    return meta, xy[:, 0], xy[:, 1], z, raw[:, 5] & 15, raw[:, 5] >> 4


def main():
    meta, x, y, z, cat, hs = load()
    g = next(t for t in meta["terrain_grid"] if t["name"] == "core")
    s = slice(g["offset"], g["offset"] + g["nx"] * g["ny"])
    gx = x[s].reshape(g["ny"], g["nx"]); gy = y[s].reshape(g["ny"], g["nx"])
    void = (cat[s] == 15).reshape(g["ny"], g["nx"])
    zz = np.where(void, np.nan, z[s].reshape(g["ny"], g["nx"]))
    shade = np.where(void, np.nan, hs[s].reshape(g["ny"], g["nx"]) / 15)
    if gy[0, 0] > gy[-1, 0]:
        gx, gy, zz, shade, void = gx[::-1], gy[::-1], zz[::-1], shade[::-1], void[::-1]

    # Smooth surface: fill voids from neighbours only for the interpolation,
    # then cut them back out with a feathered mask so no stair edge shows.
    fill = lambda a: np.where(np.isnan(a), np.nanmean(a), a)
    z_up = zoom(gaussian_filter(fill(zz), 0.6), UP, order=3)
    sh_up = zoom(gaussian_filter(fill(shade), 0.8), UP, order=3)
    mask = gaussian_filter(zoom((~void).astype(float), UP, order=1), UP * 0.6)
    mask = np.clip((mask - 0.35) / 0.4, 0, 1)
    # The grid ends where the clip ends; fade the plate out toward its frame
    # so the cut reads as an edge of the sheet, not missing data.
    ramp = lambda n, f: np.clip(np.minimum(np.arange(n), np.arange(n)[::-1]) / (f * n), 0, 1)
    mask = mask * np.outer(ramp(mask.shape[0], 0.10), ramp(mask.shape[1], 0.08))

    x0, x1, y0, y1 = np.nanmin(gx), np.nanmax(gx), np.nanmin(gy), np.nanmax(gy)
    h, w = z_up.shape
    fig = plt.figure(figsize=(w / 100 * 3, h / 100 * 3), dpi=100)
    ax = fig.add_axes([0, 0, 1, 1]); ax.set_axis_off()
    grey = 0.62 + 0.33 * np.clip(sh_up, 0, 1)
    rgba = np.dstack([grey, grey, grey, mask * 0.9])
    ax.imshow(rgba, extent=[x0, x1, y0, y1], origin="lower", interpolation="bilinear")
    xs = np.linspace(x0, x1, w); ys = np.linspace(y0, y1, h)
    levels = np.arange(25, np.nanmax(zz) + 25, 25)
    cz = np.where(mask > 0.5, z_up, np.nan)
    ax.contour(xs, ys, cz, levels=levels, colors="#5c5c5c", linewidths=0.6, alpha=0.75)
    b = cat == 1
    inside = (x[b] >= x0) & (x[b] <= x1) & (y[b] >= y0) & (y[b] <= y1)
    ax.scatter(x[b][inside], y[b][inside], s=3.2, c=ACCENT, linewidths=0, alpha=0.95)
    ax.set_xlim(x0, x1); ax.set_ylim(y0, y1); ax.set_aspect("equal")
    OUT.parent.mkdir(parents=True, exist_ok=True)
    tmp = OUT.with_suffix(".png")
    fig.savefig(tmp, transparent=True); plt.close(fig)
    im = Image.open(tmp); bbox = im.getbbox(); im = im.crop(bbox)
    im.thumbnail((1600, 1600))
    im.save(OUT, "WEBP", quality=82, method=6); tmp.unlink()
    print(f"wrote {OUT} {im.size} {OUT.stat().st_size // 1024} KB")


if __name__ == "__main__":
    main()
