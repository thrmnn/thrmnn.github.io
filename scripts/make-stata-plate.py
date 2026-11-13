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
  The robot is a generic low logistics AMR (flat base, flat cargo deck, lidar puck
  on top) drawn in points at about four times a typical AMR's size so it reads at card size.
  It is a stand-in for the kind of robot this work serves, not the PR2 that made
  the recording. The scan is imagined: a 2D lidar on the puck, 0.5 degree steps,
  18 m range, lit on the real wall points in line of sight of the true pose (the
  wall points are laser endpoints, 10 cm apart, so no claim is made about what
  the real scanner returned). The orange returns are that same scan placed at the
  reported pose: what the robot would believe it sees. Walls are extruded to 2.6 m
  in dot columns for the oblique view; the real map is 2D.

    python3 scripts/make-stata-plate.py                  # plate and loop from the asset
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
ROBOT_K = 4.2


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
    """Generic low AMR in points: base, cargo deck, lidar puck. Returns (body, puck) in world metres."""
    rng = np.random.default_rng(3)
    L, W, Hb = 0.55 * k, 0.38 * k, 0.27 * k
    pts = []
    n = 1500
    x, y = rng.uniform(-L, L, n), rng.uniform(-W, W, n)
    pts.append(np.c_[x, y, np.full(n, Hb)])
    n = 1800
    x, y = rng.uniform(-L, L, n), rng.uniform(-W, W, n)
    pts.append(np.c_[x, y, np.full(n, 0.2 * Hb)])
    for sx in (-L, L):
        n = 1000
        pts.append(np.c_[np.full(n, sx), rng.uniform(-W, W, n), rng.uniform(0.2 * Hb, Hb, n)])
    for sy in (-W, W):
        n = 1600
        pts.append(np.c_[rng.uniform(-L, L, n), np.full(n, sy), rng.uniform(0.2 * Hb, Hb, n)])
    n = 300
    pts.append(np.c_[np.full(n, L * 1.0), rng.uniform(-W, W, n), np.full(n, Hb * 0.55)])
    body = np.vstack(pts)
    th = rng.uniform(0, 2 * np.pi, 600)
    rr = 0.1 * k * np.sqrt(rng.uniform(0, 1, 600))
    zz = rng.uniform(Hb, Hb + 0.12 * k, 600)
    puck = np.c_[0.42 * L + rr * np.cos(th), rr * np.sin(th), zz]
    c, s = math.cos(pose[2]), math.sin(pose[2])
    rot = lambda p: np.c_[p[:, 0] * c - p[:, 1] * s + pose[0], p[:, 0] * s + p[:, 1] * c + pose[1], p[:, 2]]
    return rot(body), rot(puck)


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


def scene():
    walls, tp, ap, path = load()
    n = len(walls)
    zs = np.arange(0.12, WALL_H, COL_STEP)
    cols = np.c_[np.repeat(walls, len(zs), 0), np.tile(zs, n)]
    base = np.repeat(np.arange(n), len(zs))
    idx, ang, rng_, near = cast(walls, tp)
    lit_mask = np.isin(base, idx)
    ang_of = np.full(n, np.nan)
    ang_of[idx] = ang
    dyaw = ap[2] - tp[2]
    c, s = math.cos(dyaw), math.sin(dyaw)
    rel = walls[idx] - tp[:2]
    mis = np.c_[rel[:, 0] * c - rel[:, 1] * s + ap[0], rel[:, 0] * s + rel[:, 1] * c + ap[1], np.full(len(idx), LIDAR_Z)]
    body_t, puck_t = amr(tp)
    body_a, puck_a = amr(ap)
    gap = np.linspace(0, 1, int(np.hypot(*(ap[:2] - tp[:2])) / 0.45))[:, None]
    gapline = np.c_[tp[:2] + gap * (ap[:2] - tp[:2]), np.full(len(gap), 0.05)]
    rings = []
    for r in (6.0, 12.0, 18.0):
        th = np.linspace(0, 2 * np.pi, int(2 * np.pi * r / 0.45), endpoint=False)
        rings.append(np.c_[tp[0] + r * np.cos(th), tp[1] + r * np.sin(th), np.zeros(len(th))])
    trail = np.c_[path, np.zeros(len(path))]
    return dict(
        cols=cols, lit=lit_mask, col_ang=ang_of[base], mis=mis, mis_ang=ang, tp=tp, ap=ap,
        body_t=body_t, puck_t=puck_t, body_a=body_a, puck_a=puck_a, gap=gapline, trail=trail, rings=np.vstack(rings),
        near=near,
    )


