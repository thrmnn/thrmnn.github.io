#!/usr/bin/env python3
"""Square card plate for the agent-harness project, drawn from
scripts/assets/agent-harness/eval-run.json (scripts/capture-harness-run.py):
the repo's own eval suite, run as committed and again after the one change its
comment describes. No text. Host tooling (Pillow), run by hand.

    python3 scripts/make-harness-plate.py a   # grid: one row per case, one cell per check, run before | run after (alternative, to site-review/files)
    python3 scripts/make-harness-plate.py b   # waterfall: calls in order, bar length = its checks, two runs stacked
    python3 scripts/make-harness-plate.py c   # grid as dither dot patches on a faint grey dot ground
    python3 scripts/make-harness-plate.py d   # oblique point-cloud columns, height = checks, run before | after
    python3 scripts/make-harness-plate.py e   # routes: each call's returned hits as a dotted path over the five corpus docs, run before | after
    python3 scripts/make-harness-plate.py f   # terminal log in dot-matrix cells: query tokens, ranked hits (dither density = score), checks, exit code
    python3 scripts/make-harness-plate.py g   # THE CARD: retrieval as a scan, still and loop (before sweep, then after sweep)
    python3 scripts/make-harness-plate.py columns [anim]  # alternative: dot columns, one pair per returned hit (before | after), height = the score the tool returned, to site-review/files

e, f, g, columns read the "input" and "hits" fields of eval-run.json (the repo's own
calls and their returned hits, scripts/capture-harness-run.py). Every position is a
drawn layout; every count, rank, score and check result is the repo's.

g, what is drawn: the five corpus documents (doc-lidar, doc-retrieval, doc-tracing,
doc-grasping, doc-evals) as grey upright pages of dots on a ring floor, in the Roboat
plate's oblique, depth-faded dot look; the harness as a small blue mast at the centre;
a beam that swings from the harness to where each call is aimed (one sweep per run,
each hit gets an equal slice of the sweep, in the order the suite runs them, except in the after sweep, see below); the
afterglow, the page layout, the angles, the ring spacing and the beam's longer
dwell on the failing call in the after sweep (taken from the empty-result call's slice).
g, what comes from the run: which documents each call returned and in which rank
(that is what lights); the score the tool returned (sets the brightness and dot size of
the lit page; the after run returns a lower score for five of the six scored hits, the sixth, doc-retrieval in the ranking call, is 3 in both, so the pages are dimmer in the second sweep);
the check results (one ring per check, on the call's top-ranked hit, green for a pass,
orange for a fail, drawn outermost and thicker; the run records checks per call, not per hit). A hit with no score
(kb_fetch returns the document) lights only the outline of the page at one fixed level,
never as a score. A call that returns nothing sends the beam to an empty spot on the
floor, its rings are drawn there, nothing lights.

g writes the card (card-plate.webp = last frame of the after sweep; card-anim.webp, 36
frames at 80 ms, 18 per run). columns writes the older dot-column card to
~/Perso/site-review/files/harness-columns.webp; a and e, f go to the same folder
(harness-grid.webp, harness-idea-{1,2}.webp).
"""
import json
import math
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).parent.parent
RUN = json.loads((ROOT / "scripts/assets/agent-harness/eval-run.json").read_text())
VARIANT = sys.argv[1] if len(sys.argv) > 1 else "g"
IDEAS = {"e": 1, "f": 2}
if VARIANT in IDEAS:
    OUT = Path.home() / f"Perso/site-review/files/harness-idea-{IDEAS[VARIANT]}.webp"
elif VARIANT == "a":
    OUT = Path.home() / "Perso/site-review/files/harness-grid.webp"
elif VARIANT == "columns":
    OUT = Path.home() / "Perso/site-review/files/harness-columns.webp"
else:
    OUT = ROOT / ("public/projects/agent-harness/card-plate.webp" if VARIANT == "g" else f"public/projects/agent-harness/card-plate-{VARIANT}.webp")
