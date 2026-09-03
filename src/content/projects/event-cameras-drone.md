---
title: "Event Cameras for High-Speed Drone State Estimation"
date: '2023-07-01T00:00:00Z'
externalLink: 'https://www.iri.upc.edu/'
github: 'https://github.com/thrmnn/EVIO'
image: '/projects/event-cameras-drone/hero.svg'
summary: "6-DOF pose estimation through flight maneuvers exceeding 5g acceleration, where conventional frame cameras fail."
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

## Problem

Conventional frame-based cameras suffer motion blur at high angular and linear velocity, causing standard visual-inertial odometry (VIO) to diverge during aggressive quadrotor maneuvers exceeding 5g acceleration.

## Built

A PyTorch fusion architecture combining neuromorphic event-camera streams (asynchronous per-pixel brightness changes, microsecond resolution) with IMU data for continuous 6-DOF pose estimation — event-stream tensor representations, a recurrent temporal-fusion network trained on high-speed flight datasets with motion-capture ground truth, optimized for onboard ROS-integrated inference.

## Why hard

Event cameras eliminate motion blur but require fundamentally different processing than standard frame-based VIO pipelines.

## What happened

The system maintained accurate pose tracking through maneuvers exceeding 5g acceleration — the regime where conventional frame cameras and standard VIO diverge.
