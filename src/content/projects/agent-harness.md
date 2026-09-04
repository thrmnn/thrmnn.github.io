---
title: "AI-agent infrastructure"
date: '2026-06-12T00:00:00Z'
github: 'https://github.com/thrmnn/agent-harness'
summary: "For teams shipping agentic products and hitting the wall every team hits — flaky tool calls, unobservable failures, no evals, no safe way to ship a prompt change. I build the harness around your agent so it behaves like a production system: typed tool layer, retrieval you can measure, traces you can actually read, and an eval suite that catches regressions before users do."
label: "Open-source · v0.1"
featuredOrder: 1
gradient: "linear-gradient(135deg, #1e1b2e 0%, #2d1b4e 50%, #3a1f6e 100%)"
tags:
  - AI Agents
  - Typed Tool Layer
  - Evals
  - Tracing
  - Agentic Systems
---

## Overview

For teams shipping agentic products and hitting the wall every team hits — flaky tool calls, unobservable failures, no evals, no safe way to ship a prompt change. I build the harness around your agent so it behaves like a production system: typed tool layer, retrieval you can measure, traces you can actually read, and an eval suite that catches regressions before users do.

## What this covers

- Typed, versioned tool layer (testable in isolation)
- An example keyword-search tool (`kb_search`) that demonstrates the eval harness on a retrieval-style task
- One structured trace line per tool call, small enough to grep
- Regression eval suite wired into CI

Status: v0.1, deliberately minimal. A reference implementation of the pattern, plain enough to copy into your own codebase rather than depend on.

## Evidence

Author of [agent-harness](https://github.com/thrmnn/agent-harness) — open-source typed tool layer + regression evals for agentic systems.

This is one of the scoped consulting engagements available — see [engagement scopes](/consulting/) for duration, deliverables, and how engagements work.
