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

### Example: Mobile Robot Platform
- **Title:** Custom Mobile Robot Platform
- **Date:** 2021-09-01
- **Summary:** Autonomous mobile robot for navigation and mapping tasks
- **Description:**
  Worked extensively with this mobile robot platform during my Master's thesis. The platform features:
  
  - **Hardware:**
    - LiDAR sensors for SLAM
    - RGB cameras for visual perception
    - Onboard computing unit
    - Differential drive base
  
  - **Software:**
    - ROS (Robot Operating System) for middleware
    - Custom navigation stack
    - Computer vision pipelines
    - Real-time mapping algorithms
  
  - **Applications:**
    - Autonomous navigation in indoor environments
    - 3D mapping and localization
    - Object detection and tracking
  
- **External Link:** 
- **Image:** mobile_robot.jpg
- **Tags:** Mobile Robotics, ROS, SLAM, Computer Vision, Autonomous Navigation
- **Code URL:** 
- **Video URL:** 

---

### Example: Aerial Robot (Drone)
- **Title:** Event Camera-Equipped Drone
- **Date:** 2023-10-01
- **Summary:** Drone platform with event-based vision for high-speed perception
- **Description:**
  Developed and tested event camera integration on drone platforms during my research fellowship. The platform enables:
  
  - High-speed, low-latency perception
  - Dynamic obstacle avoidance
  - Real-time event processing
  
- **External Link:** 
- **Image:** event_drone.jpg
- **Tags:** Drones, Aerial Robotics, Event Cameras, High-Speed Perception
- **Code URL:** 
- **Video URL:** 

---

*(Add more platforms below using the same format)*
