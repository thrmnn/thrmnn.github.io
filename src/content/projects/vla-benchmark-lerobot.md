---
title: 'An open VLA benchmark on lerobot'
subtitle: 'Reproducible evaluations for vision-language-action models in robotics.'
date: 2026-06-01
status: 'Public release · End of June 2026'
summary: 'An open benchmark suite for Vision-Language-Action models, built on HuggingFace lerobot. Standard tasks, standard scoring, runnable from one command. The goal: make VLA comparisons reproducible without each lab maintaining its own evaluation stack.'
register: cartesian
featured: true
featuredOrder: 3
heroAlt: 'lerobot manipulation task running under the benchmark harness'
collaborators: []
links: {}
tags:
  - robotics
  - vla
  - lerobot
  - open-source
  - benchmarks
updated: 2026-05-12
---

## Why

Vision-language-action model papers rarely agree on what counts as a fair evaluation. Tasks differ. Scoring differs. Hardware differs. The result is a literature where any new model can claim improvement against the comparison set the authors chose. A shared, runnable benchmark is the cheapest way to fix this — once the harness exists, the burden of incomparability shifts back to whoever opts out of using it.

## What ships

A repository on top of HuggingFace lerobot that provides:

- A fixed set of manipulation tasks specified down to seed, scene, and instruction
- A standard scoring protocol (success rate, time-to-completion, intervention count)
- A single-command runner that takes a checkpoint and returns a scorecard
- Pre-recorded baselines for current open-weight VLA models

The repo is small on purpose. It does not extend lerobot — it consumes it.

## Status

Public release planned for end of June 2026. Repository link goes live with the announcement.
