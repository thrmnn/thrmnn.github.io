---
title: "Event Cameras for High-Speed Drone State Estimation"
date: '2023-07-01T00:00:00Z'
externalLink: 'https://www.iri.upc.edu/'
summary: "PyTorch fusion model combining neuromorphic event cameras with visual-inertial odometry for robust 6-DOF drone state estimation during aggressive maneuvers exceeding 5g acceleration."
label: "IRI (CSIC-UPC, Barcelona) · 2023"
metric: "6-DOF pose estimation · >5g flight regime"
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

PyTorch fusion model combining neuromorphic event cameras with visual-inertial odometry for robust 6-DOF drone state estimation during aggressive maneuvers exceeding 5g acceleration.

## Overview

During a visiting research position at **IRI (CSIC-UPC, Barcelona)**, I developed a 6-DOF state estimation system that fuses neuromorphic event cameras with visual-inertial odometry (VIO) for quadrotor drones performing aggressive flight maneuvers. The core problem: conventional frame-based cameras suffer from motion blur at high angular and linear velocities, causing standard VIO pipelines to diverge during maneuvers exceeding **5g acceleration**. Event cameras — which asynchronously report per-pixel brightness changes with microsecond resolution — eliminate motion blur entirely, but require fundamentally different processing architectures.

## Technical Approach

I designed and trained a **PyTorch-based fusion architecture** that combines event camera streams with IMU measurements for continuous 6-DOF pose estimation:

- **Event representation** — Converting asynchronous event streams into tensor representations suitable for deep learning (time surfaces, voxel grids)
- **Temporal fusion** — Recurrent network architecture that fuses event-derived motion cues with IMU angular velocity and acceleration data
- **Training pipeline** — Supervised training on high-speed flight datasets with ground-truth pose from motion capture systems
- **Real-time inference** — Optimized for onboard deployment with ROS integration

The model targets the regime where frame-based vision fails: fast rotations, rapid altitude changes, and aggressive translational accelerations that produce catastrophic motion blur in standard cameras.

## Role

I **designed and trained the fusion architecture** as the primary researcher, working within IRI's robotics group. This involved both the deep learning model design and the systems engineering required to interface with event camera hardware and drone flight controllers.

## Outcome

The system demonstrated **robust state estimation in flight conditions where conventional frame cameras fail**, maintaining accurate pose tracking through maneuvers that cause standard VIO to diverge. This work sits at the frontier of neuromorphic computing applied to robotics — leveraging bio-inspired sensors to extend the operational envelope of autonomous aerial systems.
