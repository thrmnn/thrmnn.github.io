#!/usr/bin/env python3
"""Sample a small Jordaan clip for the research panel: a canal, the houses
along it, and the trees on its quays.

Source: one sub-tile of AHN5, the Dutch national airborne laser scan, open
data published by Kadaster via PDOK (https://www.pdok.nl, mirrored at
https://geotiles.citg.tudelft.nl/AHN5_T/). Nothing here comes from the
canopy study's pipeline: the clip is cut from the untouched public LAZ, and
the only operations are classification filtering, a per-cell ground median
and a per-cell canopy maximum. No leaf-area or any other derived quantity.

Output format matches vidigal-rooftops.bin (4 bytes/point, little-endian):
    int8   x in [-1, 1]   (XY normalised to the clip, signed)
    int8   y in [-1, 1]
    uint8  z in [0, 1]    (height normalised to the clip's z range)
    uint8  category       (0 = ground, 1 = canopy, 2 = building roof)
Companion JSON sidecar carries provenance, counts and the assumptions.
"""
from __future__ import annotations

import json
import struct
from pathlib import Path

import laspy
import numpy as np

ROOT = Path(__file__).parent.parent
LAZS = [Path("/home/theo/SCL/SCA/ShadyBusiness2/data/tiles/25GN1/lidar/25GN1_01.LAZ"),
        Path("/home/theo/SCL/SCA/ShadyBusiness2/data/tiles/25EZ1/lidar/25EZ1_21.LAZ")]
OUT_BIN = ROOT / "public" / "data" / "amsterdam-canopy.bin"
OUT_META = ROOT / "public" / "data" / "amsterdam-canopy.json"

# Western Jordaan, EPSG:28992 (RD New): a canal running north to south with
# houses on both banks and trees along the quays. Water gives the laser no
# return, so the canal is the gap in the ground.
X0, X1, Y0, Y1 = 120640.0, 120800.0, 487380.0, 487540.0
GROUND_CELL = 2.0      # metres; one ground point per cell (median z)
Z_CAP_M = 45.0         # NAP; one spire in the clip would otherwise flatten every house
CANOPY_CELL = 1.5      # metres; one canopy point per cell (highest return)
BUILDING_CELL = 1.5    # metres; one roof point per cell (highest return)
CANOPY_MIN_HAG = 2.0   # metres above the local ground median
N_GROUND = 3500
N_CANOPY = 5500
N_BUILDING = 5000
RNG = np.random.default_rng(seed=7)


def read_clip() -> tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
    xs, ys, zs, cs = [], [], [], []
    for laz in LAZS:
      with laspy.open(laz) as reader:
        for chunk in reader.chunk_iterator(4_000_000):
              x = np.asarray(chunk.x)
              y = np.asarray(chunk.y)
              m = (x >= X0) & (x < X1) & (y >= Y0) & (y < Y1)
              if not m.any():
                  continue
              xs.append(x[m])
              ys.append(y[m])
              zs.append(np.asarray(chunk.z)[m])
              cs.append(np.asarray(chunk.classification)[m])
    return (np.concatenate(xs), np.concatenate(ys), np.concatenate(zs), np.concatenate(cs))


