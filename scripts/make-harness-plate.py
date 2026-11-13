#!/usr/bin/env python3
"""Square card plate for the agent-harness project, drawn from
scripts/assets/agent-harness/eval-run.json (scripts/capture-harness-run.py):
the repo's own eval suite, run as committed and again after the one change its
comment describes. No text. Host tooling (Pillow), run by hand.

    python3 scripts/make-harness-plate.py a   # grid: one row per case, one cell per check, run before | run after
    python3 scripts/make-harness-plate.py b   # waterfall: calls in order, bar length = its checks, two runs stacked
    python3 scripts/make-harness-plate.py c   # grid as dither dot patches on a faint grey dot ground
    python3 scripts/make-harness-plate.py d   # oblique point-cloud columns, height = checks, run before | after
"""
import json
import math
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).parent.parent
RUN = json.loads((ROOT / "scripts/assets/agent-harness/eval-run.json").read_text())
VARIANT = sys.argv[1] if len(sys.argv) > 1 else "a"
OUT = ROOT / ("public/projects/agent-harness/card-plate.webp" if VARIANT == "a" else f"public/projects/agent-harness/card-plate-{VARIANT}.webp")
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
rng = np.random.default_rng(7)


def dot(x, y, r, col):
    d.ellipse([(x - r) * SS, (y - r) * SS, (x + r) * SS, (y + r) * SS], fill=col)


def shade(col, k):
    return tuple(int(BG[i] + (col[i] - BG[i]) * k) for i in range(3))

if VARIANT == "a":
    CELL, GAP, PANEL_GAP, TICK = 96, 16, 200, 12
    panel_w = 2 * CELL + GAP
    total_w = 2 * (TICK + GAP + panel_w) + PANEL_GAP
    total_h = 6 * CELL + 5 * GAP
    # the card's caption covers the lower third, so the grid sits above it
    x_start, y_start = (S - total_w) / 2, 0.1 * S
    for r, run in enumerate(runs):
        px0 = x_start + r * (TICK + GAP + panel_w + PANEL_GAP)
        for i, case in enumerate(run):
            y = y_start + i * (CELL + GAP)
            box(px0, y, TICK, CELL, ACCENT, 4)
            for k, ok in enumerate(case["checks"]):
                box(px0 + TICK + GAP + k * (CELL + GAP), y, CELL, CELL, mark(ok))
elif VARIANT == "c":
    CELL, GAP, PANEL_GAP, TICK = 96, 16, 200, 12
    panel_w = 2 * CELL + GAP
    total_w = 2 * (TICK + GAP + panel_w) + PANEL_GAP
    x_start, y_start = (S - total_w) / 2, 0.1 * S
    PITCH, ANG = 8.0, 0.38
    ca, sa = math.cos(ANG), math.sin(ANG)
    cx0, cy0 = S / 2, y_start + 3 * CELL + 2.5 * GAP
    rects = []
    for r, run in enumerate(runs):
        px0 = x_start + r * (TICK + GAP + panel_w + PANEL_GAP)
        for i, case in enumerate(run):
            y = y_start + i * (CELL + GAP)
            rects.append((px0, y, TICK, CELL, ACCENT, 1.0))
            for k, ok in enumerate(case["checks"]):
                rects.append((px0 + TICK + GAP + k * (CELL + GAP), y, CELL, CELL, mark(ok), 1.0 if ok else 2.0))
    n = int(S * 1.4 / PITCH)
    for i in range(-n, n):
        for j in range(-n, n):
            u, v = i * PITCH, j * PITCH
            x = u * ca - v * sa + S / 2 + rng.uniform(-0.18, 0.18) * PITCH
            y = u * sa + v * ca + S / 2 + rng.uniform(-0.18, 0.18) * PITCH
            if not (0 <= x < S and 0 <= y < S):
                continue
            hit = next((q for q in rects if q[0] <= x < q[0] + q[2] and q[1] <= y < q[1] + q[3]), None)
            if hit:
                px, py, w, h, col, boost = hit
                ex = min(x - px, px + w - x, y - py, py + h - y) / (w / 2 if w > 20 else 6)
                if col == ACCENT:
                    rr = 3.0 * rng.uniform(0.85, 1.1)
                elif boost > 1:
                    rr = PITCH * 0.6 * rng.uniform(0.9, 1.1)
                else:
                    t = 0.55 + 0.25 * rng.random() + 0.2 * min(ex * 2, 1)
                    rr = PITCH * 0.5 * math.sqrt(t) * rng.uniform(0.8, 1.0)
                dot(x, y, rr, col)
            else:
                dist = math.hypot((x - S / 2) / 560, (y - cy0) / 360)
                f = max(0, 1 - dist) ** 1.4
                if f > 0.04 and rng.random() < 0.9:
                    dot(x, y, 1.1 + 1.5 * f, shade(GROUND, 0.25 + 0.6 * f))
    for (px, py, w, h, col, boost) in rects:
        if boost > 1:
            for _ in range(160):
                a, rad = rng.uniform(0, 2 * math.pi), rng.uniform(0.6, 1.0) ** 0.5 * 90
                x, y = px + w / 2 + math.cos(a) * (w / 2 + rad * 0.5), py + h / 2 + math.sin(a) * (h / 2 + rad * 0.5)
                if not any(q[0] - 3 <= x < q[0] + q[2] + 3 and q[1] - 3 <= y < q[1] + q[3] + 3 for q in rects):
                    dot(x, y, rng.uniform(1.2, 2.6), shade(FAIL, rng.uniform(0.5, 1)))
