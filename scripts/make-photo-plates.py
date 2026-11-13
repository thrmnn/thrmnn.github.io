#!/usr/bin/env python3
"""Card plates drawn as halftones of published pictures, 1200x1200 webp.
Dot size follows brightness, on a rotated grid with jittered position and size,
so it reads as a picture and a dot grid cannot beat against the screen. The
subject is blue, its surroundings grey fading into the background. Host
tooling (Pillow, numpy), run by hand; output committed. Inputs are downloaded,
never committed, except where noted.

    python3 scripts/make-photo-plates.py roboat|octopus|pipeline [--frame N]
    python3 scripts/make-photo-plates.py loomo [--shape wide|tile]

roboat: MIT News, "Autonomous boats could be your next ride", 26 Oct 2020,
  https://news.mit.edu/2020/autonomous-boats-could-be-your-next-ride-1026
  image https://news.mit.edu/sites/default/files/images/202010/MIT-Roboat%20II-Close.jpg
  credit "Photo courtesy of the researchers." MIT News images: CC BY-NC-ND,
  "may not alter ... other than crop" (https://news.mit.edu/terms-of-use).
  A halftone is an alteration: do not wire this plate in without permission.
octopus: bottom-layer render of the case,
  https://raw.githubusercontent.com/MIT-Senseable-City-Lab/octopus-fabrication/main/imgs/otopus_bottom-layer_perspective.png
  repository octopus-fabrication, MIT License, (c) 2024 MIT Senseable City Lab.
loomo: the site's own picture public/projects/autonomous-mobile-robot/hero-poster.jpg
  (600x338, a Segway Loomo following a person, EPFL VITA Lab, the owner's project).
  wide = 1600x1000 for the homepage spotlight, tile = 1200x1200 centred on the robot
  for the hero. The robot is the blue subject, the person and room are grey.
pipeline: MOT17-04 frame, MOTChallenge MOT17 (CC BY-NC-SA 3.0,
  https://motchallenge.net/data/MOT17/), read from the benchmark zip by byte
  range (pip install remotezip); boxes and trails from
  scripts/assets/pipeline/tracks.json (scripts/sample-pipeline-tracks.py, the
  github.com/thrmnn/perception-pipeline run).
"""
import io
import json
import sys
import urllib.request
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).parent.parent
S = 1200
SS = 2
BG = (14, 16, 22)
GROUND = (120, 124, 134)
WALL = (150, 156, 168)
ACCENT = (86, 140, 246)
TRAIL = (70, 200, 120)

ROBOAT_URL = "https://news.mit.edu/sites/default/files/images/202010/MIT-Roboat%20II-Close.jpg"
OCTOPUS_URL = "https://raw.githubusercontent.com/MIT-Senseable-City-Lab/octopus-fabrication/main/imgs/otopus_bottom-layer_perspective.png"
MOT_ZIP = "https://motchallenge.net/data/MOT17.zip"


def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    return Image.open(io.BytesIO(urllib.request.urlopen(req, timeout=60).read()))


