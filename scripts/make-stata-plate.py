#!/usr/bin/env python3
"""Card plate and loop for the ROS 2 log-triage project (also the hero's Decipher
tile): a logistics robot in a building, the point of the log tool in one picture.
Dots in the house look (oblique, grey fading with depth, returns lit in blue, a
sweeping beam), like scripts/make-roboat-plate.py. Host tooling (numpy, Pillow),
run by hand; outputs committed.

REAL: the building map, where the robot really was, and where it said it was.
  Dataset  MIT Stata Center dataset, a PR2 robot, CC BY 3.0 (Fallon et al.)
  Run      the demo's results/stata of github.com/thrmnn/ros2-localization-triage:
           walls.csv (laser endpoints from ground-truth-aligned scans),
           amcl_poses.csv (the poses AMCL reported), gt_part3_floor2.csv (the
           dataset's AprilTag ground truth, independent of AMCL).
  Moment   one AMCL pose inside the lost window (part3_after_floor_change, 88 s,
           median position error 19.4 m, median reported sigma 0.081 m), the one
           whose error and reported sigma are closest to those medians; the true
           pose is the ground-truth row nearest in time (within 0.1 s). The
           picture shows both: the robot where it was (grey, blue returns) and
           the robot where it said it was (orange).
  Asset    scripts/assets/stata/lost-moment.npz: walls in metres, the two poses,
           the ground-truth path of the lost window. --sample rebuilds it from a
           clone of the demo repo.

SIMULATED / DRAWN: everything that is the robot and its scan.
  The robot is a generic low logistics AMR (low rectangular base, a tote on
  the deck, a lidar puck at the front) drawn in points at about four times a typical AMR's size (4.5x here) so it reads at card size.
  It is a stand-in for the kind of robot this work serves, not the PR2 that made
  the recording. The scan is imagined: a 2D lidar on the puck, 0.5 degree steps,
  18 m range, lit on the real wall points in line of sight of the true pose (the
  wall points are laser endpoints, 10 cm apart, so no claim is made about what
  the real scanner returned). The orange returns are that same scan placed at the
  reported pose: what the robot would believe it sees. Walls are extruded to 2.6 m
  in dot columns for the oblique view; the real map is 2D.

    python3 scripts/make-stata-plate.py                  # card plate + loop, hero tile (decipher-tile) + loop
    python3 scripts/make-stata-plate.py --view top        # alternative framing, to ~/Perso/site-review/files
    python3 scripts/make-stata-plate.py --sample <clone>  # rebuild the asset
"""
import math
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).parent.parent
ASSET = ROOT / "scripts/assets/stata/lost-moment.npz"
OUT = ROOT / "public/projects/ros2-localization-triage"
ALT_OUT = Path.home() / "Perso/site-review/files"

S = 1200
BG = np.array((14, 16, 22), float)
GREY = np.array((120, 124, 134), float)
LIGHT = np.array((150, 156, 168), float)
ACCENT = np.array((86, 140, 246), float)
ORANGE = np.array((255, 138, 61), float)

WALL_H = 2.0
COL_STEP = 0.4
LIDAR_Z = 0.55
MAX_RANGE = 18.0
AZ_STEP = 0.5
ROBOT_K = 4.5


