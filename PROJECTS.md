# Projects Portfolio

**Updated:** 2026-03-16  
**Source:** Career Experience Base

---

## 1. Autonomous Boat Perception System (Roboat)

**Organization:** Roboat (MIT Spinoff)  
**Role:** Perception Engineer (First Engineering Hire)  
**Duration:** March 2024 - August 2024  
**Location:** Amsterdam, Netherlands

### Challenge
Built perception system for autonomous boats operating in challenging maritime environments with water glare, weather variations, and small dynamic obstacles (boat wake, reflections).

### Solution
- Architected transition from LiDAR to cost-effective vision-based perception
- Trained and deployed object detection models (obstacles, different boat types) on Jetson Orin
- Developed LiDAR point cloud segmentation model filtering dynamic water artifacts
- Engineered full MLOps pipeline (DVC) enabling rapid iteration with model/dataset versioning

### Impact
- ✅ Achieved <30ms real-time inference on edge hardware
- ✅ Built production dataset from 100+ hours of real-world maritime data
- ✅ Integrated with SLAM for robust localization
- ✅ Enabled startup to deploy cost-effective vision-based system

### Technologies
Python, PyTorch, Jetson Orin, DVC, LiDAR, SLAM, Computer Vision, MLOps, Object Detection

### Links
- Company: [Roboat](https://roboat.ai)
- Status: Production deployment

---

## 2. Autonomous Mobile Robot Navigation (Loomo Segway)

**Organization:** VITA Lab, EPFL  
**Role:** Research Assistant  
**Duration:** June 2022 - June 2023  
**Location:** Lausanne, Switzerland

### Challenge
Develop autonomous navigation system for mobile robots operating in crowded, dynamic environments with real-time perception and trajectory prediction requirements.

### Solution
- Built full ROS-based autonomy stack integrating detection, tracking, 3D pose estimation, and learned trajectory prediction
- Deployed multiple ML models for perception with modular framework enabling algorithm comparison
- Optimized perception and navigation through parallelized ROS node architecture
- Conducted extensive real-world testing validating perception-prediction-planning pipeline

### Impact
- ✅ Real-time performance in dynamic scenes with crowds
- ✅ Modular architecture enabling rapid algorithm iteration
- ✅ Physical robot validation (not just simulation)
- ✅ Open-source contribution to ROS community

### Technologies
ROS/ROS2, Python, C++, Object Detection, Tracking, 3D Pose Estimation, Trajectory Prediction, Mobile Robotics

### Links
- Lab: [VITA Lab, EPFL](https://www.epfl.ch/labs/vita/)
- Status: Research project (published)

---

## 3. Urban Digital Twin for Public Health

**Organization:** MIT Senseable City Lab  
**Role:** Technical Team Lead & Research Fellow  
**Duration:** January 2025 - Present  
**Location:** Rio de Janeiro, Brazil

### Challenge
Build high-fidelity 3D urban reconstruction pipeline for CFD simulations of airborne disease transmission in favela communities, requiring multi-modal data fusion and physics-ready mesh generation.

### Solution
- Led 10-person technical team coordinating with city government and community stakeholders
- Architected 3D reconstruction pipeline fusing terrestrial LiDAR, aerial imagery segmentation, and digital terrain models
- Built computational geometry workflows processing point clouds and rasters into physics-ready 3D meshes
- Deployed DIY air quality sensor network for validation

### Impact
- ✅ Large-scale digital twins enabling public health simulations
- ✅ Community-engaged research with real-world deployment
- ✅ Multi-stakeholder coordination (technical, government, community)
- ✅ Novel application of robotics/3D reconstruction to public health

### Technologies
LiDAR Processing, 3D Reconstruction, Aerial Imagery Segmentation, Computational Geometry, CFD Integration, IoT Sensors, Team Leadership

### Links
- Lab: [MIT Senseable City Lab - Rio](https://senseablerio.mit.edu/)
- Status: Ongoing research-to-deployment

---

## Additional Projects

### Hybrid MPC-RL for Autonomous Racing (EPFL BioRob)
**Type:** Semester Research Project

Combined Model Predictive Control with Reinforcement Learning for F10 racecar in PyBullet simulation. Outperformed standard MPC and enabled advanced behaviors like drifting.

**Technologies:** Python, PyBullet, Optimal Control, Reinforcement Learning

---

### Event Cameras for High-Speed Drone State Estimation (IRI Barcelona)
**Type:** Visiting Researcher Project

Developed 6-DOF state estimation model fusing event cameras and visual-inertial odometry for aggressive drone flight using PyTorch. Goal: outperform traditional VIO in rapid maneuver scenarios.

**Technologies:** PyTorch, Event Cameras, VIO, Drone Control, State Estimation

---

### Aerial LiDAR Tree Census (Master's Thesis, MIT SCL)
**Type:** Master's Thesis

Developed automated tree census method using multispectral aerial imagery and LiDAR. Trained Random Forest models to predict Leaf Area Index (LAI) from tree morphology.

**Technologies:** LiDAR, Random Forest, Aerial Imagery, Geospatial Analysis, Environmental Monitoring

---

**Portfolio Status:** Ready for website deployment  
**Featured Projects:** Top 3 showcasing research, startup, and leadership experience
