#!/usr/bin/env python3
"""Timed ground truth for the replay figure on the ros2-localization-triage page.

Source (read-only clone, path given as argv[1]): results/stata/ of thrmnn/ros2-localization-triage.
  gt_part1_floor2.csv  columns timestamp_us, x_m, y_m, yaw_rad   (healthy window, ~50 ms rows)
  gt_part3_floor2.csv  same columns                              (lost window, ~50 ms rows)
  amcl_poses.csv       first row's timestamp_us is t = 0 of the replay
Writes scripts/assets/stata/stata-truth.json: [[t_s, x_m, y_m], ...] per file, centimetre precision.
"""
import csv, json, sys
from pathlib import Path

res = Path(sys.argv[1]) / "results/stata"
ROOT = Path(__file__).parent.parent
with (res / "amcl_poses.csv").open() as f:
    t0 = next(int(r[0]) for r in csv.reader(f) if r and not r[0].startswith("#"))

def rows(name):
    out = []
    with (res / name).open() as f:
        for r in csv.reader(f):
            if r and not r[0].startswith("#"):
                out.append([round((int(r[0]) - t0) / 1e6, 3), round(float(r[1]), 2), round(float(r[2]), 2)])
    return out

out = {"t0_us": t0, "healthy": rows("gt_part1_floor2.csv"), "lost": rows("gt_part3_floor2.csv")}
(ROOT / "scripts/assets/stata/stata-truth.json").write_text(json.dumps(out, separators=(",", ":")))
print({k: (v[0][0], v[-1][0], len(v)) for k, v in out.items() if k != "t0_us"})
