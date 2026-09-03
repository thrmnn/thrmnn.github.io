const email = 'thermann.ai@gmail.com';

export const author = {
  name: 'Théo Alessandro Hermann',
  monogram: 'T.A.H',
  role: 'Independent robotics engineer',
  affiliation: 'MIT Senseable City Lab Rio',
  email,

  bio: [
    '<strong>MSc Robotics, EPFL.</strong> Four years shipping perception and autonomy systems on edge hardware. Franco-Brazilian, trained in Switzerland. French · English · Portuguese · Spanish.',
    'First engineering hire (perception) at <strong>Roboat</strong> (MIT spinoff), through deployment on Amsterdam\'s canals. Research fellow at <strong>MIT Senseable City Lab Rio</strong> — terrestrial LiDAR-based 3D reconstruction of dense informal settlements. Research assistant at EPFL VITA Lab; visiting researcher at IRI (CSIC-UPC), Barcelona.',
  ],

  education: [
    {
      degree: "Master's degree (M.Sc), Robotics",
      institution: 'EPFL',
      years: '2021–2024',
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
    { label: 'Email', href: `mailto:${email}`, icon: 'email' },
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
