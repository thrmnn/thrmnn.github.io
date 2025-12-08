---
title: 'Offline Robotic World Model: Learning Robotic Policies without a Physics Simulator'

# Authors
# If you created a profile for a user (e.g. the default `admin` user), write the username (folder name) here
# and it will be replaced with their full name and linked to their profile.
authors:
  - admin
  - Andreas Krause
  - Marco Hutter

# Author notes (optional)
author_notes:
  - 'ETH AI Center, Switzerland'
  - 'Learning & Adaptive Systems Group, ETH Zurich, Switzerland'
  - 'Robotic Systems Lab, ETH Zurich, Switzerland'

date: '2025-04-30T00:00:00Z'
doi: ''

# Schedule page publish date (NOT publication's date).
publishDate: '2017-01-01T00:00:00Z'

# Publication type.
# Accepts a single type but formatted as a YAML list (for Hugo requirements).
# Enter a publication type from the CSL standard.
publication_types: ['paper-conference']

# Publication name and optional abbreviated publication name.
publication: In *arXiv*
publication_short: In *arXiv*

abstract: Reinforcement Learning (RL) has demonstrated impressive capabilities in robotic control but remains challenging due to high sample complexity, safety concerns, and the sim-to-real gap. While offline RL eliminates the need for risky real-world exploration by learning from pre-collected data, it suffers from distributional shift, limiting policy generalization. Model-Based RL (MBRL) addresses this by leveraging predictive models for synthetic rollouts, yet existing approaches often lack robust uncertainty estimation, leading to compounding errors in offline settings. We introduce Offline Robotic World Model (RWM-O), a model-based approach that explicitly estimates epistemic uncertainty to improve policy learning without reliance on a physics simulator. By integrating these uncertainty estimates into policy optimization, our approach penalizes unreliable transitions, reducing overfitting to model errors and enhancing stability. Experimental results show that RWM-O improves generalization and safety, enabling policy learning purely from real-world data and advancing scalable, data-efficient RL for robotics.

# Summary. An optional shortened abstract.
summary: In this work, we propose a model-based reinforcement learning method for robust policy optimization in robotics from offline data.

# tags:
#   - Large Language Models

# Display this page in the Featured widget?
featured: true

# Custom links (uncomment lines below)
links:
- name: Project
  url: 'https://sites.google.com/view/corl2025-rwm-o/home'

url_pdf: 'https://arxiv.org/abs/2504.16680'
url_code: ''
url_dataset: ''
url_poster: ''
url_project: ''
url_slides: ''
url_source: ''
url_video: 'https://www.youtube.com/playlist?list=PLhqs0Oka9VREeEZem0CLuPRJ-ysNHcYGc'

# Featured image
# To use, add an image named `featured.jpg/png` to your page's folder.
image:
  caption: 'Offline Robotic World Model'
  focal_point: ''
  preview_only: false

# Associated Projects (optional).
#   Associate this publication with one or more of your projects.
#   Simply enter your project's folder or file name without extension.
#   E.g. `internal-project` references `content/project/internal-project/index.md`.
#   Otherwise, set `projects: []`.
# projects:
#   - example

# Slides (optional).
#   Associate this publication with Markdown slides.
#   Simply enter your slide deck's filename without extension.
#   E.g. `slides: "example"` references `content/slides/example/index.md`.
#   Otherwise, set `slides: ""`.
# slides: example
---

<!-- {{% callout note %}}
Click the _Cite_ button above to demo the feature to enable visitors to import publication metadata into their reference management software.
{{% /callout %}}

{{% callout note %}}
Create your slides in Markdown - click the _Slides_ button to check out the example.
{{% /callout %}}

Add the publication's **full text** or **supplementary notes** here. You can use rich formatting such as including [code, math, and images](https://docs.hugoblox.com/content/writing-markdown-latex/). -->
