#!/usr/bin/env python3
"""Square card plate for the agent-harness project, drawn from
scripts/assets/agent-harness/eval-run.json (scripts/capture-harness-run.py):
the repo's own eval suite, run as committed and again after the one change its
comment describes. No text. Host tooling (Pillow), run by hand.

    python3 scripts/make-harness-plate.py a   # grid: one row per case, one cell per check, run before | run after
    python3 scripts/make-harness-plate.py b   # waterfall: calls in order, bar length = its checks, two runs stacked
"""
import json
import sys
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).parent.parent
RUN = json.loads((ROOT / "scripts/assets/agent-harness/eval-run.json").read_text())
VARIANT = sys.argv[1] if len(sys.argv) > 1 else "a"
OUT = ROOT / ("public/projects/agent-harness/card-plate.webp" if VARIANT == "a" else "public/projects/agent-harness/card-plate-b.webp")
S = 1200
SS = 2
BG = (14, 16, 22)
ACCENT = (86, 140, 246)
GROUND = (120, 124, 134)
PASS = (70, 200, 120)
FAIL = (255, 138, 61)

im = Image.new("RGB", (S * SS, S * SS), BG)
d = ImageDraw.Draw(im)


def box(x, y, w, h, fill, r=10):
    d.rounded_rectangle([x * SS, y * SS, (x + w) * SS, (y + h) * SS], radius=r * SS, fill=fill)


def mark(ok):
    return PASS if ok else FAIL


runs = (RUN["committed"], RUN["changed"])

if VARIANT == "a":
    CELL, GAP, PANEL_GAP, TICK = 120, 20, 230, 14
    panel_w = 2 * CELL + GAP
    total_w = 2 * (TICK + GAP + panel_w) + PANEL_GAP
    total_h = 6 * CELL + 5 * GAP
    x_start, y_start = (S - total_w) / 2, (S - total_h) / 2
    for r, run in enumerate(runs):
        px0 = x_start + r * (TICK + GAP + panel_w + PANEL_GAP)
        for i, case in enumerate(run):
            y = y_start + i * (CELL + GAP)
            box(px0, y, TICK, CELL, ACCENT, 4)
            for k, ok in enumerate(case["checks"]):
                box(px0 + TICK + GAP + k * (CELL + GAP), y, CELL, CELL, mark(ok))
else:
    UNIT, BAR_H, ROW_GAP, RUN_GAP = 100, 58, 24, 90
    n = sum(len(c["checks"]) for c in runs[0])
    total_h = 2 * (6 * BAR_H + 5 * ROW_GAP) + RUN_GAP
    x_start, y_start = (S - n * UNIT) / 2, (S - total_h) / 2
    for r, run in enumerate(runs):
        y0 = y_start + r * (6 * BAR_H + 5 * ROW_GAP + RUN_GAP)
        t = 0
        for i, case in enumerate(run):
            y = y0 + i * (BAR_H + ROW_GAP)
            x = x_start + t * UNIT
            box(x - 22, y, 10, BAR_H, ACCENT, 4)
            for k, ok in enumerate(case["checks"]):
                box(x + k * UNIT, y, UNIT - 8, BAR_H, mark(ok), 8)
            t += len(case["checks"])

im = im.resize((S, S), Image.LANCZOS)
OUT.parent.mkdir(parents=True, exist_ok=True)
im.save(OUT, "WEBP", quality=82, method=6)
print(f"wrote {OUT} ({OUT.stat().st_size} B)")
