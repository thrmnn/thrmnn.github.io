---
title: "Autonomous Mobile Robot Navigation — Segway Loomo"
date: '2023-06-01T00:00:00Z'
externalLink: 'https://www.epfl.ch/labs/vita/'
github: 'https://github.com/thrmnn/ROS_Autonomous_Driving'
image: '/projects/autonomous-mobile-robot/hero-poster.jpg'
imageWidth: 600
imageHeight: 338
summary: "A full autonomy stack — SLAM, planning, obstacle avoidance, person-following — validated end-to-end on a physical robot (Segway Loomo, EPFL VITA Lab research platform)."
label: "EPFL VITA Lab · 2023"
metric: "End-to-end on physical robots · open-sourced on GitHub"
featuredOrder: 4
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

A complete ROS autonomy stack — SLAM (GMapping/Cartographer) producing occupancy grids, an A* global planner with dynamic replanning, costmap-based reactive obstacle avoidance, and vision-based person-following with multi-object tracking and trajectory prediction.

## Why hard

Real-time performance across several computationally intensive perception modules running simultaneously, validated among actual pedestrians, not just in simulation.

## What happened

Validated end-to-end on physical robots (Segway Loomo, EPFL VITA Lab research platform); the full stack was open-sourced on GitHub (`github.com/thrmnn/ROS_Autonomous_Driving`).
