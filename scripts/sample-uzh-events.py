#!/usr/bin/env python3
"""Cut one short event window from the public UZH-FPV drone dataset, the
dataset the EVIO project trains on (Delmerico et al., ICRA 2019,
https://fpv.ifi.uzh.ch/). Sequence: indoor_forward_3_davis_with_gt. The zip is
read over HTTP range requests, events.txt is streamed (x y t pol per line,
DAVIS 346x260). The window is the WINDOW seconds centred on the instant of
peak ground-truth speed, so the cloud is a real fast-flight slice. Output is
scripts/assets/evio/events.bin: per event int16 x, int16 y, uint32 dt in
microseconds from the window start, uint8 polarity (9 B). Host tooling, run by
hand; the output is committed.

    python3 scripts/sample-uzh-events.py
"""
import io
import math
import struct
import urllib.request
import zipfile
from pathlib import Path

URL = "https://download.ifi.uzh.ch/rpg/web/datasets/uzh-fpv-newer-versions/v3/indoor_forward_3_davis_with_gt.zip"
OUT = Path(__file__).parent / "assets" / "evio" / "events.bin"
WINDOW = 0.03


class Http(io.RawIOBase):
    def __init__(self, url):
        self.url, self.pos = url, 0
        self.n = int(urllib.request.urlopen(urllib.request.Request(url, method="HEAD")).headers["Content-Length"])

    def seekable(self):
        return True

    def readable(self):
        return True

    def tell(self):
        return self.pos

    def seek(self, o, w=0):
        self.pos = {0: o, 1: self.pos + o, 2: self.n + o}[w]
        return self.pos

    def readinto(self, b):
        if self.pos >= self.n:
            return 0
        end = min(self.pos + len(b), self.n) - 1
        r = urllib.request.urlopen(urllib.request.Request(self.url, headers={"Range": f"bytes={self.pos}-{end}"})).read()
        b[: len(r)] = r
        self.pos += len(r)
        return len(r)


z = zipfile.ZipFile(io.BufferedReader(Http(URL), 1 << 20))
gt = [tuple(map(float, l.split())) for l in z.open("groundtruth.txt").read().decode().splitlines() if l[0] != "#"]
best_t, best_v = None, -1.0
for a, b in zip(gt[:-5], gt[5:]):
    v = math.dist(a[1:4], b[1:4]) / (b[0] - a[0])
    if v > best_v:
        best_t, best_v = (a[0] + b[0]) / 2, v
t0 = best_t - WINDOW / 2
rows = []
for line in io.TextIOWrapper(z.open("events.txt")):
    if line[0] == "#":
        continue
    t, x, y, p = line.split()
    t = float(t)
    if t < t0:
        continue
    if t > t0 + WINDOW:
        break
    rows.append((int(x), int(y), int((t - t0) * 1e6), int(p)))
OUT.parent.mkdir(parents=True, exist_ok=True)
with OUT.open("wb") as f:
    for x, y, dt, p in rows:
        f.write(struct.pack("<hhIB", x, y, dt, p))
print(f"peak GT speed {best_v:.2f} m/s at t={best_t:.3f}; {len(rows)} events, {OUT.stat().st_size} B")
