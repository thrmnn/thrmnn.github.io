---
title: "Urban Digital Twin for Airborne Disease Modeling"
date: '2025-01-01T00:00:00Z'
externalLink: 'https://senseablerio.mit.edu/'
summary: "High-fidelity 3D reconstruction of Rio's favelas from terrestrial LiDAR and aerial imagery, driving CFD simulations of airborne pathogen dispersion to identify ventilation risk zones."
label: "MIT Senseable City Lab · 2025"
metric: "10-person team · neighborhood-scale CFD"
gradient: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)"
tags:
  - 3D Reconstruction
  - Point Cloud Processing
  - LiDAR
  - Sensor Fusion
  - Digital Twin
  - OpenFOAM
  - Python
  - Blender
---

High-fidelity 3D reconstruction of Rio's favelas from terrestrial LiDAR and aerial imagery, driving CFD simulations of airborne pathogen dispersion to identify ventilation risk zones.

## Overview

As Research Fellow at **MIT Senseable City Lab** in Rio de Janeiro, I lead a **10-person interdisciplinary team** (MIT + UFMG + TU Delft) building a high-fidelity digital twin of Rio's favelas to model airborne disease transmission. The project — **Brisa+** — fuses data from terrestrial LiDAR scans, aerial multispectral imagery, and digital terrain models into physics-ready 3D meshes of densely built informal settlements, environments where conventional mapping methods fail. These reconstructions feed directly into Computational Fluid Dynamics simulations that model ventilation patterns, pollutant dispersion, and pathogen spread at the neighborhood scale.

## Technical Pipeline

The reconstruction and simulation pipeline spans multiple data sources and processing stages:

- **Terrestrial LiDAR scanning** — Ground-level point cloud acquisition of narrow alleyways and building facades inaccessible to aerial sensors
- **Aerial imagery fusion** — Aligning overhead multispectral data with ground-level scans using georeferenced control points
- **3D mesh generation** — Converting fused point clouds into watertight meshes in Blender, suitable for physics simulation
- **CFD simulation** — OpenFOAM-based airflow modeling at neighborhood scale, simulating wind patterns through the complex geometry of informal settlements
- **Risk zone identification** — Mapping ventilation dead zones where airborne pathogen concentrations accumulate, informing targeted public health interventions
- **Vegetation modeling** — Integrating Leaf Area Index (LAI) estimates from the aerial LiDAR tree census project to quantify how urban canopy affects local airflow

## Role

I serve as **team lead**, responsible for the 3D reconstruction pipeline, CFD integration, and coordination across three institutions. Beyond the computational work, the project includes deploying a network of custom-built air quality sensors across target communities for ground-truth validation of the simulations.

## Outcome

The project operates in close coordination with **Rio's city government and community stakeholders**, ensuring the research translates into real-world impact. The digital twin framework connects 3D urban geometry, vegetation, and airflow to public health outcomes — **informing targeted interventions in underserved communities** where airborne disease risk is highest. This work demonstrates how computational tools developed in robotics and remote sensing can address pressing public health challenges.
