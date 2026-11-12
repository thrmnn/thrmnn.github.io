---
metric: "Open source, v0.1"
title: "A harness for AI agents"
date: '2026-06-12T00:00:00Z'
github: 'https://github.com/thrmnn/agent-harness'
image: '/projects/agent-harness/eval-run.webp'
cardImage: '/projects/agent-harness/card-plate.webp'
imagePhone: '/projects/agent-harness/card-plate.webp'
imageWidth: 1920
imageHeight: 834
imageAlt: "The repository's own eval suite at commit bdbe373, run twice: as committed, all six cases pass and the run exits 0; after one change to the example search tool (TITLE_WEIGHT from 2 to 1, as the suite's comment describes), the regression case fails and the run exits 1."
summary: "Agentic systems fail the way robots do: a tool call breaks, nothing traces it, and nobody notices until a user does. I built a typed tool layer with one structured trace line per call and a regression suite wired into CI, so a bad change to a tool fails the build instead of the user."
label: "Open source · 2026"
featuredOrder: 6
gradient: "linear-gradient(135deg, #1e1b2e 0%, #2d1b4e 50%, #3a1f6e 100%)"
tags:
  - AI Agents
  - Typed Tool Layer
  - Evals
  - Tracing
  - Agentic Systems
---

## Overview

Agentic products hit the same walls: flaky tool calls, failures nobody can see, no evals, no safe way to ship a prompt change. A harness around the agent makes it behave like a production system: a typed tool layer, traces you can actually read, and an eval suite that catches regressions before users do.

## What this covers

- Typed, versioned tool layer (testable in isolation)
- An example keyword-search tool (`kb_search`) that demonstrates the eval harness on a retrieval-style task
- One structured trace line per tool call, small enough to grep
- Regression eval suite wired into CI

Status: v0.1, deliberately minimal. A reference implementation of the pattern, plain enough to copy into your own codebase rather than depend on.

## Where it stands

[agent-harness](https://github.com/thrmnn/agent-harness) is open source and
deliberately minimal: a typed tool layer and a regression suite, not a
framework.

## How to check it

I wrote it to run with no model and no network, with one dependency (pydantic). A tool call that gets bad input comes back as an error result and does not crash the agent loop. Each call writes one JSON line: timestamp, tool, version, input hash, outcome, duration.

To see the regression guard work, clone the repo, run `pip install -e .`, then `python -m agent_harness.evals examples/eval_cases.py`. It exits 0. Then change `TITLE_WEIGHT` from 2 to 1 in `examples/kb_search.py` and run it again. The case `title-match-outranks-body-match` fails and the run exits 1. The repo's own CI runs the same line.
