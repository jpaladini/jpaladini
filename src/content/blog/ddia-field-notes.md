---
title: "Field notes on Designing Data-Intensive Applications"
description: "A chapter-by-chapter tour of Kleppmann's DDIA — the mental models that stuck: storage engines, replication, partitioning, transactions, consensus, and the batch/stream convergence. Written with Jon Avezbaki."
date: 2026-07-29
category: "Deep dive"
readingTime: "12 min"
tags: [system-design, distributed-systems, databases, ddia, book-notes]
author: "Jason Paladini"
draft: true
---

> These notes were written with [Jon Avezbaki](https://avenuej.dev/educational-resources/system-design/), whose original study guide lives on avenuej.dev. Everything below is our distillation of *[Designing Data-Intensive Applications](https://dataintensive.net/)* (Martin Kleppmann, 1st ed.) — the ideas are his; go read the book. This is the refresher we wish we'd had before system design interviews and architecture reviews.

---

## TL;DR

- **DDIA is really one long argument**: every data system is a composition of a few primitives — logs, indexes, replication, partitioning — and the interesting failures happen at the seams between them.
- The single most reusable interview asset is the **storage engine dichotomy** (B-trees vs. LSM-trees) and the **replication dichotomy** (single-leader vs. leaderless). Most real systems are a position on those two axes.
- **Chapters 5–9 are the payoff.** Replication lag, partition rebalancing, isolation levels, and consensus are where production systems actually bite you.

---

## Chapter 1 — What "data-intensive" even means

The book opens by replacing vague words with measurable ones. *Reliability* is tolerating faults, not preventing them. *Scalability* is meaningless without a load parameter — requests per second, read/write ratio, fan-out. *Maintainability* is mostly about operability and evolvability.

The detail that stuck with us: **describe response time as percentiles, never averages.** The p99 is where your most valuable users live (they're the ones with the most data), and tail latency compounds — a page that fans out to 100 backends inherits the *worst* straggler's latency on nearly every request. Related trap: if your load generator waits for each response before sending the next request, it artificially shortens queues and your test lies to you.

## Chapter 2 — Data models

Relational, document, and graph models aren't better or worse — they're bets about your data's shape. Documents win when data comes in self-contained trees (good locality, no impedance mismatch with objects in code). Relational wins when many-to-many relationships dominate. Graphs win when *anything can relate to anything* and your queries are about traversal depth.

The lens we kept: **declarative beats imperative when you can get it.** SQL, Cypher, even CSS — you say what you want and leave the *how* to an optimizer that can improve without your code changing.

## Chapter 3 — Storage engines

The best chapter in the book for building intuition. Two families:

| | B-trees | LSM-trees |
|---|---|---|
| Write path | Overwrite pages in place | Append to memtable, flush to sorted files, compact |
| Read path | One tree walk | Check memtable, then multiple segment files |
| Strength | Predictable reads, one copy of each key | High write throughput, better compression |
| Watch out for | Write amplification from page splits | Compaction stealing I/O at the worst time |

The other split that pays rent: **OLTP vs. OLAP.** Transactional systems fetch a few rows by key; analytics scans millions of rows but touches few columns. That's why warehouses go column-oriented — you only read the columns you ask for, and same-typed values sitting together compress absurdly well.

## Chapter 4 — Encoding and evolution

Schemas change; deploys are rolling; old and new code *will* run side by side. So every format decision is really a compatibility decision: new code must read old data (backward compat) and old code must read new data (forward compat).

JSON is fine at the edges but sloppy in the middle (no integers vs. floats distinction, no binary strings). Binary schema formats — Protobuf, Avro, Thrift — earn their keep by making evolution rules explicit and checkable. The framing that generalizes: dataflow is always one of **databases** (write now, read later), **services** (RPC/REST), or **messages** (broker in the middle) — and the compatibility question shows up in all three.

## Chapter 5 — Replication

Three strategies, in increasing order of spice:

1. **Single-leader** — writes go to one node, followers replicate. Simple, but failover is a minefield: promote the wrong follower and you lose acknowledged writes.
2. **Multi-leader** — accept writes in multiple datacenters, resolve conflicts later. Great until "later" arrives.
3. **Leaderless** (Dynamo-style) — write to W nodes, read from R, rely on quorum overlap. Repair via read-repair and anti-entropy.

The section everyone skims and then regrets skimming is **replication lag**. Asynchronous replicas mean a user can write, refresh, and not see their own comment. The guarantees that fix this have names worth memorizing: *read-your-writes*, *monotonic reads*, *consistent-prefix reads*. If you've ever routed a user's reads to the leader for a minute after they write, you were implementing read-your-writes whether you knew it or not.

## Chapter 6 — Partitioning

Two ways to split data across nodes: **by key range** (nice range scans, hot-spot risk when writes concentrate) or **by hash of key** (even spread, range queries destroyed). Secondary indexes then force a second choice: index locally per partition (cheap writes, scatter-gather reads) or index globally by term (targeted reads, expensive distributed writes).

Rebalancing rule of thumb straight from the book: **never use `hash mod N`.** Adding one node reshuffles nearly everything. Fixed partition counts (create way more partitions than nodes, move whole partitions around) is the boring strategy that works.

## Chapter 7 — Transactions

ACID's most abused letter is *I*. Almost nobody runs serializable by default; what databases call "isolation" is a menu of weaker levels, each permitting specific anomalies:

- **Read committed** — no dirty reads/writes, but a transaction can see the database change under it.
- **Snapshot isolation** — each transaction reads a consistent point-in-time view (MVCC). Kills most anomalies, still permits **write skew**: two transactions each read a condition, both act, and together they violate it (the classic being two on-call doctors simultaneously deciding it's safe to leave).
- **Serializable** — the real thing, via actual serial execution (Redis-style), two-phase locking, or optimistic SSI.

If you take one thing from this chapter: when someone says "we use transactions, we're safe," ask *at which isolation level* — the answer usually dissolves the "safe."

## Chapter 8 — The trouble with distributed systems

The pessimism chapter, and the most quotable. Networks lose and delay messages arbitrarily. Clocks drift — wall clocks jump backward on NTP correction, so **never use timestamps to order events across nodes**. Processes pause at the worst moments (GC, VM migration) and wake up thinking they still hold a lease they lost seconds ago.

The antidote to zombie leaseholders is the **fencing token**: every time a lock is granted, it comes with a monotonically increasing number, and the storage system rejects writes bearing a stale token. Cheap, boring, effective. The chapter's broader point: in a distributed system you can't *know* anything remote — you can only build protocols whose guarantees survive not knowing.

## Chapter 9 — Consistency and consensus

**Linearizability** is the strongest single-object guarantee: the system behaves as if there's one copy of the data and every operation happens atomically at some instant. It's expensive, and the CAP framing — when a partition happens, choose availability or consistency — explains why most systems decline it by default.

The chapter's quiet power move is showing that a pile of seemingly different problems — leader election, atomic commit, locks, uniqueness constraints — **are all consensus in disguise**. That's why ZooKeeper/etcd exist: solve consensus once, in one battle-tested place, and let everything else outsource to it. Two-phase commit, by contrast, is atomic commit *without* fault tolerance — a coordinator crash at the wrong moment leaves participants locked in doubt, which is why the book treats it as a last resort.

## Chapter 10 — Batch processing

MapReduce reframed: the Unix philosophy (small tools, immutable inputs, pipes) scaled out to a cluster. Its enduring ideas outlived the framework itself — immutable inputs mean failed jobs retry safely; separating storage (HDFS) from compute enabled everything that came after. Dataflow engines like Spark keep the model and drop the mandatory disk round-trip between stages.

The comparison worth internalizing: MPP warehouses and Hadoop-style clusters both run distributed queries, but the cluster approach lets you store raw data *first* and impose schema *later* — which is the entire cultural difference between a warehouse and a lake.

## Chapter 11 — Stream processing

The synthesis chapter. A stream is just an unbounded, incrementally processed input; a **log-based broker** (Kafka) differs from a classic message queue in that consuming doesn't delete — the log persists, consumers track offsets, and you can replay history.

Two ideas here changed how I build pipelines at work:

- **Change data capture** — treat the database's replication log as a first-class event stream, and downstream systems (search, caches, warehouses) become derived views that can be rebuilt from scratch.
- **Event sourcing** — store immutable facts, derive current state. Time becomes explicit: event time vs. processing time, and windows have to reckon with stragglers.

The book ends where modern data architecture actually landed: batch and stream aren't rivals; the stream is the primary artifact and batch outputs are just materialized views over it.

---

## What we'd tell someone starting the book

Read chapters 1–4 quickly, 5–9 slowly, and 10–11 with your current job in mind. Keep a running list of the *named anomalies* (dirty read, write skew, phantom, lost update) — they're the vocabulary that makes design reviews precise. And when an interviewer asks you to "design X," you're almost always being asked to pick a point on three axes this book gives you: how it stores, how it replicates, and how it partitions.

Jon's original notes — with more tables and per-chapter depth — are at [avenuej.dev](https://avenuej.dev/educational-resources/system-design/). The book is at [dataintensive.net](https://dataintensive.net/). Buy it; it's the rare technical book that's still accurate a decade later.
