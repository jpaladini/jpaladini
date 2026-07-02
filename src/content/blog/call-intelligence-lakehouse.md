---
title: "A dual-index RAG that actually cites its sources"
description: "Building call intelligence on a medallion lakehouse — transcription, embeddings, vector search — and the design choices that keep answers trustworthy enough to investigate on."
date: 2026-02-20
category: "Case study"
readingTime: "11 min"
tags: ["RAG", "Lakehouse", "MLflow"]
author: "Jason Paladini"
---

Customer-service calls are one of the richest, least-used datasets a company has. The recordings exist; almost nothing reads them at scale. I built a lakehouse pipeline that ingests, transcribes, analyzes and semantically searches those calls — and a RAG agent on top that answers investigative questions *with citations*, so an analyst can trust the answer enough to act on it.

## Medallion, end to end

The backbone is a standard Bronze/Silver/Gold layout, which matters more than it sounds — it's what keeps a messy, multi-step AI pipeline debuggable.

<div style="margin:28px 0;display:flex;flex-direction:column;gap:10px">
  <div style="padding:16px 18px;border:1px solid rgba(255,255,255,.08);border-radius:10px;background:#0c0f13"><div style="font:600 15px/1.2 'Space Grotesk',sans-serif;color:#e6edf0">Bronze</div><div style="font:400 13.5px/1.5 'JetBrains Mono',monospace;color:#7d8e94;margin-top:4px">raw recordings + call metadata, landed untouched</div></div>
  <div style="text-align:center;color:#3a4a4f;font:600 13px/1 'JetBrains Mono',monospace">↓</div>
  <div style="padding:16px 18px;border:1px solid rgba(255,255,255,.08);border-radius:10px;background:#0c0f13"><div style="font:600 15px/1.2 'Space Grotesk',sans-serif;color:#e6edf0">Silver</div><div style="font:400 13.5px/1.5 'JetBrains Mono',monospace;color:#7d8e94;margin-top:4px">transcription → LLM analysis → embeddings, each a tracked step</div></div>
  <div style="text-align:center;color:#3a4a4f;font:600 13px/1 'JetBrains Mono',monospace">↓</div>
  <div style="padding:16px 18px;border:1px solid #6ee7c7;border-radius:10px;background:rgba(110,231,199,.07)"><div style="font:600 15px/1.2 'Space Grotesk',sans-serif;color:#cffaed">Gold + RAG</div><div style="font:400 13.5px/1.5 'JetBrains Mono',monospace;color:#7fd9c2;margin-top:4px">governed serving tables + dual-index retrieval for cited answers</div></div>
</div>

Because every transformation is its own layer, when a transcript looks wrong I can walk back exactly one step at a time instead of re-running an opaque end-to-end job.

## Why two indexes

A single vector index over transcripts answers "what was said." But investigators also ask "what did we already conclude?" — questions better served by the prior LLM analyses. So the agent retrieves against both: a transcript index for ground truth, and an analysis index for prior reasoning. The two are fused at query time.

> A citation isn't decoration. It's the contract: every claim the agent makes points back to a specific transcript span it can be checked against.

Grounding with citations is what makes this usable for high-trust work. The agent doesn't get to assert; it gets to quote. If it can't find support, that's a visible gap rather than a confident hallucination.

## Measuring it like a pipeline

None of this ships without evaluation. I run an MLflow-based framework with three layers: deterministic schema checks (did the output even conform?), LLM-as-judge scoring for quality, and A/B comparison across prompts and models. That turns "the new prompt feels better" into a number I can defend — and the prompts themselves come from the [control plane](/blog/prompt-control-plane), so every eval run is tied to an exact version.

The result is a system that reads thousands of calls nobody had time to listen to, and answers questions about them in a way you can actually audit. That combination — scale plus trust — is the whole point.