DOCS = ["doc-lidar", "doc-retrieval", "doc-tracing", "doc-grasping", "doc-evals"]
MAXS = 7
BAYER = np.array([[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]]) / 16.0


def glow(cx, cy, rad, n=170):
    for _ in range(n):
        a, q = rng.uniform(0, 2 * math.pi), rng.uniform(0.15, 1.0) ** 0.6 * rad
        dot(cx + math.cos(a) * q, cy + math.sin(a) * q, rng.uniform(1.1, 2.6), shade(FAIL, rng.uniform(0.35, 1) * (1 - 0.5 * q / rad)))


def ground(x0, y0, x1, y1, pitch=14, k=0.3):
    for gx in np.arange(x0, x1, pitch):
        for gy in np.arange(y0, y1, pitch):
            dot(gx + rng.uniform(-2, 2), gy + rng.uniform(-2, 2), rng.uniform(1.0, 1.8), shade(GROUND, k * rng.uniform(0.6, 1)))


def path(p, q, col, k=1.0, step=7.5, r=1.9):
    L = math.hypot(q[0] - p[0], q[1] - p[1])
    m = max(int(L / step), 1)
    for i in range(m + 1):
        t = i / m
        dot(p[0] + (q[0] - p[0]) * t + rng.uniform(-.6, .6), p[1] + (q[1] - p[1]) * t + rng.uniform(-.6, .6), r * rng.uniform(.85, 1.1), shade(col, k))

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
elif VARIANT == "e":
    PW, ROW = 520, 122
    xs0 = [50, 630]
    ys0 = 90
    for r, run in enumerate(runs):
        x0 = xs0[r]
        qx = x0 + 10
        cols = [x0 + 120 + k * 98 for k in range(5)]
        ground(x0 - 10, ys0 - 40, x0 + PW + 10, ys0 + 5 * ROW + 40, 16, 0.22)
        for i, case in enumerate(run):
            y = ys0 + i * ROW
            bad = not all(case["checks"])
            col = FAIL if bad else PASS
            for k in range(5):
                for _ in range(7):
                    dot(cols[k] + rng.normal(0, 5), y + rng.normal(0, 5), rng.uniform(1, 1.9), shade(GROUND, 0.55))
            dot(qx, y, 9, ACCENT)
            for _ in range(10):
                dot(qx + rng.normal(0, 8), y + rng.normal(0, 8), rng.uniform(1, 2), shade(ACCENT, 0.6))
            prev = (qx, y)
            hs = case["hits"]
            if not hs:
                for t in range(1, 9):
                    dot(qx + 22 + t * 11, y + rng.uniform(-1.5, 1.5), 1.9 * (1 - t / 10), shade(ACCENT, 1 - t / 9))
            for j, h in enumerate(hs):
                k = DOCS.index(h["id"])
                tgt = (cols[k], y)
                # later ranks bow off the row so rank order stays readable
                if j:
                    mid = ((prev[0] + tgt[0]) / 2, y + (28 if bad else 22))
                    path(prev, mid, ACCENT, 0.7); path(mid, tgt, ACCENT, 0.7)
                else:
                    path(prev, tgt, ACCENT, 0.8)
                sc = h.get("score", MAXS)
                rad = 5 + 13 * sc / MAXS if "score" in h else 11
                hc = FAIL if (bad and j < 2) else PASS
                for _ in range(int(40 + rad * 8)):
                    a, q = rng.uniform(0, 2 * math.pi), rng.uniform(0, 1) ** 0.5 * rad
                    dot(tgt[0] + math.cos(a) * q, tgt[1] + math.sin(a) * q, rng.uniform(1.3, 2.4), shade(hc, rng.uniform(0.7, 1)))
                prev = tgt
            if bad:
                glow(cols[1], y + 8, 55, 120)
