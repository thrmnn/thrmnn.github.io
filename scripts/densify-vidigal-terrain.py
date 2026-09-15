#!/usr/bin/env python3
"""Rebuild vidigal-rooftops.bin for display from the file the site already
ships: the 2,500 sampled terrain points are too sparse to read as ground under
the rooftops, so the terrain is re-sampled on a regular grid by linear
interpolation of those same samples (no new source data, no information the
public file did not already carry), and the rooftop outline points are thinned
so the settlement reads as a fabric rather than a mass.

Input and output share the 4-byte format (int8 x, int8 y, uint8 z, uint8 cat).
Run once; the sidecar is updated in place with the new counts and a note.

    python3 scripts/densify-vidigal-terrain.py
"""
import json
import struct
from pathlib import Path

import numpy as np
from scipy.interpolate import griddata
from scipy.spatial import Delaunay

ROOT = Path(__file__).parent.parent
BIN = ROOT / "public/data/vidigal-rooftops.bin"
META = ROOT / "public/data/vidigal-rooftops.json"
# The un-densified file, as the sampler wrote it (git: f85947c), so the step can be re-run.
SRC_BIN = Path(__import__("os").environ.get("SRC_BIN", BIN))
SRC_META = Path(__import__("os").environ.get("SRC_META", META))
GRID_STEP = 2          # in int8 units (of 254 across the scene, so about 8 m)
BUILDING_KEEP = 0.45   # fraction of rooftop outline points kept
RNG = np.random.default_rng(seed=11)

raw = SRC_BIN.read_bytes()
pts = np.array([struct.unpack_from("bbBB", raw, i * 4) for i in range(len(raw) // 4)], dtype=np.int16)
terrain = pts[pts[:, 3] == 0]
buildings = pts[pts[:, 3] == 1]
meta = json.loads(SRC_META.read_text())
if meta.get("terrain_display"):
    raise SystemExit("already densified; regenerate from the sampler first")

# Regular grid inside the convex hull of the sampled terrain.
tx, ty, tz = terrain[:, 0].astype(float), terrain[:, 1].astype(float), terrain[:, 2].astype(float)
gx, gy = np.meshgrid(np.arange(tx.min(), tx.max() + 1, GRID_STEP), np.arange(ty.min(), ty.max() + 1, GRID_STEP))
gx, gy = gx.ravel(), gy.ravel()
hull = Delaunay(np.c_[tx, ty])
inside = hull.find_simplex(np.c_[gx, gy]) >= 0
gx, gy = gx[inside], gy[inside]
gz = griddata(np.c_[tx, ty], tz, np.c_[gx, gy], method="linear")
ok = np.isfinite(gz)
gx, gy, gz = gx[ok], gy[ok], gz[ok]

keep = RNG.random(len(buildings)) < BUILDING_KEEP
bld = buildings[keep]

blob = bytearray()
for x, y, z in zip(gx, gy, gz):
    blob += struct.pack("bbBB", int(np.clip(round(x), -128, 127)), int(np.clip(round(y), -128, 127)), int(np.clip(round(z), 0, 255)), 0)
for x, y, z, _ in bld:
    blob += struct.pack("bbBB", int(x), int(y), int(z), 1)
BIN.write_bytes(blob)

meta["count"] = len(gx) + len(bld)
meta["count_terrain"] = int(len(gx))
meta["count_buildings"] = int(len(bld))
meta["terrain_display"] = (
    f"terrain re-sampled on a regular grid ({len(gx)} points) by linear interpolation of the "
    f"{len(terrain)} sampled DTM cells this file previously carried; rooftop outline points thinned "
    f"to {BUILDING_KEEP:.0%} ({len(bld)} of {len(buildings)}); no new source data"
)
META.write_text(json.dumps(meta, indent=2) + "\n")
print(f"wrote {BIN} ({len(blob)} B): terrain {len(terrain)} -> {len(gx)}, buildings {len(buildings)} -> {len(bld)}")
