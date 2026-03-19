---
title: "Autonomous Mobile Robot Navigation — Segway Loomo"
date: '2023-06-01T00:00:00Z'
external_link: 'https://www.epfl.ch/labs/vita/'

image:
  caption: "Autonomous Mobile Robot Navigation — Segway Loomo"
  filename: projects/loomo_autonomy.jpg
  focal_point: Smart

tags:
  - ROS
  - SLAM
  - Path Planning
  - OpenCV
  - Python
  - C++
  - Mobile Robotics
  - Autonomous Navigation
  - Object Tracking

url_code: ''
url_pdf: ''
url_video: ''
url_slides: ''

slides: ''
---

Full autonomy stack on Segway Loomo: SLAM-based mapping, path planning, obstacle avoidance, and person following deployed in real indoor environments.

## Overview

At EPFL's VITA Lab, I implemented a **complete autonomy stack** enabling Segway Loomo robots to navigate safely through crowded, dynamic indoor environments. The system covers the full perception-to-planning loop: SLAM-based mapping, A* path planning, real-time obstacle avoidance, and person-following behavior. Unlike many academic navigation projects that remain in simulation, this system was validated **end-to-end on physical robots** operating among pedestrians.

## Technical Architecture

The system integrates multiple perception and planning modules into a unified ROS pipeline:

- **SLAM** — Real-time map building using GMapping and Cartographer, producing occupancy grids of indoor environments
- **Path planning** — A* global planner with dynamic replanning, operating on the live occupancy grid
- **Obstacle avoidance** — Local costmap-based reactive avoidance using depth sensing
- **Person following** — Vision-based detection and tracking for social robot interactions
- **Multi-object tracking** — Persistent pedestrian tracking with monocular 3D pose estimation and learned trajectory prediction

A key design goal was **modularity**: each component can be independently swapped or benchmarked, making the framework a practical tool for comparing state-of-the-art algorithms on real hardware.

## Role

I was responsible for the **full stack implementation** — from hardware integration and sensor calibration on the Loomo platform through to high-level behavior design. The parallelized ROS/ROS2 architecture ensures real-time performance even with computationally intensive perception modules running simultaneously.

## Outcome

The project was released as an **open-source contribution** to the ROS community, providing a reproducible baseline for mobile robot navigation research. This work deepened my expertise in real-time systems design, sensor-driven planning, and the challenges of bridging the sim-to-real gap.
