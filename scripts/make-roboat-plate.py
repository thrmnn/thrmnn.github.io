#!/usr/bin/env python3
"""Card plates for the Roboat project: a small generic boat on an Amsterdam
canal with a simulated LiDAR scan, drawn in the house point-cloud look
(oblique dots like scripts/make-cloud-plates.py). Host tooling (numpy,
Pillow, scipy; laspy+lazrs only for --sample), run by hand; outputs committed.

REAL: the canal and its surroundings are Dutch open aerial LiDAR.
  Dataset  AHN5 (Actueel Hoogtebestand Nederland 5), point cloud, Rijkswaterstaat
  Licence  CC BY 4.0 for AHN5 (AHN1 to AHN4 were CC0): derived products must name the source,
           "AHN" (https://www.ahn.nl/eerste-deel-van-ahn-5-is-beschikbaar, "Open data, maar
           bronvermelding verplicht"; licence per the AHN tile index
           https://basisdata.nl/hwh-ahn/AUX/bladwijzer/index.html)
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
  The boat is a plain generic hull (4.6 m x 1.7 m, pointed bow, sheered gunwale,
  low cabin, a 3.2 m mast with a sensor head), drawn in points. It is not Roboat's hull and its data
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

    python3 scripts/make-roboat-plate.py            # card plate and loop (high view) + hero tile and loop (low view along the water)
    python3 scripts/make-roboat-plate.py --view low   # alternative card view along the water, written to ~/Perso/site-review/files
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
    """Generic small boat in points: pointed bow, sheered gunwale, V-ish hull, raked low cabin, mast.
    Returns (hull, sensor head)."""
    L2, hw, deck = 2.3, 0.85, WATER + 0.5

    def half_w(x):
        t = np.clip((x - 0.3) / 2.0, 0, 1)
        return hw * (1 - t ** 1.7) ** 0.85

    def sheer(x):
        bow = np.clip((x - 0.4) / 1.9, 0, 1)
        stern = np.clip((-x - 1.2) / 1.1, 0, 1)
        return deck + 0.32 * bow ** 2 + 0.1 * stern ** 2

    def chine(z):
        return 0.72 + 0.28 * np.clip((z - WATER) / (deck - WATER), 0, 1)

    pts = []
    N = 3600
    x = rng.uniform(-L2, L2, N)
    sgn = rng.choice([-1, 1], N)
    z = WATER + rng.uniform(0, 1, N) * (sheer(x) - WATER)
    pts.append(np.c_[x, sgn * half_w(x) * chine(z), z])
    N = 5000
    x, y = rng.uniform(-L2, L2, N), rng.uniform(-hw, hw, N)
    k = abs(y) < half_w(x)
    pts.append(np.c_[x[k], y[k], sheer(x[k])])
    N = 260
    y = rng.uniform(-hw * 0.72, hw * 0.72, N)
    pts.append(np.c_[np.full(N, -L2), y, WATER + rng.uniform(0, 1, N) * (deck - WATER)])
    cx0, cx1, cw, ch = -1.15, 0.65, 0.58, 0.72

    def front(z):
        return cx1 - 0.45 * np.clip((z - deck) / ch, 0, 1)

    N = 1000
    zz = deck + rng.uniform(0, ch, N)
    y = rng.uniform(-cw, cw, N)
    pts.append(np.c_[front(zz), y, zz])
    N = 800
    x, y = rng.uniform(cx0, cx1 - 0.45, N), rng.uniform(-cw * 0.9, cw * 0.9, N)
    pts.append(np.c_[x, y, np.full(N, deck + ch)])
    for ys in (-cw, cw):
        N = 700
        zz = deck + rng.uniform(0, ch, N)
        x = rng.uniform(cx0, 1, N) * 0 + rng.uniform(cx0, front(zz))
        pts.append(np.c_[x, np.full(N, ys * (1 - 0.12 * (zz - deck) / ch)), zz])
    N = 260
    zz = deck + rng.uniform(0, ch, N)
    pts.append(np.c_[np.full(N, cx0), rng.uniform(-cw, cw, N), zz])
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


def hull_col(h):
    t = np.clip((h[:, 2] - WATER) / 1.2, 0, 1)[:, None]
    return np.array((118, 124, 136), float) + (LIGHT - (118, 124, 136)) * t


def groups(sc, cam, lit_i=None, ring_i=None):
    lit_i = np.ones(len(sc["lit"])) if lit_i is None else lit_i
    ring_i = np.ones(len(sc["ring"])) if ring_i is None else ring_i
    return [
        (sc["cloud"], sc["grey"], 2.4, depth_fade(cam, sc["cloud"], 6, 130, 0.6), 1.0),
        (sc["ring"], ACCENT, 2.2, depth_fade(cam, sc["ring"], 10, RING_FAR, 0.7) * ring_i, 1.0),
        (sc["hull"], hull_col(sc["hull"]), 0.9, np.ones(len(sc["hull"])), 1.0),
        (sc["lit"], ACCENT, 2.4, depth_fade(cam, sc["lit"], 10, 120, 0.5) * lit_i, 1.5),
        (sc["head"], ACCENT, 1.6, np.ones(len(sc["head"])), 1.2),
    ]


def sweep(sc, head, tau=110.0, floor=0.0):
    f = lambda a: floor + (1 - floor) * np.exp(-((head - a) % 360) / tau)
    return f(sc["lit_az"]), f(sc["ring_az"])


ALT_OUT = Path.home() / "Perso/site-review/files"
VIEWS = {
    "low": dict(cam=cam_persp((-25.0, 2.0, 6.0), (14.0, 0.0, 3.0), 1650, oy=0.19), ring_far=80,
                still=ALT_OUT / "roboat-low.webp", anim=ALT_OUT / "roboat-low-anim.webp"),
    "tile": dict(cam=cam_persp((-19.0, 3.0, 7.0), (0.5, 0.0, 1.2), 1800, oy=0.5), ring_far=60,
                 still=OUT / "hero-tile.webp", anim=OUT / "hero-tile-anim.webp", still_q=80, anim_q=32),
    "high": dict(cam=cam_persp((-40.0, 0.0, 31.0), (6.0, 0.0, 0.0), 1250, oy=0.40), ring_far=140,
                 still=OUT / "card-plate.webp", anim=OUT / "card-anim.webp"),
}


def flicker(rng, a, depth):
    """A spinning lidar's returns are not all equal from one turn to the next."""
    return a * (1 - depth * rng.random(len(a)))


