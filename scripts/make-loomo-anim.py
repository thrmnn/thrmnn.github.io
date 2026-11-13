#!/usr/bin/env python3
"""Loomo pictures: the robot's camera sensing, in the house point-cloud look
(grey halftone scene fading out, blue subject dots; same family as the Roboat
loop in scripts/make-roboat-plate.py). Host tooling (numpy, Pillow, scipy,
opencv, ffmpeg), run by hand; outputs committed.

    python3 scripts/make-loomo-anim.py            # wide still + loop, card still + loop
    python3 scripts/make-loomo-anim.py --preview  # also the contact sheet in ~/Perso/site-review/files

Writes public/projects/autonomous-mobile-robot/
  loomo-wide.webp, loomo-wide-anim.webp   homepage Robotics figure (1600x1000 still, 640x400 loop)
  card-plate.webp, card-anim.webp         project card (1200x1200 still, 480x480 loop)

REAL
  Frames: the project's own video of a Segway Loomo following a person at EPFL
  (scripts/assets/loomo/hero.webm, 720x406; removed from public/ in 6e81b05).
  Frames 1-90 at 15 fps (ffmpeg -vf fps=15); a run of consecutive frames inside
  the follow sequence is the loop's scene (the run whose last frame is closest
  to its first; the final frames dissolve into the first so the loop closes).
  Pose: scripts/assets/loomo/pose.json, torchvision keypointrcnn_resnet50_fpn
  (KeypointRCNN_ResNet50_FPN_Weights.COCO_V1) run on those frames, 17 COCO
  keypoints [x, y, score] per frame, smoothed over 3 frames. The head and
  shoulders are out of frame, so only keypoints with score > 2 are drawn, and
  only limbs between two of them; nothing is extrapolated. PifPaf is only the
  drawing style (a keypoint skeleton in limb colours), not the model. The
  tracker box is the same detector's box for the person; it is not the Stark
  tracker's output.
  The robot's blue silhouette is a dark-pixel threshold of the video frame, the
  person's mask is OpenCV GrabCut inside that detector box.

DRAWN
  The depth view. The Loomo senses depth with an Intel RealSense ZR300, an
  active-infrared stereo camera (two IR cameras and a projector), next to its
  1080p camera and ultrasonic and infrared range sensors; it has no lidar. We
  have no depth frame from the robot, so the field-of-view cone from the
  robot's head, the sweep, the floor rings and which dots light up are all
  drawn: they follow the person's mask and the floor, not a measurement. The
  cone's opening angle is chosen for legibility, not the camera's field of
  view. The motion is drawing order only (sweep, joints appearing as the
  sweep reaches them, the box settling); no number is implied.
  Sources for the sensor suite:
    https://ap-en.segway.com/product-info/loomo-personal-robot.html
    https://realsense.intel.com/loomo/
    https://developer.segwayrobotics.com/developer/documents/segway-robot-overview.html
"""
import json
import subprocess
import sys
import tempfile
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as ndi

ROOT = Path(__file__).parent.parent
VIDEO = ROOT / "scripts/assets/loomo/hero.webm"
POSE = ROOT / "scripts/assets/loomo/pose.json"
OUT = Path.home() / "Perso/site-review/files"  # alternative B, not shipped

BG = (14, 16, 22)
GREY = np.array((120, 124, 134), float)
LIGHT = np.array((150, 156, 168), float)
ACCENT = np.array((86, 140, 246), float)
PALE = np.array((160, 196, 255), float)
SS = 2
FIRST, LAST = 7, 82
N_LOOP = 24
CONF = 2.0
LIMBS = [(5, 7), (7, 9), (6, 8), (8, 10), (5, 6), (11, 12), (5, 11), (6, 12), (11, 13), (13, 15), (12, 14), (14, 16)]
LEFT = {5, 7, 9, 11, 13, 15}  # drawn blue; the right side is pale blue


def load_frames(tmp):
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(VIDEO), "-vf", "fps=15", "-frames:v", "90", f"{tmp}/f%04d.png"], check=True)
    return {i: cv2.imread(f"{tmp}/f{i:04d}.png") for i in range(FIRST, LAST + 1)}


