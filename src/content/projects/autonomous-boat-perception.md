---
title: "Perception Stack for Autonomous Canal Boats"
date: '2024-08-01T00:00:00Z'
externalLink: 'https://roboat.ai'
summary: "End-to-end perception system for autonomous canal boats achieving <30ms inference on edge hardware, deployed on physical vessels in Amsterdam."
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

End-to-end perception system for autonomous canal boats achieving <30ms inference on edge hardware, deployed on physical vessels in Amsterdam.

## Overview

As the **first engineering hire (perception)** at Roboat — a startup spun out of MIT's Senseable City Lab — I designed and built the entire perception stack from scratch for autonomous vessels navigating Amsterdam's canals. The core challenge was replacing an expensive LiDAR-only pipeline with a cost-effective, camera-first architecture while maintaining the reliability needed for real-world maritime operations.

## Technical Architecture

I designed and deployed a vision-based detection and tracking system running on **NVIDIA Jetson Orin** edge hardware, achieving **sub-30ms inference latency** for real-time obstacle avoidance. The perception stack fuses stereo camera data with LiDAR point clouds for robust 3D scene understanding on water.

Key system components:
- **Object detection** — Custom-trained YOLO models robust to glare, reflections, and dynamic water surfaces
- **Multi-object tracking** — Persistent track management across frames for consistent obstacle identification
- **LiDAR segmentation** — Filtering algorithms that remove dynamic water artifacts (wake patterns, specular reflections) — a domain-specific challenge rarely encountered in terrestrial autonomy
- **Sensor fusion** — Camera-LiDAR alignment for 3D bounding box estimation from 2D detections

## MLOps and Data Pipeline

The work spanned the full ML lifecycle. I built a complete **MLOps pipeline with DVC** for reproducible model and dataset versioning, curating a production-grade dataset from **100+ hours of on-water recordings**. The training pipeline handled the unique distribution of maritime data — high class imbalance between common obstacles (bridges, posts) and rare events (swimmers, kayaks), with extreme appearance variation from water reflections and weather conditions.

## Outcome

The system was **deployed on physical vessels** operating autonomously in Amsterdam's canal network. This project demonstrated the ability to go from zero to a production perception stack under startup constraints, balancing research-grade accuracy with deployment-ready engineering. The camera-first architecture reduced sensor costs significantly while matching the safety requirements of urban maritime navigation.
