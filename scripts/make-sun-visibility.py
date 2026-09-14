#!/usr/bin/env python3
"""Precompute direct-sunlight visibility for the Vidigal point cloud.

Drives the "solar sweep" visualisation: light climbing the ridge, rooftops
catching it first, the alleys between buildings staying dark.

Input (read-only, already public in this repo):
    public/data/vidigal-rooftops.bin  - 12,529 records of 4 bytes each,
        interleaved int8 x, int8 y, uint8 z, uint8 category
        (0 = terrain, 1 = building). z maps linearly onto metres using
        min/max from the sidecar public/data/vidigal-rooftops.json.
    public/data/vidigal-rooftops.json - sidecar for the above (z_meters
        min/max, point count). Trusted as-is, not recomputed here.

This script reads only those two files. It does not read, import from, or
reference anything outside this repository.

Method (kept simple, standard, documented):
  1. Decode points, map z to metres via the rooftops sidecar's min/max.
  2. Map x, y (int8, -128..127) onto a 256x256 grid by offsetting +128.
     The grid is assumed to span 1000 m across (Vidigal is roughly 1 km
     across) - this is an ASSUMPTION, not a measured site dimension, and
     is recorded as such in the output sidecar.
  3. Build a max-height raster over that grid: for each cell, the tallest
     point (terrain or building) that lands there. Empty cells carry no
     obstruction (-inf), meaning a ray can pass through freely.
  4. Sun path for Vidigal (latitude -22.99 deg) on an equinox day
     (declination 0 deg): the sun rises due east, sets due west, and
     peaks at elevation (90 - 22.99) = 67.01 deg at solar noon. 16 sun
     steps are generated evenly spaced in hour angle from sunrise
     (H = -90 deg) to sunset (H = +90 deg), using the standard
     declination-0 solar-position formulae for elevation and azimuth.
     The two endpoint steps sit exactly at the horizon (elevation 0) and
     are clamped to "no direct sunlight" rather than marched.
  5. For every point and every (non-clamped) sun step, a ray is marched
     outward from the point across the raster, one grid cell at a time,
     in the horizontal direction of the sun's azimuth. At each step the
     ray's height is z + horizontal_distance * tan(elevation). If the
     raster's max height at that cell exceeds the ray height, the point
     is shadowed at that sun step and the march stops early; otherwise
     the point is sunlit.

ASSUMPTIONS a reader could dispute (also recorded in the JSON sidecar):
  - The 1000 m horizontal span of the int8 grid (Vidigal's real extent is
    not measured anywhere in this repo's data).
  - +x is assumed to point east and +y north. The source point cloud does
    not document a compass orientation, so this is a convention, not a
    fact about the data.
  - Declination 0 (equinox) is chosen for simplicity, not the date of
    data capture.

Output:
    public/data/vidigal-sun.bin  - one little-endian uint16 per point, in
        the same order as the input file. Bit i (i = 0..15) is 1 when the
        point is sunlit at sun step i. Exactly count * 2 bytes.
    public/data/vidigal-sun.json - sidecar describing the schema, the 16
        sun steps, the assumptions above, and the method, for the
        build-time caption.

Usage:
    python3 scripts/make-sun-visibility.py            # compute and write
    python3 scripts/make-sun-visibility.py --check     # verify, no write
"""
from __future__ import annotations

import json
import math
import sys
from pathlib import Path

import numpy as np

ROOT = Path(__file__).parent.parent
IN_BIN = ROOT / "public" / "data" / "vidigal-rooftops.bin"
IN_JSON = ROOT / "public" / "data" / "vidigal-rooftops.json"
OUT_BIN = ROOT / "public" / "data" / "vidigal-sun.bin"
OUT_JSON = ROOT / "public" / "data" / "vidigal-sun.json"

GRID_SIZE = 256
HORIZONTAL_SPAN_M = 1000.0
METERS_PER_CELL = HORIZONTAL_SPAN_M / (GRID_SIZE - 1)
LATITUDE_DEG = -22.99
N_STEPS = 16
MAX_MARCH_CELLS = 400
ELEVATION_EPS_DEG = 1e-9


def load_points():
    raw = np.frombuffer(IN_BIN.read_bytes(), dtype=np.dtype(
        [("x", "i1"), ("y", "i1"), ("z", "u1"), ("cat", "u1")]
    ))
    sidecar = json.loads(IN_JSON.read_text())
    z_min = sidecar["z_meters"]["min"]
    z_max = sidecar["z_meters"]["max"]
    z_m = z_min + (raw["z"].astype(np.float64) / 255.0) * (z_max - z_min)
    px = raw["x"].astype(np.int32) + 128
    py = raw["y"].astype(np.int32) + 128
    return px, py, z_m, sidecar


def build_raster(px, py, z_m):
    raster = np.full((GRID_SIZE, GRID_SIZE), -np.inf, dtype=np.float64)
    np.maximum.at(raster, (py, px), z_m)
    return raster


