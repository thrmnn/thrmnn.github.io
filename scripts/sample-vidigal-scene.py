#!/usr/bin/env python3
"""Vidigal scene for the point-cloud panel, from MorphoFavela's source data.

Terrain: the 700 m extended DTM (5 m cells) block-averaged onto two regular
grids, a core at CORE_STEP m over the extent of the 300 m clip and a context
ring at CTX_STEP m out to the 700 m extent, each emitted as a full
row-major rectangle so the renderer can draw the surface as cells; the core
is drawn over the context grid, which covers the whole clip. Each terrain cell carries a
hillshade (light from the north-west, 45 degrees up) in the top nibble of its
category byte. Buildings: rooftop outline points from the morphometrics
footprints, the same set and the same extent the site already publishes.

Format v3, 6 bytes per point: int16 x, int16 y (scene units, /32767),
uint8 z (over z_meters), uint8 cat (low nibble: 0 terrain core, 1 building,
3 terrain context, 15 void; high nibble: shade 0..15 for terrain).
"""
import json
import struct
import sys
from pathlib import Path

import geopandas as gpd
import numpy as np
import rasterio

ROOT = Path(__file__).parent.parent
MF = Path.home() / "SCL" / "SCR" / "MorphoFavela"
DTM_WIDE = MF / "data" / "vidigal" / "dtm_extended_700m.tif"
DTM_CORE = MF / "data" / "vidigal" / "dtm_extended_300m.tif"
BLDG = MF / "outputs" / "vidigal" / "morphometrics" / "buildings" / "buildings_with_morphology_metrics.gpkg"
OUT_BIN = ROOT / "public" / "data" / "vidigal-rooftops.bin"
OUT_META = ROOT / "public" / "data" / "vidigal-rooftops.json"
CORE_STEP = 16      # m; the grid the terrain surface is drawn on
CTX_STEP = 32       # m; the ring that carries the terrain past the frame
N_BUILDING = 4600   # rooftop outline points, as today
RNG = np.random.default_rng(seed=42)


def grid(dtm_path: Path, step: int, bounds=None):
    """Block-mean the DTM onto a step-m grid; returns x, y, z, shade, valid (row-major)."""
    with rasterio.open(dtm_path) as src:
        z = src.read(1).astype(np.float64)
        if src.nodata is not None:
            z[z == src.nodata] = np.nan
        t = src.transform
        px = t.a
        x0, y0 = t.c, t.f
    k = int(round(step / px))
    ny, nx = z.shape[0] // k, z.shape[1] // k
    zc = z[: ny * k, : nx * k].reshape(ny, k, nx, k)
    zm = np.nanmean(zc, axis=(1, 3))
    valid = np.isfinite(zm)
    # hillshade from the block-mean surface
    zf = np.where(valid, zm, np.nanmean(zm))
    dzdx = np.gradient(zf, step, axis=1)
    dzdy = -np.gradient(zf, step, axis=0)
    slope = np.arctan(np.hypot(dzdx, dzdy))
    aspect = np.arctan2(dzdy, -dzdx)
    alt, az = np.radians(45), np.radians(315)
    shade = np.sin(alt) * np.cos(slope) + np.cos(alt) * np.sin(slope) * np.cos(az - np.pi / 2 - aspect)
    shade = np.clip(shade, 0, 1)
    cols = np.arange(nx) * k + k / 2
    rows = np.arange(ny) * k + k / 2
    X = x0 + cols[None, :] * px + np.zeros((ny, 1))
    Y = y0 - rows[:, None] * px + np.zeros((1, nx))
    return X, Y, zm, shade, valid, (nx, ny)


def buildings(scene_crs: str):
    g = gpd.read_file(BLDG)
    if g.crs is not None and str(g.crs) != scene_crs:
        g = g.to_crs(scene_crs)
    g = g[(g.geometry.notna()) & (g.geometry.area > 4.0)].copy()
    ok = np.isfinite(g["base_height"].to_numpy()) & np.isfinite(g["top_height"].to_numpy()) & (g["top_height"].to_numpy() > g["base_height"].to_numpy())
    g = g[ok]
    rings = []
    for geom, top in zip(g.geometry, g["top_height"].to_numpy()):
        for poly in (geom.geoms if geom.geom_type == "MultiPolygon" else [geom]):
            rings.append((poly.exterior, poly.exterior.length, float(top)))
    total = sum(r[1] for r in rings)
    k = (N_BUILDING * 0.85) / max(total, 1.0)
    xs, ys, zs = [], [], []
    for ring, perim, top in rings:
        n = int(np.clip(round(k * perim), 2, 24))
        for tt in np.linspace(0, perim, n, endpoint=False):
            p = ring.interpolate(tt)
            xs.append(p.x); ys.append(p.y); zs.append(top)
    xs, ys, zs = map(np.asarray, (xs, ys, zs))
    if len(xs) > N_BUILDING:
        idx = RNG.choice(len(xs), N_BUILDING, replace=False)
        xs, ys, zs = xs[idx], ys[idx], zs[idx]
    return xs, ys, zs, len(g)


