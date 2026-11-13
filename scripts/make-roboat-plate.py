#!/usr/bin/env python3
"""Card plates for the Roboat project: a small generic boat on an Amsterdam
canal with a simulated LiDAR scan, drawn in the house point-cloud look
(oblique dots like scripts/make-cloud-plates.py). Host tooling (numpy,
Pillow, scipy; laspy+lazrs only for --sample), run by hand; outputs committed.

REAL: the canal and its surroundings are Dutch open aerial LiDAR.
  Dataset  AHN5 (Actueel Hoogtebestand Nederland 5), point cloud, Rijkswaterstaat
  Licence  CC0 1.0 (public domain dedication)
  Tile     25GN1_01..25 sheet, sub-tile 25GN1_02.LAZ, 5.2 MB per 1000 m
           https://geotiles.citg.tudelft.nl/AHN5_T/25GN1_02.LAZ
           (index: https://www.ahn.nl/ , data portal https://www.pdok.nl/ahn)
  Site     a straight canal stretch about 200 m long in central Amsterdam,
           centre RD New (EPSG:28992) 121437.9 E, 486454.3 N, axis bearing
           (0.977, -0.213); the water is the region with no returns (water
           absorbs the laser), found by --sample from the empty-cell mask.
  Asset    scripts/assets/roboat/canal.npz: the cloud cut to a 170 m x 110 m
           box around the site, thinned to one point per 0.4 m voxel, in
           metres relative to the canal centre (u along the canal, v across,
           z in m NAP), with the AHN classification (1 other, 2 ground,
           6 building, 26 other). The raw LAZ is not committed.

SIMULATED: everything that is the boat and its scan.
  The boat is a plain generic hull (4.6 m x 1.7 m flat deck, a 2.4 m mast
  with a sensor head), drawn in points. It is not Roboat's hull and its data
  is not Roboat's data.
  The scanner is an imagined 16-beam spinning LiDAR on the mast head,
  3.6 m above the water, beams from -25 to +15 degrees in elevation, 0.4
  degree azimuth step, 60 m maximum range, water level -0.40 m NAP (the
  Amsterdam city water level). For each beam and azimuth step the first
  point of the real cloud within 0.3 m + 0.2% of range of the ray is lit
  (a z-buffer per azimuth x elevation bin); a ray that reaches the water
  plane first draws a ring point there. AHN is an aerial scan, so facades
  and quay walls are sparse and beams can pass where a real scanner would
  hit a wall; nothing here is a claim about what an on-board scanner sees.

    python3 scripts/make-roboat-plate.py            # plates from the asset
    python3 scripts/make-roboat-plate.py --view high  # alternative high oblique view, written to ~/Perso/site-review/files
    python3 scripts/make-roboat-plate.py --sample   # rebuild the asset from a LAZ
"""
import math
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).parent.parent
ASSET = ROOT / "scripts/assets/roboat/canal.npz"
OUT = ROOT / "public/projects/autonomous-boat-perception"
LAZ = Path("/home/theo/SCL/SCA/ShadyBusiness2/data/tiles/25GN1/lidar/25GN1_02.LAZ")
SEED = (121440.0, 486460.0)
BOX = (121000, 122000, 486230, 486700)
HALF_U, HALF_V = 85.0, 55.0
VOXEL = 0.4

S = 1200
BG = np.array((14, 16, 22), float)
ACCENT = np.array((86, 140, 246), float)
GREY = np.array((120, 124, 134), float)
LIGHT = np.array((150, 156, 168), float)

WATER = -0.4
MAST_H = 3.6
BEAMS = np.radians(np.linspace(-25, 15, 16))
AZ_STEP = 0.4
MAX_RANGE = 60.0
RING_STEP = 2
RING_FAR = 80
YAW = math.radians(28)


