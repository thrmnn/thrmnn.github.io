# Projects - Master File

**Updated:** 2026-03-16  
**Source:** Career Experience Base

---

## Your Projects

### Autonomous Boat Perception System
- **Title:** Vision-Based Perception for Autonomous Maritime Vehicles
- **Date:** 2024-08-01
- **Summary:** Real-time perception system for autonomous boats achieving <30ms inference on edge hardware
- **Description:**
  As the first engineering hire at Roboat — a startup spun out of MIT's Senseable City Lab — I built the end-to-end perception system for autonomous vessels navigating the canals of Amsterdam. The core challenge was replacing an expensive LiDAR-only pipeline with a cost-effective, camera-first architecture while maintaining the reliability needed for real-world maritime operations. I designed and deployed a vision-based detection and tracking system running on NVIDIA Jetson Orin edge hardware, achieving sub-30ms inference latency for real-time obstacle avoidance.

  The work spanned the full ML lifecycle: curating a production-grade dataset from over 100 hours of on-water recordings, training object detection models robust to glare, reflections, and dynamic water surfaces, and engineering a complete MLOps pipeline with DVC for reproducible model and dataset versioning. I also developed LiDAR point cloud segmentation algorithms that filter out dynamic water artifacts such as wake patterns and specular reflections — a domain-specific challenge rarely encountered in terrestrial autonomy. This project demonstrated my ability to go from zero to a production perception stack under startup constraints, balancing research-grade accuracy with deployment-ready engineering.

- **External Link:** https://roboat.ai
- **Image:** roboat_perception.jpg
- **Tags:** Computer Vision, MLOps, Autonomous Navigation, LiDAR, Edge Computing, Object Detection, Maritime Robotics
- **Code URL:** 
- **PDF URL:** 
- **Video URL:** 

---

### Autonomous Mobile Robot Navigation
- **Title:** ROS-Based Autonomy Stack for Crowded Environments
- **Date:** 2023-06-01
- **Summary:** Full perception-to-planning pipeline for mobile robots navigating dynamic scenes
- **Description:**
  At EPFL's VITA Lab, I designed and built a complete open-source autonomy stack enabling Loomo Segway robots to navigate safely through crowded, dynamic environments. The system integrates real-time object detection, multi-object tracking, monocular 3D pose estimation, and learned trajectory prediction into a unified ROS pipeline — covering the full perception-to-planning loop required for socially-aware robot navigation. A key design goal was modularity: each component can be independently swapped or benchmarked, making the framework a practical tool for comparing state-of-the-art algorithms on real hardware.

  Unlike many academic navigation projects that remain in simulation, this system was validated end-to-end on physical robots operating among pedestrians. The parallelized ROS/ROS2 architecture ensures real-time performance even with computationally intensive perception modules running simultaneously. The project was released as an open-source contribution to the ROS community, providing a reproducible baseline for mobile robot navigation research. This work deepened my expertise in real-time systems design, sensor-driven planning, and the challenges of bridging the gap between simulation and real-world deployment.

- **External Link:** https://www.epfl.ch/labs/vita/
- **Image:** loomo_autonomy.jpg
- **Tags:** ROS, Autonomous Navigation, Mobile Robotics, Object Tracking, Trajectory Prediction, Real-Time Systems
- **Code URL:** 
- **PDF URL:** 
- **Video URL:** 

---

### Urban Digital Twin for Public Health
- **Title:** LiDAR-Based 3D Reconstruction for Disease Transmission Modeling
- **Date:** 2025-01-01
- **Summary:** Large-scale urban reconstruction enabling physics-based public health simulations in favelas
- **Description:**
  As Research Fellow at MIT Senseable City Lab in Rio de Janeiro, I lead a 10-person technical team building a high-fidelity digital twin of Rio's favelas to model airborne disease transmission. The project fuses data from terrestrial LiDAR scans, aerial multispectral imagery, and digital terrain models into physics-ready 3D meshes of densely built informal settlements — environments where conventional mapping methods fail. These reconstructions feed directly into Computational Fluid Dynamics (CFD) simulations that model ventilation patterns, pollutant dispersion, and pathogen spread at the neighborhood scale, producing actionable insights for urban public health interventions.

  Beyond the computational pipeline, the project includes deploying a network of custom-built air quality sensors across target communities for ground-truth validation of the simulations. This work also draws on my earlier research at MIT Senseable City Lab (Amsterdam), where I developed methods for estimating Leaf Area Index (LAI) from aerial LiDAR — quantifying urban tree canopy density and its effect on local ventilation. Together, these components form a comprehensive framework connecting 3D urban geometry, vegetation, and airflow to public health outcomes. The project operates in close coordination with Rio's city government and community stakeholders, ensuring the research translates into real-world impact.