def vignette(cx, cy, rx, ry, power=2.0):
    y, x = np.mgrid[0:S, 0:S]
    d = np.sqrt(((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2)
    return np.clip(1 - d, 0, 1) ** (1 / power)


def halftone(tone, blue, pitch=9, rmax=None, angle=0.38, seed=3, grey=GROUND):
    """tone: SxS in [0,1], dot area. blue: SxS bool, subject dots."""
    rng = np.random.default_rng(seed)
    rmax = rmax or pitch * 0.62
    ca, sa = np.cos(angle), np.sin(angle)
    H, W = tone.shape
    n = int(max(W, H) * 1.5 / pitch)
    img = Image.new("RGB", (W * SS, H * SS), BG)
    d = ImageDraw.Draw(img)
    for i in range(-n, n):
        for j in range(-n, n):
            u, v = i * pitch, j * pitch
            x = u * ca - v * sa + W / 2 + rng.uniform(-0.18, 0.18) * pitch
            y = u * sa + v * ca + H / 2 + rng.uniform(-0.18, 0.18) * pitch
            if not (0 <= x < W and 0 <= y < H):
                continue
            t = tone[int(y), int(x)]
            if t < 0.03:
                continue
            r = rmax * np.sqrt(t) * rng.uniform(0.88, 1.08)
            col = ACCENT if blue[int(y), int(x)] else grey
            d.ellipse([(x - r) * SS, (y - r) * SS, (x + r) * SS, (y + r) * SS], fill=col)
    return img.resize((W, H), Image.LANCZOS)


def lum(im):
    return np.asarray(im.convert("L"), dtype=np.float32) / 255


def stretch(g, m, gamma, lo=3, hi=97):
    a, b = np.percentile(g[m], [lo, hi])
    return np.clip((g - a) / (b - a), 0, 1) ** gamma


def place(im, box_w, cx, cy):
    """Scale to width box_w, centre at (cx, cy) on an SxS canvas; returns canvas and paste mask."""
    h = round(im.height * box_w / im.width)
    im = im.resize((box_w, h), Image.LANCZOS)
    canvas = Image.new("RGB", (S, S), (0, 0, 0))
    canvas.paste(im, (cx - box_w // 2, cy - h // 2))
    inside = Image.new("L", (S, S), 0)
    inside.paste(255, (cx - box_w // 2, cy - h // 2, cx - box_w // 2 + box_w, cy - h // 2 + h))
    return canvas, np.asarray(inside, dtype=np.float32) / 255, (cx - box_w // 2, cy - h // 2, h)


def roboat():
    im = fetch(ROBOAT_URL).convert("RGB")
    im = im.crop((int(im.width * 0.07), 0, int(im.width * 0.93), im.height))
    canvas, inside, (ox, oy, h) = place(im, S, S // 2, S // 2)
    k = S / 900 / 0.86
    poly = [(160, 272), (560, 288), (735, 330), (770, 375), (797, 440), (790, 478), (750, 512),
            (300, 522), (110, 507), (98, 455), (150, 370), (155, 330)]
    mast = [(405, 178), (472, 178), (482, 292), (405, 292)]
    mask = Image.new("L", (S, S), 0)
    md = ImageDraw.Draw(mask)
    for p in (poly, mast):
        md.polygon([((x - 900 * 0.07) * k + ox, y * k + oy) for x, y in p], fill=255)
    blue = np.asarray(mask.filter(ImageFilter.GaussianBlur(2))) > 128
    g = lum(canvas.filter(ImageFilter.GaussianBlur(2.2)))
    g = np.clip((g - 0.04) / 0.8, 0, 1) ** 0.8
    fade = vignette(S / 2, S / 2 + 90, 700, 640, 1.6) * np.clip(inside * 3 - 0.2, 0, 1)
    tone = np.where(blue, 0.06 + 0.94 * stretch(g, blue, 1.3), 0.8 * g * fade)
    return halftone(tone, blue, pitch=7)


def octopus():
    src = fetch(OCTOPUS_URL).convert("RGB")
    g0 = lum(src)
    ys, xs = np.where(g0 < 0.985)
    src = src.crop((xs.min() - 10, ys.min() - 10, xs.max() + 10, ys.max() + 10))
    src = src.crop((3, 3, src.width - 3, src.height - 3))
    side = int(S * 0.74)
    canvas, inside, (ox, oy, h) = place(src, side, S // 2, S // 2 - 30)
    g = lum(canvas.filter(ImageFilter.GaussianBlur(1.2)))
    white = (g > 0.985) | (inside < 0.5)
    shape = ~white
    m = 24
    shape[:oy + m] = shape[oy + h - m:] = False
    shape[:, : S // 2 - side // 2 + m] = shape[:, S // 2 + side // 2 - m :] = False
    shape = np.asarray(Image.fromarray((shape * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.GaussianBlur(1.5))) > 128
    tone = (0.05 + 0.9 * stretch(g, shape, 2.2)) * shape
    y, x = np.mgrid[0:S, 0:S]
    cy = oy + h * 0.9
    ring = np.sqrt(((x - S / 2) / (side * 0.62)) ** 2 + ((y - cy) / (side * 0.2)) ** 2)
    ground = np.clip(1 - ring, 0, 1) ** 0.8 * 0.55 * (~shape)
    tone = np.where(shape, tone, ground)
    return halftone(tone, shape, pitch=7)


LOOMO_SRC = ROOT / "public/projects/autonomous-mobile-robot/hero-poster.jpg"
# robot silhouette in source pixels (600x338): wheels, base, stem, camera head
LOOMO_ROBOT = [
    [(340, 246), (352, 240), (366, 252), (366, 300), (352, 312), (340, 300)],
    [(440, 256), (452, 250), (464, 262), (464, 316), (452, 324), (440, 312)],
    [(358, 270), (446, 272), (446, 298), (358, 296)],
    [(391, 200), (413, 200), (414, 282), (391, 282)],
    [(389, 166), (404, 160), (421, 170), (421, 198), (404, 202), (389, 196)],
]


def loomo(shape):
    src = Image.open(LOOMO_SRC).convert("RGB")
    if shape == "wide":
        W, H, k, x0, y0 = 1600, 1000, 1000 / 338, 175, 0
        pitch = 9
    elif shape == "card":
        # the robot stands at the bottom of the photo; the card's caption covers the lower third,
        # so the photo fills the top 820 px and the rest is ground fading out under the caption
        W, H, k, x0, y0 = 1200, 1200, 820 / 338, 255, 0
        pitch = 8
    else:
        W, H, k, x0, y0 = 1200, 1200, 1200 / 338, 233 * 1200 / 338, 0
        pitch = 8
    big = src.resize((round(600 * k), round(338 * k)), Image.LANCZOS)
    crop = big.crop((round(x0), round(y0), round(x0) + W, round(y0) + H)).filter(ImageFilter.GaussianBlur(1.6))
    mask = Image.new("L", (W, H), 0)
    md = ImageDraw.Draw(mask)
    for poly in LOOMO_ROBOT:
        md.polygon([(x * k - x0, y * k - y0) for x, y in poly], fill=255)
    mask = mask.filter(ImageFilter.MaxFilter(9)).filter(ImageFilter.GaussianBlur(4))
    rgb = np.asarray(crop, dtype=np.float32)
    jeans = np.asarray(Image.fromarray((((rgb[..., 2] - rgb[..., 0]) > 22) * 255).astype(np.uint8)).filter(ImageFilter.MedianFilter(7)).filter(ImageFilter.GaussianBlur(2))) > 128
    g = lum(crop)
    blue = (np.asarray(mask) > 128) & (g < 0.3)
    blue = np.asarray(Image.fromarray((blue * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(7)).filter(ImageFilter.GaussianBlur(3))) > 128
    g = stretch(g, np.ones_like(g, bool), 1.5, 4, 97)
    g = np.where(jeans, np.maximum(g, 0.8), g)
    y, x = np.mgrid[0:H, 0:W]
    d = np.sqrt(((x - W / 2) / (W * 0.62)) ** 2 + ((y - H * 0.52) / (H * 0.62)) ** 2)
    fade = np.clip(1.15 - d, 0, 1) ** 0.7
    if shape == "card":
        fade = 0.7 * np.clip(1.15 - np.sqrt(((x - W * 0.62) / (W * 0.7)) ** 2 + ((y - H * 0.42) / (H * 0.5)) ** 2), 0, 1) ** 0.8 * np.clip((800 - y) / 260, 0, 1)
    tone = np.where(blue, 0.8, np.clip(0.04 + 0.96 * g, 0, 1) * fade)
    return halftone(tone, blue, pitch=pitch)


def pipeline(frame_no):
    from remotezip import RemoteZip

    data = json.loads((ROOT / "scripts" / "assets" / "pipeline" / "tracks.json").read_text())
    with RemoteZip(MOT_ZIP) as z:
        frame = Image.open(io.BytesIO(z.read(f"MOT17/train/MOT17-04-SDP/img1/{frame_no:06d}.jpg"))).convert("RGB")
    X0, Y0, SIDE = 250, 0, 1080
    k = S / SIDE
    crop = frame.crop((X0, Y0, X0 + SIDE, Y0 + SIDE)).resize((S, S), Image.LANCZOS)
    g = lum(crop.filter(ImageFilter.GaussianBlur(1.6)))
    g = stretch(g, np.ones_like(g, bool), 1.1, 2, 99)
    boxes, trails = [], []
    for tid, pts in data["tracks"].items():
        byf = {p[0]: p for p in pts}
        if frame_no not in byf or len(byf[frame_no]) < 5:
            continue
        _, cx, y2, w, h = byf[frame_no]
        x1, y1, x2 = cx - w / 2, y2 - h, cx + w / 2
        if h * k < 70 or x2 < X0 or x1 > X0 + SIDE:
            continue
        boxes.append(((x1 - X0) * k, (y1 - Y0) * k, (x2 - X0) * k, (y2 - Y0) * k))
        foot = [(byf[f][1], byf[f][2]) for f in range(frame_no - 60, frame_no + 1) if f in byf]
        sm = [tuple(np.mean(foot[max(0, i - 6) : i + 7], axis=0)) for i in range(len(foot))]
        trails.append([((x - X0) * k, (y - Y0) * k) for x, y in sm])
    persons = Image.new("L", (S, S), 0)
    pd = ImageDraw.Draw(persons)
    for b in boxes:
        pd.rectangle(b, fill=255)
    persons = np.asarray(persons.filter(ImageFilter.GaussianBlur(6)), dtype=np.float32) / 255
    fade = vignette(S / 2, S / 2, 700, 700, 1.1)
    tone = np.clip(g * (0.5 + 0.45 * persons) * (0.4 + 0.6 * fade) * 1.15, 0, 1)
    base = halftone(tone, np.zeros((S, S), bool), pitch=6, grey=GROUND)
    over = Image.new("RGB", (S * SS, S * SS), (0, 0, 0))
    ov = ImageDraw.Draw(over)
    cover = Image.new("L", (S * SS, S * SS), 0)
    cd = ImageDraw.Draw(cover)
    for tr in trails:
        for a, b in zip(tr, tr[1:]):
            cd.line([a[0] * SS, a[1] * SS, b[0] * SS, b[1] * SS], fill=255, width=9)
            ov.line([a[0] * SS, a[1] * SS, b[0] * SS, b[1] * SS], fill=TRAIL, width=9)
    for b in boxes:
        pad = 4 * SS
        r = [b[0] * SS, b[1] * SS, b[2] * SS, b[3] * SS]
        cd.rectangle(r, outline=255, width=pad)
        ov.rectangle(r, outline=ACCENT, width=pad)
    over = over.resize((S, S), Image.LANCZOS)
    cover = cover.resize((S, S), Image.LANCZOS)
    base.paste(over, (0, 0), cover)
    return base


if __name__ == "__main__":
    which = sys.argv[1]
    if which == "roboat":
        out, path = roboat(), Path.home() / "Perso/site-review/files/roboat-mitnews.webp"
    elif which == "loomo":
        shape = sys.argv[sys.argv.index("--shape") + 1] if "--shape" in sys.argv else "wide"
        out, path = loomo(shape), ROOT / f"public/projects/autonomous-mobile-robot/loomo-{shape}.webp"
    elif which == "octopus":
        out, path = octopus(), ROOT / "public/projects/octopus/card-plate.webp"
    else:
        n = int(sys.argv[sys.argv.index("--frame") + 1]) if "--frame" in sys.argv else 390
        out, path = pipeline(n), ROOT / "public/projects/perception-pipeline/card-plate.webp"
    if "--out" in sys.argv:
        path = Path(sys.argv[sys.argv.index("--out") + 1])
    path.parent.mkdir(parents=True, exist_ok=True)
    if which == "loomo" and shape == "tile":
        # the hero shows this tile at about 340 css px; the dot noise compresses poorly at full size
        out = out.resize((600, 600), Image.LANCZOS)
    out.save(path, "WEBP", quality=70 if which == "loomo" else 78, method=6)
    print(path)
