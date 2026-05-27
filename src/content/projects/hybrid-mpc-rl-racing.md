---
title: 'Real-Time Hybrid Control: RL + MPC for Autonomous Systems'
date: '2023-01-13T00:00:00Z'
externalLink: 'https://www.epfl.ch/labs/biorob/'
proprietary: true
image: '/projects/hybrid-mpc-rl-racing/tracks-snapshot.png'
summary: 'Semester project at EPFL BioRob (Ijspeert lab) under G. Bellegarda — a switching hybrid controller that combines Reinforcement Learning and Model Predictive Control to drive a car through learned tracks faster than either approach alone.'
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

Semester project at **EPFL BioRob Lab** under [G. Bellegarda](https://gbellegarda.github.io/) and Prof. [Auke Ijspeert](https://www.epfl.ch/labs/biorob/), Fall 2022 (MA3, 10 ECTS). Title: **_Real-Time Hybrid Control: Combining Reinforcement Learning and Model Predictive Control for Autonomous Systems_**.

The core question: classical Model Predictive Control gives strong safety guarantees and respects vehicle dynamics, but it's limited by the dynamics model and struggles with aggressive maneuvers. Reinforcement Learning can discover policies that exploit the full dynamics envelope, but it's sample-inefficient and lacks safety guarantees. Can a switching controller get the best of both?

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

The switching controller out-laps both standalone MPC and pure-RL across the evaluated tracks. The hybrid prior accelerates learning: starting from MPC behavior, the RL agent does not have to re-discover competent driving from scratch.

The full report covers methodology, alternative architectures considered (including residual-policy and reward-shaping variants), and experimental results across track geometries.

## Article

The full EPFL BioRob semester report is available as a PDF — see the **Source / Article** link in the project links section below.

## Repository status

The original code lived on a private EPFL GitLab; access lapsed after the semester closed. **No public source repository available.** The report and figures here are the authoritative record of the work.
