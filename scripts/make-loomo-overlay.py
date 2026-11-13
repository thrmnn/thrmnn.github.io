#!/usr/bin/env python3
"""Alternative Loomo figure: the 1600x1000 halftone of scripts/make-photo-plates.py
`loomo --shape wide` (the poster photo, the person grey, the robot blue) left as
it is, with the real walking legs and a drawn depth scan laid over it.
Host tooling (numpy, Pillow, scipy, opencv, ffmpeg), run by hand.

    python3 scripts/make-loomo-overlay.py [--out DIR]   # default ~/Perso/site-review/files

Writes loomo-pose-c.webp (1600x1000) and loomo-pose-c-anim.webp (640x400, 24 frames at 80 ms).

REAL
  Base: public/projects/autonomous-mobile-robot/hero-poster.jpg through the
  make-photo-plates.py loomo('wide') halftone, same crop and transform
  (k = 1000/338, x0 = 175), nothing re-rendered.
  Mapping, verified: hero-poster.jpg (600x338) is frame 48 of
  scripts/assets/loomo/hero.webm (720x406) sampled at 15 fps (ffmpeg -vf fps=15,
  1-based). Matching the 600x338 poster, scaled by 720/600, against frames 7-82
  over the ceiling and pavilion (a region with neither person nor robot), frame
  48 has the lowest residual (mean absolute difference 3.5 of 255) and a
  phase-correlation shift of (0.2, 0.1) px, so the video-to-poster mapping is
  a pure scale of 600/720, no offset.
  Pose: scripts/assets/loomo/pose.json, torchvision keypointrcnn_resnet50_fpn
  (KeypointRCNN_ResNet50_FPN_Weights.COCO_V1) on those frames. The hand-held
  camera pans, so each frame's keypoints are shifted by the background motion
  against frame 48 (Lucas-Kanade on features outside the person and the robot),
  then smoothed over 3 frames. Only the hips, knees and ankles with score > 2
  are drawn, and a limb only when both ends pass; the arms are left out because
  the shoulders are out of frame. PifPaf is only the drawing style, not the model.
  The loop plays frames 36-59, the 24 frames around the poster's.

DRAWN
  The depth view. The Loomo senses depth with an Intel RealSense ZR300, an
  active-infrared stereo camera, next to its 1080p camera and ultrasonic and
  infrared range sensors; it has no lidar. We have no depth frame from the
  robot, so the cone from its head, the sweep and the lit dots (a sparse set of
  new dots on the legs and the floor in the cone, from the poster's jeans mask
  and the floor below the horizon) are an illustration. The cone angle is for
  legibility. The base legs stay at frame 48's pose while the drawn skeleton
  walks; the motion is drawing order plus the real keypoints; no number is
  implied.
  Sensor sources:
    https://ap-en.segway.com/product-info/loomo-personal-robot.html
    https://realsense.intel.com/loomo/
    https://developer.segwayrobotics.com/developer/documents/segway-robot-overview.html
"""
import importlib.util
import json
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

REF = 48
IDX = list(range(36, 60))
KX, KY = 600 / 720 * 1000 / 338, 1000 / 406
X0 = 175
HEAD = (405 * 1000 / 338 - X0, 181 * 1000 / 338)
LEGS = [11, 12, 13, 14, 15, 16]
LIMBS = [(11, 12), (11, 13), (13, 15), (12, 14), (14, 16)]
SS = 2
BLUE, PALE = A.ACCENT, A.PALE


