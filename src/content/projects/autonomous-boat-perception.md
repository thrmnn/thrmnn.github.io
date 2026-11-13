---
title: "Camera perception for canal boats"
date: '2024-08-01T00:00:00Z'
featuredOrder: 4
proprietary: true
summary: "Roboat's autonomy ran on LiDAR. As its first intern I added the camera side: detection and tracking on the vessel's own edge hardware, and the MLOps to keep models and data versioned as the recordings grew."
label: "Roboat, MIT spinoff · 2024"
metric: "Camera perception on a LiDAR stack"
gradient: '#0f1018'
image: '/projects/autonomous-boat-perception/card-plate.webp'
imageWidth: 1200
imageHeight: 1200
imageAlt: "A small generic boat on an Amsterdam canal between rows of buildings and trees, drawn as dots. Blue rings and points mark where a simulated 16-beam LiDAR on its mast would hit the water and the surroundings. The canal is open aerial LiDAR; the boat and the scan are simulated."
cardImage: '/projects/autonomous-boat-perception/card-plate.webp'
cardAnim: '/projects/autonomous-boat-perception/card-anim.webp'
tags:
  - Object Detection
  - Multi-Object Tracking
  - PyTorch
  - YOLO
  - ROS 2
  - Jetson Orin
  - Edge Deployment
---

## The problem

Roboat's autonomy already worked, and it worked on LiDAR. LiDAR is precise and
expensive, and on water it reports a great deal that is not an obstacle:
reflection, wake, chop. The open question when I arrived was how much of the
perception job a camera could take on instead, on hardware that fits on a small
vessel and inside a real-time budget.

## What I did

I joined as the first intern and built the camera side of the stack: detection
and multi-object tracking running on the vessel's own edge hardware, trained on
the recordings the boats had been collecting from the canals. Water is an
awkward subject for a detector, because the same object looks different under
glare, reflection and weather, and the things you most need to catch are the
things you have least footage of.

The second half of the work was the part that outlives any particular model.
Datasets and model versions went under DVC so a result could be traced back to
the exact data that produced it, and retraining stopped being a thing one
person could do on one laptop.

## Picture credit

The card picture is an Amsterdam canal drawn from open aerial LiDAR: the AHN5 point cloud of the Dutch national elevation survey. Source: [AHN](https://www.ahn.nl/eerste-deel-van-ahn-5-is-beschikbaar), CC BY 4.0. The boat is a generic hull and the scan is simulated: an imagined 16-beam scanner lights the points of that aerial cloud it would reach first. It is not Roboat's boat and not Roboat's data.