- **External Link:** https://senseablerio.mit.edu/
- **Image:** digital_twin_favela.jpg
- **Tags:** LiDAR, 3D Modeling, Urban Planning, Public Health, CFD, Digital Twin, IoT, Team Leadership
- **Code URL:** 
- **PDF URL:** 
- **Video URL:** 

---

### Hybrid MPC-RL for Autonomous Racing
- **Title:** Combining Optimal Control and Reinforcement Learning for High-Performance Racing
- **Date:** 2023-12-01
- **Summary:** Hybrid approach enabling advanced autonomous racing behaviors like drifting
- **Description:**
  Semester research project at EPFL BioRob lab combining Model Predictive Control with Reinforcement Learning for F10 racecar in PyBullet simulation. Outperformed standard MPC and accelerated learning while enabling advanced behaviors.
  
  **Key Contributions:**
  - Novel hybrid control architecture combining classical and learning-based methods
  - Demonstrated superior performance and learning efficiency
  - Enabled aggressive maneuvers (drifting) beyond traditional MPC
  
  **Technologies:** Python, PyBullet, Optimal Control, Reinforcement Learning, Autonomous Racing
  
- **External Link:** https://www.epfl.ch/labs/biorob/
- **Image:** mpc_rl_racing.jpg
- **Tags:** Optimal Control, Reinforcement Learning, Autonomous Racing, Simulation, Model Predictive Control
- **Code URL:** 
- **PDF URL:** 
- **Video URL:** 

---

### Event Cameras for Drone State Estimation
- **Title:** High-Speed 6-DOF State Estimation with Event Cameras
- **Date:** 2023-07-01
- **Summary:** Event-based vision fused with VIO for aggressive drone maneuvers
- **Description:**
  Visiting researcher project at IRI (CSIC/UPC) Barcelona developing 6-DOF state estimation model fusing event cameras and visual-inertial odometry. Goal: outperform traditional VIO methods in aggressive flight scenarios where conventional cameras fail.
  
  **Key Contributions:**
  - Developed PyTorch-based fusion model for event cameras + VIO
  - Targeted high-speed aggressive maneuvers where frame-based vision struggles
  - Novel application of event-based sensors to drone control
  
  **Technologies:** PyTorch, Event Cameras, Visual-Inertial Odometry, Drone Control, State Estimation
  
- **External Link:** https://www.iri.upc.edu/
- **Image:** event_drone.jpg
- **Tags:** Event Cameras, VIO, Drone Control, State Estimation, PyTorch, High-Speed Navigation
- **Code URL:** 
- **PDF URL:** 
- **Video URL:** 

---

### Aerial LiDAR Tree Census
- **Title:** Urban Tree Morphology and Canopy Density Estimation
- **Date:** 2024-09-01
- **Summary:** Automated tree census using LiDAR and multispectral imagery for urban forestry
- **Description:**
  For my Master's thesis at MIT Senseable City Lab (Amsterdam), I developed an automated method for large-scale urban tree census using aerial LiDAR and multispectral imagery. The core contribution was a pipeline that extracts individual tree morphological features — crown diameter, height, canopy volume — from airborne LiDAR point clouds and fuses them with spectral vegetation indices derived from multispectral aerial imagery. I trained Random Forest models to predict Leaf Area Index (LAI), a key metric for quantifying canopy density and its influence on urban microclimate, air quality, and stormwater management.

  This work established the methodological foundation for my current research in Rio de Janeiro, where LAI estimation feeds into CFD simulations of urban ventilation in informal settlements. The pipeline demonstrated that tree morphology extracted from remote sensing data can reliably predict canopy density at city scale, enabling urban planners to assess green infrastructure without costly ground-level surveys.

- **External Link:** https://senseable.mit.edu/
- **Image:** tree_census.jpg
- **Tags:** LiDAR, Random Forest, Aerial Imagery, Urban Forestry, Geospatial Analysis, Environmental Science
- **Code URL:** 
- **PDF URL:** 
- **Video URL:** 

---

**Total Projects:** 6  
**Featured:** Top 3 (Roboat, Loomo, Digital Twin)  
**Status:** Ready for website deployment