def per_cell(x, y, z, cell, reduce):
    """One (x, y, z) per occupied cell; z reduced by `reduce` over the cell."""
    ix = ((x - X0) // cell).astype(np.int64)
    iy = ((y - Y0) // cell).astype(np.int64)
    key = iy * 1_000_000 + ix
    order = np.argsort(key, kind="stable")
    key, z = key[order], z[order]
    starts = np.r_[0, np.flatnonzero(np.diff(key)) + 1]
    ends = np.r_[starts[1:], len(key)]
    out_z = np.array([reduce(z[s:e]) for s, e in zip(starts, ends)])
    k = key[starts]
    cx = X0 + (k % 1_000_000 + 0.5) * cell
    cy = Y0 + (k // 1_000_000 + 0.5) * cell
    return cx, cy, out_z


def main() -> int:
    x, y, z, c = read_clip()
    n_capped = int((z > Z_CAP_M).sum())
    x, y, z, c = x[z <= Z_CAP_M], y[z <= Z_CAP_M], z[z <= Z_CAP_M], c[z <= Z_CAP_M]
    ground = c == 2
    gx, gy, gz = per_cell(x[ground], y[ground], z[ground], GROUND_CELL, np.median)

    # Height above ground from the ground median of the enclosing ground cell.
    gix = ((gx - X0) // GROUND_CELL).astype(np.int64)
    giy = ((gy - Y0) // GROUND_CELL).astype(np.int64)
    grid = np.full((int((Y1 - Y0) // GROUND_CELL) + 1, int((X1 - X0) // GROUND_CELL) + 1), np.nan)
    grid[giy, gix] = gz
    fill = np.nanmedian(gz)
    grid = np.where(np.isnan(grid), fill, grid)

    veg = c == 1  # AHN leaves vegetation unclassified; buildings (6) and water (9) are excluded
    vx, vy, vz = x[veg], y[veg], z[veg]
    hag = vz - grid[((vy - Y0) // GROUND_CELL).astype(np.int64), ((vx - X0) // GROUND_CELL).astype(np.int64)]
    keep = hag >= CANOPY_MIN_HAG
    cx, cy, cz = per_cell(vx[keep], vy[keep], vz[keep], CANOPY_CELL, np.max)

    bm = c == 6
    bx, by, bz = per_cell(x[bm], y[bm], z[bm], BUILDING_CELL, np.max)
    n_ground_cells, n_canopy_cells, n_building_cells = len(gx), len(cx), len(bx)
    if len(bx) > N_BUILDING:
        i = RNG.choice(len(bx), N_BUILDING, replace=False)
        bx, by, bz = bx[i], by[i], bz[i]
    if len(gx) > N_GROUND:
        i = RNG.choice(len(gx), N_GROUND, replace=False)
        gx, gy, gz = gx[i], gy[i], gz[i]
    if len(cx) > N_CANOPY:
        i = RNG.choice(len(cx), N_CANOPY, replace=False)
        cx, cy, cz = cx[i], cy[i], cz[i]

    ax = np.concatenate([gx, cx, bx])
    ay = np.concatenate([gy, cy, by])
    az = np.concatenate([gz, cz, bz])
    cat = np.concatenate([np.zeros(len(gx), np.uint8), np.ones(len(cx), np.uint8), np.full(len(bx), 2, np.uint8)])

    mx, my = (X0 + X1) / 2, (Y0 + Y1) / 2
    scale = max(X1 - X0, Y1 - Y0) / 2
    z_min, z_max = float(az.min()), float(az.max())
    qx = np.clip(np.round((ax - mx) / scale * 127), -128, 127).astype(np.int8)
    qy = np.clip(np.round((ay - my) / scale * 127), -128, 127).astype(np.int8)
    qz = np.clip(np.round((az - z_min) / max(z_max - z_min, 1e-6) * 255), 0, 255).astype(np.uint8)

    blob = bytearray()
    for x_, y_, z_, c_ in zip(qx.tolist(), qy.tolist(), qz.tolist(), cat.tolist()):
        blob += struct.pack("bbBB", x_, y_, z_, c_)
    OUT_BIN.write_bytes(blob)

    meta = {
        "schema": "amsterdam-canopy-v2",
        "source": "AHN5, Dutch national airborne laser scan (Kadaster, open data via PDOK), sub-tiles 25GN1_01 and 25EZ1_21",
        "source_url": "https://www.pdok.nl/introductie/-/article/actueel-hoogtebestand-nederland-ahn",
        "site": "Jordaan, Amsterdam",
        "crs": "EPSG:28992",
        "bbox_m": {"x": [X0, X1], "y": [Y0, Y1]},
        "encoding": "interleaved int8 x, int8 y, uint8 z, uint8 category (0=ground, 1=canopy, 2=building roof); 4 bytes/point",
        "count": int(len(ax)),
        "n_ground": int(len(gx)),
        "n_canopy": int(len(cx)),
        "n_building": int(len(bx)),
        "cells_before_thinning": {"ground": int(n_ground_cells), "canopy": int(n_canopy_cells), "building": int(n_building_cells)},
        "z_meters": {"min": round(z_min, 2), "max": round(z_max, 2), "datum": "NAP"},
        "assumptions": [
            f"ground = median z of classification 2 per {GROUND_CELL:g} m cell",
            f"canopy = highest classification-1 return per {CANOPY_CELL:g} m cell, at least {CANOPY_MIN_HAG:g} m above the local ground median; AHN does not label vegetation, so this is height above ground, not a species or leaf attribute",
            f"building = highest classification-6 return per {BUILDING_CELL:g} m cell",
            "water gives the laser no return, so the canal is the gap in the ground; bridges (26) excluded",
            f"{n_capped} returns above {Z_CAP_M:g} m NAP dropped (a single spire), so the houses keep their proportions",
            "uniform random thinning to the point budget; no derived quantity computed",
        ],
    }
    OUT_META.write_text(json.dumps(meta, indent=2) + "\n")
    print(f"wrote {OUT_BIN} ({len(blob)} B, {len(ax)} points: {len(gx)} ground, {len(cx)} canopy, {len(bx)} building; z {z_min:.1f}..{z_max:.1f} m)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
