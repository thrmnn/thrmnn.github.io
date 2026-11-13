---
title: "Autonomous mobile robot navigation on a Segway Loomo"
date: '2023-06-01T00:00:00Z'
externalLink: 'https://www.epfl.ch/labs/vita/'
github: 'https://github.com/thrmnn/ROS_Autonomous_Driving'
cardImage: '/projects/autonomous-mobile-robot/loomo-card.webp'
image: '/projects/autonomous-mobile-robot/hero-poster.jpg'
imageWidth: 600
imageHeight: 338
summary: "A modular ROS stack for a Segway Loomo at EPFL VITA Lab: person detection, tracking and 3D pose, trajectory prediction, planning and model predictive control, validated end to end on the physical robot."
label: "EPFL VITA Lab · 2022–23"
metric: "End-to-end on the physical robot · code on GitHub"
gradient: "linear-gradient(135deg, #1a3a3a 0%, #2d5a5a 50%, #3a7a7a 100%)"
tags:
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
- **Estimation:** one node turns the IMU stream the Loomo sends into the robot's state, relative to where it started; another builds a map and estimates the state from all its sensors.
- **Prediction:** where the followed person is heading.
- **Planning and control:** a collision-free path, followed with model predictive control.

It keeps the base of C. Conejo Bernal's earlier pipeline (2020–21); I redid its architecture and its perception block in 2022–23, continuing the VITA Lab research line. The perception models and the ROS 1 workspace are pinned to the 2023 stack; the modern successor of the perception is the real-time vision pipeline.

## Why hard

Real-time performance across several computationally intensive perception modules running simultaneously, validated among actual pedestrians, not just in simulation.

## What happened

Validated end-to-end on physical robots (Segway Loomo, EPFL VITA Lab research platform); the code is public on [GitHub](https://github.com/thrmnn/ROS_Autonomous_Driving).

## How the pieces talk

The Loomo runs an Android app that bridges the Segway Java SDK to C++. Over sockets, it sends the server the camera image, the robot's pose and speed, and where the target is. The server sends back the detections it found and the linear and rotation speed commands.

The framework was adapted to help paraplegic patients walk, with the Loomo as an assistant, and the 3D pose of the target served that use. The README links the technical report on the original pipeline (Conejo, Liu, Bahari and Alahi, EPFL VITA Lab). Its last code change was in June 2023.

## Picture credit

The homepage picture is made from frames of the project's own video of the Loomo following a person. The legs are real: the hips, knees and ankles that torchvision's Keypoint R-CNN found on those frames, drawn in the style of EPFL VITA Lab's OpenPifPaf, which did not produce them. The depth view is drawn: the Loomo senses depth with an Intel RealSense stereo camera, but we have no depth frame from the robot, so the cone, the sweep and the lit points are an illustration.
