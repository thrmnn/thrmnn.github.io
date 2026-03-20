---
title: "Urban Tree Census at Scale: Aerial LiDAR + ML"
date: '2024-09-01T00:00:00Z'
externalLink: 'https://senseable.mit.edu/'
summary: "Large-scale aerial LiDAR survey of São Paulo identifying 12,350 trees in favela communities using ML-driven species classification and health assessment."
label: "MIT Senseable City Lab · 2024"
metric: "12,350 trees identified · submitted to Springer Nature"
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

Large-scale aerial LiDAR survey of São Paulo identifying 12,350 trees in favela communities using ML-driven species classification and health assessment.

## Overview

For my Master's thesis at MIT Senseable City Lab, I designed and executed a large-scale automated tree census across informal settlements in São Paulo, Brazil. The project identified and characterized **12,350 individual trees** in favela communities — environments where conventional ground-level surveys are impractical due to dense, irregular urban morphology. This is the first large-scale automated tree census of informal settlements, demonstrating that airborne remote sensing combined with machine learning can deliver city-scale ecological assessments in areas traditionally invisible to urban planning data.

## Technical Approach

The ML pipeline extracts individual tree morphological features — crown diameter, height, canopy volume — from airborne LiDAR point clouds and fuses them with spectral vegetation indices derived from multispectral aerial imagery. I trained an ensemble of **XGBoost and Random Forest** classifiers to predict Leaf Area Index (LAI), a key metric for quantifying canopy density and its influence on urban microclimate, air quality, and stormwater management. The geospatial processing stack is built on **GeoPandas** and scikit-learn, handling point clouds with tens of millions of points across the survey area.

Key pipeline stages:
- **Point cloud segmentation** — isolating individual tree crowns from ground, building, and vegetation returns
- **Feature extraction** — computing morphological descriptors (height, crown area, volume) per tree
- **Spectral fusion** — aligning LiDAR-derived geometry with multispectral vegetation indices (NDVI, NDRE)
- **Species and health classification** — ensemble ML models predicting species class and canopy health status

## Role and Collaboration

I served as **lead researcher**, responsible for the full ML pipeline design, data collection coordination, and analysis. The project is a collaboration between **MIT Senseable City Lab**, **TU Delft**, and local partners in São Paulo.

## Outcome

The paper has been submitted to **Springer Nature**. This work established the methodological foundation for the urban digital twin project in Rio de Janeiro, where LAI estimation feeds into CFD simulations of urban ventilation in informal settlements. The pipeline demonstrated that tree morphology extracted from remote sensing data can reliably predict canopy density at city scale, enabling urban planners to assess green infrastructure without costly ground-level surveys.
