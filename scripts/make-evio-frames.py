#!/usr/bin/env python3
"""Event-frame loop and still for the event-camera drone project, rendered
from real events: a window of the public UZH-FPV drone dataset (Delmerico et
al., ICRA 2019, https://fpv.ifi.uzh.ch/), cut by scripts/sample-uzh-events.py
into scripts/assets/evio/events.bin (DAVIS 346x260, centred on the peak
ground-truth speed). Each sensor pixel lights at its last event, blue for a
brightness rise (ON) and grey for a fall (OFF), and fades with time constant
TAU, so pixels switch on and off as the room's edges sweep past. No overlay.
Prints the facts the project page quotes.

House rules (cycle 20, readability): the picture is a dot matrix, one round dot
per 5x5 block of sensor pixels (the block's mean brightness sets the dot's size and strength, the majority
polarity its colour), faint grey dots where nothing fired so the sensor grid reads, dots big
enough to stay dots at 330 px. The loop is 36 frames at 80 ms (it was 75 frames at
40 ms, 20 ms slices): the same real event window is resampled into 36 equal slices
(about 42 ms each) and played in 2.9 s, so it runs at about half real time; no event
is added, moved or dropped, only grouped differently. The loop starts on a frame
that has events and no frame is empty (the old fade-in made frame 0 empty).
Host tooling (numpy, Pillow), run by hand; outputs committed.

    python3 scripts/make-evio-frames.py
"""
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).parent.parent
SRC = ROOT / "scripts" / "assets" / "evio" / "events.bin"
OUT = ROOT / "public" / "projects" / "event-cameras-drone"
BG = np.array((14, 16, 22), float)
ON = np.array((86, 140, 246), float)
OFF = np.array((150, 156, 168), float)
FLOOR = 0.12
W, H = 346, 260
CROP = (23, 323)
N_FRAMES, ANIM_MS = 36, 80
TAU = 12000
BLOCK = 5
ANIM_SCALE, ANIM_SIZE = 2, 600
STILL_SCALE, STILL_SIZE = 4, 1200

ev = np.frombuffer(SRC.read_bytes(), np.dtype([("x", "<i2"), ("y", "<i2"), ("t", "<u4"), ("p", "u1")]))
span = int(ev["t"].max())
n_frames = N_FRAMES
STEP = span // N_FRAMES


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
    return np.exp(-(t_end - last_t)), pol, last_t, t_end


def frame_k(t_end):
    lo = ev["t"].searchsorted(t_end - 6 * TAU)
    hi = ev["t"].searchsorted(t_end)
    e = ev[lo:hi]
    last_t = np.full((H, W), -1e9)
    pol = np.zeros((H, W), np.uint8)
    e = e[np.argsort(e["t"], kind="stable")]
    last_t[e["y"], e["x"]] = e["t"]
    pol[e["y"], e["x"]] = e["p"]
    return np.exp(-(t_end - last_t) / TAU), pol


def dots(k, pol, scale, size):
    k = k[:, CROP[0]:CROP[1]]
    pol = pol[:, CROP[0]:CROP[1]]
    gh, gw = k.shape[0] // BLOCK, k.shape[1] // BLOCK
    kb = k[:gh * BLOCK, :gw * BLOCK].reshape(gh, BLOCK, gw, BLOCK).transpose(0, 2, 1, 3).reshape(gh, gw, -1)
    pb = pol[:gh * BLOCK, :gw * BLOCK].reshape(gh, BLOCK, gw, BLOCK).transpose(0, 2, 1, 3).reshape(gh, gw, -1)
    kk = np.clip(kb.mean(-1) * 3.0, 0, 1)
    pp = ((pb * kb).sum(-1) > 0.5 * kb.sum(-1)).astype(np.uint8)
    cell = BLOCK * scale
    x0 = (size - gw * cell) / 2
    y0 = (size - gh * cell) / 2
    im = Image.new("RGB", (size, size), tuple(int(v) for v in BG))
    dr = ImageDraw.Draw(im)
    rmax = 0.0042 * size
    for r_ in range(gh):
        for c_ in range(gw):
            v = kk[r_, c_]
            cx, cy = x0 + (c_ + 0.5) * cell, y0 + (r_ + 0.5) * cell
            if v < 0.05:
                rad, col = rmax * 0.55, BG + (OFF - BG) * FLOOR
            else:
                rad = rmax * (0.7 + 0.8 * v)
                col = BG + ((ON if pp[r_, c_] == 1 else OFF) - BG) * (FLOOR + (1 - FLOOR) * v)
            dr.ellipse([cx - rad, cy - rad, cx + rad, cy + rad], fill=tuple(int(q) for q in col))
    return im, float(kk.sum())


times = [(i + 1) * STEP for i in range(n_frames)]
raw = [frame_k(t) for t in times]
lit = [float((k > 0.05).mean()) for k, _ in raw]
start = int(np.argmax([x > 0.02 for x in lit]))
order = [(start + i) % n_frames for i in range(n_frames)]
still_i = int(np.argmax(lit))

imgs = [dots(*raw[i], ANIM_SCALE, ANIM_SIZE)[0] for i in order]
OUT.mkdir(parents=True, exist_ok=True)
imgs[0].save(OUT / "card-anim.webp", "WEBP", save_all=True, append_images=imgs[1:], duration=ANIM_MS,
             loop=0, quality=20, method=6)
dots(*raw[still_i], STILL_SCALE, STILL_SIZE)[0].save(OUT / "card-plate.webp", "WEBP", quality=88, method=6)
for n in ("card-anim.webp", "card-plate.webp"):
    print(n, (OUT / n).stat().st_size, "B")
print(f"window {span / 1e6:.2f} s, {len(ev)} events, {n_frames} frames of {STEP // 1000} ms slices, tau {TAU // 1000} ms, played at {ANIM_MS} ms per frame; lit share per frame min {min(lit):.2%} max {max(lit):.2%}, loop starts at slice {start}")