def stabilise(frames, pose, ref_i=FIRST):
    """The camera is hand held and pans about 25 px over the clip. Track the background
    (features outside the person's box and the robot) against the first frame and shift
    every frame, and its keypoints and box, back by the median motion."""
    ref = cv2.cvtColor(frames[ref_i], cv2.COLOR_BGR2GRAY)
    out, shifts = {}, {}
    for i, f in frames.items():
        gray = cv2.cvtColor(f, cv2.COLOR_BGR2GRAY)
        m = np.full(gray.shape, 255, np.uint8)
        x1, y1, x2, y2 = [int(v) for v in pose[f"{i:04d}"][0]["box"]]
        m[:, max(x1 - 20, 0): x2 + 20] = 0
        m[150:, 360:] = 0
        pts = cv2.goodFeaturesToTrack(ref, 300, 0.01, 8, mask=m)
        nxt, st, _ = cv2.calcOpticalFlowPyrLK(ref, gray, pts, None)
        d = (nxt - pts)[st.ravel() == 1].reshape(-1, 2)
        dx, dy = np.median(d, axis=0)
        shifts[i] = (dx, dy)
        out[i] = cv2.warpAffine(f, np.float32([[1, 0, -dx], [0, 1, -dy]]), (f.shape[1], f.shape[0]), borderMode=cv2.BORDER_REPLICATE)
    return out, shifts


def pick_window(frames):
    small = {i: cv2.resize(cv2.cvtColor(f, cv2.COLOR_BGR2GRAY), (90, 51)).astype(float) for i, f in frames.items()}
    best = min(range(FIRST, 15), key=lambda s: np.abs(small[s] - small[s + N_LOOP - 1]).mean())
    return list(range(best, best + N_LOOP))


def smooth(a):
    a = np.array(a, float)
    k = np.pad(a, [(1, 1)] + [(0, 0)] * (a.ndim - 1), mode="edge")
    return (k[:-2] + k[1:-1] + k[2:]) / 3


def analyse(frames, idx, pose, shifts):
    kp = np.array([pose[f"{i:04d}"][0]["kp"] for i in idx], float)
    box = np.array([pose[f"{i:04d}"][0]["box"] for i in idx], float)
    for n, i in enumerate(idx):
        dx, dy = shifts[i]
        kp[n, :, 0] -= dx
        kp[n, :, 1] -= dy
        box[n] -= (dx, dy, dx, dy)
    kp[..., :2] = smooth(kp[..., :2])
    box = smooth(box)
    out = []
    for n, i in enumerate(idx):
        im = frames[i]
        g = cv2.cvtColor(im, cv2.COLOR_BGR2GRAY) / 255.0
        reg = np.zeros(g.shape, bool)
        reg[150:400, 375:620] = True
        m = ndi.binary_closing((g < 0.2) & reg, iterations=3)
        lab, k = ndi.label(m)
        m = lab == 1 + int(np.argmax(ndi.sum(m, lab, range(1, k + 1))))
        m = ndi.binary_fill_holes(m)
        ys, xs = np.nonzero(m)
        base_x = np.median(xs[ys > np.percentile(ys, 70)])
        wide = np.abs(np.arange(g.shape[1])[None, :] - base_x) < np.where(np.arange(g.shape[0])[:, None] > ys.max() - 75, 120, 36)
        m &= wide
        m = ndi.binary_closing(m, structure=np.ones((11, 3), bool), iterations=2)
        ys, xs = np.nonzero(m)
        top = ys < ys.min() + 25
        head = (xs[top].mean(), ys[top].mean() + 10)
        x1, y1, x2, y2 = [int(v) for v in box[n]]
        x1, y1 = max(x1, 0), max(y1, 0)
        gc = np.zeros(g.shape, np.uint8)
        cv2.grabCut(im, gc, (x1, y1, x2 - x1, y2 - y1), np.zeros((1, 65)), np.zeros((1, 65)), 4, cv2.GC_INIT_WITH_RECT)
        person = (gc == 1) | (gc == 3)
        person[:, :x1] = person[:, x2:] = False
        lab, k = ndi.label(person)
        person = lab == 1 + int(np.argmax(ndi.sum(person, lab, range(1, k + 1))))
        out.append(dict(g=g, im=im, robot=m, person=person, head=head, box=box[n], kp=kp[n]))
    bg = np.median([f["g"] for f in out], axis=0)
    for f in out:
        fg = ndi.binary_dilation(f["person"] | f["robot"], iterations=6)
        f["bg"], f["fg"] = bg, fg
    return out


