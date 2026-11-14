#!/usr/bin/env python3
"""Pose B v3, the homepage Robotics figure (pose C, scripts/make-loomo-overlay.py,
is the earlier one). The full-frame halftone of
make-photo-plates.py loomo('wide') edge to edge, with
  - the real walking legs (hips, knees, ankles with score > 2; the follow clip
    has no upper body in frame) drawn as limbs with joint dots, and light dots
    along those limbs instead of a lit mask;
  - a drawn depth cone from Loomo's head toward the legs with a near-to-far sweep;
  - an input-view panel with the full 17-point skeleton, and a faint
    frustum from Loomo's head to it.
Host tooling (numpy, Pillow, opencv, ffmpeg); needs scripts/assets/loomo/inset-pose.json
(scripts/make-loomo-inset-pose.py). Writes loomo-pose.webp (1600x1000) and
loomo-pose-anim.webp (576x360) to ~/Perso/site-review/files (--out public/projects/autonomous-mobile-robot for the site).

    python3 scripts/make-loomo-pose.py [--out DIR] [--q N]

REAL
  Base photo, mapping and leg and forearm keypoints: as in make-loomo-overlay.py
  (hero-poster.jpg is frame 48 of scripts/assets/loomo/hero.webm, a pure scale of
  600/720, verified; keypoints from scripts/assets/loomo/pose.json shifted by
  the measured camera pan against frame 48).
  Panel: the project's video from frame 85 (15 fps) is a screen recording of its
  own pose pipeline, with the Input view (a camera image of a person walking)
  at x 15-353, y 80-333 of the 720x406 frame. The panel is that Input view, a
  140x160 px region around the person, frames 98-121, in grey dots; its
  burned-in overlay colours are painted out first. The skeleton on it is the
  17 COCO keypoints of torchvision keypointrcnn_resnet50_fpn
  (KeypointRCNN_ResNet50_FPN_Weights.COCO_V1) run on that view
  (scripts/assets/loomo/inset-pose.json), smoothed over 3 frames; only keypoints
  with score > 2 are drawn. PifPaf is only the drawing style, not the model.
DRAWN
  The perspective lattice of dots on the empty floor and top band (fill_planes).
  The depth view (Intel RealSense ZR300 active-IR stereo camera; the Loomo has no
  lidar; we have no depth frame from the robot): the cone, the sweep, the lit
  dots on the floor and along the limbs, and the frustum to the panel. The base
  legs stay at frame 48's pose while the drawn limbs walk. No number is implied.
  Sensor sources:
    https://ap-en.segway.com/product-info/loomo-personal-robot.html
    https://realsense.intel.com/loomo/
    https://developer.segwayrobotics.com/developer/documents/segway-robot-overview.html
"""
import importlib.util
import json
import subprocess
import sys
import tempfile
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).parent.parent


def load(name):
    spec = importlib.util.spec_from_file_location(name.replace("-", "_"), ROOT / "scripts" / f"{name}.py")
    m = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m)
    return m


A = load("make-loomo-anim")
P = load("make-photo-plates")
INSET = load("make-loomo-inset-pose")

REF = 48
IDX = list(range(30, 66))
PIDX = list(range(98, 134))
KX, KY = 600 / 720 * 1000 / 338, 1000 / 406
X0 = 175
HEAD = (405 * 1000 / 338 - X0, 181 * 1000 / 338)
LIMBS = [(11, 12), (11, 13), (13, 15), (12, 14), (14, 16)]
JOINTS = [11, 12, 13, 14, 15, 16]
FULL = [(5, 7), (7, 9), (6, 8), (8, 10), (5, 6), (11, 12), (5, 11), (6, 12), (11, 13), (13, 15), (12, 14), (14, 16), (0, 1), (0, 2), (1, 3), (2, 4), (0, 5), (0, 6)]
SS = 2
BLUE, PALE = A.ACCENT, A.PALE
PANEL = (1160, 16, 1562, 596)
CROP = (127, 25, 223, 163)


def clean_panel(crop):
    # stronger than the pose-side clean: also the faint green detector box
    hsv = cv2.cvtColor(crop, cv2.COLOR_BGR2HSV)
    h, sat, v = hsv[..., 0].astype(int), hsv[..., 1], hsv[..., 2]
    ov = (sat > 60) & (v > 80) & (((h > 35) & (h < 90)) | ((sat > 140) & (((h > 98) & (h < 130)) | ((h > 8) & (h < 22)))))
    ov = cv2.dilate(ov.astype(np.uint8), np.ones((3, 3), np.uint8), iterations=2)
    return cv2.inpaint(crop, ov, 4, cv2.INPAINT_TELEA)


