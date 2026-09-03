---
title: "Perception Stack for Autonomous Canal Boats"
date: '2024-08-01T00:00:00Z'
featuredOrder: 1
proprietary: true
image: '/projects/autonomous-boat-perception/hero.svg'
summary: "First engineering hire at Roboat (MIT spinoff) — camera-first perception stack, sub-30ms inference on Jetson Orin, deployed on canal vessels in Amsterdam."
label: "Roboat (MIT spin-off) · 2024"
metric: "<30ms inference · 100+ hours on-water data · deployed in Amsterdam"
gradient: "linear-gradient(135deg, #1a1a3e 0%, #2a2a5e 50%, #3a3a7e 100%)"
tags:
  - Object Detection
  - Sensor Fusion
  - Multi-Object Tracking
  - PyTorch
  - YOLO
  - ROS 2
  - Jetson Orin
  - Edge Deployment
---

## Problem

As the first engineering hire (perception) at Roboat, a startup spun out of MIT's Senseable City Lab, the challenge was replacing an expensive LiDAR-only pipeline with a cost-effective, camera-first architecture for autonomous vessels navigating Amsterdam's canals — while keeping the reliability real-world maritime operations require.

## Built

A vision-based detection and tracking system on NVIDIA Jetson Orin edge hardware — custom-trained YOLO models robust to glare, reflections, and dynamic water surfaces; persistent multi-object tracking across frames; a full MLOps pipeline with DVC for reproducible model and dataset versioning, built over 100+ hours of on-water recordings.

## Why hard

Maritime data carries heavy class imbalance (common obstacles vs. rare events like swimmers or kayaks) and extreme appearance variation from water reflections and weather.

## What happened

Sub-30ms inference latency on Jetson Orin; the system was deployed on physical vessels operating autonomously in Amsterdam's canal network.