class View:
    """Video pixels to a canvas (scale k, offset x0, y0), with a fixed jittered dot grid
    so the dots do not shimmer from frame to frame, and an elliptical fade."""

    def __init__(self, W, H, k, x0, y0, pitch, fade, angle=0.38, seed=3):
        self.args = (W, H, k, x0, y0, pitch, fade)
        self.W, self.H, self.k, self.x0, self.y0 = W, H, k, x0, y0
        rng = np.random.default_rng(seed)
        n = int(max(W, H) * 1.5 / pitch)
        i, j = np.meshgrid(np.arange(-n, n), np.arange(-n, n))
        u, v = i.ravel() * pitch, j.ravel() * pitch
        ca, sa = np.cos(angle), np.sin(angle)
        x = u * ca - v * sa + W / 2 + rng.uniform(-0.18, 0.18, u.size) * pitch
        y = u * sa + v * ca + H / 2 + rng.uniform(-0.18, 0.18, u.size) * pitch
        jit = rng.uniform(0.88, 1.08, u.size)
        keep = (x >= 0) & (x < W) & (y >= 0) & (y < H)
        self.X, self.Y, self.jit = x[keep], y[keep], jit[keep]
        self.ix, self.iy = self.X.astype(int), self.Y.astype(int)
        self.rmax = pitch * 0.62
        yy, xx = np.mgrid[0:H, 0:W]
        cx, cy, rx, ry = fade
        d = np.sqrt(((xx - cx) / rx) ** 2 + ((yy - cy) / ry) ** 2)
        self.fade = np.clip(1.12 - d, 0, 1) ** 0.8

    def scaled(self, f, pitch):
        """The same framing at f times the size, with its own dot pitch (the loops are smaller than the stills)."""
        a = self.args
        return View(round(a[0] * f), round(a[1] * f), a[2] * f, a[3] * f, a[4] * f, pitch, tuple(v * f for v in a[6]))

    def pt(self, x, y):
        return x * self.k - self.x0, y * self.k - self.y0

    def warp(self, a, const=False):
        M = np.array([[self.k, 0, -self.x0], [0, self.k, -self.y0]], np.float32)
        return cv2.warpAffine(a.astype(np.float32), M, (self.W, self.H), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT if const else cv2.BORDER_REPLICATE)


def ease(x):
    return 1 - (1 - np.clip(x, 0, 1)) ** 3


