---
title: "Event cameras for high-speed drone state estimation"
date: '2023-07-01T00:00:00Z'
externalLink: 'https://www.iri.upc.edu/'
github: 'https://github.com/thrmnn/EVIO'
image: '/projects/event-cameras-drone/hero.svg'
summary: "6-DOF pose estimation through flight maneuvers exceeding 5 g acceleration, where conventional frame cameras fail."
label: "IRI (CSIC-UPC, Barcelona) · 2023–24"
metric: "6-DOF pose estimation · flight above 5 g"
gradient: "linear-gradient(135deg, #2d1b4e 0%, #4a2d6b 50%, #6b3fa0 100%)"
tags:
  - State Estimation
  - Visual-Inertial Odometry
  - Sensor Fusion
  - Event Cameras
  - Deep Learning
  - PyTorch
  - ROS
  - C++
---

## Problem

Conventional frame-based cameras suffer motion blur at high angular and linear velocity, causing standard visual-inertial odometry (VIO) to diverge during aggressive quadrotor maneuvers exceeding 5 g acceleration.

## Built

A PyTorch network that estimates 6-DOF pose from three streams: an event camera (asynchronous per-pixel brightness changes, microsecond resolution), an RGB camera and an IMU.

- **Early fusion:** event and RGB frames are fused on a shared spatial tensor.
- **IMU encoder:** a WaveNet encoder reads the IMU stream over time.
- **Pose head:** a multi-modal head regresses the 6-DOF pose.

Trained on the UZH-FPV drone-racing dataset and the lab's own IRI-Borinot recordings (RGB, IMU and an event camera on a drone), with Juan Andrade-Cetto.

## Why hard

Event cameras eliminate motion blur but require fundamentally different processing than standard frame-based VIO pipelines.

## What happened

The model targets maneuvers above 5 g, the regime where conventional frame cameras and standard VIO diverge. The training framework is open source ([EVIO](https://github.com/thrmnn/EVIO)); real-time onboard inference lives in a separate repository that is not yet open.
