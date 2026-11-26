#!/usr/bin/env python3
"""Turn the played range of MOT17-04 into a brightness grid, 4 bits per cell (two cells per byte, high nibble first), every second video frame, behind a 10-byte header
(cols, rows, stored frames, pitch, frame step as uint16 LE), for the
film figure on the perception-pipeline page (src/scripts/track-figure.ts). The browser never receives a filmed frame: each frame is
box-averaged down to PITCH x PITCH source pixels per cell (960x540 video pixels), then the filmed
frames are discarded. A head is about two cells wide at most, so no face, plate or sign survives.
Footage: MOT17-04-SDP, 960x540, 30 fps, from the public MOTChallenge MOT17 benchmark
(Milan et al., 2016), licence CC BY-NC-SA 3.0. Track frame f is video frame f-1 (checked below); stored frame j holds video frame 2j, so track frames 2j+1 and 2j+2 share it.

    python3 -I scripts/make-film-grid.py <MOT17-04-SDP-raw.mp4>
"""
import json
import sys
from pathlib import Path

import cv2
import numpy as np

PITCH = 6
STEP = 2
HEAD = 0.125
root = Path(__file__).parent
tracks = json.loads((root / "assets/pipeline/tracks.json").read_text())
frames, scale = tracks["frames"], 2
cap = cv2.VideoCapture(sys.argv[1])
W, H = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)), int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
assert (W, H) == (tracks["width"] // scale, tracks["height"] // scale) and W % PITCH == 0 and H % PITCH == 0
cols, rows = W // PITCH, H // PITCH

boxes = [[] for _ in range(frames + 1)]
for t in tracks["tracks"].values():
    for f, x, y, w, h in t:
        boxes[f].append((x / scale, y / scale, w / scale, h / scale))

grid = np.zeros((frames // STEP, rows, cols), np.uint8)
prev, shift = None, {o: 0.0 for o in range(-3, 4)}
for i in range(frames):
    ok, im = cap.read()
    assert ok
    g = cv2.cvtColor(im, cv2.COLOR_BGR2GRAY)
    if i % STEP == 0:
        grid[i // STEP] = np.minimum(15, (cv2.resize(g, (cols, rows), interpolation=cv2.INTER_AREA).astype(np.uint16) + 8) >> 4)
    gf = g.astype(np.float32)
    if prev is not None:
        for o in shift:
            f = i + 1 + o
            if 2 <= f <= frames:
                m = np.zeros((H, W), bool)
                for x, y, w, h in boxes[f]:
                    m[max(0, int(y - h)):int(y), max(0, int(x - w / 2)):int(x + w / 2)] = True
                d = np.abs(gf - prev)
                shift[o] += d[m].sum() / (d.sum() + 1e-9)
    prev = gf
cap.release()

out = root.parent / "public/data/film-grid.bin"
flat = grid.reshape(-1)
packed = ((flat[0::2] << 4) | flat[1::2]).astype(np.uint8)
out.write_bytes(np.array([cols, rows, frames // STEP, PITCH, STEP], "<u2").tobytes() + packed.tobytes())
tall = max(h for b in boxes for *_, h in b)
print(f"grid {cols}x{rows} cells, {frames // STEP} stored frames (every {STEP}nd), 4 bit, {out.stat().st_size} B -> {out}")
print(f"cell pitch {PITCH} source px (video {W}x{H}); tallest box {tall:.0f} px = {tall / PITCH:.1f} cells tall; head ~{HEAD * tall / PITCH:.1f} cells")
print("alignment, share of frame-difference energy inside the boxes when track frame f is paired with video frame f-1+offset:")
for o, v in sorted(shift.items()):
    print(f"  offset {o:+d}: {v / (frames - 4):.4f}")
