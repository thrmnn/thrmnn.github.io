#!/usr/bin/env python3
"""Keypoints for the 'what Loomo sees' panel. From frame 85 (15 fps) the project's
video shows a screen recording: the pose pipeline's Input view (a camera image of
a person walking, whole body in frame) with the project's own skeleton and box
burned into the pixels, and a 3D plot beside it. The Input view sits at
x 15-353, y 80-333 of the 720x406 video (checked on frames 95-140: the same box).
This script crops it, paints out the burned-in overlay colours (green, blue and
orange saturated pixels) so the detector does not read the project's own
skeleton, upsamples it 3x, and runs torchvision keypointrcnn_resnet50_fpn
(KeypointRCNN_ResNet50_FPN_Weights.COCO_V1) on it. Output: scripts/assets/loomo/inset-pose.json,
[x, y, score] per COCO keypoint in inset-crop pixels (339x254), score is the logit
(> 2 confident). Host tooling (torch, torchvision, opencv, ffmpeg), run by hand.

    python3 scripts/make-loomo-inset-pose.py
"""
import json
import subprocess
import tempfile
from pathlib import Path

import cv2
import numpy as np
import torch
import torchvision
from torchvision.models.detection import KeypointRCNN_ResNet50_FPN_Weights, keypointrcnn_resnet50_fpn

ROOT = Path(__file__).parent.parent
VIDEO = ROOT / "scripts/assets/loomo/hero.webm"
BOX = (15, 80, 354, 334)
FRAMES = range(85, 146)
UP = 3


def clean(crop):
    hsv = cv2.cvtColor(crop, cv2.COLOR_BGR2HSV)
    h, s, v = hsv[..., 0].astype(int), hsv[..., 1], hsv[..., 2]
    ov = (s > 140) & (v > 110) & (((h > 35) & (h < 90)) | ((h > 98) & (h < 130)) | ((h > 8) & (h < 22)))
    ov = cv2.dilate(ov.astype(np.uint8), np.ones((3, 3), np.uint8))
    return cv2.inpaint(crop, ov, 3, cv2.INPAINT_TELEA)


def main():
    w = KeypointRCNN_ResNet50_FPN_Weights.COCO_V1
    model = keypointrcnn_resnet50_fpn(weights=w).eval()
    out = {}
    with tempfile.TemporaryDirectory() as tmp:
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(VIDEO), "-vf", "fps=15", "-frames:v", str(max(FRAMES)), f"{tmp}/f%04d.png"], check=True)
        for i in FRAMES:
            im = cv2.imread(f"{tmp}/f{i:04d}.png")
            x0, y0, x1, y1 = BOX
            crop = clean(im[y0:y1, x0:x1])
            big = cv2.resize(crop, None, fx=UP, fy=UP, interpolation=cv2.INTER_CUBIC)
            t = torch.from_numpy(cv2.cvtColor(big, cv2.COLOR_BGR2RGB)).permute(2, 0, 1).float() / 255
            with torch.no_grad():
                r = model([t])[0]
            dets = []
            for k in range(len(r["scores"])):
                if r["scores"][k] >= 0.5:
                    kp = r["keypoints"][k].numpy().copy()
                    kp[:, 0] /= UP
                    kp[:, 1] /= UP
                    kp[:, 2] = r["keypoints_scores"][k].numpy()
                    dets.append({"score": round(float(r["scores"][k]), 3), "box": [round(float(v) / UP, 1) for v in r["boxes"][k]], "kp": [[round(float(a), 1) for a in p] for p in kp]})
            out[f"{i:04d}"] = dets
    meta = {
        "source": "scripts/assets/loomo/hero.webm, frames 85-145 at 15 fps (ffmpeg -vf fps=15), Input view crop x 15-353, y 80-333, burned-in overlay colours inpainted, 3x upsampled",
        "model": "torchvision keypointrcnn_resnet50_fpn, weights KeypointRCNN_ResNet50_FPN_Weights.COCO_V1, torchvision " + torchvision.__version__ + ", detections with score >= 0.5",
        "command": "python3 scripts/make-loomo-inset-pose.py",
        "kp_format": "[x, y, score] per COCO keypoint in inset-crop pixels (339x254); score is the logit, > 2 is confident",
        "frames": out,
    }
    (ROOT / "scripts/assets/loomo/inset-pose.json").write_text(json.dumps(meta))
    for i in (90, 100, 110, 120, 130, 140):
        d = out[f"{i:04d}"]
        print(i, len(d), [sum(p[2] > 2 for p in x["kp"]) for x in d])


if __name__ == "__main__":
    main()
