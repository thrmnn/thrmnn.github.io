---
title: "Autonomous mobile robot navigation on a Segway Loomo"
date: '2023-06-01T00:00:00Z'
externalLink: 'https://www.epfl.ch/labs/vita/'
github: 'https://github.com/thrmnn/ROS_Autonomous_Driving'
image: '/projects/autonomous-mobile-robot/hero-poster.jpg'
imageWidth: 600
imageHeight: 338
summary: "A full autonomy stack — SLAM, planning, obstacle avoidance, person-following — validated end-to-end on a physical robot (Segway Loomo, EPFL VITA Lab research platform)."
label: "EPFL VITA Lab · 2023"
metric: "End-to-end on physical robots · open-sourced on GitHub"
gradient: "linear-gradient(135deg, #1a3a3a 0%, #2d5a5a 50%, #3a7a7a 100%)"
tags:
  - SLAM
  - Path Planning
  - Autonomous Navigation
  - Multi-Object Tracking
  - ROS
  - C++
  - OpenCV
  - Mobile Robotics
---

## Problem

Enable Segway Loomo robots to navigate crowded, dynamic indoor environments; most academic navigation systems never leave simulation.

## Built

A modular ROS pipeline that runs on a server and drives the Loomo over a wireless socket link, one package per job:

- **Perception:** person detection (YOLOv5), a single-object tracker that holds on to the person being followed (Stark), and their 2D and 3D keypoints.
- **Estimation:** the robot's state from its IMU and GPS, and a map, with the state estimated from all its sensors.
- **Prediction:** where the followed person is heading.
- **Planning and control:** a collision-free path, followed with model predictive control.

It builds on an earlier autonomous driving pipeline by C. Conejo Bernal; the perception models and the ROS 1 workspace are pinned to the 2023 stack, and its modern successor is the real-time vision pipeline.

## Why hard

Real-time performance across several computationally intensive perception modules running simultaneously, validated among actual pedestrians, not just in simulation.

## What happened

Validated end-to-end on physical robots (Segway Loomo, EPFL VITA Lab research platform); the full stack was open-sourced on GitHub (`github.com/thrmnn/ROS_Autonomous_Driving`).