def beam(sc, head):
    """Dots along the ray at sensor angle head, true pose and the same ray at the reported pose."""
    b = int(round(head / AZ_STEP)) % len(sc["near"])
    r = sc["near"][b] if np.isfinite(sc["near"][b]) else MAX_RANGE
    t = np.arange(0.8, r, 0.35)
    out = []
    for p in (sc["tp"], sc["ap"]):
        a = p[2] + math.radians(head)
        out.append(np.c_[p[0] + t * math.cos(a), p[1] + t * math.sin(a), np.full(len(t), LIDAR_Z)])
    return out


def groups(sc, cam, head=None, tau=110.0, floor=0.0):
    zt = np.clip(sc["cols"][:, 2] / WALL_H, 0, 1)
    grey = GREY + (LIGHT - GREY) * zt[:, None]
    wf = fade(cam, sc["cols"], 8, 90, 0.7)
    lit = sc["lit"]
    if head is None:
        wi, mi = np.ones(lit.sum()), np.ones(len(sc["mis"]))
    else:
        f = lambda a: floor + (1 - floor) * np.exp(-((head - a) % 360) / tau)
        wi, mi = f(sc["col_ang"][lit]), f(sc["mis_ang"])
    lc = sc["cols"][lit]
    lit_w = fade(cam, lc, 8, 90, 0.5) * wi
    g = [
        (sc["cols"], grey, 2.5, wf * 0.8, 1.0),
        (sc["rings"], ACCENT, 1.8, fade(cam, sc["rings"], 10, 80, 0.7) * 0.55, 1.0),
        (sc["trail"], LIGHT, 1.3, np.full(len(sc["trail"]), 0.45), 1.0),
        (sc["gap"], ORANGE, 2.6, np.full(len(sc["gap"]), 0.9), 1.5),
        (lc, ACCENT, 3.0, np.clip(lit_w * 1.25, 0, 1), 1.6),
        (sc["mis"], ORANGE, 2.6, fade(cam, sc["mis"], 8, 90, 0.5) * mi, 1.4),
        (sc["body_a"], ORANGE, 1.1, np.full(len(sc["body_a"]), 0.55), 0.9),
        (sc["puck_a"], ORANGE, 1.4, np.ones(len(sc["puck_a"])), 1.1),
        (sc["body_t"], LIGHT, 1.1, np.ones(len(sc["body_t"])), 0.9),
        (sc["puck_t"], ACCENT, 1.5, np.ones(len(sc["puck_t"])), 1.2),
    ]
    if head is not None:
        bt, ba = beam(sc, head)
        g += [(bt, ACCENT, 2.0, np.full(len(bt), 0.9), 1.2), (ba, ORANGE, 2.0, np.full(len(ba), 0.9), 1.2)]
    return g


def main():
    top = "--view" in sys.argv and sys.argv[sys.argv.index("--view") + 1] == "top"
    sc = scene()
    mid = (sc["tp"][:2] + sc["ap"][:2]) / 2
    v = sc["ap"][:2] - sc["tp"][:2]
    v /= np.linalg.norm(v)
    perp = np.array([v[1], -v[0]])
    if top:
        cp = mid + perp * 9
        cam = cam_persp((cp[0], cp[1], 58), (mid[0], mid[1], 0.8), 980, oy=0.38)
    else:
        cp = mid + perp * 24
        cam = cam_persp((cp[0], cp[1], 27), (mid[0], mid[1], 0.5), 980, oy=0.38)
    still = ALT_OUT / "decipher-alt.webp" if top else OUT / "stata-plate.webp"
    anim = ALT_OUT / "decipher-alt-anim.webp" if top else OUT / "stata-anim.webp"
    still.parent.mkdir(parents=True, exist_ok=True)
    print(len(sc["cols"]), "wall dots,", sc["lit"].sum(), "lit")
    render(cam, groups(sc, cam, head=200.0, floor=0.35)).save(still, "WEBP", quality=84, method=6)
    n, frames = 36, []
    for i in range(n):
        frames.append(render(cam, groups(sc, cam, head=i * 360 / n, floor=0.0), 600))
    frames[0].save(anim, "WEBP", save_all=True, append_images=frames[1:], duration=80, loop=0, quality=30, method=6)
    for f in (still, anim):
        print(f, f.stat().st_size, "B")


if __name__ == "__main__":
    if "--sample" in sys.argv:
        sample(sys.argv[sys.argv.index("--sample") + 1])
    else:
        main()
