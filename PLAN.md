# Boar Book — Plan

Interactive, chapter-by-chapter recall companion for *Designing Data-Intensive
Applications*, **2nd edition** (Kleppmann & Riccomini). Unofficial and fan-made:
the text is original, with no copied passages, figures, cover art or O'Reilly branding.

## Decisions (from Q&A)

| Topic | Decision |
|---|---|
| Edition | 2nd edition (14 chapters, 3 parts) |
| 2D vs 3D | Hybrid: 3D where space helps (home map, server clusters), clean 2D for mechanisms (timelines, logs, quorums) |
| First version | One chapter end-to-end (Ch 6 Replication) + the home map |
| State | Stateless. No accounts, no saved progress. Rewards live for the visit only |
| Access | Every chapter open, no locking |
| Devices | Desktop first; phones should still work (3D degrades to simpler views) |
| Content | Original writing by us. **Keep reading short**: no paragraph over ~2 lines |
| Look | Minimal black and white, in the shadcn/ui style. Colour only where it carries meaning |

## The chapter loop (5–10 minutes)

1. **Recap strip:** 3–4 flip cards, one idea each, under 25 words.
2. **Missions:** 3–4 hands-on challenges. Each starts with a one-line goal,
   and you learn by doing, often by breaking something and then fixing it.
   You can do them in any order.
3. **Recall check:** 5–6 "predict what happens" questions with instant feedback
   and a one-line explanation.
4. **Reward:** an animated chapter stamp and a takeaway card you can download as a PNG.

## Chapter 6 — Replication (first build)

| # | Mission | View | You do | It teaches |
|---|---|---|---|---|
| 1 | **Keep the lights on** | 3D | Send writes, crash the leader, promote a follower, deal with the old leader when it comes back | sync vs async followers, failover, lost writes, split brain |
| 2 | **Bug triage** | 2D | Post and refresh in a mock app, watch the bug happen, choose the guarantee that fixes it | read-your-writes, monotonic reads, consistent prefix reads |
| 3 | **Two devices, one list** | 2D | Edit a shared list on two offline devices, reconnect, pick a merge strategy | multi-leader, offline sync, last-write-wins data loss, CRDTs |
| 4 | **Quorum dial** | 2D | Set `w` and `r` for 5 replicas, kill nodes, write and read | leaderless replication, `w + r > n`, read repair |

## Roadmap (all 14 chapters, 2nd edition)

Part I — Foundations of Data Systems
1. Trade-offs in Data Systems Architecture: *OLTP vs OLAP sorter; cloud vs self-hosted trade-off dial*
2. Defining Nonfunctional Requirements: *home-timeline fan-out sim; percentile latency explorer*
3. Data Models and Query Languages: *model the same data as relational, document and graph*
4. Storage and Retrieval: *LSM-tree vs B-tree playground (3D stacks of SSTables and pages)*
5. Encoding and Evolution: *schema-evolution game: will old and new code still talk?*

Part II — Distributed Data
6. **Replication ← building now**
7. Sharding: *hot-spot rebalancing in a 3D cluster; key-range vs hash*
8. Transactions: *spot the anomaly (lost update, write skew), choose the isolation level*
9. The Trouble with Distributed Systems: *zombie leader vs fencing tokens; clock drift*
10. Consistency and Consensus: *linearizability checker; leader election*

Part III — Derived Data
11. Batch Processing: *assemble a dataflow pipeline*
12. Stream Processing: *event log, consumer offsets, replay*
13. A Philosophy of Streaming Systems: *derive views from one log*
14. Doing the Right Thing: *data-ethics decision cards*

## Design system

- **Palette:** white background, near-black ink, zinc greys.
  Meaning colours, used sparingly: blue = data/write in flight,
  green = success/in sync, red = failure/lost data, amber = conflict/stale.
- **Type:** Geist (UI), Geist Mono (numbers, logs, code).
- **Components:** shadcn-style Button, Card, Badge, Slider, Progress, built on
  Radix primitives (the shadcn registry isn't reachable from the build sandbox,
  so they're written by hand to the same spec).
- **Motion:** short (150–400 ms) and purposeful; respects `prefers-reduced-motion`.

## Tech

Vite + React + TypeScript, Tailwind CSS v4, Radix primitives, `motion` for 2D
animation, `three` + `@react-three/fiber` + `@react-three/drei` for 3D,
React Router. Static build; any static host works (`vercel.json` included).

```
src/
  content/chapters.ts        # all 14 chapters: number, title, part, blurb, status
  components/ui/             # shadcn-style primitives
  components/chapter/        # ChapterShell, RecapStrip, MissionFrame, Quiz, Reward
  pages/Home.tsx             # 3D book map + plain list fallback
  pages/Chapter.tsx          # routes to a chapter module
  chapters/ch06-replication/ # recap, missions, quiz, takeaways
```

## Build order

1. Scaffold the project and design tokens; build the UI primitives.
2. Home: 3D map of 14 chapters plus an accessible list.
3. Chapter shell: recap strip, mission navigation, quiz, reward.
4. Ch 6 missions 1–4.
5. Visual QA with Playwright (desktop and phone), then build and push.
6. Review with you, then roll the same template out to other chapters.

## Ideas: other ways to show the chapters (not built)

| Idea | Why it fits | Cost |
|---|---|---|
| **The building:** floors stacked by Part | Part I is literally "Foundations"; you climb the book | Medium (3D) |
| **Metro map:** Parts are lines, chapters are stations | Interchanges show how ideas connect, which helps recall; works on phones | Medium (2D) |
| **Data-centre aisle:** each chapter is a rack | Very on-theme, game-like | High; hard on phones |
| **Append-only log:** chapters as offsets 0–13 | Clever nod to Ch 11–13 | Low; less fun |
| **Node graph:** chapters as networked nodes | Packets flow between related chapters | Medium |

Leaning: the building, or the metro map if phones matter more. The chapter
entrance transition is independent of this choice (it opens from the click point).