def sample(clone):
    res = Path(clone) / "results/stata"
    walls = np.loadtxt(res / "walls.csv", delimiter=",", skiprows=1)
    amcl = np.loadtxt(res / "amcl_poses.csv", delimiter=",", skiprows=1)
    gt = np.loadtxt(res / "gt_part3_floor2.csv", delimiter=",")
    t0 = amcl[0, 0]
    t = (amcl[:, 0] - t0) / 1e6
    lo, hi = float(gt[0, 0] - t0) / 1e6, float(gt[-1, 0] - t0) / 1e6
    gi = np.abs(gt[:, 0][None, :] - amcl[:, 0][:, None]).argmin(1)
    ok = (np.abs(gt[gi, 0] - amcl[:, 0]) < 1e5) & (t >= 302.0) & (t <= hi)
    err = np.hypot(*(gt[gi, 1:3] - amcl[:, 1:3]).T)
    med_err, med_sig = np.median(err[ok]), np.median(amcl[ok, 4])
    cost = np.abs(err - med_err) / med_err + np.abs(amcl[:, 4] - med_sig) / med_sig
    cost[~ok] = 1e9
    i = int(cost.argmin())
    print(f"replay t={t[i]:.1f} s, error {err[i]:.1f} m (median {med_err:.1f}), sigma {amcl[i, 4]:.3f} m (median {med_sig:.3f})")
    np.savez_compressed(
        ASSET,
        walls=np.round(walls * 100).astype(np.int16),
        true_pose=gt[gi[i], 1:4],
        amcl_pose=amcl[i, 1:4],
        path=np.round(gt[::10, 1:3] * 100).astype(np.int16),
        meta=np.array([t[i], err[i], amcl[i, 4]]),
    )
    print(ASSET.stat().st_size, "B")


def load():
    d = np.load(ASSET)
    return d["walls"].astype(float) / 100, d["true_pose"], d["amcl_pose"], d["path"].astype(float) / 100


def cast(walls, pose):
    """Wall points in line of sight of a 2D lidar at pose: indices, sensor-frame angle (deg), range."""
    d = walls - pose[:2]
    r = np.hypot(d[:, 0], d[:, 1])
    a = (np.degrees(np.arctan2(d[:, 1], d[:, 0])) - math.degrees(pose[2])) % 360
    nb = int(round(360 / AZ_STEP))
    b = (a / AZ_STEP).astype(int) % nb
    near = np.full(nb, np.inf)
    ok = (r > 0.6) & (r < MAX_RANGE)
    np.minimum.at(near, b[ok], r[ok])
    m = np.min([np.roll(near, k) for k in range(-2, 3)], axis=0)
    vis = ok & (r <= m[b] + 0.25)
    return np.nonzero(vis)[0], a[vis], r[vis], near


def amr(pose, k=ROBOT_K):
    """Generic low AMR in points: base, a tote on the deck, lidar puck at the front. Returns (body, tote, puck) in world metres."""
    rng = np.random.default_rng(3)
    L, W, Hb = 0.55 * k, 0.38 * k, 0.24 * k
    Ht = 0.26 * k
    t0, t1, tw = -0.9 * L, 0.3 * L, 0.78 * W

    def box_faces(x0, x1, y0, y1, z0, z1, n_side, n_top):
        out = []
        for sx in (x0, x1):
            out.append(np.c_[np.full(n_side, sx), rng.uniform(y0, y1, n_side), rng.uniform(z0, z1, n_side)])
        for sy in (y0, y1):
            out.append(np.c_[rng.uniform(x0, x1, n_side), np.full(n_side, sy), rng.uniform(z0, z1, n_side)])
        out.append(np.c_[rng.uniform(x0, x1, n_top), rng.uniform(y0, y1, n_top), np.full(n_top, z1)])
        return np.vstack(out)

    body = box_faces(-L, L, -W, W, 0.15 * Hb, Hb, 1300, 1200)
    body = np.vstack([body, np.c_[np.full(260, L), rng.uniform(-W, W, 260), np.full(260, Hb * 0.5)]])
    tote = box_faces(t0, t1, -tw, tw, Hb, Hb + Ht, 900, 1000)
    th = rng.uniform(0, 2 * np.pi, 500)
    rr = 0.14 * k * np.sqrt(rng.uniform(0, 1, 500))
    zz = rng.uniform(Hb + 0.03 * k, Hb + 0.14 * k, 500)
    puck = np.c_[0.66 * L + rr * np.cos(th), rr * np.sin(th), zz]
    c, s = math.cos(pose[2]), math.sin(pose[2])
    rot = lambda p: np.c_[p[:, 0] * c - p[:, 1] * s + pose[0], p[:, 0] * s + p[:, 1] * c + pose[1], p[:, 2]]
    return rot(body), rot(tote), rot(puck)


