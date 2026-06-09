#!/usr/bin/env python3
"""Sample a small Vidigal point cloud for the home-page hero scrubber.

Output format (4 bytes/point, packed little-endian):
    int8   x in [-1, 1] (XY normalized to scene bounds, signed)
    int8   y in [-1, 1]
    uint8  z in [0, 1] (height normalized to scene max)
    uint8  category (0 = terrain DTM cell, 1 = building voxel)

Companion JSON sidecar carries provenance + the absolute z range so the
caption can show the real metric height span.
"""
from __future__ import annotations

import json
import struct
import sys
from pathlib import Path

import geopandas as gpd
import numpy as np
import rasterio
from rasterio.warp import transform_bounds
from shapely.geometry import Point

ROOT = Path(__file__).parent.parent
DTM_PATH = Path("/home/theo/MorphoFavela/data/vidigal/dtm_extended_300m.tif")
BLDG_PATH = Path(
    "/home/theo/MorphoFavela/outputs/vidigal/morphometrics/buildings/"
    "buildings_with_morphology_metrics.gpkg"
)
OUT_BIN = ROOT / "public" / "data" / "vidigal-rooftops.bin"
OUT_META = ROOT / "public" / "data" / "vidigal-rooftops.json"

N_TERRAIN = 2500
N_BUILDING_TARGET = 3500
RNG = np.random.default_rng(seed=42)


def sample_terrain() -> tuple[np.ndarray, np.ndarray, np.ndarray, dict]:
    """Return (x_m, y_m, z_m, meta) — sampled DTM cells in source CRS metres."""
    with rasterio.open(DTM_PATH) as src:
        z = src.read(1).astype(np.float32)
        nodata = src.nodata
        transform = src.transform
        crs = src.crs

    mask = np.isfinite(z)
    if nodata is not None:
        mask &= z != nodata
    if not mask.any():
        sys.exit("✗ no valid DTM cells")

    # Drop the lowest 12% — sea and outlier hits.
    p_lo = np.quantile(z[mask], 0.12)
    mask &= z >= p_lo

    ys, xs = np.where(mask)
    if len(ys) > N_TERRAIN:
        idx = RNG.choice(len(ys), size=N_TERRAIN, replace=False)
        ys, xs = ys[idx], xs[idx]

    # Pixel → world coords (col, row) → (x, y)
    px = transform * (xs + 0.5, ys + 0.5)
    x_m = np.asarray(px[0], dtype=np.float64)
    y_m = np.asarray(px[1], dtype=np.float64)
    z_m = z[ys, xs].astype(np.float64)

    return x_m, y_m, z_m, {"crs": str(crs)}


