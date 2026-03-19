---
title: "Hybrid MPC-RL for Autonomous Racing"
date: '2023-12-01T00:00:00Z'
external_link: 'https://www.epfl.ch/labs/biorob/'

image:
  caption: "Hybrid MPC-RL for Autonomous Racing"
  filename: projects/mpc_rl_racing.jpg
  focal_point: Smart

tags:
  - Model Predictive Control
  - Reinforcement Learning
  - PPO
  - Stable-Baselines3
  - Python
  - ROS
  - Autonomous Racing
  - F1Tenth

url_code: ''
url_pdf: ''
url_video: ''
url_slides: ''

slides: ''
---

Hybrid control architecture combining Model Predictive Control with Reinforcement Learning for high-speed autonomous racing, enabling aggressive maneuvers beyond classical MPC limits.

## Overview

As a semester research project at **EPFL's BioRob Lab**, I designed a hybrid control architecture that combines **Model Predictive Control (MPC)** with **Reinforcement Learning (RL)** for autonomous racing on the F1Tenth platform. The key insight: MPC provides strong safety guarantees and respects vehicle dynamics constraints, but is limited by the accuracy of its dynamics model and struggles with aggressive maneuvers like controlled drifting. RL can discover policies that exploit the full dynamics envelope, but lacks safety guarantees and suffers from sample-inefficient training. The hybrid approach uses MPC as a safety-constrained base controller while RL learns a residual policy that pushes performance beyond what classical control achieves alone.

## Technical Approach

The architecture combines classical optimal control with modern policy learning:

- **MPC base layer** — Solves a constrained optimization problem over a receding horizon, enforcing track boundaries and vehicle dynamics limits
- **RL residual policy** — A PPO agent (Stable-Baselines3) learns corrective actions on top of MPC outputs, optimizing for lap time while the MPC layer ensures constraint satisfaction
- **Reward shaping** — Custom reward function balancing lap time minimization, trajectory smoothness, and track boundary penalties
- **Simulation environment** — F1Tenth simulator with realistic tire dynamics and track geometries

The hybrid architecture significantly **accelerated RL training** by providing a strong MPC prior — the agent starts from competent driving behavior rather than random exploration, reducing training from scratch by orders of magnitude.

## Role

I was responsible for the **full algorithm design and implementation**, working within EPFL's autonomous racing research group. This included the MPC formulation, RL training pipeline, reward engineering, and simulation benchmarking.

## Outcome

The hybrid controller **outperformed standalone MPC** in lap time while maintaining safety constraint satisfaction, and achieved **faster convergence than pure RL**. The system enabled aggressive driving behaviors — including controlled drifting through tight corners — that exceed the capability of classical MPC alone. This work demonstrated that combining model-based and learning-based control is a practical approach to pushing the performance frontier in autonomous racing.