def cam_fit(look, elev, alpha, tp, ap, tgt_t, tgt_a, dist=45.0):
    """Perspective camera at elevation elev (deg), azimuth alpha (deg from the gap's perpendicular), scaled and shifted so the
    two poses land on the given pixels (1200 px space)."""
    v = ap[:2] - tp[:2]
    v = v / np.linalg.norm(v)
    perp = np.array([v[1], -v[0]])
    a = math.radians(alpha)
    dh = np.array([perp[0] * math.cos(a) - perp[1] * math.sin(a), perp[0] * math.sin(a) + perp[1] * math.cos(a)])
    e = math.radians(elev)
    look = np.array(look, float)
    pos = look + np.r_[dh * math.cos(e), math.sin(e)] * dist
    fwd = look - pos
    fwd /= np.linalg.norm(fwd)
    right = np.cross(fwd, [0, 0, 1.0])
    right /= np.linalg.norm(right)
    up = np.cross(right, fwd)

    def raw(p):
        d = p - pos
        zc = np.maximum(d @ fwd, 0.3)
        return (d @ right) / zc, -(d @ up) / zc, zc

    P = [raw(np.array([q[0], q[1], 0.3])) for q in (tp, ap)]
    dv = np.array([P[1][0] - P[0][0], P[1][1] - P[0][1]])
    tv = np.array(tgt_a, float) - np.array(tgt_t, float)
    f = np.linalg.norm(tv) / np.linalg.norm(dv)
    ang_err = math.degrees(math.atan2(tv[1], tv[0]) - math.atan2(dv[1], dv[0]))
    ox = tgt_t[0] - f * P[0][0]
    oy = tgt_t[1] - f * P[0][1]

    def cam(p):
        x, y, zc = raw(p)
        return ox + f * x, oy + f * y, zc, f / zc / 120

    return cam, dv, f


def best_alpha(look, elev, tp, ap, want_deg):
    """Azimuth that makes the true-to-reported gap point want_deg above the screen's horizontal, reported to the right."""
    best = None
    for al in np.arange(-179, 180, 1.0):
        cam, dv, _ = cam_fit(look, elev, al, tp, ap, (0, 0), (100, 0))
        if dv[0] <= 0:
            continue
        ang = math.degrees(math.atan2(-dv[1], dv[0]))
        if best is None or abs(ang - want_deg) < best[0]:
            best = (abs(ang - want_deg), al)
    return best[1]


def render(cam, groups, size=S):
    X, Y, D, R, C = [], [], [], [], []
    for pts, col, rad, w, rmin in groups:
        if not len(pts):
            continue
        x, y, d, sc = cam(pts)
        col = np.broadcast_to(col, (len(pts), 3))
        X.append(x); Y.append(y); D.append(d); R.append(np.clip(rad * sc, rmin, 7))
        C.append(BG + (col - BG) * w[:, None])
    X, Y, D, R, C = (np.concatenate(v) for v in (X, Y, D, R, C))
    ok = (X > -5) & (X < S + 5) & (Y > -5) & (Y < S + 5)
    o = np.argsort(-D[ok])
    k = size / S
    im = Image.new("RGB", (size, size), tuple(int(v) for v in BG))
    dr = ImageDraw.Draw(im)
    for x, y, r, c in zip(X[ok][o] * k, Y[ok][o] * k, R[ok][o] * k, C[ok][o].astype(np.uint8)):
        dr.ellipse([x - r, y - r, x + r, y + r], fill=tuple(int(v) for v in c))
    return im


def fade(cam, pts, near, far, gamma):
    return np.clip(1 - (cam(pts)[2] - near) / (far - near), 0, 1) ** gamma


MARGIN = 8.0