elif VARIANT == "f":
    P, CW, CH = 5.0, 3, 5
    LH = 54

    def cell(cx, cy, fill, col):
        for a in range(CW):
            for b in range(CH):
                if fill >= 1 or BAYER[b % 4, a % 4 + 1 if a < 3 else 0] < fill:
                    dot(cx + a * P, cy + b * P, 1.9, col)

    def block(cx, cy, w, fill, col):
        for a in range(w):
            for b in range(CH):
                if fill >= 1 or BAYER[b % 4, a % 4] < fill:
                    dot(cx + a * P, cy + b * P, 1.9, col)

    ground(40, 40, 1160, 800, 22, 0.16)
    for r, run in enumerate(runs):
        y0 = 70 + r * (6 * LH + 40)
        for i, case in enumerate(run):
            y = y0 + i * LH
            bad = not all(case["checks"])
            x = 70
            for a, b in [(0, 0), (1, 1), (2, 2), (1, 3), (0, 4)]:
                dot(x + a * P * 1.3, y + b * P, 2.4, ACCENT)
            x += 5 * P
            q = case["input"].get("query") or case["input"]["doc_id"]
            for tok in q.replace("-", " ").split():
                for c in range(len(tok)):
                    block(x, y, CW, 0.7, shade(ACCENT, 0.8))
                    x += (CW + 1) * P
                x += 3 * P
            xh = 850
            for k in range(7):
                dot(xh - 40 + k * 5.5, y + 2 * P, 1.4, shade(GROUND, 0.7))
            for j, h in enumerate(case["hits"]):
                f = h.get("score", MAXS) / MAXS
                hc = FAIL if (bad and j == 0) else (225, 228, 236)
                block(xh, y, 6, max(f, 0.2), hc)
                xh += 8 * P
            xc = 1030
            for ok in case["checks"]:
                block(xc, y, CW + 1, 1.0, mark(ok))
                if not ok:
                    for off in (1, 2):
                        for a in range(CW + 2):
                            dot(xc + a * P + off * 4, y - off * 4, 1.1, shade(FAIL, 0.7 / off))
                        for b in range(CH + 1):
                            dot(xc + CW * P + off * 4 + 4, y + b * P - off * 4, 1.1, shade(FAIL, 0.7 / off))
                xc += (CW + 3) * P
        okrun = all(all(c["checks"]) for c in run)
        yb = y0 + 6 * LH - 6
        for k in range(22):
            dot(70 + k * 14, yb + 6, 1.2, shade(GROUND, 0.5))
        block(1020, yb - 10, 14, 1.0, mark(okrun))
        if not okrun:
            glow(1070, yb + 4, 60, 70)