def render(fr, first, blend, t, V):
    """t in [0, 1) is the loop phase; the last frames dissolve the scene into the first frame's."""
    blur = lambda a: cv2.GaussianBlur(a.astype(np.float32), (0, 0), 1.6)
    scene = np.where(fr["fg"], blur(fr["g"]), blur(fr["bg"]))
    if blend > 0:
        scene = scene * (1 - blend) + np.where(first["fg"], blur(first["g"]), blur(first["bg"])) * blend
    g = V.warp(scene)
    lo, hi = np.percentile(g, [4, 98])
    g = np.clip((g - lo) / (hi - lo), 0, 1) ** 1.5
    valid = cv2.GaussianBlur(V.warp(np.ones_like(fr["g"]), const=True), (0, 0), 3)
    robot = cv2.GaussianBlur(V.warp(fr["robot"]), (0, 0), 2) > 0.5
    person = cv2.GaussianBlur(V.warp(fr["person"]), (0, 0), 2) > 0.5
    hx, hy = V.pt(*fr["head"])
    sc = V.W / 1600

    kp = fr["kp"]
    ok = kp[:, 2] > CONF
    pts = np.array([V.pt(x, y) for x, y, _ in kp])
    hip_y = pts[[j for j in (11, 12) if ok[j]], 1].mean() if (ok[11] or ok[12]) else V.pt(0, 120)[1]
    X, Y = V.X, V.Y
    on_person = person[V.iy, V.ix]
    on_robot = robot[V.iy, V.ix]
    legs = on_person & (Y > hip_y)
    tx, ty = X[legs].mean(), Y[legs].mean()
    axis = np.arctan2(ty - hy, tx - hx)
    half = np.radians(27)
    reach = np.hypot(tx - hx, ty - hy) * 1.15

    rel = (np.arctan2(Y - hy, X - hx) - axis + np.pi) % (2 * np.pi) - np.pi
    dist = np.hypot(X - hx, Y - hy)
    incone = (np.abs(rel) < half) & (dist < reach) & (dist > 30 * sc)

    env = 1.0 if t < 0.84 else max(0.0, (1.0 - t) / 0.16)
    env *= ease(t / 0.03)
    p = ease(t / 0.74)
    rho = 40 * sc + (reach - 40 * sc) * p
    tau = 0.3 * reach
    lit = np.exp(-np.clip(rho - dist, 0, None) / tau) * (dist <= rho) * incone * env
    front = np.exp(-(((dist - rho) / (0.025 * reach)) ** 2)) * incone * (t < 0.78) * env

    sx, sy = hx - tx, hy - ty
    s = np.clip(((X - tx) * sx + (Y - ty) * sy) / (sx * sx + sy * sy), 0, 1)
    d_line = np.hypot(X - (tx + s * sx), Y - (ty + s * sy))
    calm = 0.35 + 0.65 * np.clip(1 - d_line / (0.55 * V.H), 0, 1) ** 1.2

    floor = (Y > V.pt(0, 205)[1]) & ~on_person & ~on_robot
    ret_floor = floor & incone & (np.modf(V.jit * 997.0)[0] < 0.3)
    ret_leg = legs & incone

    gv = g[V.iy, V.ix]
    vf = V.fade[V.iy, V.ix] * valid[V.iy, V.ix]
    tone = gv * vf * 0.6 * calm
    tone = np.where(on_person, np.maximum(tone, (0.2 + 0.4 * gv) * vf * 0.9), tone)
    tone = np.where(on_robot, 0.5 + 0.45 * gv, tone)
    gate = np.clip(lit * 2.2 + front, 0, 1)
    tone = np.maximum(tone, np.where(ret_floor, 0.4 * gate, 0))
    tone = np.where(ret_leg, np.minimum(tone * (1 + 0.6 * gate) + 0.15 * gate, 1), tone)
    tone = np.round(np.clip(tone, 0, 1) * 9) / 9

    grey = GREY[None] * (1 - tone[:, None]) + LIGHT[None] * tone[:, None]
    mixb = np.clip(on_robot * 1.0 + ret_leg * gate * 0.5 + ret_floor * gate * 0.95, 0, 1)
    blue = ACCENT[None] * (1 - 0.3 * front[:, None]) + PALE[None] * 0.3 * front[:, None]
    col = grey * (1 - mixb[:, None]) + blue * mixb[:, None]
    r = V.rmax * np.sqrt(tone) * V.jit
    keep = tone > 0.03

    img = Image.new("RGB", (V.W * SS, V.H * SS), BG)
    d = ImageDraw.Draw(img)
    for x, y, rr, c in zip(X[keep], Y[keep], r[keep], col[keep]):
        d.ellipse([(x - rr) * SS, (y - rr) * SS, (x + rr) * SS, (y + rr) * SS], fill=tuple(int(v) for v in c))

    over = Image.new("RGBA", img.size, (0, 0, 0, 0))
    od = ImageDraw.Draw(over)
    lw = max(2, round(2.6 * sc * SS))
    jr = max(3, 5.5 * sc * SS)
    pale, acc = tuple(int(v) for v in PALE), tuple(int(v) for v in ACCENT)
    a_env = int(255 * env)

    edge = (*acc, int(150 * env))
    for sgn in (-1, 1):
        ex, ey = hx + reach * np.cos(axis + sgn * half), hy + reach * np.sin(axis + sgn * half)
        od.line([hx * SS, hy * SS, ex * SS, ey * SS], fill=edge, width=max(2, round(1.6 * sc * SS)))

    t_hit = {}
    for j in np.nonzero(ok)[0]:
        pj = np.clip((np.hypot(pts[j][0] - hx, pts[j][1] - hy) - 40 * sc) / (reach - 40 * sc), 0, 0.999)
        t_hit[j] = 0.74 * (1 - (1 - pj) ** (1 / 3)) + 0.02
    shown = {j for j, th in t_hit.items() if t >= th}
    for a, b in LIMBS:
        if a in shown and b in shown:
            od.line([pts[a][0] * SS, pts[a][1] * SS, pts[b][0] * SS, pts[b][1] * SS], fill=(*(acc if a in LEFT else pale), a_env), width=lw)
    for j in shown:
        x, y = pts[j][0] * SS, pts[j][1] * SS
        age = (t - t_hit[j]) / 0.09
        if 0 <= age < 1:
            R = jr * (1.5 + 2.2 * age)
            od.ellipse([x - R, y - R, x + R, y + R], outline=(*pale, int(a_env * (1 - age))), width=max(1, lw // 2))
        od.ellipse([x - jr, y - jr, x + jr, y + jr], fill=(255, 255, 255, a_env), outline=(*(acc if j in LEFT else pale), a_env), width=max(2, lw))

    p1, p2 = V.pt(*fr["box"][:2]), V.pt(*fr["box"][2:])
    cx, cy = (p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2
    bs = 1 + 0.22 * (1 - ease((t - 0.05) / 0.3))
    hw, hh = (p2[0] - p1[0]) / 2 * bs + 10 * sc, (p2[1] - p1[1]) / 2 * bs + 10 * sc
    ba = int(150 * env * ease((t - 0.04) / 0.08))
    arm = min(hw, hh) * 0.2 * SS
    for sx_ in (-1, 1):
        for sy_ in (-1, 1):
            px, py = (cx + sx_ * hw) * SS, (cy + sy_ * hh) * SS
            od.line([px, py, px - sx_ * arm, py], fill=(*pale, ba), width=lw)
            od.line([px, py, px, py - sy_ * arm], fill=(*pale, ba), width=lw)
    img = Image.alpha_composite(img.convert("RGBA"), over).convert("RGB")
    return img.resize((V.W, V.H), Image.LANCZOS)


def build(fa, V, VL, still_t=0.8):
    n = len(fa)
    loop = [render(fr, fa[0], max(0.0, (i / n - 0.88) / 0.12), i / n, VL) for i, fr in enumerate(fa)]
    k = int(still_t * n)
    return render(fa[k], fa[0], 0, k / n, V), loop


def save_anim(frames, path, quality):
    frames[0].save(path, "WEBP", save_all=True, append_images=frames[1:], duration=80, loop=0, quality=quality, method=6)


def main():
    pose = json.loads(POSE.read_text())["frames"]
    with tempfile.TemporaryDirectory() as tmp:
        frames, shifts = stabilise(load_frames(tmp), pose)
        idx = pick_window(frames)
        fa = analyse(frames, idx, pose, shifts)
    print("window", idx[0], idx[-1])
    wide = View(1600, 1000, 2.5, -60, -10, 7, (800, 500, 980, 640))
    card = View(1200, 1200, 1.65, -121, -70, 6.5, (600, 430, 700, 520))
    OUT.mkdir(parents=True, exist_ok=True)
    ws, wl = build(fa, wide, wide.scaled(0.4, 3.9))
    ws.save(OUT / "loomo-pose-b.webp", "WEBP", quality=72, method=6)
    save_anim(wl, OUT / "loomo-pose-b-anim.webp", 34)
    cs, cl = build(fa, card, card.scaled(0.4, 3.4))
    cs.save(OUT / "loomo-b-card.webp", "WEBP", quality=72, method=6)
    save_anim(cl, OUT / "loomo-b-card-anim.webp", 40)
    for n in ("loomo-pose-b.webp", "loomo-pose-b-anim.webp", "loomo-b-card.webp", "loomo-b-card-anim.webp"):
        print(n, (OUT / n).stat().st_size)
    if "--preview" in sys.argv:
        alt = Path.home() / "Perso/wt20-alt-a/public/projects/autonomous-mobile-robot/loomo-wide.webp"
        sheet = Image.new("RGB", (1600, 1500), BG)
        if alt.exists():
            sheet.paste(Image.open(alt).convert("RGB").resize((800, 500)), (0, 0))
        sheet.paste(ws.resize((800, 500)), (800, 0))
        for n, i in enumerate((5, 12, 19)):
            sheet.paste(wl[i].resize((533, 333)), (n * 533, 500))
        sheet.paste(ws.resize((390, 244)), (0, 860))
        sheet.paste(cs.resize((350, 350)), (450, 860))
        sheet.save(Path.home() / "Perso/site-review/files/loomo-anim-20.png")


if __name__ == "__main__":
    main()
