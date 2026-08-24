#!/usr/bin/env python3
"""Sample the two Amsterdam datasets for the rotating hero artifact.

Same binary format as sample-favela-pointcloud.py (4 bytes/point):
    int8 x, int8 y in [-1, 1] · uint8 z in [0, 1] · uint8 category
Categories: 0 = ground/terrain, 1 = structure, 2 = vegetation.

1. ams-trees.bin — per-tree LAI census (MSc thesis, MIT Senseable Amsterdam
   + AMS Institute). Each tree renders as a short vertical stroke: ground
   anchor (cat 0) + stem/crown points (cat 2), crown width from the measured
   diameter.
2. depijp-lidar.bin — raw aerial LiDAR tile of De Pijp. The tile ships
   unclassified, so points are split ground / above-ground with a per-cell
   minimum heuristic (10 m grid, +1.0 m tolerance) — a standard coarse
   ground filter, not a semantic claim.
"""
from __future__ import annotations

import json
import struct
import sys
from pathlib import Path

import numpy as np

ROOT = Path(__file__).parent.parent
TREES_CSV = Path("/home/theo/LAI/data/results/ams_dataset_v0.csv")
LAS_PATH = Path(
    "/home/theo/treeLAI_rsrc/untracked_ShadyBusiness/testing/test_data/lidar_crop_0.las"
)
OUT_DIR = ROOT / "public" / "data"
RNG = np.random.default_rng(seed=42)

N_LIDAR = 12000


def quantize_and_write(
    x_m: np.ndarray,
    y_m: np.ndarray,
    z_m: np.ndarray,
    cat: np.ndarray,
    out_stem: str,
    meta_extra: dict,
) -> None:
    cx = (x_m.max() + x_m.min()) / 2
    cy = (y_m.max() + y_m.min()) / 2
    scale = max(x_m.max() - x_m.min(), y_m.max() - y_m.min()) / 2 or 1.0
    nx = (x_m - cx) / scale
    ny = (y_m - cy) / scale

    z_min, z_max = float(z_m.min()), float(z_m.max())
    nz = (z_m - z_min) / max(z_max - z_min, 1e-6)

    qx = np.clip(np.round(nx * 127), -128, 127).astype(np.int8)
    qy = np.clip(np.round(ny * 127), -128, 127).astype(np.int8)
    qz = np.clip(np.round(nz * 255), 0, 255).astype(np.uint8)

    blob = bytearray()
    for x_, y_, z_, c_ in zip(qx.tolist(), qy.tolist(), qz.tolist(), cat.tolist()):
        blob += struct.pack("bbBB", x_, y_, z_, c_)

    out_bin = OUT_DIR / f"{out_stem}.bin"
    out_bin.write_bytes(blob)
    meta = {
        "schema": "vidigal-rooftops-v2",
        "encoding": "interleaved int8 x, int8 y, uint8 z, uint8 category; 4 bytes/point",
        "count": int(len(qx)),
        "z_meters": {"min": z_min, "max": z_max},
        **meta_extra,
    }
    (OUT_DIR / f"{out_stem}.json").write_text(json.dumps(meta, indent=2))
    print(f"✓ {out_bin.relative_to(ROOT)} — {out_bin.stat().st_size} bytes, {len(qx)} pts")