def sun_steps():
    """16 steps evenly spaced in hour angle from sunrise to sunset.

    Declination 0 (equinox): sunrise/sunset hour angle is +/-90 deg, so the
    16 steps run H = -90, -78, ..., 78, 90 deg in 12-degree increments.
    """
    phi = math.radians(LATITUDE_DEG)
    steps = []
    for k in range(N_STEPS):
        h_deg = -90.0 + k * (180.0 / (N_STEPS - 1))
        h_rad = math.radians(h_deg)
        sin_el = math.cos(phi) * math.cos(h_rad)
        sin_el = max(-1.0, min(1.0, sin_el))
        el_deg = math.degrees(math.asin(sin_el))
        if el_deg <= ELEVATION_EPS_DEG:
            steps.append({"step": k, "hour_angle_deg": h_deg, "azimuth_deg": 90.0 if h_deg <= 0 else 270.0, "elevation_deg": 0.0, "sun_up": False})
            continue
        el_rad = math.radians(el_deg)
        cos_az = -math.tan(el_rad) * math.tan(phi)
        cos_az = max(-1.0, min(1.0, cos_az))
        az_deg = math.degrees(math.acos(cos_az))
        if h_rad > 0:
            az_deg = 360.0 - az_deg
        steps.append({"step": k, "hour_angle_deg": h_deg, "azimuth_deg": az_deg, "elevation_deg": el_deg, "sun_up": True})
    return steps


def sunlit_bits(px, py, z_m, raster, steps):
    n = px.shape[0]
    bits = np.zeros(n, dtype=np.uint16)
    for s in steps:
        if not s["sun_up"]:
            continue
        az_rad = math.radians(s["azimuth_deg"])
        el_rad = math.radians(s["elevation_deg"])
        dx = math.sin(az_rad)
        dy = math.cos(az_rad)
        tan_el = math.tan(el_rad)
        shadowed = np.zeros(n, dtype=bool)
        for d in range(1, MAX_MARCH_CELLS + 1):
            cell_x = np.rint(px + dx * d).astype(np.int32)
            cell_y = np.rint(py + dy * d).astype(np.int32)
            in_bounds = (
                (cell_x >= 0) & (cell_x < GRID_SIZE)
                & (cell_y >= 0) & (cell_y < GRID_SIZE)
            )
            active = in_bounds & ~shadowed
            if not active.any():
                break
            idx_x = np.clip(cell_x, 0, GRID_SIZE - 1)
            idx_y = np.clip(cell_y, 0, GRID_SIZE - 1)
            ray_height = z_m + d * METERS_PER_CELL * tan_el
            obstruction = raster[idx_y, idx_x]
            newly_shadowed = active & (obstruction > ray_height)
            shadowed |= newly_shadowed
        sunlit = ~shadowed
        bits |= (sunlit.astype(np.uint16) << np.uint16(s["step"]))
    return bits


def sunlit_pct(bits, step):
    mask = ((bits >> np.uint16(step)) & np.uint16(1)).astype(bool)
    return 100.0 * mask.sum() / bits.shape[0]


def build_json(count, steps):
    return {
        "schema": "vidigal-sun-v1",
        "computed_from": "public/data/vidigal-rooftops.bin",
        "count": count,
        "encoding": "one little-endian uint16 per point, same order as the input file; bit i (0..15) is 1 when sunlit at sun step i",
        "latitude_deg": LATITUDE_DEG,
        "sun_steps": [
            {
                "step": s["step"],
                "hour_angle_deg": round(s["hour_angle_deg"], 3),
                "azimuth_deg": round(s["azimuth_deg"], 3),
                "elevation_deg": round(s["elevation_deg"], 3),
            }
            for s in steps
        ],
        "assumptions": {
            "equinox": "solar declination assumed 0 degrees (an equinox day), not the date the source data was captured; this makes the sun rise due east, set due west, and peak at elevation 90 - |latitude| at solar noon",
            "horizontal_span_m": HORIZONTAL_SPAN_M,
            "horizontal_span_note": "the int8 grid (256 cells across, offset 0..255) is assumed to span 1000 m; Vidigal is roughly 1 km across, but this is an assumption, not a measured site dimension",
            "axis_convention": "+x is assumed to point east and +y north; the source point cloud does not document a compass orientation",
        },
        "method": "for each point, a ray is marched toward the sun in 1-cell steps across a 256x256 max-height raster built from this point cloud; the point is sunlit at a sun step if no raster cell along that ray is taller than the ray's height at that distance",
    }


def main() -> int:
    check = "--check" in sys.argv[1:]

    px, py, z_m, _sidecar = load_points()
    n = px.shape[0]
    raster = build_raster(px, py, z_m)
    steps = sun_steps()
    bits = sunlit_bits(px, py, z_m, raster, steps)
    blob = bits.astype("<u2").tobytes()
    assert len(blob) == n * 2, f"expected {n * 2} bytes, got {len(blob)}"

    if check:
        if not OUT_BIN.exists():
            print(f"x {OUT_BIN.name} does not exist, nothing to check against")
            return 1
        existing = OUT_BIN.read_bytes()
        if existing == blob:
            print(f"OK {OUT_BIN.name} matches recomputed output ({len(blob)} bytes, {n} points)")
            return 0
        print(f"MISMATCH {OUT_BIN.name}: {len(existing)} bytes on disk vs {len(blob)} recomputed")
        return 1

    OUT_BIN.parent.mkdir(parents=True, exist_ok=True)
    OUT_BIN.write_bytes(blob)
    OUT_JSON.write_text(json.dumps(build_json(n, steps), indent=2) + "\n")

    pct0 = sunlit_pct(bits, 0)
    pct_mid = sunlit_pct(bits, 8)
    pct_last = sunlit_pct(bits, 15)
    print(
        f"OK {OUT_BIN.name} - {len(blob)} bytes, {n} points\n"
        f"OK {OUT_JSON.name} - {OUT_JSON.stat().st_size} bytes\n"
        f"sunlit: step 0 = {pct0:.1f}%, step 8 = {pct_mid:.1f}%, step 15 = {pct_last:.1f}%"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
