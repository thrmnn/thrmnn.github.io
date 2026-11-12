#!/usr/bin/env python3
"""Event-frame loop and still for the event-camera drone project, rendered
from real events: a window of the public UZH-FPV drone dataset (Delmerico et
al., ICRA 2019, https://fpv.ifi.uzh.ch/), cut by scripts/sample-uzh-events.py
into scripts/assets/evio/events.bin (DAVIS 346x260, centred on the peak
ground-truth speed). Each pixel lights at its last event, blue for a
brightness rise (ON) and grey for a fall (OFF), and fades with time constant
TAU, so pixels switch on and off as the room's edges sweep past. Nearest-
neighbour upscale; no overlay. Prints the facts the project page quotes.
Host tooling (numpy, Pillow), run by hand; outputs committed.

    python3 scripts/make-evio-frames.py
"""
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).parent.parent
SRC = ROOT / "scripts" / "assets" / "evio" / "events.bin"
OUT = ROOT / "public" / "projects" / "event-cameras-drone"
BG = np.array((14, 16, 22), float)
ON = np.array((86, 140, 246), float)
OFF = np.array((150, 156, 168), float)
W, H = 346, 260
CROP = (23, 323)
STEP = 20000
TAU = 12000
FADE = 4
ANIM_SCALE, ANIM_SIZE, ANIM_MS = 2, 600, 40
STILL_SCALE, STILL_SIZE = 4, 1200

ev = np.frombuffer(SRC.read_bytes(), np.dtype([("x", "<i2"), ("y", "<i2"), ("t", "<u4"), ("p", "u1")]))
span = int(ev["t"].max())
n_frames = span // STEP


def frame_at(t_end):
    lo = ev["t"].searchsorted(t_end - 6 * TAU)
    hi = ev["t"].searchsorted(t_end)
    e = ev[lo:hi]
    last_t = np.full((H, W), -1e9)
    pol = np.zeros((H, W), np.uint8)
    order = np.argsort(e["t"], kind="stable")
    e = e[order]
    last_t[e["y"], e["x"]] = e["t"]
    pol[e["y"], e["x"]] = e["p"]
    k = np.exp(-(t_end - last_t) / TAU)[..., None]
    col = np.where(pol[..., None] == 1, ON, OFF)
    return BG + (col - BG) * k


def to_image(f, scale, size):
    f = f[:, CROP[0]:CROP[1]]
    big = np.repeat(np.repeat(f, scale, 0), scale, 1)
    canvas = np.tile(BG, (size, size, 1))
    y0, x0 = (size - big.shape[0]) // 2, (size - big.shape[1]) // 2
    canvas[y0:y0 + big.shape[0], x0:x0 + big.shape[1]] = big
    return Image.fromarray(canvas.round().astype(np.uint8))


times = [(i + 1) * STEP for i in range(n_frames)]
frames = [frame_at(t) for t in times]
counts = [int(((f - BG) ** 2).sum()) for f in frames]
still_i = int(np.argmax(counts[FADE:-FADE])) + FADE

imgs = []
for i, f in enumerate(frames):
    g = min(1.0, (i + 1) / (FADE + 1), (n_frames - i) / (FADE + 1))
    imgs.append(to_image(BG + (f - BG) * g, ANIM_SCALE, ANIM_SIZE))
OUT.mkdir(parents=True, exist_ok=True)
imgs[0].save(OUT / "card-anim.webp", "WEBP", save_all=True, append_images=imgs[1:], duration=ANIM_MS,
             loop=0, quality=20, method=6)
to_image(frames[still_i], STILL_SCALE, STILL_SIZE).save(OUT / "card-plate.webp", "WEBP", quality=88, method=6)
for n in ("card-anim.webp", "card-plate.webp"):
    print(n, (OUT / n).stat().st_size, "B")
print(f"window {span / 1e6:.2f} s, {len(ev)} events, {n_frames} frames of {STEP // 1000} ms slices, tau {TAU // 1000} ms, played at {ANIM_MS} ms per frame")