def scene():
    walls, tp, ap, path = load()
    mid = (tp[:2] + ap[:2]) / 2
    v = ap[:2] - tp[:2]
    gl = np.linalg.norm(v)
    v = v / gl
    rel = walls - mid
    along, across = rel @ v, rel @ np.array([-v[1], v[0]])
    keep = (np.abs(along) < gl / 2 + MARGIN) & (np.abs(across) < 0.5 * gl / 2 + MARGIN)
    cast_idx, cast_ang, _, near = cast(walls, tp)
    walls_all = walls
    keep_idx = np.nonzero(keep)[0]
    walls = walls[keep_idx]
    n = len(walls)
    zs = np.arange(0.12, WALL_H, COL_STEP)
    cols = np.c_[np.repeat(walls, len(zs), 0), np.tile(zs, n)]
    base = np.repeat(np.arange(n), len(zs))
    ang_of = np.full(len(walls_all), np.nan)
    ang_of[cast_idx] = cast_ang
    ang_k = ang_of[keep_idx]
    lit_mask = ~np.isnan(ang_k)[base]
    dt = np.hypot(*(walls - tp[:2]).T)
    da = np.hypot(*(walls - ap[:2]).T)
    near_w = np.where(np.minimum(dt, da) < 7.0, 1.3, 1.0)
    dist_w = (0.25 + 0.75 * np.clip(1 - dt / 26.0, 0, 1) ** 0.8) * near_w
    wall_w = dist_w[base]
    dyaw = ap[2] - tp[2]
    c, s = math.cos(dyaw), math.sin(dyaw)
    li = cast_idx[np.isin(cast_idx, keep_idx)]
    rel2 = walls_all[li] - tp[:2]
    mis = np.c_[rel2[:, 0] * c - rel2[:, 1] * s + ap[0], rel2[:, 0] * s + rel2[:, 1] * c + ap[1], np.full(len(li), LIDAR_Z)]
    mis_ang = ang_of[li]
    body_t, tote_t, puck_t = amr(tp)
    body_a, tote_a, puck_a = amr(ap)
    gap = np.linspace(0.12, 0.88, int(gl * 0.76 / 0.45))[:, None]
    gapline = np.c_[tp[:2] + gap * (ap[:2] - tp[:2]), np.full(len(gap), 0.05)]
    rings = []
    for r in (6.0, 12.0, 18.0):
        th = np.linspace(0, 2 * np.pi, int(2 * np.pi * r / 0.45), endpoint=False)
        rings.append(np.c_[tp[0] + r * np.cos(th), tp[1] + r * np.sin(th), np.zeros(len(th))])
    i0 = int(np.hypot(*(path - tp[:2]).T).argmin())
    seg = path[: i0 + 1][::-1]
    arc = np.r_[0, np.cumsum(np.hypot(*np.diff(seg, axis=0).T))]
    seg = seg[arc < 9.0]
    arc = arc[: len(seg)]
    tt = np.arange(0.9 * ROBOT_K * 0.55, 9.0, 0.4)
    trail = np.c_[np.interp(tt, arc, seg[:, 0]), np.interp(tt, arc, seg[:, 1]), np.full(len(tt), 0.04)]
    return dict(
        cols=cols, lit=lit_mask, col_ang=ang_k[base], wall_w=wall_w, mis=mis, mis_ang=mis_ang, tp=tp, ap=ap,
        body_t=body_t, tote_t=tote_t, puck_t=puck_t, body_a=body_a, tote_a=tote_a, puck_a=puck_a,
        gap=gapline, trail=trail, rings=np.vstack(rings), near=near, mid=mid,
    )


def beam(sc, head):
    b = int(round(head / AZ_STEP)) % len(sc["near"])
    r = sc["near"][b] if np.isfinite(sc["near"][b]) else MAX_RANGE
    t = np.arange(1.2, r, 0.35)
    out = []
    for p in (sc["tp"], sc["ap"]):
        a = p[2] + math.radians(head)
        out.append(np.c_[p[0] + t * math.cos(a), p[1] + t * math.sin(a), np.full(len(t), LIDAR_Z)])
    return out


