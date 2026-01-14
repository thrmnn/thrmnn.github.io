---
# Leave the homepage title empty to use the site title
title: ""
date: 2025-03-08
type: landing

design:
  # Default section spacing
  spacing: "6rem"

sections:
  - block: hero
    demo: false # Only display this section in the Hugo Blox Builder demo site
    content:
      title: <br/><br/>From Autonomous Robots to 3D Urban Intelligence
    design:
      background:
        image:
          filename: hero_picture.jpg
          filters:
            brightness: 0.5
        text_color_light: true
  - block: resume-biography-3
    id: about
    content:
      # Choose a user profile to display (a folder name within `content/authors/`)
      username: admin
      text: ""
      # Show a call-to-action button under your biography? (optional)
      button:
        text: Download CV
        url: uploads/resume.pdf
    design:
      css_class: dark
      background:
        color: '#242424'
        # image:
        #   # Add your image background to `assets/media/`.
        #   filename: stacked-peaks.svg
        #   filters:
        #     brightness: 1.0
        #   size: cover
        #   position: center
        #   parallax: false
  # - block: markdown
  #   content:
  #     title: '📚 My Research'
  #     subtitle: ''
  #     text: |-
  #       Use this area to speak to your mission. I'm a research scientist in the Moonshot team at DeepMind. I blog about machine learning, deep learning, and moonshots.

  #       I apply a range of qualitative and quantitative methods to comprehensively investigate the role of science and technology in the economy.
        
  #       Please reach out to collaborate 😃
  #   design:
  #     columns: '1'
  # - block: collection
  #   id: news
  #   content:
  #     title: News
  #     subtitle: ''
  #     text: ''
  #     # Page type to display. E.g. post, talk, publication...
  #     page_type: post
  #     # Choose how many pages you would like to display (0 = all pages)
  #     count: 0
  #     # Filter on criteria
  #     filters:
  #       author: ""
  #       category: ""
  #       tag: ""
  #       exclude_featured: false
  #       exclude_future: false
  #       exclude_past: false
  #       publication_type: ""
  #     # Choose how many pages you would like to offset by
  #     offset: 0
  #     # Page order: descending (desc) or ascending (asc) date.
  #     order: desc
  #   design:
  #     # Choose a layout view
  #     view: date-title-summary
  #     # Reduce spacing
  #     spacing:
  #       padding: [0, 0, 0, 0]
  - block: markdown
    id: news
    content:
      title: News
      text: |-
        <div style="height: 600px; width: 1000px; overflow-y: scroll; align-items: center;">
          <details open>
            <summary>
              <strong>2025</strong>
            </summary>
            <!-- <blockquote> -->
            <div style="margin-left:6px; padding-left:20px; border-left:1px solid;">
              <p><strong>November 2025</strong> - Paper accepted at AGU Fall Meeting 2025 on LiDAR-Informed 3D Modeling of Favelas for Public Health Research</p>
            </div>
            <!-- </blockquote> -->
          </details>
          <details open>
            <summary>
              <strong>2024</strong>
            </summary>
            <!-- <blockquote> -->
            <div style="margin-left:6px; padding-left:20px; border-left:1px solid;">
              <p></p>
            </div>
            <!-- </blockquote> -->
          </details>
          <details open>
            <summary>
              <strong>2023</strong>
            </summary>
            <!-- <blockquote> -->
            <div style="margin-left:6px; padding-left:20px; border-left:1px solid;">
              <p></p>
            </div>
            <!-- </blockquote> -->
          </details>
          <p></p>
          <details>
            <summary>
              <strong>2022</strong>
            </summary>
            <!-- <blockquote> -->
            <div style="margin-left:6px; padding-left:20px; border-left:1px solid;">
              <p></p>
            </div>
            <!-- </blockquote> -->
          </details>
          <p></p>
          <details>
            <summary>
              <strong>2021</strong>
            </summary>
            <!-- <blockquote> -->
            <div style="margin-left:6px; padding-left:20px; border-left:1px solid;">
              <p></p>
              <!-- Add your news entries here -->
            </div>
            <!-- </blockquote> -->
          </details>
          <p></p>
          <details>
            <summary>
              <strong>2020</strong>
            </summary>
            <!-- <blockquote> -->
            <div style="margin-left:6px; padding-left:20px; border-left:1px solid;">
              <p></p>
              <!-- Add your news entries here -->
            </div>
            <!-- </blockquote> -->
          </details>
          <p></p>
          <details>
            <summary>
              <strong>2019</strong>
            </summary>
            <!-- <blockquote> -->
            <div style="margin-left:6px; padding-left:20px; border-left:1px solid;">
              <p></p>
              <!-- Add your news entries here -->
            </div>
            <!-- </blockquote> -->
          </details>
          <p></p>
          <details>
            <summary>
              <strong>2018</strong>
            </summary>
            <!-- <blockquote> -->
            <div style="margin-left:6px; padding-left:20px; border-left:1px solid;">
              <p></p>
              <!-- Add your news entries here -->
            </div>
            <!-- </blockquote> -->
          </details>
          <p></p>
          <details>
            <summary>
              <strong>2016</strong>
            </summary>
            <!-- <blockquote> -->
            <div style="margin-left:6px; padding-left:20px; border-left:1px solid;">
              <p></p>
              <!-- Add your news entries here -->
            </div>
            <!-- </blockquote> -->
          </details>
        </div>
    design:
      columns: 2
  # Temporarily disabled due to Hugo version compatibility - will re-enable after updating template or Hugo version
  # - block: collection
  #   id: publications
  #   content:
  #     title: Featured Publications
  #     count: 0
  #     filters:
  #       folders:
  #         - publication
  #       featured_only: true
  #   design:
  #     view: citation
  #     columns: 2
  # - block: collection
  #   content:
  #     title: Recent Publications
  #     text: ""
  #     count: 0
  #     filters:
  #       folders:
  #         - publication
  #       exclude_featured: false
  #   design:
  #     view: citation
  - block: resume-experience
    id: experience
    content:
      username: admin
    design:
      # Hugo date format
      date_format: 'January 2006'
      # Education or Experience section first?
      is_education_first: false
  # Temporarily disabled due to Hugo version compatibility - will update when adding your content
  # - block: collection
  #   id: posts
  #   content:
  #     title: Posts
  #     count: 0
  #     filters:
  #       folders:
  #         - post
  #   design:
  #     view: article-grid
  #     columns: 2
  # - block: collection
  #   id: talks
  #   content:
  #     title: Recent & Upcoming Talks
  #     count: 0
  #     filters:
  #       folders:
  #         - event
  #   design:
  #     view: article-grid
  #     columns: 2
  - block: collection
    id: platforms
    content:
      title: Robotic Platforms
      subtitle: Platforms I've Worked With
      count: 0
      filters:
        folders:
          - platform
    design:
      view: card
      columns: 2
  - block: markdown
    id: contact
    content:
      title: Contact Me
    design:
      # Reduce spacing
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
  # - block: cta-card
  #   demo: true # Only display this section in the Hugo Blox Builder demo site
  #   content:
  #     title: 👉 Build your own academic website like this
  #     text: |-
  #       This site is generated by Hugo Blox Builder - the FREE, Hugo-based open source website builder trusted by 250,000+ academics like you.

  #       <a class="github-button" href="https://github.com/HugoBlox/hugo-blox-builder" data-color-scheme="no-preference: light; light: light; dark: dark;" data-icon="octicon-star" data-size="large" data-show-count="true" aria-label="Star HugoBlox/hugo-blox-builder on GitHub">Star</a>

  #       Easily build anything with blocks - no-code required!
        
  #       From landing pages, second brains, and courses to academic resumés, conferences, and tech blogs.
  #     button:
  #       text: Get Started
  #       url: https://hugoblox.com/templates/
  #   design:
  #     card:
  #       # Card background color (CSS class)
  #       css_class: "bg-primary-700"
  #       css_style: ""
---