elif VARIANT == "columns":
    U, W, GAP, GG = 60, 54, 12, 34
    hits_n = sum(len(c["hits"]) for c in runs[0])
    total = hits_n * (2 * W + GAP) + 1 * (W + GAP) + 5 * GG
    x = (S - total) / 2
    base = 790
    cols_ = []
    flat = []
    for i, (c0, c1) in enumerate(zip(*runs)):
        bad = not all(c1["checks"])
        if not c0["hits"]:
            flat.append(x)
            x += W + GAP + GG
            continue
        for j, (h0, h1) in enumerate(zip(c0["hits"], c1["hits"])):
            sc0, sc1 = h0.get("score", 0), h1.get("score", 0)
            for side, (hh, sc) in enumerate(((h0, sc0), (h1, sc1))):
                xx = x + side * (W + GAP)
                height = sc * U
                pts = [(rng.uniform(0, W), rng.uniform(0, height), rng.uniform(1.3, 2.4)) for _ in range(int(W * height / 17))]
                ghost = []
                if side == 1 and sc1 < sc0:
                    ghost = [(rng.uniform(0, W), rng.uniform(sc1 * U, sc0 * U)) for _ in range(int(W * (sc0 - sc1) * U / 55))]
                cols_.append(dict(i=i, side=side, id=hh["id"], x=xx, h=height, pts=pts, ghost=ghost, bad=bad and side == 1))
            x += 2 * W + GAP + GAP
        x += GG - GAP
    swap = [(a_, b_) for a_ in cols_ if a_["side"] == 0 and not all(runs[1][a_["i"]]["checks"]) for b_ in cols_ if b_["side"] == 1 and b_["i"] == a_["i"] and b_["id"] == a_["id"]]
    arcs = [rng.uniform(0, 1, 30) for _ in swap]
    sparks = [(rng.uniform(0, 2 * math.pi), rng.uniform(0.15, 1) ** 0.6 * 50, rng.uniform(1.1, 2.6), rng.uniform(.35, 1)) for _ in range(70)]
    nb = sum(1 for c in cols_ if c["side"] == 0)

    def frame(p):
        """p in [0,1]: before columns rise left to right, then the after columns, then the failing ones turn orange."""
        global im, d
        im = Image.new("RGB", (S * SS, S * SS), BG)
        d = ImageDraw.Draw(im)
        ground(40, base + 8, 1160, base + 60, 14, 0.2)
        for fx in flat:
            for k in range(int(W)):
                dot(fx + k, base + 4, 1.5, shade(GROUND, 0.7))
        b_i = a_i = 0
        for c in cols_:
            if c["side"] == 0:
                g = min(max(p * 2.4 * nb - b_i * 1.0, 0) / 1.6, 1)
                b_i += 1
            else:
                g = min(max((p - 0.45) * 2.0 * nb - a_i * 1.0, 0) / 1.6, 1)
                a_i += 1
            turn = c["bad"] and p > 0.78
            col = FAIL if turn else PASS
            if g <= 0:
                continue
            h = c["h"] * g
            for dx, yy, r in c["pts"]:
                if yy <= h:
                    dot(c["x"] + dx, base - yy, r, shade(col, 0.45 + 0.55 * (yy / max(h, 1)) ** 0.8))
            for k in range(int(W / 5)):
                dot(c["x"] + k * 5 + 2, base - h, 2.6, col)
            if g >= 1 and p > 0.6:
                for dx, yy in c["ghost"]:
                    dot(c["x"] + dx, base - yy, 1.0, shade(GROUND, 0.3))
        if p > 0.8:
            for (c0_, c1_), u_ in zip(swap, arcs):
                for t in range(24):
                    u = t / 23
                    dot(c0_["x"] + W / 2 + (c1_["x"] - c0_["x"]) * u, base - (c0_["h"] + (c1_["h"] - c0_["h"]) * u) - 70 * math.sin(math.pi * u), 1.9, shade(FAIL, 0.9))
                dot(c1_["x"] + W / 2, base - c1_["h"] - 20, 1, FAIL)
        if p > 0.78:
            for c in cols_:
                if c["bad"]:
                    for a_, q_, r_, k_ in sparks:
                        dot(c["x"] + W / 2 + math.cos(a_) * q_, base - c["h"] - 20 + math.sin(a_) * q_, r_, shade(FAIL, k_ * (1 - 0.5 * q_ / 50)))

    if len(sys.argv) > 2 and sys.argv[2] == "anim":
        frames = []
        N = 36
        for fi in range(N):
            frame(min(fi / (N - 6), 1.0))
            frames.append(im.resize((600, 600), Image.LANCZOS))
        OUTA = Path.home() / "Perso/site-review/files/harness-columns-anim.webp"
        OUTA.parent.mkdir(parents=True, exist_ok=True)
        frames[0].save(OUTA, "WEBP", save_all=True, append_images=frames[1:], duration=[80] * (N - 1) + [1400], loop=0, quality=70, method=6)
        print(f"wrote {OUTA} ({OUTA.stat().st_size} B)")
    frame(1.0)