def sample_buildings(scene_crs: str) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    """Return (x_m, y_m, z_m) — building outlines, not blobs.

    Each footprint contributes points along its boundary at *both* the base
    height (ground line) and top height (rooftop outline) so the structure
    reads as a wireframe box sitting on the DTM, not a cloud of voxels.
    """
    g = gpd.read_file(BLDG_PATH)
    if g.crs is None or str(g.crs) != scene_crs:
        try:
            g = g.to_crs(scene_crs)
        except Exception:
            pass

    g = g[(g.geometry.notna()) & (g.geometry.area > 4.0)].copy()
    # Larger footprints get more outline samples — recognisable buildings first.
    g["__area"] = g.geometry.area
    g = g.sort_values("__area", ascending=False)

    xs: list[float] = []
    ys: list[float] = []
    zs: list[float] = []

    def _polygons(geom):
        """Yield Polygon parts of a (Multi)Polygon."""
        if geom.geom_type == "Polygon":
            yield geom
        elif geom.geom_type == "MultiPolygon":
            yield from geom.geoms

    for geom, base_h, top_h in zip(
        g.geometry, g["base_height"].to_numpy(), g["top_height"].to_numpy()
    ):
        if not np.isfinite(base_h) or not np.isfinite(top_h) or top_h <= base_h:
            continue
        if len(xs) >= N_BUILDING_TARGET:
            break

        for poly in _polygons(geom):
            if len(xs) >= N_BUILDING_TARGET:
                break
            ring = poly.exterior
            perim = ring.length
            spacing = 2.0
            n_samples = int(np.clip(np.ceil(perim / spacing), 4, 22))
            ts = np.linspace(0, perim, n_samples, endpoint=False)
            for t in ts:
                pt = ring.interpolate(t)
                xs.append(float(pt.x))
                ys.append(float(pt.y))
                zs.append(float(top_h))     # rooftop outline
            # Ground line — only for taller buildings (≥ 3 m); otherwise the
            # base ring overlaps the rooftop and reads as noise.
            if top_h - base_h >= 3.0:
                for t in ts[::2]:
                    pt = ring.interpolate(t)
                    xs.append(float(pt.x))
                    ys.append(float(pt.y))
                    zs.append(float(base_h))

    xs_arr = np.asarray(xs)
    ys_arr = np.asarray(ys)
    zs_arr = np.asarray(zs)
    if len(xs_arr) > N_BUILDING_TARGET:
        xs_arr = xs_arr[:N_BUILDING_TARGET]
        ys_arr = ys_arr[:N_BUILDING_TARGET]
        zs_arr = zs_arr[:N_BUILDING_TARGET]
    return xs_arr, ys_arr, zs_arr


def main() -> int:
    tx, ty, tz, meta = sample_terrain()
    bx, by, bz = sample_buildings(meta["crs"])

    all_x = np.concatenate([tx, bx])
    all_y = np.concatenate([ty, by])
    all_z = np.concatenate([tz, bz])
    cat = np.concatenate(
        [np.zeros(len(tx), dtype=np.uint8), np.ones(len(bx), dtype=np.uint8)]
    )

    # Centre on midpoint, scale isotropic, drop the long tail so the layout reads.
    cx = (all_x.max() + all_x.min()) / 2
    cy = (all_y.max() + all_y.min()) / 2
    scale = max(all_x.max() - all_x.min(), all_y.max() - all_y.min()) / 2 or 1.0
    nx = (all_x - cx) / scale
    ny = (all_y - cy) / scale

    z_min, z_max = float(all_z.min()), float(all_z.max())
    nz = (all_z - z_min) / max(z_max - z_min, 1e-6)

    qx = np.clip(np.round(nx * 127), -128, 127).astype(np.int8)
    qy = np.clip(np.round(ny * 127), -128, 127).astype(np.int8)
    qz = np.clip(np.round(nz * 255), 0, 255).astype(np.uint8)

    blob = bytearray()
    for x_, y_, z_, c_ in zip(qx.tolist(), qy.tolist(), qz.tolist(), cat.tolist()):
        blob += struct.pack("bbBB", x_, y_, z_, c_)

    OUT_BIN.parent.mkdir(parents=True, exist_ok=True)
    OUT_BIN.write_bytes(blob)

    out_meta = {
        "schema": "vidigal-rooftops-v2",
        "source": "MIT Senseable City Lab Rio — Vidigal DTM + building footprints",
        "site": "Vidigal favela, Rio de Janeiro",
        "encoding": "interleaved int8 x, int8 y, uint8 z, uint8 category (0=terrain, 1=building); 4 bytes/point",
        "count": int(len(qx)),
        "count_terrain": int(len(tx)),
        "count_buildings": int(len(bx)),
        "z_meters": {"min": z_min, "max": z_max},
    }
    OUT_META.write_text(json.dumps(out_meta, indent=2))

    print(
        f"✓ {OUT_BIN.relative_to(OUT_BIN.parents[2])} — {OUT_BIN.stat().st_size} bytes, "
        f"{out_meta['count']} pts ({out_meta['count_terrain']} terrain + "
        f"{out_meta['count_buildings']} bldg)"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