def main() -> int:
    with rasterio.open(DTM_CORE) as c:
        cb = c.bounds
        crs = str(c.crs)
    Xw, Yw, Zw, Sw, Vw, (nxw, nyw) = grid(DTM_WIDE, CTX_STEP)
    Xc, Yc, Zc, Sc, Vc, (nxc, nyc) = grid(DTM_WIDE, CORE_STEP)
    core_c = (Xc >= cb.left) & (Xc <= cb.right) & (Yc >= cb.bottom) & (Yc <= cb.top)
    # trim the core grid to the rows/cols that touch the 300 m clip
    rr = np.where(core_c.any(axis=1))[0]; cc = np.where(core_c.any(axis=0))[0]
    r0, r1, c0, c1 = rr.min(), rr.max() + 1, cc.min(), cc.max() + 1
    Xc, Yc, Zc, Sc, Vc = (a[r0:r1, c0:c1] for a in (Xc, Yc, Zc, Sc, Vc))
    nyc, nxc = Zc.shape
    # the context grid is complete: the core is drawn over it, so there is no seam
    bx, by, bz, nb = buildings(crs)

    cx0, cy0 = (Xc.min() + Xc.max()) / 2, (Yc.min() + Yc.max()) / 2
    half = max(np.abs(Xw - cx0).max(), np.abs(Yw - cy0).max())
    zs_all = np.concatenate([Zc[Vc], Zw[Vw], bz])
    zmin, zmax = float(np.nanmin(zs_all)), float(np.nanmax(zs_all))

    def enc(x, y, z, cat, shade=None):
        xi = np.clip(np.round((x - cx0) / half * 32767), -32768, 32767).astype(np.int16)
        yi = np.clip(np.round((y - cy0) / half * 32767), -32768, 32767).astype(np.int16)
        zi = np.clip(np.round((np.nan_to_num(z, nan=zmin) - zmin) / (zmax - zmin) * 255), 0, 255).astype(np.uint8)
        sh = np.zeros_like(zi) if shade is None else np.clip(np.round(shade * 15), 0, 15).astype(np.uint8)
        ci = (cat.astype(np.uint8) & 0x0F) | (sh << 4)
        return np.stack([xi, yi, zi.astype(np.int16), ci.astype(np.int16)], axis=1)

    core_cat = np.where(Vc, 0, 15); ctx_cat = np.where(Vw, 3, 15)
    parts = [
        enc(Xc.ravel(), Yc.ravel(), Zc.ravel(), core_cat.ravel(), Sc.ravel()),
        enc(Xw.ravel(), Yw.ravel(), Zw.ravel(), ctx_cat.ravel(), Sw.ravel()),
        enc(bx, by, bz, np.ones(len(bx))),
    ]
    off_core, off_ctx, off_b = 0, Xc.size, Xc.size + Xw.size
    buf = bytearray()
    for p in parts:
        for xi, yi, zi, ci in p:
            buf += struct.pack("<hhBB", int(xi), int(yi), int(zi), int(ci))
    OUT_BIN.write_bytes(buf)
    n = len(buf) // 6
    meta = {
        "schema": "cloud-v3",
        "stride": 6,
        "source": "MIT Senseable City Lab Rio — Vidigal DTM (700 m extended clip, 5 m) + building footprints (300 m clip)",
        "site": "Vidigal favela, Rio de Janeiro",
        "encoding": "interleaved int16 x, int16 y (scene units /32767), uint8 z, uint8 cat (low nibble: 0 terrain core, 1 building, 3 terrain context, 15 void; high nibble: hillshade 0..15); 6 bytes/point",
        "count": n,
        "count_terrain": int(Vc.sum() + Vw.sum()),
        "count_buildings": int(len(bx)),
        "count_void": int((~Vc).sum() + (~Vw).sum()),
        "n_building_footprints": int(nb),
        "z_meters": {"min": zmin, "max": zmax},
        "terrain_grid": [
            {"name": "core", "step_m": CORE_STEP, "nx": int(nxc), "ny": int(nyc), "offset": off_core},
            {"name": "context", "step_m": CTX_STEP, "nx": int(nxw), "ny": int(nyw), "offset": off_ctx},
        ],
        "buildings_offset": off_b,
        "scene_half_extent_m": float(half),
        "assumptions": [
            f"terrain = DTM block mean per {CORE_STEP} m cell inside the 300 m clip, {CTX_STEP} m outside it out to the 700 m clip; drawn as a shaded surface, the shade is a hillshade of that mean (light from 315 deg azimuth, 45 deg up), not a measurement",
            "buildings = rooftop outline points sampled along each footprint's perimeter at its top height, thinned to a fixed budget; the footprint set and extent are unchanged from the previous derivative",
            "no derived quantity is computed or shown",
        ],
    }
    OUT_META.write_text(json.dumps(meta, indent=1) + "\n")
    print(f"wrote {n} points ({len(buf)} B): core {nxc}x{nyc}, context {nxw}x{nyw} ({int(Vw.sum())} live), buildings {len(bx)} from {nb} footprints; z {zmin:.1f}..{zmax:.1f} m; half-extent {half:.0f} m")
    return 0


if __name__ == "__main__":
    sys.exit(main())