elif VARIANT == "g":
    CX, CY, A_, B_ = 600, 500, 520, 230
    ANG = {"doc-evals": 18, "doc-retrieval": 90, "doc-lidar": 162, "doc-grasping": 234, "doc-tracing": 306}
    EMPTY_ANG, EMPTY_R, DOC_R = 270, 0.55, 0.78
    PCOLS, PROWS, PPITCH = 8, 11, 18
    TAU, RES, HOLD = 0.15, 0.45, 0.82
    NF = 18
    LIGHT = (150, 156, 168)

    def gp(ang, r):
        a = math.radians(ang)
        return CX + r * A_ * math.cos(a), CY - r * B_ * math.sin(a)

    def far(ang):
        return (math.sin(math.radians(ang)) + 1) / 2

    pages = {}
    for k, doc in enumerate(DOCS):
        prng = np.random.default_rng(100 + k)
        bx, by = gp(ANG[doc], DOC_R)
        cells = []
        for r_ in range(PROWS):
            for c_ in range(PCOLS):
                edge = r_ in (0, PROWS - 1) or c_ in (0, PCOLS - 1)
                if r_ == 0 or edge or prng.random() > 0.14:
                    cells.append((bx + (c_ - (PCOLS - 1) / 2) * PPITCH + prng.uniform(-1.2, 1.2), by - 14 - (PROWS - 1 - r_) * PPITCH + prng.uniform(-1.2, 1.2), edge))
        pages[doc] = (bx, by, cells)

    floor_pts = []
    for rr in (0.34, 0.67, 1.0):
        n = int(2 * math.pi * rr * 26)
        for i in range(n):
            a = 360 * i / n
            x, y = gp(a, rr)
            floor_pts.append((x, y, 0.26 + 0.4 * (1 - far(a))))

    def run_events(run):
        ev = []
        for ci, c in enumerate(run):
            if not c["hits"]:
                ev.append(dict(call=ci, ang=EMPTY_ANG, hit=None, rank=0, checks=c["checks"]))
            for j, h in enumerate(c["hits"]):
                ev.append(dict(call=ci, ang=ANG[h["id"]], hit=h, rank=j, checks=c["checks"]))
        failing = {i for i, c in enumerate(run) if not all(c["checks"])}
        wts = [(2.2 if e["call"] in failing else (0.2 if failing and e["hit"] is None else 1.0)) for e in ev]
        start = 0.0
        for e, w in zip(ev, wts):
            d_ = w / sum(wts) * HOLD
            e["t"] = start + min(0.6 * d_, 0.045)
            e["leave"] = start + 0.7 * d_
            start += d_
        radii = {}
        for e in ev:
            if e["rank"] == 0:
                key = e["hit"]["id"] if e["hit"] else "empty"
                e["ring0"] = radii.get(key, 0)
                radii[key] = e["ring0"] + len(e["checks"])
        return ev

    def head(ev, t):
        ks = [(0.0, ev[0]["ang"] - 50)]
        for e in ev:
            prev = ks[-1][1]
            ks.append((e["t"], prev + ((e["ang"] - prev + 180) % 360 - 180)))
        if t <= ks[1][0]:
            u = t / ks[1][0]
            return ks[0][1] + (ks[1][1] - ks[0][1]) * (u * u * (3 - 2 * u))
        for i in range(1, len(ks) - 1):
            t0, t1 = ks[i][0], ks[i + 1][0]
            if t <= t1:
                dw = ev[i - 1]["leave"]
                u = min(max((t - dw) / (t1 - dw), 0), 1)
                return ks[i][1] + (ks[i + 1][1] - ks[i][1]) * (u * u * (3 - 2 * u))
        return ks[-1][1]

    def blend(c0, c1, m):
        return tuple(c0[i] + (c1[i] - c0[i]) * m for i in range(3))

    def sweep_frame(run, ri, t):
        ev = run_events(run)
        items = []
        for x, y, k in floor_pts:
            items.append((-2, x, y, 3.3, shade(GROUND, k)))
        for j in range(12):
            ph = head(ev, max(t - j * 0.012, 0))
            w = math.exp(-j / 3.5)
            n = 26
            for i in range(1, n + 1):
                rr = i / n
                x, y = gp(ph, rr)
                kk = w * (0.95 - 0.55 * rr) * (0.55 + 0.45 * (1 - far(ph)))
                if kk > 0.07:
                    items.append((-1, x, y, 3.4 + 1.2 * (j == 0), shade(ACCENT, kk)))
        lvl = {d_: 0.0 for d_ in DOCS}
        outline = {d_: False for d_ in DOCS}
        for e in ev:
            if t < e["t"] or not e["hit"]:
                continue
            h = e["hit"]
            peak = 0.15 + 0.85 * h["score"] / MAXS if "score" in h else 0.5
            w = peak * (RES + (1 - RES) * math.exp(-(t - e["t"]) / TAU))
            if w > lvl[h["id"]]:
                lvl[h["id"]] = w
                outline[h["id"]] = "score" not in h
        for e in ev:
            if e["rank"] or t < e["t"] + 0.015:
                continue
            bx, by = gp(e["ang"], DOC_R if e["hit"] else EMPTY_R)
            fade = min((t - e["t"] - 0.015) / 0.04, 1)
            for slot_, (k, ok) in enumerate(sorted(enumerate(e["checks"]), key=lambda q: (not q[1], q[0]))):
                rx = 76 + 19 * (e["ring0"] + slot_) + (8 if not ok else 0)
                ry = rx * 0.42
                rd = 4.3 if ok else 8.0
                n = int(2 * math.pi * rx / (15 if ok else 12.5))
                for i in range(n):
                    a = 2 * math.pi * i / n
                    items.append((by - 0.5, bx + rx * math.cos(a), by + ry * math.sin(a), rd, shade(mark(ok), fade)))
        for doc in DOCS:
            bx, by, cells = pages[doc]
            gk = 0.4 + 0.4 * (1 - far(ANG[doc]))
            w = lvl[doc]
            for x, y, edge in cells:
                if w > 0 and (edge or not outline[doc]):
                    m = min(1.0, w * 2.5)
                    col = blend(shade(LIGHT, gk), shade(ACCENT, 0.4 + 0.6 * min(1, w / 0.45)), m)
                    rr = 5.0 * (0.95 + 0.4 * min(1, w / 0.5))
                else:
                    col, rr = shade(LIGHT, gk), 5.0
                items.append((by, x, y, rr, tuple(int(v) for v in col)))
        for i in range(36):
            a = 2 * math.pi * i / 36
            items.append((CY - 1, CX + 26 * math.cos(a), CY + 11 * math.sin(a), 3.6, ACCENT))
        for z in range(1, 6):
            items.append((CY, CX, CY - z * 10, 3.8, ACCENT))
        for i in range(10):
            a = 2 * math.pi * i / 10
            items.append((CY + 1, CX + 11 * math.cos(a), CY - 62 + 5 * math.sin(a), 4.2, ACCENT))
        items.append((CY + 1, CX, CY - 62, 5.2, (200, 220, 255)))
        img = Image.new("RGB", (S * SS, S * SS), BG)
        dr = ImageDraw.Draw(img)
        for _, x, y, r, col in sorted(items, key=lambda q: q[0]):
            dr.ellipse([(x - r) * SS, (y - r) * SS, (x + r) * SS, (y + r) * SS], fill=tuple(int(v) for v in col))
        return img

    frames = []
    for ri, run in enumerate(runs):
        for f in range(NF):
            frames.append(sweep_frame(run, ri, f / (NF - 1)))
    im = frames[-1]
    small = [fr.resize((600, 600), Image.LANCZOS) for fr in frames]
    OUTA = ROOT / "public/projects/agent-harness/card-anim.webp"
    small[0].save(OUTA, "WEBP", save_all=True, append_images=small[1:], duration=80, loop=0, quality=60, method=6)
    print(f"wrote {OUTA} ({OUTA.stat().st_size} B)")
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
