const email = 'thermann.ai@gmail.com';

export const author = {
  name: 'Théo Alessandro Hermann',
  monogram: 'T.A.H',
  role: 'Researcher and robotics engineer',
  affiliation: 'MIT Senseable City Lab Rio',
  email,

  bio: [
    'Four years building perception and autonomy systems on edge hardware. Franco-Brazilian, trained in Switzerland. French · English · Portuguese · Spanish.',
    'Computer vision and MLOps at <strong>Roboat</strong> (MIT spinoff) as its first intern, adding camera perception to a stack built on LiDAR. Founding member and research fellow at <strong><a href="https://senseablerio.mit.edu/">MIT Senseable City Lab Rio</a></strong> — 3D reconstruction of dense informal settlements from terrestrial LiDAR, terrain models and building footprints. Research assistant at <a href="https://www.epfl.ch/labs/vita/">EPFL VITA Lab</a>; visiting researcher at <a href="https://www.iri.upc.edu/">IRI (CSIC-UPC)</a>, Barcelona.',
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
        'Founding member of the Rio branch, there from the first week. I work on morphometrics of informal urban form: describing favela fabric from terrain models and building footprints so that wind and sunlight simulation has something defensible to run on. Tech: Python, GeoPandas, point-cloud tooling.',
    },
    {
      role: 'Computer Vision and MLOps Intern (first intern)',
      company: 'Roboat (MIT Spinoff)',
      period: 'Mar 2024 – Aug 2024',
      location: 'Amsterdam, Netherlands',
      summary:
        'Brought camera-based perception to a stack that until then ran on LiDAR: detection and multi-object tracking for autonomous canal vessels on Jetson Orin, and the MLOps around it, with DVC versioning over the on-water recordings the models were trained on. Tech: PyTorch, ROS 2, Docker, DVC.',
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
