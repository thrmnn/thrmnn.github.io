---
title: ROS-Based Autonomy Stack for Crowded Environments
date: '2023-06-01T00:00:00Z'
external_link: 'https://www.epfl.ch/labs/vita/'

image:
  caption: ROS-Based Autonomy Stack for Crowded Environments
  filename: projects/loomo_autonomy.jpg
  focal_point: Smart

tags:
  - ROS
  - Autonomous Navigation
  - Mobile Robotics
  - Object Tracking
  - Trajectory Prediction
  - Real-Time Systems

url_code: ''
url_pdf: ''
url_video: ''
url_slides: ''

slides: ''
---

Full perception-to-planning pipeline for mobile robots navigating dynamic scenes

At EPFL's VITA Lab, I designed and built a complete open-source autonomy stack enabling Loomo Segway robots to navigate safely through crowded, dynamic environments. The system integrates real-time object detection, multi-object tracking, monocular 3D pose estimation, and learned trajectory prediction into a unified ROS pipeline — covering the full perception-to-planning loop required for socially-aware robot navigation. A key design goal was modularity: each component can be independently swapped or benchmarked, making the framework a practical tool for comparing state-of-the-art algorithms on real hardware.

Unlike many academic navigation projects that remain in simulation, this system was validated end-to-end on physical robots operating among pedestrians. The parallelized ROS/ROS2 architecture ensures real-time performance even with computationally intensive perception modules running simultaneously. The project was released as an open-source contribution to the ROS community, providing a reproducible baseline for mobile robot navigation research. This work deepened my expertise in real-time systems design, sensor-driven planning, and the challenges of bridging the gap between simulation and real-world deployment.