def sample():
    import laspy
    from scipy import ndimage as ndi

    x0, x1, y0, y1 = BOX
    parts = []
    with laspy.open(LAZ) as r:
        for ch in r.chunk_iterator(4_000_000):
            x, y = np.asarray(ch.x), np.asarray(ch.y)
            m = (x >= x0) & (x < x1) & (y >= y0) & (y < y1)
            parts.append(np.c_[x[m], y[m], np.asarray(ch.z)[m], np.asarray(ch.classification)[m]])
    a = np.vstack(parts)
    occ = np.zeros((y1 - y0, x1 - x0), bool)
    occ[(a[:, 1] - y0).astype(int), (a[:, 0] - x0).astype(int)] = True
    lab, _ = ndi.label(ndi.binary_opening(~occ, structure=np.ones((5, 5))))
    ys, xs = np.nonzero(lab == lab[int(SEED[1]) - y0, int(SEED[0]) - x0])
    p = np.c_[xs + x0, ys + y0].astype(float)
    c = p.mean(0)
    ax = np.linalg.svd(p - c)[2][0]
    ax = ax if ax[0] > 0 else -ax
    u = (a[:, 0] - c[0]) * ax[0] + (a[:, 1] - c[1]) * ax[1]
    v = -(a[:, 0] - c[0]) * ax[1] + (a[:, 1] - c[1]) * ax[0]
    k = (abs(u) < HALF_U) & (abs(v) < HALF_V)
    q = np.c_[u[k], v[k], a[k, 2], a[k, 3]]
    key = np.floor(q[:, :3] / VOXEL).astype(np.int64)
    _, idx = np.unique(key, axis=0, return_index=True)
    q = q[idx]
    ASSET.parent.mkdir(parents=True, exist_ok=True)
    np.savez_compressed(ASSET, uvz=np.round(q[:, :3] * 100).astype(np.int16), cls=q[:, 3].astype(np.uint8))
    print(f"centre RD {c}, axis {ax}, {len(q)} points, {ASSET.stat().st_size} B")


def load():
    d = np.load(ASSET)
    return d["uvz"].astype(np.float64) / 100, d["cls"]


def boat(rng):
    """Generic hull in points: rounded bow, flat deck, low cabin, mast. Returns (hull, sensor head)."""
    L2, hw, side, deck = 2.3, 0.85, 0.55, WATER + 0.55

    def half_w(x):
        t = np.clip((x - 1.0) / 1.3, 0, 1)
        return hw * np.sqrt(1 - t ** 2)

    def top(x):
        t = np.clip((x - 0.8) / 1.5, 0, 1)
        return deck + 0.3 * t ** 2

    pts = []
    N = 2200
    x = rng.uniform(-L2, L2, N)
    sgn = rng.choice([-1, 1], N)
    pts.append(np.c_[x, sgn * half_w(x), WATER + rng.uniform(0, 1, N) * (top(x) - WATER)])
    N = 2600
    x, y = rng.uniform(-L2, L2, N), rng.uniform(-hw, hw, N)
    k = abs(y) < half_w(x)
    pts.append(np.c_[x[k], y[k], top(x[k])])
    N = 300
    y = rng.uniform(-hw, hw, N)
    pts.append(np.c_[np.full(N, -L2), y, WATER + rng.uniform(0, 1, N) * (deck - WATER)])
    cx0, cx1, cw, ch = -1.1, 0.7, 0.55, 0.75
    N = 1000
    x, y = rng.uniform(cx0, cx1, N), rng.uniform(-cw, cw, N)
    pts.append(np.c_[x, y, np.full(N, deck + ch)])
    for ys in (-cw, cw):
        N = 400
        pts.append(np.c_[rng.uniform(cx0, cx1, N), np.full(N, ys), deck + rng.uniform(0, ch, N)])
    for xs in (cx0, cx1):
        N = 700
        pts.append(np.c_[np.full(N, xs), rng.uniform(-cw, cw, N), deck + rng.uniform(0, ch, N)])
    N = 500
    pts.append(np.c_[np.full(N, 0.4) + rng.normal(0, 0.015, N), rng.normal(0, 0.015, N), rng.uniform(deck + ch, WATER + MAST_H - 0.3, N)])
    th = rng.uniform(0, 2 * np.pi, 700)
    zz = rng.uniform(WATER + MAST_H - 0.3, WATER + MAST_H, 700)
    head = np.c_[0.4 + 0.14 * np.cos(th), 0.14 * np.sin(th), zz]
    return np.vstack(pts), head


