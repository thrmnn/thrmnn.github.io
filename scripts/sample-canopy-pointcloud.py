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
from scipy import ndimage

ROOT = Path(__file__).parent.parent
LAZS = [Path("/home/theo/SCL/SCA/ShadyBusiness2/data/tiles/25GN1/lidar/25GN1_01.LAZ"),
        Path("/home/theo/SCL/SCA/ShadyBusiness2/data/tiles/25EZ1/lidar/25EZ1_21.LAZ")]
OUT_BIN = ROOT / "public" / "data" / "amsterdam-canopy.bin"
OUT_META = ROOT / "public" / "data" / "amsterdam-canopy.json"

# Western Jordaan, EPSG:28992 (RD New): a canal running north to south, a row
# of quay trees on the west bank, an open quay with a few trees and the
# houses beyond it on the east. Water gives the laser no
# return, so the canal is the gap in the ground.
X0, X1, Y0, Y1 = 120635.0, 120755.0, 487425.0, 487515.0
GROUND_CELL = 1.5      # metres; one ground point per cell (median z)
Z_CAP_M = 45.0         # NAP; one spire in the clip would otherwise flatten every house
CANOPY_CELL = 1.0      # metres; one canopy point per cell (highest return)
BUILDING_CELL = 1.2    # metres; one roof point per cell (highest return)
CANOPY_MIN_HAG = 2.0   # metres above the local ground median
MIN_NEIGHBOURS = 5     # of 8, for a canopy cell to count as part of a crown
MIN_PATCH_CELLS = 12   # a crown patch smaller than this (m^2) is noise
FACADE_CELLS = 2       # a canopy cell this close to a roof at its height is a wall
N_GROUND = 3800
N_CANOPY = 4500
N_BUILDING = 4200
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
    # A crown's top from single returns is spiky; a 3 x 3 mean over occupied
    # cells (empties ignored) gives the smooth upper surface a crown has,
    # without inventing canopy where there is none.
    nx, ny = int((X1 - X0) // CANOPY_CELL) + 1, int((Y1 - Y0) // CANOPY_CELL) + 1
    chm = np.full((ny, nx), np.nan)
    ci = ((cx - X0) // CANOPY_CELL).astype(int); cj = ((cy - Y0) // CANOPY_CELL).astype(int)
    chm[cj, ci] = cz
    pad = np.pad(chm, 1, constant_values=np.nan)
    stack = np.stack([pad[a:a + ny, b:b + nx] for a in range(3) for b in range(3)])
    smooth = np.nanmean(stack, axis=0)
    # Noise: a crown is a compact patch of occupied cells. A cell with fewer
    # than MIN_NEIGHBOURS occupied neighbours (a wire, a lamp post, a facade
    # edge) is dropped, then any remaining patch under MIN_PATCH_CELLS.
    occ = np.isfinite(chm)
    neigh = np.stack([np.pad(occ, 1)[a:a + ny, b:b + nx] for a in range(3) for b in range(3)]).sum(axis=0) - occ
    occ &= neigh >= MIN_NEIGHBOURS
    lab, nlab = ndimage.label(occ)
    sizes = ndimage.sum(occ, lab, index=np.arange(1, nlab + 1))
    small = np.isin(lab, np.where(sizes < MIN_PATCH_CELLS)[0] + 1)
    occ &= ~small
    # Facade echoes: unclassified returns hugging a building at roof height.
    # A canopy cell within FACADE_CELLS of a roof cell whose top is at or
    # above the canopy top is a wall or a chimney, not a tree.
    bm = c == 6
    bgrid = np.full((ny, nx), np.nan)
    bi = np.clip(((x[bm] - X0) // CANOPY_CELL).astype(int), 0, nx - 1); bj = np.clip(((y[bm] - Y0) // CANOPY_CELL).astype(int), 0, ny - 1)
    np.maximum.at(bgrid, (bj, bi), z[bm])
    roofmax = ndimage.maximum_filter(np.nan_to_num(bgrid, nan=-np.inf), size=2 * FACADE_CELLS + 1)
    occ &= ~(roofmax >= smooth - 1.0)
    keep_cell = occ[cj, ci]
    n_noise = int((~keep_cell).sum())
    cx, cy, ci, cj = cx[keep_cell], cy[keep_cell], ci[keep_cell], cj[keep_cell]
    cz = smooth[cj, ci]
    # a crown top is anywhere in its cell; drawing every one at the cell centre
    # weaves a lattice through the crown, so each sits at a random spot in its cell
    cx = cx + RNG.uniform(-0.5, 0.5, len(cx)) * CANOPY_CELL
    cy = cy + RNG.uniform(-0.5, 0.5, len(cy)) * CANOPY_CELL

    bm = c == 6
    # the 90th percentile, not the max: one chimney return would otherwise spike a roof cell
    bx, by, bz = per_cell(x[bm], y[bm], z[bm], BUILDING_CELL, lambda v: np.percentile(v, 90))
    n_ground_cells, n_canopy_cells, n_building_cells = len(gx), len(cx), len(bx)
    if len(cx) > N_CANOPY:
        i = RNG.choice(len(cx), N_CANOPY, replace=False)
        cx, cy, cz = cx[i], cy[i], cz[i]

    # Ground and roofs ship as full row-major grids so the renderer draws
    # them as surfaces: the quay is a faint plane with the canal as its gap,
    # each roof a slab. Empty cells are void (15); nothing is interpolated.
    def as_grid(px, py, pz, cell):
        nxg, nyg = int((X1 - X0) // cell) + 1, int((Y1 - Y0) // cell) + 1
        g = np.full((nyg, nxg), np.nan)
        g[((py - Y0) // cell).astype(int), ((px - X0) // cell).astype(int)] = pz
        gx_ = X0 + (np.arange(nxg) + 0.5) * cell
        gy_ = Y0 + (np.arange(nyg) + 0.5) * cell
        X, Y = np.meshgrid(gx_, gy_)
        return X.ravel(), Y.ravel(), g.ravel(), (nxg, nyg)
    GX, GY, GZ, (gnx, gny) = as_grid(gx, gy, gz, GROUND_CELL)
    RX, RY, RZ, (rnx, rny) = as_grid(bx, by, bz, BUILDING_CELL)
    gvalid, rvalid = np.isfinite(GZ), np.isfinite(RZ)
    # hillshade of the ground plane (the quays are flat, so this is near-uniform and light)
    gg = np.where(gvalid, GZ, np.nanmedian(GZ)).reshape(gny, gnx)
    dzdx, dzdy = np.gradient(gg, GROUND_CELL, axis=1), -np.gradient(gg, GROUND_CELL, axis=0)
    slope = np.arctan(np.hypot(dzdx, dzdy)); aspect = np.arctan2(dzdy, -dzdx)
    alt, azm = np.radians(45), np.radians(315)
    gshade = np.clip(np.sin(alt) * np.cos(slope) + np.cos(alt) * np.sin(slope) * np.cos(azm - np.pi / 2 - aspect), 0, 1).ravel()

    ax = np.concatenate([GX, RX, cx])
    ay = np.concatenate([GY, RY, cy])
    az = np.concatenate([np.nan_to_num(GZ, nan=np.nanmin(gz)), np.nan_to_num(RZ, nan=np.nanmin(gz)), cz])
    shade = np.concatenate([np.round(gshade * 15), np.full(len(RX), 8), np.zeros(len(cx))]).astype(np.uint8)
    cat = np.concatenate([np.where(gvalid, 0, 15), np.where(rvalid, 2, 15), np.ones(len(cx))]).astype(np.uint8)
    cat = (cat & 0x0F) | (shade << 4)
    grids = [
        {"name": "ground", "cat": 0, "step_m": GROUND_CELL, "nx": int(gnx), "ny": int(gny), "offset": 0},
        {"name": "roof", "cat": 2, "step_m": BUILDING_CELL, "nx": int(rnx), "ny": int(rny), "offset": int(len(GX))},
    ]

    mx, my = (X0 + X1) / 2, (Y0 + Y1) / 2
    scale = max(X1 - X0, Y1 - Y0) / 2
    z_min, z_max = float(az.min()), float(az.max())
    qx = np.clip(np.round((ax - mx) / scale * 32767), -32768, 32767).astype(np.int16)
    qy = np.clip(np.round((ay - my) / scale * 32767), -32768, 32767).astype(np.int16)
    qz = np.clip(np.round((az - z_min) / max(z_max - z_min, 1e-6) * 255), 0, 255).astype(np.uint8)

    blob = bytearray()
    for x_, y_, z_, c_ in zip(qx.tolist(), qy.tolist(), qz.tolist(), cat.tolist()):
        blob += struct.pack("<hhBB", x_, y_, z_, c_)
    OUT_BIN.write_bytes(blob)

    meta = {
        "schema": "cloud-v3",
        "stride": 6,
        "source": "AHN5, Dutch national airborne laser scan (Kadaster, open data via PDOK), sub-tiles 25GN1_01 and 25EZ1_21",
        "source_url": "https://www.pdok.nl/introductie/-/article/actueel-hoogtebestand-nederland-ahn",
        "site": "Jordaan, Amsterdam",
        "crs": "EPSG:28992",
        "bbox_m": {"x": [X0, X1], "y": [Y0, Y1]},
        "encoding": "interleaved int16 x, int16 y (scene units /32767), uint8 z, uint8 cat (low nibble: 0 ground cell, 1 canopy, 2 roof cell, 15 void; high nibble: hillshade 0..15 for ground); 6 bytes/point",
        "terrain_grid": grids,
        "count": int(len(ax)),
        "n_ground": int(gvalid.sum()),
        "n_canopy": int(len(cx)),
        "n_building": int(rvalid.sum()),
        "cells_before_thinning": {"ground": int(n_ground_cells), "canopy": int(n_canopy_cells), "building": int(n_building_cells)},
        "z_meters": {"min": round(z_min, 2), "max": round(z_max, 2), "datum": "NAP"},
        "assumptions": [
            f"ground = median z of classification 2 per {GROUND_CELL:g} m cell",
            f"canopy = highest classification-1 return per {CANOPY_CELL:g} m cell, at least {CANOPY_MIN_HAG:g} m above the local ground median, then a 3 x 3 mean over occupied cells; AHN does not label vegetation, so this is height above ground, not a species or leaf attribute",
            f"building = 90th percentile of classification-6 returns per {BUILDING_CELL:g} m cell",
            "water gives the laser no return, so the canal is the gap in the ground; bridges (26) excluded",
            f"{n_capped} returns above {Z_CAP_M:g} m NAP dropped (a single spire), so the houses keep their proportions",
            "ground and roof cells ship as full grids with empty cells marked void and are drawn as surfaces; canopy tops are thinned uniformly to the point budget; no derived quantity computed",
            f"canopy noise filter: a canopy cell keeps only with at least {MIN_NEIGHBOURS} of 8 occupied neighbours, in a patch of at least {MIN_PATCH_CELLS} cells, and not within {FACADE_CELLS} cells of a roof at or above its height ({n_noise} cells dropped)",
        ],
    }
    OUT_META.write_text(json.dumps(meta, indent=2) + "\n")
    print(f"wrote {OUT_BIN} ({len(blob)} B, {len(ax)} points: {int(gvalid.sum())} ground cells of {gnx}x{gny}, {len(cx)} canopy ({n_noise} noise cells dropped), {int(rvalid.sum())} roof cells of {rnx}x{rny}; z {z_min:.1f}..{z_max:.1f} m)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
