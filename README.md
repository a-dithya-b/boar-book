# Boar Book

Hands-on, chapter-by-chapter recaps of *Designing Data-Intensive Applications*
(2nd edition). No long reading: each chapter is a few short missions where you
break something, fix it, and keep the takeaways.

Unofficial and fan-made. Not affiliated with the authors or O'Reilly.

## Run it

```bash
npm install
```

```bash
npm run dev
```

```bash
npm run build
```

`dist/` is a static site; any static host works (`vercel.json` handles
client-side routes on Vercel).

## What's built

- **Home:** a 3D bookshelf of all 14 chapters, plus a plain list.
- **Ch 6 Replication:** warm-up flip cards, four missions (3D failover,
  lag-bug triage, offline multi-device sync, quorum dial), a recall check,
  and a takeaway card with a stamp you earn.

See [PLAN.md](PLAN.md) for the roadmap and the design decisions.

## Adding a chapter

1. Create `src/chapters/chNN-<slug>/index.tsx` exporting a component that renders
   `<ChapterShell meta={…} content={…} />`. `content` holds the recap cards,
   missions, quiz and takeaways (types in `src/components/chapter/types.ts`).
2. Each mission is a component that receives `{ onComplete, done }` and calls
   `onComplete()` when the player finishes it.
3. Register the module in `src/pages/Chapter.tsx` and set `ready: true` in
   `src/content/chapters.ts`.

## Stack

Vite, React, TypeScript, Tailwind CSS v4, Radix primitives (shadcn-style
components in `src/components/ui`), `motion`, `three` with `@react-three/fiber`
and `@react-three/drei`.