def panel_frames():
    d = json.loads((ROOT / "scripts/assets/loomo/inset-pose.json").read_text())["frames"]
    ims, kps = [], []
    with tempfile.TemporaryDirectory() as tmp:
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(A.VIDEO), "-vf", "fps=15", "-frames:v", str(max(PIDX)), f"{tmp}/f%04d.png"], check=True)
        for i in PIDX:
            im = cv2.imread(f"{tmp}/f{i:04d}.png")[80:334, 15:354]
            im = clean_panel(im)
            c = CROP
            ims.append(cv2.cvtColor(im[c[1]:c[3], c[0]:c[2]], cv2.COLOR_BGR2GRAY))
            det = max(d[f"{i:04d}"], key=lambda x: x["score"])
            kps.append(det["kp"])
    kp = np.array(kps, float)
    kp[..., :2] = A.smooth(kp[..., :2])
    kp[..., 0] -= CROP[0]
    kp[..., 1] -= CROP[1]
    return ims, kp


def fill_planes(base):
    """Where the halftone leaves flat ground colour (the floor under and right of the robot, the dark
    band along the top), continue the ground and ceiling planes as depth-view dots: a perspective
    lattice, rows spaced by depth, dots shrinking toward the horizon. Drawn only in the lower-right floor and the top band."""
    lum = cv2.GaussianBlur(np.asarray(base.convert("L"), np.float32), (0, 0), 9)
    empty = lum < 44
    img = base.copy()
    d = ImageDraw.Draw(img)
    horizon = 205 * KY
    vp = 640.0
    col = (118, 134, 166)

    def lattice(sign, y_from, y_to, keep):
        k = 0
        while True:
            u = 55 * 1.1 ** k
            y = y_from + sign * (u - 55)
            if (sign > 0 and y > y_to) or (sign < 0 and y < y_to) or k > 70:
                break
            k += 1
            step = max(14.0, 0.17 * u)
            r = float(np.clip(1.3 + 0.0065 * abs(y - y_from), 1.4, 4.2))
            j0 = int(-vp / step) - 1
            for j in range(j0, int((1600 - vp) / step) + 2):
                x = vp + j * step
                if 0 <= x < 1600 and 0 <= y < 1000 and keep(int(x), int(y)):
                    d.ellipse([x - r, y - r, x + r, y + r], fill=col)

    lower_right = lambda x, y: (x > 1215 and y > 610) or (y > 880 and x > 760)
    lattice(1, horizon + 40, 1000, lambda x, y: y > horizon and lower_right(x, y) and lum[y, x] < 60)
    lattice(-1, 420, 0, lambda x, y: y < 90 and x < 1150 and lum[y, x] < 60)
    return img


