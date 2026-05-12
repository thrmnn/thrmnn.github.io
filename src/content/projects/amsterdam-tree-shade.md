---
title: 'Amsterdam tree-shade and the daytime pedestrian climate'
subtitle: 'How canopy geometry shapes thermal comfort across a temperate city.'
date: 2026-05-08
status: 'Submitted to Nature Cities · May 2026'
summary: 'A street-level estimate of tree shade across central Amsterdam, derived from aerial LiDAR and modeled across the summer day. The work pairs canopy geometry with solar exposure to map where pedestrians actually find shade at peak heat — and where the gaps cluster.'
register: cartesian
featured: true
featuredOrder: 1
heroAlt: 'Pedestrian shade index map of central Amsterdam at solar noon'
collaborators: []
links: {}
tags:
  - urban-science
  - remote-sensing
  - thermal-comfort
  - lidar
updated: 2026-05-12
---

## Question

Where do Amsterdam's pedestrians find shade during summer peak heat, and where do the gaps cluster?

The city has detailed canopy cover statistics at the neighborhood level, but those numbers do not answer what someone walking down a specific street will encounter at 14:00 in July. Cover is a stock measure. Shade at the pedestrian eye is a flux measure — it depends on canopy geometry, sun angle, building height, and the path being walked.

## Approach

The work reconstructs the canopy from aerial LiDAR at one-meter resolution, then sweeps a solar exposure model across the summer day to produce hourly shade rasters. Pedestrian-level shade is integrated along street segments rather than reported per polygon, which lets the result be read as a walking experience rather than a planning abstraction.

### Methods

- Aerial LiDAR (AHN4) canopy reconstruction at 1 m resolution
- Hourly solar exposure raster, June–August, 14:00 emphasized
- Pedestrian Shade Index (PSI) computed per street segment
- Validation against ground temperature loggers at 47 sites

## What the data shows

Canopy cover and pedestrian shade diverge sharply in central Amsterdam. Neighborhoods with comparable canopy percentages show PSI differences of 30–40 percentage points at solar noon, driven almost entirely by the spatial relationship between tree position and pedestrian path. The largest shade deficits cluster along east-west commercial streets where buildings sit low and tree planting is constrained by underground utilities.

## Status

Submitted to Nature Cities, May 2026. Preprint and reproducible code release alongside acceptance.

## Related

Method translates to other LiDAR-equipped cities. Rio de Janeiro replication underway via MIT Senseable Rio — different climate, different morphology, same pedestrian-experience framing.
