---
title: "Urban Tree LAI at Individual-Tree Scale: Aerial LiDAR + ML"
date: '2024-09-01T00:00:00Z'
featuredOrder: 2
externalLink: 'https://senseable.mit.edu/'
github: 'https://github.com/thrmnn/LAI'
summary: "Aerial-LiDAR + multispectral ML pipeline estimating Leaf Area Index at individual-tree resolution across Amsterdam, with the city municipality as the operational stakeholder."
label: "MIT Senseable City Lab Amsterdam · AMS Institute · 2024"
metric: "Individual-tree LAI · Amsterdam municipality · MSc thesis"
gradient: "linear-gradient(135deg, #0d3b0d 0%, #1a472a 50%, #2d6a4f 100%)"
tags:
  - LiDAR
  - Point Cloud Processing
  - 3D Segmentation
  - Sensor Fusion
  - XGBoost
  - scikit-learn
  - GeoPandas
  - Remote Sensing
---

## Overview

Master's thesis at **MIT Senseable City Lab Amsterdam** with **AMS Institute**, in collaboration with the **City of Amsterdam**. The municipality maintains a registry of street trees but lacks per-tree estimates of **Leaf Area Index (LAI)** — the metric that drives canopy density, shading, evapotranspiration, and air-quality modelling. I designed and built the pipeline that closes that gap by estimating LAI at individual-tree resolution from aerial LiDAR and multispectral imagery, with the city as the operational stakeholder.

## Technical Approach

The ML pipeline extracts individual tree morphological features — crown diameter, height, canopy volume — from airborne LiDAR point clouds and fuses them with spectral vegetation indices derived from multispectral aerial imagery. I trained an ensemble of **XGBoost and Random Forest** classifiers to predict LAI per tree, a key metric for quantifying canopy density and its influence on urban microclimate, air quality, and stormwater management. The geospatial stack is built on **GeoPandas** and scikit-learn, handling point clouds with tens of millions of points across the survey area.

Key pipeline stages:
- **Point cloud segmentation** — isolating individual tree crowns from ground, building, and vegetation returns
- **Feature extraction** — computing morphological descriptors (height, crown area, volume) per tree
- **Spectral fusion** — aligning LiDAR-derived geometry with multispectral vegetation indices (NDVI, NDRE)
- **LAI regression** — ensemble ML models predicting per-tree LAI calibrated against ground reference

## Role

**Lead researcher** — responsible for the full ML pipeline design, data acquisition workflow with the municipality, model training, and analysis. End-to-end ownership of the thesis line.

## Outcome

The pipeline established the methodological foundation later carried into the **urban digital twin** work in Rio — LAI estimation feeds CFD simulations of urban ventilation, connecting per-tree canopy density to airflow at neighbourhood scale. The Amsterdam line demonstrated that tree morphology extracted from remote sensing can predict LAI reliably at city scale, giving municipalities a tool for green-infrastructure planning without costly ground-level surveys.

## Links

- Lab: [MIT Senseable City Lab](https://senseable.mit.edu/)
- Partner: [AMS Institute](https://www.ams-institute.org/)
