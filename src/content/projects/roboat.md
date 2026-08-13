---
title: 'Roboat: vision perception for autonomous boats'
subtitle: 'Real-time object detection on the water, and the MLOps that keeps it shipping.'
date: 2026-07-10
status: 'Completed · Roboat (MIT spinoff), Amsterdam · Mar–Aug 2024'
summary: 'Perception engineering for Roboat, the MIT spinoff putting autonomous boats on Amsterdam''s canals. Object detection running under 30 ms on a Jetson Orin, trained on a production dataset built from 100+ hours of maritime data, versioned and deployed through a DVC pipeline. The premise: on the water, the model that matters is the one still improving at day 100.'
register: cartesian
featured: false
heroAlt: 'Detection overlay from the Roboat perception stack on an Amsterdam canal'
outcomes:
  - value: '< 30 ms'
    label: 'inference on Jetson Orin, on the boat'
  - value: '100+ h'
    label: 'maritime data curated into a versioned dataset'
  - value: '1 pipeline'
    label: 'new hours on water to deployed model, via DVC'
collaborators: []
links: {}
tags:
  - robotics
  - perception
  - edge-deployment
  - mlops
  - autonomous-navigation
updated: 2026-07-10
---

## Problem

A canal is a hostile environment for perception. Water moves, reflects, and throws sensor returns that look like obstacles; traffic mixes tour boats, kayaks, and debris; docking demands precision that GPS alone cannot give. Roboat's existing stack leaned on LiDAR — but LiDAR on water inherits the water's noise. The task, as the company's first engineering hire: architect the transition from a LiDAR-centric stack to vision, without breaking the boat that had to keep operating while the transition happened.

## Constraint

Everything runs on the boat. The compute budget is a Jetson Orin, not a datacenter; the latency budget is set by a vessel that cannot stop the way a car can. A detector that is accurate offline but slow onboard is not a detector — so the inference target was hard: real time, under 30 ms, on the edge device.

## What was built

- **Vision object detection on Jetson Orin** — deployed on the boat, inference under 30 ms, real time
- **A production dataset from 100+ hours of maritime data** — the raw material for a detector that reflects canals as they are, not benchmarks as they were
- **A full MLOps pipeline on DVC** — model and dataset versioning plus automated deployment, so every retrained model traces back to the exact data that produced it
- **LiDAR segmentation filtering dynamic water artifacts** — cleaning the point cloud of the water's noise, integrated with the SLAM stack

The pipeline is the load-bearing item. On a system that collects new data every time it leaves the dock, training the first model is the easy part; the hard part is making the fiftieth retrain as safe and boring as the first.

## What the numbers say

Under 30 ms per inference on the Orin — inside the real-time budget, on the boat, not on a workstation. Over 100 hours of maritime data curated into a versioned production dataset. One pipeline that turns new hours on the water into new model versions without manual archaeology.

## Day 100, not day 1

The demo model and the production model are different artifacts. The demo model works once, on the day someone is watching. The production model has to keep working after the dataset has doubled, the failure cases have been folded back in, and nobody remembers which checkpoint is on which boat. That is what the versioning, the automated deployment, and the dataset discipline buy: production ML is what the system looks like at day 100, not day 1.