def sample_trees() -> None:
    """LAI → shading, made visible.

    Each tree renders as: a trunk column (cat 1), a canopy dome whose POINT
    DENSITY is proportional to its measured LAI (cat 2), and a shade
    footprint on the ground (cat 0) offset along the sun direction, again
    densified by LAI — denser canopy, deeper shade. Sun fixed at 45°
    elevation from the south-west (afternoon). Trees come from the densest
    500 m window of the census so individual canopies stay legible.
    """
    import pandas as pd

    df = pd.read_csv(TREES_CSV)
    df = df[np.isfinite(df["height_max"]) & (df["height_max"] > 2)].copy()

    lat0 = float(df["latitude"].mean())
    mx = 111_320 * np.cos(np.radians(lat0))
    my = 110_540
    df["x"] = (df["longitude"] - df["longitude"].mean()) * mx
    df["y"] = (df["latitude"] - df["latitude"].mean()) * my

    # Densest 280 m window keeps canopies readable at hero scale.
    best, best_n = (0.0, 0.0), 0
    for cx in np.arange(df["x"].min(), df["x"].max(), 50):
        for cy in np.arange(df["y"].min(), df["y"].max(), 50):
            n = ((df["x"] > cx) & (df["x"] < cx + 280) & (df["y"] > cy) & (df["y"] < cy + 280)).sum()
            if n > best_n:
                best_n, best = n, (cx, cy)
    df = df[
        (df["x"] > best[0]) & (df["x"] < best[0] + 280)
        & (df["y"] > best[1]) & (df["y"] < best[1] + 280)
    ]

    lai = np.nan_to_num(df["lai_mean"].to_numpy(), nan=1.0)
    lai_n = np.clip(lai / 3.2, 0.05, 1.0)  # census max ≈ 3.2
    h = df["height_max"].to_numpy()
    crown_r = np.clip(np.nan_to_num(df["diameters"].to_numpy(), nan=6.0), 3.0, 30.0) / 2

    sun = np.array([0.707, 0.707])  # shadow cast toward NE (sun in SW), 45° elevation

    xs, ys, zs, cs = [], [], [], []
    for xi, yi, hi, ri, li in zip(df["x"], df["y"], h, crown_r, lai_n):
        # trunk
        for f in (0.1, 0.4, 0.62):
            xs.append(xi); ys.append(yi); zs.append(hi * f); cs.append(1)
        # canopy dome — density ∝ LAI
        n_canopy = int(round(30 + li * 90))
        cz = hi * 0.74
        for _ in range(n_canopy):
            u, v, w = RNG.uniform(-1, 1, 3)
            norm = max(np.sqrt(u * u + v * v + w * w), 1e-6)
            rad = ri * RNG.uniform(0.55, 1.0) ** 0.5
            xs.append(xi + (u / norm) * rad)
            ys.append(yi + (v / norm) * rad)
            zs.append(max(cz + (abs(w) / norm) * hi * 0.26 * np.sign(w), hi * 0.45))
            cs.append(2)
        # shade footprint — offset = height (45° sun), density ∝ LAI
        n_shade = int(round(24 + li * 70))
        sx, sy = xi + sun[0] * hi * 1.25, yi + sun[1] * hi * 1.25
        for _ in range(n_shade):
            a = RNG.uniform(0, 2 * np.pi)
            rr = ri * 1.15 * np.sqrt(RNG.uniform(0, 1))
            ex = np.cos(a) * rr * 1.45  # major axis along NE cast
            ey = np.sin(a) * rr * 0.8
            xs.append(sx + ex * 0.707 - ey * 0.707)
            ys.append(sy + ex * 0.707 + ey * 0.707)
            zs.append(0.0)
            cs.append(0)

    quantize_and_write(
        np.asarray(xs), np.asarray(ys), np.asarray(zs),
        np.asarray(cs, dtype=np.uint8),
        "ams-trees",
        {
            "source": "MIT Senseable City Lab Amsterdam + AMS Institute — per-tree LAI census; shade footprints derived at 45° SW sun",
            "site": "Amsterdam, Netherlands (densest 500 m census window)",
            "n_trees": int(len(df)),
        },
    )


def sample_lidar() -> None:
    import laspy

    f = laspy.read(LAS_PATH)
    x = np.asarray(f.x); y = np.asarray(f.y); z = np.asarray(f.z)

    idx = RNG.choice(len(x), size=N_LIDAR, replace=False)
    idx.sort()
    x, y, z = x[idx], y[idx], z[idx]

    # Coarse ground filter: per-10m-cell minimum + 1.0 m tolerance.
    cell = 10.0
    gx = ((x - x.min()) / cell).astype(np.int32)
    gy = ((y - y.min()) / cell).astype(np.int32)
    key = gx * 100_000 + gy
    order = np.argsort(key)
    ground = np.zeros(len(x), dtype=bool)
    i = 0
    while i < len(order):
        j = i
        while j < len(order) and key[order[j]] == key[order[i]]:
            j += 1
        block = order[i:j]
        zmin = z[block].min()
        ground[block] = z[block] <= zmin + 1.0
        i = j
    cat = np.where(ground, 0, 1).astype(np.uint8)

    quantize_and_write(
        x, y, z, cat,
        "depijp-lidar",
        {
            "source": "Aerial LiDAR (AHN) — De Pijp, Amsterdam; ground split via per-cell min heuristic",
            "site": "De Pijp, Amsterdam",
            "n_ground": int(ground.sum()),
            "n_above": int((~ground).sum()),
        },
    )


def main() -> int:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    sample_trees()
    # sample_lidar() kept for reference — the De Pijp tile was replaced by the
    # procedural Loomo scene in the hero (2026-06-12).
    return 0


if __name__ == "__main__":
    sys.exit(main())