def main():
    out = Path(sys.argv[sys.argv.index("--out") + 1]) if "--out" in sys.argv else Path.home() / "Perso/site-review/files"
    q = int(sys.argv[sys.argv.index("--q") + 1]) if "--q" in sys.argv else 30
    pose = json.loads(A.POSE.read_text())["frames"]
    with tempfile.TemporaryDirectory() as tmp:
        frames = A.load_frames(tmp)
        _, shifts = A.stabilise(frames, pose, REF)
    kp = np.array([pose[f"{i:04d}"][0]["kp"] for i in IDX], float)
    for n, i in enumerate(IDX):
        kp[n, :, 0] -= shifts[i][0]
        kp[n, :, 1] -= shifts[i][1]
    kp[..., :2] = A.smooth(kp[..., :2])
    kp[..., 0] = kp[..., 0] * KX - X0
    kp[..., 1] = kp[..., 1] * KY
    pims, pkp = panel_frames()
    px0, py0, px1, py1 = PANEL
    pk = (px1 - px0) / (CROP[2] - CROP[0])

    base = fill_planes(P.loomo("wide"))
    rng = np.random.default_rng(5)
    n = 230
    i, j = np.meshgrid(np.arange(-n, n), np.arange(-n, n))
    u, v = i.ravel() * 9.0, j.ravel() * 9.0
    ca, sa = np.cos(0.38), np.sin(0.38)
    gx = u * ca - v * sa + 800 + rng.uniform(-1.6, 1.6, u.size)
    gy = u * sa + v * ca + 500 + rng.uniform(-1.6, 1.6, u.size)
    ok = (gx >= 0) & (gx < 1600) & (gy >= 0) & (gy < 1000)
    gx, gy = gx[ok], gy[ok]
    pick = rng.uniform(size=gx.size)
    horizon = 205 * KY
    hx, hy = HEAD

    pg = np.mgrid[0:1, 0:1]
    pn = int(max(px1 - px0, py1 - py0) * 1.5 / 5.5)
    pi_, pj_ = np.meshgrid(np.arange(-pn, pn), np.arange(-pn, pn))
    pu, pv = pi_.ravel() * 5.5, pj_.ravel() * 5.5
    qx = pu * ca - pv * sa + (px0 + px1) / 2 + rng.uniform(-1, 1, pu.size)
    qy = pu * sa + pv * ca + (py0 + py1) / 2 + rng.uniform(-1, 1, pu.size)
    pok = (qx >= px0) & (qx < px1) & (qy >= py0) & (qy < py1)
    qx, qy = qx[pok], qy[pok]
    qjit = rng.uniform(0.88, 1.08, qx.size)

    N = len(IDX)
    pale, acc = tuple(int(c) for c in PALE), tuple(int(c) for c in BLUE)

    def draw(f, t, pf):
        k = kp[f]
        conf = [jx for jx in JOINTS if k[jx, 2] > A.CONF]
        legs = [jx for jx in conf if jx >= 11]
        tx, ty = k[legs, 0].mean(), k[legs, 1].mean()
        axis = np.arctan2(ty - hy, tx - hx)
        half = np.radians(27)
        reach = np.hypot(tx - hx, ty - hy) * 1.15
        rel = (np.arctan2(gy - hy, gx - hx) - axis + np.pi) % (2 * np.pi) - np.pi
        dist = np.hypot(gx - hx, gy - hy)
        incone = (np.abs(rel) < half) & (dist < reach) & (dist > 40)
        env = (1.0 if t < 0.84 else max(0.0, (1 - t) / 0.16)) * A.ease(t / 0.03)
        rho = 40 + (reach - 40) * A.ease(t / 0.74)
        lit = np.exp(-np.clip(rho - dist, 0, None) / (0.3 * reach)) * (dist <= rho) * incone * env
        front = np.exp(-(((dist - rho) / (0.025 * reach)) ** 2)) * incone * (t < 0.78) * env
        gate = np.clip(lit * 2.2 + front, 0, 1)

        near = np.zeros(gx.size, bool)
        for a, b in LIMBS:
            if k[a, 2] > A.CONF and k[b, 2] > A.CONF:
                ax, ay, bx, by = k[a, 0], k[a, 1], k[b, 0], k[b, 1]
                dx, dy = bx - ax, by - ay
                s = np.clip(((gx - ax) * dx + (gy - ay) * dy) / (dx * dx + dy * dy), 0, 1)
                near |= np.hypot(gx - (ax + s * dx), gy - (ay + s * dy)) < 15
        floor = (gy > horizon) & incone & (pick < 0.2)
        sel = (gate > 0.05) & ((near & (pick < 0.7)) | floor)

        img = base.copy().convert("RGBA")
        over = Image.new("RGBA", (1600 * SS, 1000 * SS), (0, 0, 0, 0))
        od = ImageDraw.Draw(over)
        for x, y, g_ in zip(gx[sel], gy[sel], gate[sel]):
            r = 3.4 * (0.6 + 0.4 * g_) * SS
            od.ellipse([x * SS - r, y * SS - r, x * SS + r, y * SS + r], fill=(*acc, int(235 * min(1, g_ * 1.5))))
        edge = (*acc, int(150 * env))
        for sgn in (-1, 1):
            ex, ey = hx + reach * np.cos(axis + sgn * half), hy + reach * np.sin(axis + sgn * half)
            od.line([hx * SS, hy * SS, ex * SS, ey * SS], fill=edge, width=3)

        pa = A.ease((t - 0.08) / 0.12) * env
        ba = int(255 * pa)
        if ba > 0:
            for cy_ in (py0, py1):
                steps = 40
                for s_ in range(0, steps, 2):
                    a_, b_ = s_ / steps, (s_ + 1) / steps
                    od.line([(hx + (px0 - hx) * a_) * SS, (hy + (cy_ - hy) * a_) * SS, (hx + (px0 - hx) * b_) * SS, (hy + (cy_ - hy) * b_) * SS], fill=(*pale, int(110 * pa)), width=3)
            od.rectangle([px0 * SS, py0 * SS, px1 * SS, py1 * SS], fill=(14, 16, 22, ba), outline=(*acc, int(102 * pa)), width=2)

        t_hit = {}
        for jx in conf:
            p = np.clip((np.hypot(k[jx, 0] - hx, k[jx, 1] - hy) - 40) / (reach - 40), 0, 0.999)
            t_hit[jx] = 0.74 * (1 - (1 - p) ** (1 / 3)) + 0.02
        shown = {jx for jx, th in t_hit.items() if t >= th}
        a_env = int(255 * env)
        for a, b in LIMBS:
            if a in shown and b in shown:
                od.line([k[a, 0] * SS, k[a, 1] * SS, k[b, 0] * SS, k[b, 1] * SS], fill=(*(acc if a % 2 else pale), a_env), width=4 * SS)
        for jx in shown:
            x, y = k[jx, 0] * SS, k[jx, 1] * SS
            age = (t - t_hit[jx]) / 0.09
            if 0 <= age < 1:
                R = 8 * SS * (1.5 + 2.2 * age)
                od.ellipse([x - R, y - R, x + R, y + R], outline=(*pale, int(a_env * (1 - age))), width=3)
            od.ellipse([x - 8 * SS, y - 8 * SS, x + 8 * SS, y + 8 * SS], fill=(255, 255, 255, a_env), outline=(*(acc if jx % 2 else pale), a_env), width=4)

        if ba > 0:
            g = cv2.GaussianBlur(pims[pf].astype(np.float32) / 255, (0, 0), 0.8)
            lo, hi = np.percentile(g, [3, 99])
            g = np.clip((g - lo) / (hi - lo), 0, 1) ** 1.3
            gxp = np.clip(((qx - px0) / pk).astype(int), 0, g.shape[1] - 1)
            gyp = np.clip(((qy - py0) / pk).astype(int), 0, g.shape[0] - 1)
            tone = np.round(g[gyp, gxp] * 9) / 9 * 0.9
            for x, y, tn, jt in zip(qx, qy, tone, qjit):
                if tn > 0.05:
                    r = 5.5 * 0.62 * np.sqrt(tn) * jt * SS
                    c = tuple(int(120 + 30 * tn) for _ in range(3))
                    od.ellipse([x * SS - r, y * SS - r, x * SS + r, y * SS + r], fill=(*c, ba))
            pkk = pkp[pf]
            pts = {jx: (px0 + pkk[jx, 0] * pk, py0 + pkk[jx, 1] * pk) for jx in range(17) if pkk[jx, 2] > A.CONF}
            order = sorted(pts, key=lambda jx: pts[jx][1])
            for rank, jx in enumerate(order):
                pts[jx] = pts[jx] + (0.28 + 0.46 * rank / max(len(order) - 1, 1),)
            shownp = {jx for jx in pts if t >= pts[jx][2]}
            for a, b in FULL:
                if a in shownp and b in shownp:
                    od.line([pts[a][0] * SS, pts[a][1] * SS, pts[b][0] * SS, pts[b][1] * SS], fill=(*(acc if a % 2 else pale), ba), width=4 * SS)
            for jx in shownp:
                x, y = pts[jx][0] * SS, pts[jx][1] * SS
                od.ellipse([x - 7 * SS, y - 7 * SS, x + 7 * SS, y + 7 * SS], fill=(255, 255, 255, ba), outline=(*(acc if jx % 2 else pale), ba), width=4)
        return Image.alpha_composite(img, over.resize((1600, 1000), Image.LANCZOS)).convert("RGB")

    out.mkdir(parents=True, exist_ok=True)
    frames_out = [draw(f, f / N, f) for f in range(N)]
    still = draw(IDX.index(REF), 0.8, 19)
    still.save(out / "loomo-pose.webp", "WEBP", quality=72, method=6)
    loop = [im.resize((576, 360), Image.LANCZOS) for im in frames_out]
    loop[0].save(out / "loomo-pose-anim.webp", "WEBP", save_all=True, append_images=loop[1:], duration=80, loop=0, quality=q, method=6)
    for nme in ("loomo-pose.webp", "loomo-pose-anim.webp"):
        print(nme, (out / nme).stat().st_size)

if __name__ == "__main__":
    main()