def groups(sc, cam, head=None, tau=110.0, floor=0.0):
    zt = np.clip(sc["cols"][:, 2] / WALL_H, 0, 1)
    grey = GREY + (LIGHT - GREY) * zt[:, None]
    lit = sc["lit"]
    if head is None:
        wi, mi = np.ones(lit.sum()), np.ones(len(sc["mis"]))
    else:
        f = lambda a: floor + (1 - floor) * np.exp(-((head - a) % 360) / tau)
        wi, mi = f(sc["col_ang"][lit]), f(sc["mis_ang"])
    lc = sc["cols"][lit]
    one = lambda a: np.ones(len(a))
    g = [
        (sc["cols"], grey, 2.5, np.clip(sc["wall_w"] * 0.8, 0, 0.95), 1.0),
        (sc["rings"], ACCENT, 1.8, fade(cam, sc["rings"], 10, 90, 0.7) * 0.5, 1.0),
        (sc["trail"], LIGHT, 2.2, np.linspace(0.9, 0.15, len(sc["trail"])), 1.2),
        (sc["gap"], ORANGE, 2.6, one(sc["gap"]) * 0.9, 1.5),
        (lc, ACCENT, 3.2, np.clip(wi * 1.3, 0, 1) * (0.55 + 0.45 * sc["wall_w"][lit] / 1.3), 1.7),
        (sc["mis"], ORANGE, 2.8, np.clip(mi * 1.2, 0, 1), 1.5),
        (sc["body_a"], ORANGE, 1.2, one(sc["body_a"]) * 0.75, 1.0),
        (sc["tote_a"], ORANGE, 1.2, one(sc["tote_a"]) * 0.95, 1.0),
        (sc["puck_a"], ORANGE, 1.6, one(sc["puck_a"]), 1.2),
        (sc["body_t"], LIGHT, 1.2, one(sc["body_t"]), 1.0),
        (sc["tote_t"], np.array((205, 210, 220.0)), 1.2, one(sc["tote_t"]), 1.0),
        (sc["puck_t"], ACCENT, 1.8, one(sc["puck_t"]) * 1.0, 1.4),
    ]
    if head is not None:
        bt, ba = beam(sc, head)
        g += [(bt, ACCENT, 2.2, np.full(len(bt), 0.95), 1.3), (ba, ORANGE, 2.2, np.full(len(ba), 0.95), 1.3)]
    return g


VIEWS = {
    "card": dict(elev=40, want=33, t=(280, 640), a=(900, 300), size=1200),
    "tile": dict(elev=40, want=38, t=(330, 790), a=(870, 410), size=600),
    "top": dict(elev=78, want=33, t=(300, 600), a=(900, 280), size=1200),
}


def render_view(sc, name, still, anim, n=36):
    cfg = VIEWS[name]
    tp, ap = sc["tp"], sc["ap"]
    look = np.r_[sc["mid"], 0.5]
    al = best_alpha(look, cfg["elev"], tp, ap, cfg["want"])
    cam, dv, f = cam_fit(look, cfg["elev"], al, tp, ap, cfg["t"], cfg["a"])
    size = cfg["size"]
    render(cam, groups(sc, cam, head=200.0, floor=0.4), size).save(still, "WEBP", quality=84 if size == 1200 else 82, method=6)
    frames = [render(cam, groups(sc, cam, head=i * 360 / n), 600) for i in range(n)]
    frames[0].save(anim, "WEBP", save_all=True, append_images=frames[1:], duration=80, loop=0, quality=30, method=6)
    for f_ in (still, anim):
        print(f_, f_.stat().st_size, "B")


def main():
    sc = scene()
    print(len(sc["cols"]), "wall dots,", sc["lit"].sum(), "lit")
    ALT_OUT.mkdir(parents=True, exist_ok=True)
    if "--view" in sys.argv:
        v = sys.argv[sys.argv.index("--view") + 1]
        render_view(sc, v, ALT_OUT / f"decipher-{v}.webp", ALT_OUT / f"decipher-{v}-anim.webp")
        return
    render_view(sc, "card", OUT / "stata-plate.webp", OUT / "stata-anim.webp")
    render_view(sc, "tile", OUT / "decipher-tile.webp", OUT / "decipher-tile-anim.webp")


if __name__ == "__main__":
    if "--sample" in sys.argv:
        sample(sys.argv[sys.argv.index("--sample") + 1])
    else:
        main()
