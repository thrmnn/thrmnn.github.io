export const author = {
  name: 'Théo Alessandro Hermann',
  monogram: 'T.A.H',
  role: 'Researcher & Perception Engineer',
  affiliation: 'MIT Senseable City Lab Rio',
  email: 'thermann@mit.edu',

  bio: [
    'Researcher and builder. <strong>MSc Robotics, EPFL</strong> · 3 years shipping perception and autonomy systems on edge hardware · Franco-Brazilian, trained in Switzerland.',
    'Founding member of <strong>MIT Senseable City Lab Rio</strong> — researcher on the 3D digital twins of favelas line, reconstructing dense informal settlements from LiDAR for public health work. On the side, building open-source robotics software.',
    'Previously first engineering hire at <strong>Roboat</strong> (MIT spinoff) — built the full perception stack for autonomous canal vessels, sub-30ms on Jetson Orin, deployed in Amsterdam. Open to senior <strong>perception, computer vision, and robotics</strong> roles at companies pushing physical AI forward.',
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
      role: 'Research Fellow — Founding Member, Rio branch',
      company: 'MIT Senseable City Lab Rio',
      url: 'https://senseablerio.mit.edu/',
      period: 'Jan 2025 – Present',
      location: 'Rio de Janeiro, Brazil',
      summary:
        'Researcher on the urban-digital-twin line — high-fidelity 3D reconstructions of favelas from terrestrial LiDAR and aerial imagery, feeding OpenFOAM CFD simulations of airborne disease transmission. Tech: Python, Blender, GeoPandas, Google Earth Engine.',
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
    { label: 'GitHub', href: 'https://github.com/thrmnn', icon: 'github' },
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/theohermann-epfl/', icon: 'linkedin' },
  ],

  languages: [
    { name: 'French', level: 'Native' },
    { name: 'English', level: 'Fluent' },
    { name: 'Portuguese', level: 'Fluent' },
    { name: 'Spanish', level: 'Conversational' },
  ],
};
