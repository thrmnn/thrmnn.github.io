---
title: Urban Tree Morphology and Canopy Density Estimation
date: '2024-09-01T00:00:00Z'
external_link: 'https://senseable.mit.edu/'

image:
  caption: Urban Tree Morphology and Canopy Density Estimation
  filename: projects/tree_census.jpg
  focal_point: Smart

tags:
  - LiDAR
  - Random Forest
  - Aerial Imagery
  - Urban Forestry
  - Geospatial Analysis
  - Environmental Science

url_code: ''
url_pdf: ''
url_video: ''
url_slides: ''

slides: ''
---

Automated tree census using LiDAR and multispectral imagery for urban forestry

For my Master's thesis at MIT Senseable City Lab (Amsterdam), I developed an automated method for large-scale urban tree census using aerial LiDAR and multispectral imagery. The core contribution was a pipeline that extracts individual tree morphological features — crown diameter, height, canopy volume — from airborne LiDAR point clouds and fuses them with spectral vegetation indices derived from multispectral aerial imagery. I trained Random Forest models to predict Leaf Area Index (LAI), a key metric for quantifying canopy density and its influence on urban microclimate, air quality, and stormwater management.

This work established the methodological foundation for my current research in Rio de Janeiro, where LAI estimation feeds into CFD simulations of urban ventilation in informal settlements. The pipeline demonstrated that tree morphology extracted from remote sensing data can reliably predict canopy density at city scale, enabling urban planners to assess green infrastructure without costly ground-level surveys.