const email = 'thermann.ai@gmail.com';

export const author = {
  name: 'Théo Alessandro Hermann',
  monogram: 'T.A.H',
  role: 'Roboticist and urban scientist',
  // Locked 22 Oct (Acervo C-2026-10-22-05), word for word.
  headline: 'Scan. Model. Decipher.',
  subtitle: 'Making hidden structure visible.',
  heroLines: [
    'Research Fellow, MIT Senseable City Lab Rio · MSc Robotics, EPFL',
    'Research: how city form shapes light and air.',
    'Practice: making autonomous systems legible.',
  ],
  affiliation: 'MIT Senseable City Lab Rio',
  email,

  // The owner's locked About text (Acervo C-2026-10-22-07), word for word;
  // only the paragraph breaks and the links are the desk's.
  bio: [
    "I'm Théo, a French-Brazilian roboticist and urban scientist. Paris, São Paulo, Rio, Lausanne, Amsterdam, Barcelona, Stockholm.",
    'I trained in robotics at EPFL, built perception for a person-following robot at <a href="https://www.epfl.ch/labs/vita/">VITA Lab</a> and for an autonomous boat at Roboat, then brought the same tools to cities at <a href="https://senseablerio.mit.edu/">MIT Senseable City Lab</a>.',
    'Wherever I work, the question is the same: what aren\'t we seeing yet that explains how the system behaves? Today I help <a href="https://theohermann.ch">robot makers find out why their systems fail</a>, and I study how city form shapes light and air.',
  ],

  education: [
    {
      degree: "Master's degree (M.Sc), Robotics",
      institution: 'EPFL',
      years: '2021–2024',
      note: 'Thesis on urban tree canopy from aerial LiDAR, with Senseable City Lab, MIT and the AMS Institute.',
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
      role: 'Research Fellow',
      company: 'MIT Senseable City Lab Rio',
      url: 'https://senseablerio.mit.edu/',
      period: 'Jan 2025 – Present',
      location: 'Rio de Janeiro, Brazil',
      summary:
        'There from the first week of the Rio branch. I work on morphometrics of informal urban form: describing favela fabric from terrain models and building footprints so that wind and sunlight simulation has something defensible to run on. Tech: Python, GeoPandas, point-cloud tooling.',
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
        'Redid the architecture and the perception block of the lab’s ROS autonomy stack for mobile robot navigation in crowded environments, continuing the VITA Lab research line. Real-time detection, multi-object tracking, 3D pose estimation, and trajectory prediction on Segway Loomo. Tech: ROS, Python, C++, OpenCV.',
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
