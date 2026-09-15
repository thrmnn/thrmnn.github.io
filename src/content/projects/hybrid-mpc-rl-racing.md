---
title: 'Real-Time Hybrid Control: RL + MPC for Autonomous Systems'
date: '2023-01-13T00:00:00Z'
draft: true
# assets parked in drafts/public/projects/hybrid-mpc-rl-racing/ while draft: true
externalLink: 'https://www.epfl.ch/labs/biorob/'
proprietary: true
image: '/projects/hybrid-mpc-rl-racing/tracks-snapshot.png'
imageWidth: 743
imageHeight: 620
summary: 'Semester project at EPFL BioRob (Ijspeert lab) under G. Bellegarda: a switching controller that combines Reinforcement Learning and Model Predictive Control to drive a car through learned tracks.'
label: 'EPFL BioRob · Bellegarda / Ijspeert · MA3, Fall 2022'
metric: 'PPO + MPC switching · car dynamics · OpenAI Gym tracks'
gradient: 'linear-gradient(135deg, #4a1a1a 0%, #6b2d2d 50%, #8b3a3a 100%)'
tags:
  - Model Predictive Control
  - Reinforcement Learning
  - Proximal Policy Optimization
  - Actor-Critic
  - Optimal Control
  - Value Function Approximation
  - Curriculum Learning
  - OpenAI Gym
---

<!--
ASSETS NOTE: this project's repository lived on a private GitLab no longer
accessible. The technical artifact preserved is the EPFL BioRob semester
report (rapport.pdf) plus the figure set used in the final presentation
(2023-01). All images surfaced below were rendered for the original report
or final presentation and are reproduced here.
-->

## Overview

Semester project at **EPFL BioRob Lab** under G. Bellegarda and Prof. [Auke Ijspeert](https://www.epfl.ch/labs/biorob/), Fall 2022 (MA3, 10 ECTS). Title: **_Real-Time Hybrid Control: Combining Reinforcement Learning and Model Predictive Control for Autonomous Systems_**.

Classical Model Predictive Control respects the vehicle dynamics and gives safety guarantees, but it is limited by its dynamics model and struggles with aggressive maneuvers. Reinforcement Learning can discover policies that use the full dynamics envelope, but it is sample-inefficient and offers no safety guarantee. The project builds a switching controller that runs both and hands over between them.

![Switching architecture — RL when off-track, MPC when on a confident trajectory.](/projects/hybrid-mpc-rl-racing/architecture-diagram.png)

## Method

### MPC layer

Receding-horizon optimal control over the car dynamics, enforcing track boundaries and physical limits.

![Bicycle model used for the car dynamics.](/projects/hybrid-mpc-rl-racing/car-model.png)

### RL layer

Actor-Critic with Proximal Policy Optimization (PPO), trained on OpenAI Gym track environments. Curriculum learning ramps difficulty: simple straight tracks → simple curves → composed circuits.

![PPO learning curves across track difficulties.](/projects/hybrid-mpc-rl-racing/rl-learning-curves.png)

### Switching controller

The hybrid layer chooses between RL and MPC based on the **learned value function** from the critic — switching to MPC when the RL agent's confidence drops below a threshold (e.g. recovery from off-track), and back to RL once on a confident trajectory.

![Online switching policy — value-function-driven controller selection.](/projects/hybrid-mpc-rl-racing/online-switching.png)

![Value function MLP — separates high-confidence states from recovery states.](/projects/hybrid-mpc-rl-racing/mlp-value-function.png)

## Results

The report evaluates the switching controller against standalone MPC and RL baselines, and considers alternative architectures including reward-shaping variants.

## Article

The full EPFL BioRob semester report is available as a PDF — see the **Source / Article** link in the project links section below.

## Repository status

The original code lived on a private EPFL GitLab; access lapsed after the semester closed. **No public source repository available.** The report and figures here are the authoritative record of the work.
