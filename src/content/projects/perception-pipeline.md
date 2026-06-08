---
title: 'Perception Pipeline — Modern Real-Time Vision Stack'
date: '2026-06-08T00:00:00Z'
externalLink: 'https://github.com/thrmnn/perception-pipeline'
github: 'https://github.com/thrmnn/perception-pipeline'
image: '/projects/perception-pipeline/hero.webp'
summary: 'Consolidated, modernized perception stack — detection, multi-object tracking, ReID, pose — replacing four years of one-off prototypes with a single modular, latency-budget-aware pipeline.'
label: 'Open-source · v0.1 shipped · 2026'
metric: 'YOLOv8 + ByteTrack · modular · MIT-licensed'
gradient: 'linear-gradient(135deg, #1a3a3a 0%, #2d5a5a 50%, #3a7a7a 100%)'
tags:
  - Object Detection
  - Multi-Object Tracking
  - Re-Identification
  - Pose Estimation
  - YOLO
  - ByteTrack
  - PyTorch
  - TensorRT
  - Edge Deployment
---

## Overview

Across 2022–2023 I shipped four versions of "detection + tracking + ReID" — single-person tracking on a Loomo robot, multi-person pose tracking, a ReID demo on Colab, and the perception module of a full ROS autonomy stack. Each solved a real problem in its context. None of them shared an interface; all four ran on dependency stacks that aged out.

**`perception-pipeline` is the consolidated re-do** against the 2026 stack: modern YOLO (v8/v11), ByteTrack / BoT-SORT / OC-SORT, OSNet-class ReID, MMPose-compatible 2D and 3D pose, with TensorRT export targets for edge deployment on Jetson-class hardware.

## What v0.1 ships (June 2026)

A runnable detector + tracker loop with the architecture the rest of the roadmap will plug into.

- **Narrow interfaces** — `Detector` and `Tracker` abstract base classes; every primitive lives behind one. Swap modules without touching the rest.
- **YOLO detection** — `ultralytics` wrapper, any checkpoint (`yolov8n` by default).
- **ByteTrack association** — via the `supervision` package; persistent track IDs across frames.
- **CLI demo** — `perception-demo --input video.mp4 --output annotated.mp4`. Latency summary printed on exit (per-module mean / p95, effective FPS).
- **Type contracts** — `Detections`, `Tracks`, `FrameResult` carry per-module latencies so the runtime can budget downstream stages.
- **MIT-licensed, pip-installable** — `pip install -e .` and you're running.

## Design principles

1. **Modules over monoliths.** Every primitive (detector, tracker, ReID, pose) is a stand-alone class behind a narrow interface; the pipeline is a composition.
2. **One config file per scenario.** No hand-edited launch scripts. YAML in, pipeline out. (Config-loading lands in v0.2.)
3. **Latency-budget-aware.** Every module reports measured latency; the runtime can downgrade or skip modules to hit a target frame budget.
4. **Platform-agnostic core, platform-specific shims.** ROS / standalone / SDK adapters live at the edge.

## Roadmap

- ✅ **v0.1** — Detection + tracking baseline (YOLO + ByteTrack), CLI demo, latency reporting. **Shipped June 2026.**
- **v0.2** — ReID hook (OSNet baseline), multi-person tracking, YAML pipeline config
- **v0.3** — 2D pose estimation (MMPose-compatible)
- **v0.4** — 3D pose lifting + temporal smoothing
- **v0.5** — Edge deployment (TensorRT export, Jetson Orin baseline, FP16 + INT8)
- **v0.6** _(stretch)_ — VLM-conditioned tracking ("track the person in the red jacket")

## Ancestors

The historical record — these still run on their original dependency stacks:

- [Perception-Pipeline](https://github.com/thrmnn/Perception-Pipeline) (2022) — single-person detection + tracking, method comparison
- **ReID** (2022) — YOLO + ReID demo notebook · _repo under maintenance_
- **PostureTrack** (2023) — modular pose tracking, single + multi-person · _repo under maintenance_
- [ROS_Autonomous_Driving](https://github.com/thrmnn/ROS_Autonomous_Driving) perception module (2023) — same primitives wrapped in ROS for the Loomo robot

## Why open

Side build at the intersection of the main MIT Senseable Rio research line and active interest in senior perception roles. Public, MIT-licensed, modular — designed to be useful to whoever picks it up and an honest demonstration of how I think about real-time vision systems.
