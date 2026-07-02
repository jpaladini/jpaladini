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

---

## TL;DR

- **A medallion layout keeps an AI pipeline debuggable.** Transcription, analysis, and embeddings are each a tracked step — when a transcript looks wrong, you walk back one layer, not one opaque job.
- **Two indexes, not one.** A transcript index answers "what was said"; an analysis index answers "what did we already conclude." The agent retrieves against both and fuses at query time.
- **Citations are the contract.** Every claim points to a transcript span it can be checked against — and an MLflow eval stack (schema checks, LLM-as-judge, A/B) turns prompt changes into defensible numbers.

---

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

---

## Why two indexes

A single vector index over transcripts answers "what was said." But investigators also ask "what did we already conclude?" — questions better served by the prior LLM analyses. So the agent retrieves against both: a transcript index for ground truth, and an analysis index for prior reasoning. The two are fused at query time.

```mermaid
flowchart LR
  Q([Analyst question]) --> AG[RAG agent]
  AG == "what was said" ==> TI[(Transcript index<br/>ground truth)]
  AG == "what we concluded" ==> AI[(Analysis index<br/>prior reasoning)]
  TI --> F[Fuse at query time]
  AI --> F
  F --> ANS[Answer with citations<br/>every claim → transcript span]

  classDef idx fill:#E7EEFC,stroke:#2D6CDF,color:#15191E;
  classDef out fill:#E4F3EA,stroke:#138A4E,color:#15191E;
  class TI,AI idx;
  class ANS out;
```

<details class="diagram-note">
  <summary>Diagram description (text version)</summary>
  <p>A left-to-right retrieval diagram. An "Analyst question" node flows into a "RAG agent" box. From the agent, two bold arrows fan out to two blue cylinders: a "Transcript index — ground truth" (labeled "what was said") and an "Analysis index — prior reasoning" (labeled "what we concluded"). Both cylinders feed a "Fuse at query time" box, which flows into a green "Answer with citations" node annotated "every claim → transcript span". The message: one question, two retrieval planes, one cited answer.</p>
</details>

> A citation isn't decoration. It's the contract: every claim the agent makes points back to a specific transcript span it can be checked against.

Grounding with citations is what makes this usable for high-trust work. The agent doesn't get to assert; it gets to quote. If it can't find support, that's a visible gap rather than a confident hallucination.

---

## Measuring it like a pipeline

None of this ships without evaluation. I run an MLflow-based framework with three layers:

| Layer | Question it answers | Failure it catches |
|---|---|---|
| Deterministic schema checks | Did the output even conform? | Malformed or incomplete responses |
| LLM-as-judge scoring | Is the answer good? | Quality drift, weak grounding |
| A/B across prompts and models | Is the new version *better*? | "Feels better" shipping on vibes |

That turns "the new prompt feels better" into a number I can defend — and the prompts themselves come from the [control plane](/blog/prompt-control-plane), so every eval run is tied to an exact version.

The result is a system that reads thousands of calls nobody had time to listen to, and answers questions about them in a way you can actually audit. That combination — scale plus trust — is the whole point.

---

*The prompts behind every step here are versioned rows in [the prompt control plane](/blog/prompt-control-plane) — same lakehouse, same governance, one audit trail from wording to answer.*
