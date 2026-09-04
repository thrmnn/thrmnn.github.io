---
title: 'ROS 2 fleet log triage'
date: '2026-08-27T00:00:00Z'
summary: 'Four fault detectors tested against 108 minutes of recordings from five robot platforms — every number recomputable from the repo.'
label: 'Open-source · 2026'
metric: '4 detectors · 5 platforms · 16/16 labelled gaps · 9 to 36 vs 1,880 flags per robot-hour'
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
imageAlt: 'The same yaw-uncertainty threshold on two robots: set on a simulated TurtleBot3 where injected faults cross it, then applied to a real Tiago with no faults, where the signal rides the line for much of the recording.'
imageWidth: 1489
imageHeight: 1025
---

Method public: [github.com/thrmnn/ros2-localization-triage](https://github.com/thrmnn/ros2-localization-triage)

## Problem

A robot misbehaves at a customer site and someone has to comb the bag files and logs to find out why.

## Built

Four independent fault detectors for ROS 2/ROS 1 localization pipelines — sensor dropout, transform jumps, covariance spikes, pose divergence — tested against 108 minutes of real recordings from five robot platforms (Cartographer backpack rigs, a Tiago, a MiR100 AGV, a PR2, a handheld 3D rig), all public third-party benchmark data, not a live customer fleet. 24 passing tests. Every graded figure recomputes from a committed artifact with one script, `check_numbers.py`; the cross-platform flag rates recompute from the flag count and duration stated in their own row, bag linked. Clone the repo and run it.

## Why hard

The same frozen thresholds produced 9 to 36 flags per robot-hour on one platform, every one a real dropout, and 1,880 on another, none of which look real. A threshold is a property of the machine it was measured on, not of the failure. That is cross-platform transfer, not fleet calibration; calibrating to a live fleet's own robots is what an engagement builds.

## What happened

- 16 of 16 labelled laser gaps found, against labels the tool's author never wrote (the Cartographer dataset's own decade-old ground truth).
- Three predictions were committed before the ERL benchmark run. Two held, including that the laser-gap detector would show no elevation on the engineered failure runs: it fired zero times over 1,013 seconds. The prediction that the transform detector would not rise did not hold.
- Two case-log rows are graded "wrong" and published as such.
- One candidate dataset was rejected over its licence, not for a technical reason.
