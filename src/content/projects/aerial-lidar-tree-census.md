---
title: "Leaf area from an aerial scan"
date: '2024-09-01T00:00:00Z'
cardImage: '/projects/aerial-lidar-tree-census/jordaan-plate.webp'
featuredOrder: 2
externalLink: 'https://www.ams-institute.org/'
summary: "A city knows where its trees are, not how much leaf they carry. I recover leaf area per tree by inverting how much sky the canopy blocks in an aerial LiDAR survey the city already flies for other reasons."
label: "Senseable City Lab, MIT and AMS Institute · since 2024"
metric: "Manuscript in preparation"
gradient: 'linear-gradient(135deg, #0d3b0d 0%, #1a472a 50%, #2d6a4f 100%)'
tags:
  - Remote sensing
  - LiDAR
  - Canopy
  - Beer-Lambert inversion
  - Python
---

## The problem

Municipal tree registers are good at the things a register is for: species,
location, trunk diameter, when it was last inspected. They do not record how
much leaf a tree actually carries, which is the quantity that matters for
shade, cooling and interception. Measuring it directly, tree by tree, across a
city is not something anyone is going to fund.

## What I build

Cities already fly aerial LiDAR surveys on a regular cycle for entirely
unrelated reasons. Those scans contain the information: a pulse that passes
through a canopy and a pulse that is intercepted by it are distinguishable, so
the fraction of sky visible through the crown can be recovered from data that
already exists.

From that gap fraction, leaf area follows by a physical inversion rather than a
fitted model, which is the part I care about most. The relationship between how
much light a canopy blocks and how much leaf it carries is classical physics
with known assumptions, so the estimate can be argued about on its own terms
instead of defended as the output of a regressor nobody can inspect. An earlier
version of this work did use machine learning; the current method does not.

## What is shown here

Nothing but the method. This is a multi-author manuscript in preparation, so
there are no numbers, figures or findings on this page, and there will not be
until it is published.