elif VARIANT == "d":
    ROT, TILT, SQ, ZS = 0.4, 1.0, 1.0, 1.0
    cr, sr, ct, st = math.cos(ROT), math.sin(ROT), math.cos(TILT), math.sin(TILT)
    COLS, W, PITCH_B, STEP = 3, 0.8, 1.2, 0.055
    pts = []
    for r, run in enumerate(runs):
        ox = r * (COLS * PITCH_B + 0.7)
        for gx in np.arange(ox - 0.5, ox + COLS * PITCH_B, 0.3):
            for gy in np.arange(-0.5, 2 * PITCH_B, 0.3):
                pts.append((gx + rng.uniform(-.04, .04), gy + rng.uniform(-.04, .04), 0.0, GROUND, 1.0, 1.6))
        for i, case in enumerate(run):
            x0, y0 = ox + (i % COLS) * PITCH_B, (i // COLS) * PITCH_B
            m = round(W / STEP)
            for k, ok in enumerate(case["checks"]):
                col = mark(ok)
                z0, z1 = k * 1.0 * ZS, (k * 1.0 + 0.9) * ZS
                nz = max(round((z1 - z0) / STEP), 1)
                rd = 2.4 if ok else 3.0
                for _ in range(int(150 * (z1 - z0) / ZS + 0)):
                    pts.append((x0 + rng.uniform(0, W), y0 + rng.uniform(0, W), z1, col, 1.0, rd))
                for _ in range(int(130 * (z1 - z0) / ZS)):
                    pts.append((x0 + rng.uniform(0, W), y0, rng.uniform(z0, z1), col, 0.7, rd))
                    pts.append((x0 + W, y0 + rng.uniform(0, W), rng.uniform(z0, z1), col, 0.45, rd))
                if not ok:
                    for _ in range(260):
                        h = rng.uniform(0, 1) ** 1.5 * 1.6
                        pts.append((x0 + W / 2 + rng.normal(0, 0.28), y0 + W / 2 + rng.normal(0, 0.28), z1 + h, FAIL, 1.0 - 0.6 * h / 1.6, rng.uniform(1.3, 3.0)))
    def proj(x, y, z):
        rz = x * sr + y * cr
        return (x * cr - y * sr), (z * ct - rz * st) * SQ
    pr = [(proj(x, y, z), x * sr + y * cr, c, b, rd) for x, y, z, c, b, rd in pts]
    xs = [p[0][0] for p in pr]
    ys = [p[0][1] for p in pr]
    sx0, sx1, sy0, sy1 = min(xs), max(xs), min(ys), max(ys)
    sc = min(1100 / (sx1 - sx0), 0.66 * S / (sy1 - sy0))
    ox_, oy_ = (S - (sx1 - sx0) * sc) / 2 - sx0 * sc, 0.1 * S - sy0 * sc
    pr.sort(key=lambda p: -p[1])
    for (px, py), _, col, b, rd in pr:
        X, Y = px * sc + ox_, py * sc + oy_
        if col == GROUND:
            f = max(0, 1 - ((X - S / 2) / 580) ** 2) ** 1.5
            if f < 0.05:
                continue
            dot(X, Y, 1.7, shade(col, 0.25 + 0.6 * f))
        else:
            dot(X, Y, rd * 0.6, shade(col, b))
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
