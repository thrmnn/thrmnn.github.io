export const author = {
  name: 'Théo Hermann',
  role: 'Perception & Robotics Engineer',
  affiliation: 'MIT Senseable City Lab',
  email: 'thermann@mit.edu',

  bio: [
    '<strong>MSc Robotics, EPFL</strong> · 4+ years building perception and autonomy systems · Python, C++, PyTorch, ROS · Shipped production on edge hardware.',
    'Founding member of <strong>MIT Senseable City Lab</strong> Rio — building city-scale 3D digital twins from LiDAR for public health (10-person group, 3 institutions). Previously first engineering hire at <strong>Roboat</strong> (MIT spinoff) — built the full perception stack for autonomous vessels, sub-30ms on Jetson Orin, deployed in Amsterdam.',
    'Full stack from sensor fusion to edge deployment. Looking for senior perception or robotics roles at companies pushing physical AI forward.',
  ],

  interests: [
    'Perception & Sensor Fusion',
    'Autonomous Systems',
    '3D Reconstruction & LiDAR',
    'Robot Learning',
    'Edge Deployment & MLOps',
  ],

  education: [
    {
      degree: "Master's degree (M.Sc), Robotics",
      institution: 'EPFL',
      years: '2021–2023',
    },
    {
      degree: 'Exchange (B.Sc 3rd year), Embedded Systems',
      institution: 'KTH Royal Institute of Technology',
      years: '2020–2021',
    },
    {
      degree: "Bachelor's degree (B.Sc), Microengineering",
      institution: 'EPFL',
      years: '2018–2021',
    },
  ],

  experience: [
    {
      role: 'Research Fellow — Founding Member',
      company: 'MIT Senseable City Lab',
      url: 'https://senseablerio.mit.edu/',
      period: 'Jan 2025 – Present',
      location: 'Rio de Janeiro, Brazil',
      summary:
        'Founding member of the Rio branch (now 10 researchers, 3 institutions). Building high-fidelity 3D digital twins of favelas from terrestrial LiDAR and aerial imagery — reconstructions feed OpenFOAM CFD simulations of airborne disease transmission. Tech: Python, Blender, GeoPandas, Google Earth Engine.',
    },
    {
      role: 'Perception Engineer — First Engineering Hire',
      company: 'Roboat (MIT Spinoff)',
      url: 'https://roboat.ai',
      period: 'Mar 2024 – Aug 2024',
      location: 'Amsterdam, Netherlands',
      summary:
        'Designed and shipped end-to-end perception stack for autonomous canal vessels. YOLO-based detection + multi-object tracking at <30ms on Jetson Orin. Built full MLOps pipeline with DVC over 100+ hours of maritime data. LiDAR point cloud segmentation for dynamic water filtering. Tech: PyTorch, ROS2, Docker, DVC.',
    },
    {
      role: 'Visiting Research Fellow',
      company: 'IRI (CSIC-UPC)',
      url: 'https://www.iri.upc.edu/',
      period: 'Oct 2023 – Feb 2024',
      location: 'Barcelona, Spain',
      summary:
        'Built PyTorch fusion model combining neuromorphic event cameras with visual-inertial odometry for 6-DOF drone state estimation during aggressive maneuvers (>5g). Tech: PyTorch, ROS, C++.',
    },
    {
      role: 'Research Assistant',
      company: 'VITA Lab, EPFL',
      url: 'https://www.epfl.ch/labs/vita/',
      period: 'Jun 2022 – Jun 2023',
      location: 'Lausanne, Switzerland',
      summary:
        'Built and open-sourced a full ROS autonomy stack for mobile robot navigation in crowded environments. Real-time detection, multi-object tracking, 3D pose estimation, and trajectory prediction on Segway Loomo. Tech: ROS, Python, C++, OpenCV.',
    },
  ],

  social: [
    { label: 'Email', href: 'mailto:thermann@mit.edu', icon: 'email' },
    { label: 'GitHub', href: 'https://github.com/theoh-io', icon: 'github' },
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/theohermann-epfl/', icon: 'linkedin' },
    { label: 'Google Scholar', href: 'https://scholar.google.com/citations?user=SYHaPDAAAAAJ&hl=en', icon: 'scholar' },
  ],

  languages: [
    { name: 'French', level: 'Native' },
    { name: 'English', level: 'Fluent' },
    { name: 'Portuguese', level: 'Fluent' },
    { name: 'Spanish', level: 'Conversational' },
  ],
};
