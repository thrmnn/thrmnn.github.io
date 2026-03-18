---
title: Vision-Based Perception for Autonomous Maritime Vehicles
date: '2024-08-01T00:00:00Z'
external_link: 'https://roboat.ai'

image:
  caption: Vision-Based Perception for Autonomous Maritime Vehicles
  filename: projects/roboat_perception.jpg
  focal_point: Smart

tags:
  - Computer Vision
  - MLOps
  - Autonomous Navigation
  - LiDAR
  - Edge Computing
  - Object Detection
  - Maritime Robotics

url_code: ''
url_pdf: ''
url_video: ''
url_slides: ''

slides: ''
---

Real-time perception system for autonomous boats achieving <30ms inference on edge hardware

As the first engineering hire at Roboat — a startup spun out of MIT's Senseable City Lab — I built the end-to-end perception system for autonomous vessels navigating the canals of Amsterdam. The core challenge was replacing an expensive LiDAR-only pipeline with a cost-effective, camera-first architecture while maintaining the reliability needed for real-world maritime operations. I designed and deployed a vision-based detection and tracking system running on NVIDIA Jetson Orin edge hardware, achieving sub-30ms inference latency for real-time obstacle avoidance.

The work spanned the full ML lifecycle: curating a production-grade dataset from over 100 hours of on-water recordings, training object detection models robust to glare, reflections, and dynamic water surfaces, and engineering a complete MLOps pipeline with DVC for reproducible model and dataset versioning. I also developed LiDAR point cloud segmentation algorithms that filter out dynamic water artifacts such as wake patterns and specular reflections — a domain-specific challenge rarely encountered in terrestrial autonomy. This project demonstrated my ability to go from zero to a production perception stack under startup constraints, balancing research-grade accuracy with deployment-ready engineering.