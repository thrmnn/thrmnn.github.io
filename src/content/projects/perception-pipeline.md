---
title: 'Perception Pipeline — Modern Real-Time Vision Stack'
date: '2026-05-27T00:00:00Z'
externalLink: 'https://github.com/thrmnn/perception-pipeline'
github: 'https://github.com/thrmnn/perception-pipeline'
summary: 'Consolidated, modernized perception stack — detection, multi-object tracking, ReID, pose — replacing four years of one-off prototypes with a single modular, latency-budget-aware pipeline.'
label: 'Open-source · in progress · 2026'
metric: 'Modular stack · consolidates 4 years of perception work'
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

## Design principles

1. **Modules over monoliths.** Every primitive (detector, tracker, ReID, pose) is a stand-alone class behind a narrow interface; the pipeline is a composition.
2. **One config file per scenario.** No hand-edited launch scripts. YAML in, pipeline out.
3. **Latency-budget-aware.** Every module reports measured latency; the runtime can downgrade or skip modules to hit a target frame budget.
4. **Platform-agnostic core, platform-specific shims.** ROS / standalone / SDK adapters live at the edge.

## Status and roadmap

Public scaffold landed 2026-05-27. Implementation is sequenced:

- **v0.1** — single-person detection + tracking baseline (YOLO + ByteTrack), CLI
- **v0.2** — ReID hook + multi-person tracking
- **v0.3** — 2D pose estimation
- **v0.4** — 3D pose lifting + temporal smoothing
- **v0.5** — Real-time edge deployment (Jetson Orin baseline)
- **v0.6** _(stretch)_ — VLM-conditioned tracking ("track the person in the red jacket")

## Ancestors

The historical record — these still run on their original dependency stacks:

- [Perception-Pipeline](https://github.com/theoh-io/Perception-Pipeline) (2022) — single-person detection + tracking, method comparison
- [ReID-Colab](https://github.com/theoh-io/ReID-Colab) (2022) — YOLO + ReID demo notebook
- [PostureTrack](https://github.com/theoh-io/PostureTrack) (2023) — modular pose tracking, single + multi-person
- [ROS_Autonomous_Driving](https://github.com/thrmnn/ROS_Autonomous_Driving) perception module (2023) — same primitives wrapped in ROS for the Loomo robot

## Why open

Side build at the intersection of the main MIT Senseable Rio research line and active job-search interest in perception roles. Public, MIT-licensed, modular — designed to be useful to whoever picks it up and an honest demonstration of how I think about real-time vision systems.