def main():
    out = Path(sys.argv[sys.argv.index("--out") + 1]) if "--out" in sys.argv else Path.home() / "Perso/site-review/files"
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

    base = P.loomo("wide")
    poster = np.asarray(Image.open(P.LOOMO_SRC).convert("RGB").resize((round(600 * 1000 / 338), 1000), Image.LANCZOS).crop((X0, 0, X0 + 1600, 1000)), float)
    jeans = (poster[..., 2] - poster[..., 0]) > 22
    jeans = cv2.medianBlur((jeans * 255).astype(np.uint8), 7) > 128

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
    ix, iy = gx.astype(int), gy.astype(int)
    horizon = 205 * KY
    hx, hy = HEAD

    N = len(IDX)
    frames_out = []
    still_f = IDX.index(REF)

    def draw(f, t):
        k = kp[f]
        conf = [jx for jx in LEGS if k[jx, 2] > A.CONF]
        tx, ty = k[conf, 0].mean(), k[conf, 1].mean()
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
        on_leg = jeans[iy, ix] & (gy > k[[11, 12], 1][k[[11, 12], 2] > A.CONF].mean() if (k[[11, 12], 2] > A.CONF).any() else 500)
        on_floor = (gy > horizon) & ~jeans[iy, ix]
        sel = incone & (gate > 0.05) & ((on_leg & (pick < 0.28)) | (on_floor & (pick < 0.2)))

        img = base.copy().convert("RGBA")
        over = Image.new("RGBA", (1600 * SS, 1000 * SS), (0, 0, 0, 0))
        od = ImageDraw.Draw(over)
        for x, y, g_ in zip(gx[sel], gy[sel], gate[sel]):
            r = 3.4 * (0.6 + 0.4 * g_) * SS
            od.ellipse([x * SS - r, y * SS - r, x * SS + r, y * SS + r], fill=(*[int(c) for c in BLUE], int(235 * min(1, g_ * 1.5))))
        edge = (*[int(c) for c in BLUE], int(150 * env))
        for sgn in (-1, 1):
            ex, ey = hx + reach * np.cos(axis + sgn * half), hy + reach * np.sin(axis + sgn * half)
            od.line([hx * SS, hy * SS, ex * SS, ey * SS], fill=edge, width=3)
        t_hit = {}
        for jx in conf:
            p = np.clip((np.hypot(k[jx, 0] - hx, k[jx, 1] - hy) - 40) / (reach - 40), 0, 0.999)
            t_hit[jx] = 0.74 * (1 - (1 - p) ** (1 / 3)) + 0.02
        shown = {jx for jx, th in t_hit.items() if t >= th}
        a_env = int(255 * env)
        pale, acc = tuple(int(c) for c in PALE), tuple(int(c) for c in BLUE)
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
        img = Image.alpha_composite(img, over.resize((1600, 1000), Image.LANCZOS)).convert("RGB")
        return img


    frames_out = [draw(f, f / N) for f in range(N)]
    still = draw(still_f, 0.8)
    out.mkdir(parents=True, exist_ok=True)
    still.save(out / "loomo-pose-c.webp", "WEBP", quality=72, method=6)
    loop = [im.resize((640, 400), Image.LANCZOS) for im in frames_out]
    loop[0].save(out / "loomo-pose-c-anim.webp", "WEBP", save_all=True, append_images=loop[1:], duration=80, loop=0, quality=int(sys.argv[sys.argv.index("--q") + 1]) if "--q" in sys.argv else 27, method=6)
    for nme in ("loomo-pose-c.webp", "loomo-pose-c-anim.webp"):
        print(nme, (out / nme).stat().st_size)
    if "--preview" in sys.argv:
        pub = ROOT / "public/projects/autonomous-mobile-robot"
        sheet = Image.new("RGB", (1600, 1500), A.BG)
        alt = Path.home() / "Perso/wt20-alt-a/public/projects/autonomous-mobile-robot/loomo-wide.webp"
        sheet.paste((Image.open(alt) if alt.exists() else base).convert("RGB").resize((533, 333)), (0, 0))
        sheet.paste(Image.open(pub / "loomo-wide.webp").convert("RGB").resize((533, 333)), (533, 0))
        sheet.paste(still.resize((533, 333)), (1066, 0))
        for q, fi in enumerate((5, 12, 19)):
            sheet.paste(frames_out[fi].resize((533, 333)), (q * 533, 340))
        sheet.paste(still.resize((390, 244)), (0, 700))
        sheet.save(Path.home() / "Perso/site-review/files/loomo-anim-20.png")


if __name__ == "__main__":
    main()