def scan(uvz, origin):
    d = uvz - origin
    rng_ = np.linalg.norm(d, axis=1)
    keep = (rng_ > 1.0) & (rng_ < MAX_RANGE)
    az = np.degrees(np.arctan2(d[:, 1], d[:, 0])) % 360
    el = np.arcsin(np.clip(d[:, 2] / np.maximum(rng_, 1e-6), -1, 1))
    ai = np.floor(az / AZ_STEP).astype(int)
    n_az = int(round(360 / AZ_STEP))
    best = {}
    tol = (0.3 + 0.002 * rng_) / np.maximum(rng_, 1e-6)
    for b, be in enumerate(BEAMS):
        hit = np.nonzero(keep & (abs(el - be) < tol))[0]
        if not len(hit):
            continue
        order = hit[np.argsort(rng_[hit])[::-1]]
        for i in order:
            best[(b, ai[i])] = i
    pt_idx = np.array(list(best.values()), int)
    pt_az = np.array([k[1] for k in best]) * AZ_STEP
    ring_pts, ring_az = [], []
    for b, be in enumerate(BEAMS):
        if be >= 0:
            continue
        r = (origin[2] - WATER) / -math.tan(be)
        if r > MAX_RANGE:
            continue
        for k in range(0, n_az, RING_STEP):
            if (b, k) in best and rng_[best[(b, k)]] < r:
                continue
            a_ = math.radians(k * AZ_STEP)
            ring_pts.append((origin[0] + r * math.cos(a_), origin[1] + r * math.sin(a_), WATER))
            ring_az.append(k * AZ_STEP)
    return pt_idx, pt_az, np.array(ring_pts), np.array(ring_az)


R_VIEW = 50.0


def cam_oblique(rot=1.25, tilt=0.8, ysq=0.85, oy=0.36, span=0.92):
    c, s = math.cos(rot), math.sin(rot)
    ct, st = math.cos(tilt), math.sin(tilt)
    k = span * S / (2 * R_VIEW)

    def cam(p):
        x, y, z = p[:, 0], p[:, 1], p[:, 2]
        rz = x * s + y * c
        sx = x * c - y * s
        sy = (z * ct - rz * st) * ysq
        return S / 2 + sx * k, S * oy - sy * k, z * st + rz * ct, np.full(len(p), k / 6.7)

    return cam


def cam_persp(cam_pos, look, f, oy=0.4):
    cam_pos, look = np.array(cam_pos, float), np.array(look, float)
    fwd = look - cam_pos
    fwd /= np.linalg.norm(fwd)
    right = np.cross(fwd, [0, 0, 1.0])
    right /= np.linalg.norm(right)
    up = np.cross(right, fwd)

    def cam(p):
        d = p - cam_pos
        zc = np.maximum(d @ fwd, 0.3)
        return S / 2 + f * (d @ right) / zc, S * oy - f * (d @ up) / zc, zc, f / zc / 120

    return cam


def render(cam, groups, size=S):
    """groups: (points, rgb Nx3 or 3, radius px at 1200, weight N) per layer."""
    X, Y, D, R, C, V = [], [], [], [], [], []
    for pts, col, rad, w, rmin in groups:
        x, y, d, sc = cam(pts)
        col = np.broadcast_to(col, (len(pts), 3))
        X.append(x); Y.append(y); D.append(d); R.append(np.clip(rad * sc, rmin, 6)); V.append(d > 2.5)
        C.append(BG + (col - BG) * w[:, None])
    X, Y, D, R, C, V = (np.concatenate(v) for v in (X, Y, D, R, C, V))
    ok = V & (X > -5) & (X < S + 5) & (Y > -5) & (Y < S + 5)
    o = np.argsort(-D[ok])
    k = size / S
    im = Image.new("RGB", (size, size), tuple(int(v) for v in BG))
    dr = ImageDraw.Draw(im)
    for x, y, r, c in zip(X[ok][o] * k, Y[ok][o] * k, R[ok][o] * k, C[ok][o].astype(np.uint8)):
        dr.ellipse([x - r, y - r, x + r, y + r], fill=tuple(int(v) for v in c))
    return im


