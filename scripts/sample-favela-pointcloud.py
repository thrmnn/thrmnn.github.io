#!/usr/bin/env python3
"""Sample a small point cloud from a Vidigal DTM GeoTIFF for the home-page hero scrubber.

Produces a compact binary blob in public/data/ that the client-side scrubber
streams in. 8-bit quantization + scale metadata keeps it ~5–10 KB for
3000 points.
"""
from __future__ import annotations

import json
import struct
import sys
from pathlib import Path

import numpy as np
import rasterio

SRC = Path("/home/theo/MorphoFavela/data/vidigal/dtm_extended_300m.tif")
OUT_BIN = Path(__file__).parent.parent / "public" / "data" / "vidigal-rooftops.bin"
OUT_META = Path(__file__).parent.parent / "public" / "data" / "vidigal-rooftops.json"
N_POINTS = 3000


def main() -> int:
    if not SRC.exists():
        print(f"✗ missing {SRC}", file=sys.stderr)
        return 1

    with rasterio.open(SRC) as src:
        z = src.read(1).astype(np.float32)
        nodata = src.nodata

    # Drop nodata cells
    mask = np.ones_like(z, dtype=bool)
    if nodata is not None:
        mask &= z != nodata
    mask &= np.isfinite(z)
    if not mask.any():
        print("✗ no valid cells in DTM", file=sys.stderr)
        return 1

    # Keep the dense hillside ridge — drop the lowest 15% (sea / outliers)
    p_low, p_high = np.quantile(z[mask], [0.15, 0.999])
    mask &= (z >= p_low) & (z <= p_high)

    h, w = z.shape
    ys, xs = np.where(mask)

    # Uniform random sample of N_POINTS — keep deterministic seed so the
    # checked-in blob is stable across regens.
    rng = np.random.default_rng(seed=42)
    if len(ys) > N_POINTS:
        idx = rng.choice(len(ys), size=N_POINTS, replace=False)
        ys, xs = ys[idx], xs[idx]

    # Normalize XY into [-1, 1], Z into [0, 1].
    nx = (xs.astype(np.float32) / (w - 1)) * 2 - 1
    ny = (ys.astype(np.float32) / (h - 1)) * 2 - 1
    nz = z[ys, xs]
    nz_min, nz_max = float(nz.min()), float(nz.max())
    nz = (nz - nz_min) / max(nz_max - nz_min, 1e-6)

    # 8-bit quantize each axis. XY: signed (-128..127 → [-1,1]), Z: unsigned (0..255 → [0,1]).
    qx = np.clip(np.round(nx * 127), -128, 127).astype(np.int8)
    qy = np.clip(np.round(ny * 127), -128, 127).astype(np.int8)
    qz = np.clip(np.round(nz * 255), 0, 255).astype(np.uint8)

    # Pack as interleaved (x, y, z) — 3 bytes per point.
    blob = bytearray()
    for x_, y_, z_ in zip(qx.tolist(), qy.tolist(), qz.tolist()):
        blob += struct.pack("bbB", x_, y_, z_)

    OUT_BIN.parent.mkdir(parents=True, exist_ok=True)
    OUT_BIN.write_bytes(blob)

    meta = {
        "schema": "vidigal-rooftops-v1",
        "source": "MIT Senseable City Lab Rio — Vidigal DTM (extended 300m buffer)",
        "site": "Vidigal favela, Rio de Janeiro",
        "encoding": "interleaved int8 x, int8 y, uint8 z; 3 bytes per point",
        "count": int(len(qx)),
        "z_meters": {"min": nz_min, "max": nz_max},
    }
    OUT_META.write_text(json.dumps(meta, indent=2))

    print(f"✓ wrote {OUT_BIN.relative_to(OUT_BIN.parents[2])} ({OUT_BIN.stat().st_size} bytes, "
          f"{meta['count']} points)")
    print(f"✓ wrote {OUT_META.relative_to(OUT_META.parents[2])}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
