#!/usr/bin/env python3
"""Run the perception-pipeline (github.com/thrmnn/perception-pipeline, v0.1:
YOLOv8n detector + ByteTrack, persons only) on public footage and keep the
tracked foot points. Footage: MOT17-04 (static surveillance camera, 1920x1080,
30 fps), frames 1 to FRAMES, from the public MOTChallenge MOT17 benchmark
(Milan et al., 2016, https://motchallenge.net/data/MOT17/). The frames are not
kept; only scripts/assets/pipeline/tracks.json is (per track id, the bottom
centre of the box per frame, rounded to whole pixels). CPU only.

    python3 scripts/sample-pipeline-tracks.py <MOT17-04-SDP/img1 dir> <perception-pipeline/src dir>
"""
import json
import sys
from pathlib import Path

import cv2

frames_dir, pp_src = Path(sys.argv[1]), sys.argv[2]
sys.path.insert(0, pp_src)
from perception.detectors import YOLODetector  # noqa: E402
from perception.trackers import ByteTrackTracker  # noqa: E402

FRAMES = 400
OUT = Path(__file__).parent / "assets" / "pipeline" / "tracks.json"
det = YOLODetector(model="yolov8n.pt", conf=0.25, iou=0.45, classes=[0], device="cpu")
trk = ByteTrackTracker(frame_rate=30)
tracks = {}
for i in range(1, FRAMES + 1):
    frame = cv2.imread(str(frames_dir / f"{i:06d}.jpg"))
    t = trk.update(det(frame))
    for j in range(len(t)):
        x1, y1, x2, y2 = t.xyxy[j]
        tracks.setdefault(int(t.track_id[j]), []).append([i, round(float((x1 + x2) / 2)), round(float(y2))])
    if i % 50 == 0:
        print(i, len(tracks), flush=True)
OUT.write_text(json.dumps({"width": 1920, "height": 1080, "frames": FRAMES, "tracks": tracks}, separators=(",", ":")))
print(f"wrote {OUT} ({OUT.stat().st_size} B, {len(tracks)} tracks)")