def scene():
    rng = np.random.default_rng(7)
    uvz, cls = load()
    mast = np.array([0.4, 0.0, WATER + MAST_H])
    hull, head = boat(rng)
    c, sn = math.cos(YAW), math.sin(YAW)
    hull = hull - [0.4, 0, 0]
    hull = np.c_[hull[:, 0] * c - hull[:, 1] * sn + 0.4, hull[:, 0] * sn + hull[:, 1] * c, hull[:, 2]]
    idx, az, ring, ring_az = scan(uvz, mast)
    zt = np.clip(uvz[:, 2] / 18, 0, 1)
    return dict(
        cloud=uvz, grey=GREY + (LIGHT - GREY) * zt[:, None], hull=hull, head=head,
        lit=uvz[idx], lit_az=az, ring=ring, ring_az=ring_az,
        mast=mast,
    )


def depth_fade(cam, pts, near, far, gamma):
    d = cam(pts)[2]
    return np.clip(1 - (d - near) / (far - near), 0, 1) ** gamma


def groups(sc, cam, lit_i=None, ring_i=None):
    lit_i = np.ones(len(sc["lit"])) if lit_i is None else lit_i
    ring_i = np.ones(len(sc["ring"])) if ring_i is None else ring_i
    return [
        (sc["cloud"], sc["grey"], 2.4, depth_fade(cam, sc["cloud"], 6, 130, 0.6), 1.0),
        (sc["ring"], ACCENT, 2.2, depth_fade(cam, sc["ring"], 10, RING_FAR, 0.7) * ring_i, 1.0),
        (sc["hull"], LIGHT, 0.9, np.ones(len(sc["hull"])), 1.0),
        (sc["lit"], ACCENT, 2.4, depth_fade(cam, sc["lit"], 10, 120, 0.5) * lit_i, 1.5),
        (sc["head"], ACCENT, 1.6, np.ones(len(sc["head"])), 1.2),
    ]


def sweep(sc, head, tau=110.0, floor=0.0):
    f = lambda a: floor + (1 - floor) * np.exp(-((head - a) % 360) / tau)
    return f(sc["lit_az"]), f(sc["ring_az"])


CAM = cam_persp((-25.0, 2.0, 6.0), (14.0, 0.0, 3.0), 1650, oy=0.19)


CAM_HIGH = cam_persp((-40.0, 0.0, 31.0), (6.0, 0.0, 0.0), 1250, oy=0.40)
HIGH_OUT = Path.home() / "Perso/site-review/files"


def main():
    high = "--view" in sys.argv and sys.argv[sys.argv.index("--view") + 1] == "high"
    global RING_FAR
    cam = CAM_HIGH if high else CAM
    RING_FAR = 140 if high else RING_FAR
    still = HIGH_OUT / "roboat-high.webp" if high else OUT / "card-plate.webp"
    anim = HIGH_OUT / "roboat-high-anim.webp" if high else OUT / "card-anim.webp"
    still.parent.mkdir(parents=True, exist_ok=True)
    sc = scene()
    print(len(sc["cloud"]), "cloud pts,", len(sc["lit"]), "lit,", len(sc["ring"]), "ring")
    render(cam, groups(sc, cam)).save(still, "WEBP", quality=84, method=6)
    frames = []
    n = 36
    for i in range(n):
        li, ri = sweep(sc, i * 360 / n)
        frames.append(render(cam, groups(sc, cam, li, ri)).resize((600, 600), Image.LANCZOS))
    frames[0].save(anim, "WEBP", save_all=True, append_images=frames[1:], duration=80, loop=0, quality=30, method=6)
    for f in (still, anim):
        print(f, f.stat().st_size, "B")


if __name__ == "__main__":
    sample() if "--sample" in sys.argv else main()
