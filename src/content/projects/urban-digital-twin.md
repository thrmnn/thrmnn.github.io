---
title: "Morphometrics of informal urban form"
date: '2025-01-01T00:00:00Z'
cardImage: '/projects/urban-digital-twin/vidigal-plate.webp'
featuredOrder: 1
externalLink: 'https://senseablerio.mit.edu/'
summary: "Favelas are built without plans, and the descriptors urban analysis relies on assume a street grid that is not there. I build the ones that hold on this fabric, from terrain models and building footprints, fine enough to resolve a single alley."
label: "MIT Senseable City Lab Rio · since 2025"
metric: "Geometry published on this site"
gradient: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)'
tags:
  - Urban morphometrics
  - Point clouds
  - LiDAR
  - Terrain models
  - Python
---

## The problem

Most ways of describing a city assume that someone drew it first: streets with
names, plots with edges, blocks that repeat. Informal settlements are not built
that way, so the standard descriptors either fail outright or quietly measure
the wrong thing. Anything you want to say afterwards about how air, light or
heat move through that fabric depends on describing its geometry first.

## What I build

A Python pipeline that turns building footprints and a digital terrain model
into a grid of morphometric indicators, fine enough that a single alley is
resolved rather than averaged away. The indicators are the standard vocabulary
of urban physics, computed so they hold on a fabric they were not designed for:
sky openness, frontal area density, height variation, slope, aspect, porosity.

On top of that sits a sampling design that decides where a computational fluid
dynamics campaign should actually look, rather than simulating everywhere at
uniform cost, and an ingestion layer that turns public meteorological records
into the boundary conditions those simulations need. The simulations themselves
run elsewhere; this work defines what they receive and how their output is read
back.

## What is shown here

The geometry of one site, Vidigal, is drawn on this site's front page. Nothing
else from this work appears here. It is unpublished
research with co-authors, so this page describes the method and stops there: no
indicators, no findings, no figures from the study.
