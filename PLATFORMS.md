# Robotics Platforms - Master File

**⚠️ IMPORTANT: This is your single source of truth for robotics platforms you've worked with.**
Edit this file to add/update platforms. Run the sync script to update the website.

---

## How to Use This File

1. **Add a new platform** by creating a new entry below
2. **Format**: Follow the template structure shown
3. **Run sync**: After editing, run `python3 sync_platforms.py` (or manually copy to `content/platform/`)
4. **Images**: Place images in `assets/media/platforms/` and reference them by filename

---

## Platform Entry Template

```markdown
### Platform Name
- **Title:** Platform Name
- **Date:** YYYY-MM-DD (when you started working with it)
- **Summary:** One-line description
- **Description:** Detailed description of the platform and your work with it
- **External Link:** https://example.com (manufacturer website or documentation)
- **Image:** filename.jpg (place in assets/media/platforms/)
- **Tags:** tag1, tag2, tag3 (comma-separated)
- **Code URL:** https://github.com/... (optional - your code using this platform)
- **Video URL:** https://... (optional - demo video)
```

---

## Robotics Platforms You've Worked With

### Thymio Robot
- **Title:** Thymio Educational Robot
- **Date:** 2018-09-01
- **Summary:** Educational mobile robot platform used during studies at EPFL
- **Description:**
  Worked with the Thymio robot during my Bachelor's and Master's studies at EPFL. Thymio is an educational robot designed for learning robotics and programming.
  
  - **Hardware Features:**
    - Proximity sensors (9 IR sensors)
    - Ground sensors
    - Accelerometer
    - Microphone
    - Temperature sensor
    - RGB LEDs for visual feedback
    - Two motors for differential drive
  
  - **Software & Programming:**
    - Visual programming interface (VPL)
    - Aseba programming language
    - Block-based programming for beginners
    - Text-based programming for advanced users
  
  - **Applications & Projects:**
    - Introduction to robotics concepts
    - Sensor integration and data processing
    - Basic navigation and obstacle avoidance
    - Human-robot interaction experiments
    - Educational robotics projects during coursework
  
- **External Link:** https://www.thymio.org/
- **Image:** thymio_robot.jpg
- **Tags:** Educational Robotics, Mobile Robotics, EPFL, Sensor Integration, Programming
- **Code URL:** 
- **Video URL:** 

---

### F1TENTH Autonomous Racing
- **Title:** F1TENTH Autonomous Racing Car (Simulation)
- **Date:** 2021-09-01
- **Summary:** Autonomous racing platform for developing high-speed navigation algorithms in simulation
- **Description:**
  Worked with the F1TENTH platform in simulation to develop autonomous racing algorithms. F1TENTH is a 1/10th scale autonomous racing platform designed for research and education.
  
  - **Platform Features:**
    - 1/10th scale RC car platform
    - LiDAR for perception
    - High-speed autonomous navigation
    - Real-time control algorithms
    - Simulation environment for safe testing
  
  - **Software & Algorithms:**
    - ROS (Robot Operating System)
    - Path planning algorithms
    - Model Predictive Control (MPC)
    - Obstacle avoidance
    - High-speed trajectory optimization
  
  - **Applications:**
    - Autonomous racing algorithms
    - High-speed navigation research
    - Real-time control systems
    - Simulation-based development and testing
  
- **External Link:** https://f1tenth.org/
- **Image:** f1tenth_racing.jpg
- **Tags:** Autonomous Racing, Simulation, ROS, Path Planning, Model Predictive Control, High-Speed Navigation
- **Code URL:** 
- **Video URL:** 

---

### Borinot Drone
- **Title:** Borinot Aerial Robot
- **Date:** 2023-10-01
- **Summary:** Aerial robotics platform used during research fellowship at CSIC-IRII
- **Description:**
  Worked with the Borinot drone platform during my Visiting Research Fellowship at IRI (Institut de Robòtica i Informàtica Industrial, CSIC-UPC) in Barcelona. Borinot is a research-oriented aerial robot platform.
  
  - **Hardware Features:**
    - Quadrotor configuration
    - Onboard computing unit
    - Camera systems for vision
    - Event cameras (during my research)
    - IMU and other sensors
    - Flight controller
  
  - **Software & Research:**
    - ROS for middleware
    - Event-based vision processing
    - Real-time perception algorithms
    - Autonomous flight control
    - Sensor fusion techniques
  
  - **Research Applications:**
    - Event camera integration for drones
    - High-speed perception and navigation
    - Dynamic obstacle avoidance
    - Real-time visual processing
    - Aerial robotics research
  
- **External Link:** https://www.iri.upc.edu/
- **Image:** borinot_drone.jpg
- **Tags:** Aerial Robotics, Drones, Event Cameras, CSIC-IRII, Computer Vision, Autonomous Flight
- **Code URL:** 
- **Video URL:** 

---

### Roboat Autonomous Vessel
- **Title:** Roboat Autonomous Boat
- **Date:** 2023-06-01
- **Summary:** Autonomous vessel platform for maritime navigation and logistics
- **Description:**
  Worked extensively with the Roboat autonomous vessel platform during my position as Computer Vision Software Engineer at Roboat (MIT startup). Roboat develops autonomous boats for urban waterways.
  
  - **Platform Features:**
    - Autonomous vessel for urban waterways
    - RGB cameras for visual perception
    - LiDAR sensors for navigation
    - Onboard computing systems
    - Modular design for various applications
  
  - **Software & Technologies:**
    - ROS (Robot Operating System)
    - Computer vision pipelines
    - LiDAR processing and SLAM
    - MLOps framework (DVC)
    - Detection and tracking algorithms
    - Pose estimation systems
  
  - **Applications & Work:**
    - Autonomous vessel navigation
    - Detection and tracking of boats and obstacles
    - Pose estimation in maritime environments
    - Dataset creation and management
    - Machine learning model training
    - MLOps infrastructure development
  
- **External Link:** https://roboat.tech/
- **Image:** roboat_vessel.jpg
- **Tags:** Autonomous Vessels, Maritime Robotics, Computer Vision, LiDAR, MLOps, Roboat, MIT
- **Code URL:** 
- **Video URL:** 

---
