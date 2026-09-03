---
title: 'ROS 2 fleet log triage'
date: '2026-08-27T00:00:00Z'
summary: 'Four fault detectors tested against 108 minutes of recordings from five robot platforms — every number recomputable from the repo.'
label: 'Open-source · 2026'
metric: '4 detectors · 5 platforms · 16/16 labelled gaps · 9→1,880 false alarms per robot-hour'
tags:
  - ROS 2
  - Log Analysis
  - Fault Detection
  - Localization
  - Python
github: 'https://github.com/thrmnn/ros2-localization-triage'
externalLink: 'https://github.com/thrmnn/ros2-localization-triage'
featuredOrder: 2
image: '/projects/ros2-localization-triage/threshold-transfer.webp'
imageAlt: 'Same detection thresholds on two robot platforms: 9 vs 1,880 false alarms per robot-hour'
imageWidth: 1489
imageHeight: 1025
---

Method public: [github.com/thrmnn/ros2-localization-triage](https://github.com/thrmnn/ros2-localization-triage)

## Problem

A robot misbehaves at a customer site and someone has to comb the bag files and logs to find out why.

## Built

Four independent fault detectors for ROS 2/ROS 1 localization pipelines — sensor dropout, transform jumps, covariance spikes, pose divergence — tested against 108 minutes of real recordings from five robot platforms (Cartographer backpack rigs, a Tiago, a MiR100 AGV, a PR2, a handheld 3D rig), all public third-party benchmark data, not a live customer fleet. 24 passing tests. Every headline number recomputes mechanically from committed data via a public script (`check_numbers.py`) — clone the repo and run it yourself.

## Why hard

The same frozen detection thresholds behave very differently per platform — 9 false alarms per robot-hour on one, 1,880 on another. That's cross-platform transfer, not fleet-scale calibration yet; per-fleet calibration on a live customer's actual robots is what an engagement would build.

## What happened

- 16 of 16 labelled laser gaps found, against labels the tool's author never wrote (the Cartographer dataset's own decade-old ground truth).
- A pre-registered zero-false-positive prediction, committed before the run, held across 1,013 seconds of matched-control data.
- Two case-log rows are graded "wrong" and published as such.
- One candidate dataset was rejected outright over licensing, before it could bias a result.
