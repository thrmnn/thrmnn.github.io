---
title: 'Production ML is day 100, not day 1'
date: 2026-07-10
summary: 'Six months as the first engineering hire on an autonomous-boat company taught me that the model is the easy part. The system that keeps the fiftieth retrain as boring as the first — that is the product.'
register: tropical
language: en
tags:
  - robotics
  - mlops
  - perception
  - production
---

<!-- DRAFT — R1 pipeline, first draft 2026-07-10. Not for publication until Théo's edit pass. -->

In 2024 I spent six months in Amsterdam as the first engineering hire at Roboat, an MIT spinoff putting autonomous boats on the canals. My job was perception: making the boat see. The number people ask about is inference speed — object detection running under 30 milliseconds on a Jetson Orin, on the boat, in real time. It is a good number. It is also the least interesting thing we built.

A canal is a hostile place for perception. The water moves, reflects, and throws sensor returns that look like obstacles. Traffic mixes tour boats, kayaks, and floating debris. The existing stack leaned on LiDAR, and LiDAR on water inherits the water's noise — so part of my work was segmentation that filtered the dynamic water artifacts out of the point cloud before they reached the SLAM stack. The larger task was architecting the transition from a LiDAR-centric stack to vision, without breaking a boat that had to keep operating while the transition happened.

Here is what that constraint teaches you, faster than any course on machine learning operations: the demo model and the production model are different artifacts.

The demo model works once, on the day someone is watching. You can get there with a weekend, a public dataset, and a checkpoint you never look at again. Most of what gets called "AI" in a pitch deck is a demo model. The production model has a different job. It has to keep working after the dataset has doubled, after the failure cases have been folded back in, after the third retrain, when nobody remembers which checkpoint is running on which boat. Nothing about training the first model prepares you for that. The skills are not adjacent; they are different disciplines that happen to share a file format.

At Roboat the raw material was time on the water. We curated a production dataset from more than a hundred hours of maritime data — canals as they are, not benchmarks as they were. That sounds like an asset, and it is, but it is also a liability with a growth rate. Every hour the boat operates, the dataset drifts away from whatever the current model was trained on. A new season changes the light. [Théo: fill — a concrete failure case that came back from the water and forced a retrain, if one stands out.]

The load-bearing thing we built was not the detector. It was the pipeline: model and dataset versioning on DVC, automated deployment, so that every retrained model traced back to the exact data that produced it. On a system that collects new data every time it leaves the dock, training the first model is the easy part. The hard part is making the fiftieth retrain as safe and boring as the first. Versioning is not bookkeeping — it is the system's memory. Without it, every improvement is an act of faith, and every regression is an archaeology project.

I think about this as a day-100 test. On day 1, the questions are the ones everyone asks: how accurate is it, how fast is it, does it run on the edge device. By day 100, the questions have changed shape entirely. Which data produced the model that is deployed right now? If the new model is worse in the rain, can we prove it, and can we roll back in minutes instead of days? When a failure case comes in from the field, what is the path — measured in steps, not intentions — from that clip to a retrained, validated, deployed model? A team that cannot answer these has a demo in production, which is a different thing from having production ML.

The uncomfortable part is that the day-100 questions are unglamorous, and the incentives everywhere point at day 1. Papers are day-1 artifacts. Funding announcements are day-1 artifacts. [Théo: fill — your view on whether this incentive problem is worse in robotics than in software ML, one sentence.]

Since Roboat I have carried the same discipline into research — LiDAR pipelines over favelas in Rio, tree-canopy models from aerial scans — where the temptation to stop at the first working result is even stronger, because a paper, unlike a boat, does not have to go back out on the water. The rule survives the change of domain: the model is a snapshot; the pipeline is the system. If you are building anything that learns from its own operation, the question to ask on day 1 is what day 100 looks like. Everything worth keeping that we built, we built because someone asked it early.
