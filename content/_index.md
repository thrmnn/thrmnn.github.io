---
# Leave the homepage title empty to use the site title
title: ""
date: 2025-03-08
type: landing

design:
  # Default section spacing
  spacing: "6rem"

sections:
  # 1. Hero
  - block: hero
    content:
      title: |
        <br/>From Autonomous Robots<br/>to 3D Urban Intelligence
      text: |
        Research Fellow at MIT Senseable City Lab — building AI systems that work in the physical world.
      primary_action:
        text: View Research
        url: /#publications
        icon: academic-cap
      secondary_action:
        text: AI Consulting →
        url: https://landing-seven-olive-75.vercel.app
    design:
      background:
        image:
          filename: hero_picture.jpg
          filters:
            brightness: 0.4
        text_color_light: true

  # 2. About / Biography
  - block: resume-biography-3
    id: about
    content:
      username: admin
      text: ""
      button:
        text: Download CV
        url: uploads/resume.pdf
    design:
      css_class: dark
      background:
        color: '#242424'

  # 3. Publications
  - block: collection
    id: publications
    content:
      title: Publications
      count: 0
      filters:
        folders:
          - publication
    design:
      view: date-title-summary
      columns: 2

  # 4. Selected Talks
  - block: markdown
    id: talks
    content:
      title: Selected Talks
      text: |-
        | Date | Talk | Venue |
        |------|------|-------|
        | **Nov 2025** | LiDAR-Informed 3D Modeling of Favelas for Public Health Research | [AGU Fall Meeting](https://www.agu.org/fall-meeting), San Francisco |
        | **Jan 2025** | Developmental Legged Intelligence: from Imitation to Generation | [Sony AI](https://ai.sony/), Tokyo |
        | **Mar 2024** | Leveraging Spatial-Temporal Structures in Self-supervised Motion Representation and Learning | [CMU Robotics Institute](https://www.ri.cmu.edu/), Pittsburgh |

        [See all talks →](/event)
    design:
      columns: 1

  # 5. News
  - block: markdown
    id: news
    content:
      title: News
      text: |-
        <div style="max-height: 500px; overflow-y: auto;">
          <details open>
            <summary><strong>2025</strong></summary>
            <div style="margin-left:6px; padding-left:20px; border-left:1px solid;">
              <p><strong>November 2025</strong> — Poster and abstract accepted at <strong>AGU Fall Meeting 2025</strong> on LiDAR-Informed 3D Modeling of Favelas for Public Health Research.</p>
              <p><strong>January 2025</strong> — Joined <strong>MIT Senseable City Lab</strong> in Rio de Janeiro as Research Fellow, leading a 10-person team on urban digital twins for public health.</p>
            </div>
          </details>
          <details open>
            <summary><strong>2024</strong></summary>
            <div style="margin-left:6px; padding-left:20px; border-left:1px solid;">
              <p><strong>September 2024</strong> — Defended Master's thesis at EPFL: <em>Urban Tree Morphology and Canopy Density Estimation from Aerial LiDAR</em>, conducted at MIT Senseable City Lab Amsterdam.</p>
              <p><strong>March 2024</strong> — Joined <strong>Roboat</strong> (MIT spinoff) as first engineering hire. Built end-to-end perception system for autonomous vessels in Amsterdam.</p>
            </div>
          </details>
          <details>
            <summary><strong>2023</strong></summary>
            <div style="margin-left:6px; padding-left:20px; border-left:1px solid;">
              <p><strong>October 2023</strong> — Started visiting research at <strong>IRI (CSIC-UPC)</strong>, Barcelona, on event cameras for high-speed drone state estimation.</p>
              <p><strong>June 2023</strong> — Completed research assistantship at <strong>EPFL VITA Lab</strong>, building an open-source ROS autonomy stack for mobile robot navigation.</p>
            </div>
          </details>
          <details>
            <summary><strong>2022</strong></summary>
            <div style="margin-left:6px; padding-left:20px; border-left:1px solid;">
              <p><strong>September 2022</strong> — Started as Teaching Assistant at EPFL for General Physics and Mobile Robotics.</p>
              <p><strong>June 2022</strong> — Joined <strong>VITA Lab</strong> at EPFL as Research Assistant under Dr. Alexandre Alahi.</p>
            </div>
          </details>
          <details>
            <summary><strong>2021</strong></summary>
            <div style="margin-left:6px; padding-left:20px; border-left:1px solid;">
              <p><strong>September 2021</strong> — Started <strong>MSc in Robotics</strong> at EPFL.</p>
              <p><strong>June 2021</strong> — Completed exchange year at <strong>KTH Royal Institute of Technology</strong>, Stockholm.</p>
            </div>
          </details>
        </div>
    design:
      columns: 2

  # 6. Projects
  - block: collection
    id: projects
    content:
      title: Research Projects
      subtitle: Selected Projects
      count: 0
      filters:
        folders:
          - project
    design:
      view: card
      columns: 2

  # 7. Contact
  - block: markdown
    id: contact
    content:
      title: Contact Me
    design:
      spacing:
        padding: [0, 0, 0, 0]
  - block: cta-button-list
    content:
      buttons:
        - text: E-mail
          icon: at-symbol
          url: mailto:thermann@mit.edu
        - text: Connect
          icon: brands/linkedin
          url: https://www.linkedin.com/in/theohermann-epfl/
    design:
      columns: 2
---