def run(name, sc):
    global RING_FAR
    v = VIEWS[name]
    cam, RING_FAR = v["cam"], v["ring_far"]
    v["still"].parent.mkdir(parents=True, exist_ok=True)
    full = render(cam, groups(sc, cam))
    small = name == "tile"
    (full.resize((600, 600), Image.LANCZOS) if small else full).save(v["still"], "WEBP", quality=v.get("still_q", 84), method=6)
    rng = np.random.default_rng(3)
    frames = []
    n = 36
    for i in range(n):
        li, ri = sweep(sc, i * 360 / n)
        li, ri = flicker(rng, li, 0.45), flicker(rng, ri, 0.2)
        frames.append(render(cam, groups(sc, cam, li, ri)).resize((600, 600), Image.LANCZOS))
    frames[0].save(v["anim"], "WEBP", save_all=True, append_images=frames[1:], duration=80, loop=0, quality=v.get("anim_q", 30), method=6)
    for f in (v["still"], v["anim"]):
        print(f, f.stat().st_size, "B")


def main():
    names = [sys.argv[sys.argv.index("--view") + 1]] if "--view" in sys.argv else ["high", "tile"]
    sc = scene()
    print(len(sc["cloud"]), "cloud pts,", len(sc["lit"]), "lit,", len(sc["ring"]), "ring")
    for n in names:
        run(n, sc)


if __name__ == "__main__":
    sample() if "--sample" in sys.argv else main()
