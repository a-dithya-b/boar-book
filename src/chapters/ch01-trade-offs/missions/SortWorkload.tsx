import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ArrowRight, BarChart3, Database, Flame, RotateCcw } from "lucide-react";
import type { MissionProps } from "@/components/chapter/types";
import { Coach, type Tone } from "@/components/chapter/Coach";
import { Goals } from "@/components/chapter/Goals";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Bin = "oltp" | "olap";

const CARDS: { text: string; bin: Bin; why: string }[] = [
  { text: "Show customer #4021's open orders", bin: "oltp", why: "A few rows, looked up by key, while a user waits." },
  { text: "Total revenue per country, last 5 years", bin: "olap", why: "Scans millions of rows to compute one aggregate." },
  { text: "Mark order #88 as shipped", bin: "oltp", why: "A small write, triggered by a user action." },
  { text: "Which products are bought together most?", bin: "olap", why: "A question about patterns across all orders." },
  { text: "Check if the username “kai” is taken", bin: "oltp", why: "One keyed lookup, needs to be instant." },
  { text: "Weekly active users, by app version", bin: "olap", why: "Aggregates huge event history for a dashboard." },
  { text: "Add a comment to a post", bin: "oltp", why: "A single insert, part of the live app." },
  { text: "Train a model to predict churn", bin: "olap", why: "Data science reads lots of history in bulk." },
];

const BINS: Record<Bin, { name: string; sub: string; icon: typeof Database }> = {
  oltp: { name: "Operational DB", sub: "OLTP · serves users", icon: Database },
  olap: { name: "Data warehouse", sub: "OLAP · answers questions", icon: BarChart3 },
};

export default function SortWorkload({ onComplete }: MissionProps) {
  const [i, setI] = useState(0);
  const [placed, setPlaced] = useState<Record<Bin, number[]>>({ oltp: [], olap: [] });
  const [wrong, setWrong] = useState<Bin | null>(null);
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(0);
  const [last, setLast] = useState<{ ok: boolean; why: string } | null>(null);
  const [etl, setEtl] = useState(false);
  const done = i >= CARDS.length;
  const root = useRef<HTMLDivElement>(null);

  const route = (bin: Bin) => {
    if (done) return;
    const card = CARDS[i];
    if (card.bin !== bin) {
      setWrong(bin);
      setStreak(0);
      setLast({ ok: false, why: card.why });
      setTimeout(() => setWrong(null), 400);
      return;
    }
    const s = streak + 1;
    setStreak(s);
    setBest((b) => Math.max(b, s));
    setLast({ ok: true, why: card.why });
    setPlaced((p) => ({ ...p, [bin]: [...p[bin], i] }));
    setI(i + 1);
  };

  // keyboard: ← operational, → warehouse
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      // only while the mission is actually on screen
      const r = root.current?.getBoundingClientRect();
      if (!r || r.bottom < 0 || r.top > window.innerHeight) return;
      if (e.key === "ArrowLeft") route("oltp");
      if (e.key === "ArrowRight") route("olap");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const runEtl = () => {
    setEtl(true);
    setTimeout(onComplete, 1600);
  };

  const reset = () => {
    setI(0);
    setPlaced({ oltp: [], olap: [] });
    setStreak(0);
    setLast(null);
    setEtl(false);
  };

  const coach: { tone: Tone; text: React.ReactNode } = etl
    ? {
        tone: "ok",
        text: (
          <>
            Analytics run on a <b>copy</b>. ETL extracts data from the operational systems (the <b>systems of record</b>) and loads it into the
            warehouse, which is <b>derived data</b>. Heavy scans never slow down users.
          </>
        ),
      }
    : done
      ? { tone: "info", text: <>All sorted. But the warehouse is empty: the data lives in the operational DB. How does it get there?</> }
      : last
        ? { tone: last.ok ? "ok" : "fail", text: <>{last.ok ? "Yes. " : "Other side. "}{last.why}</> }
        : { tone: "info", text: <>Requests are arriving. Send each one where it belongs. Click a side, or use ← and →.</> };

  return (
    <div ref={root} className="flex flex-col gap-4">
      <Goals
        items={[
          { label: `Sort ${CARDS.length} requests`, done },
          { label: "Feed the warehouse", done: etl },
        ]}
      />

      <div className="grid grid-cols-2 items-stretch gap-3 md:grid-cols-[1fr_1.1fr_1fr]">
        {(["oltp", "olap"] as Bin[]).map((bin, k) => {
          const B = BINS[bin];
          const binEl = (
            <button
              key={bin}
              onClick={() => route(bin)}
              disabled={done}
              className={cn(
                "group relative flex min-h-[150px] cursor-pointer md:min-h-[220px] flex-col rounded-xl border p-3 text-left transition-colors disabled:cursor-default",
                !done && "hover:border-foreground/40 hover:bg-muted/40",
                wrong === bin && "animate-[shake_0.3s] border-fail bg-fail/5",
                k === 0 ? "md:order-1" : "md:order-3",
              )}
            >
              <div className="flex items-center gap-2">
                <B.icon className="size-4" />
                <div>
                  <div className="text-sm font-medium">{B.name}</div>
                  <div className="font-mono text-[10px] text-muted-foreground">{B.sub}</div>
                </div>
                <span className="ml-auto text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
                  {k === 0 ? <ArrowLeft className="size-4" /> : <ArrowRight className="size-4" />}
                </span>
              </div>
              <div className="mt-3 flex flex-col gap-1">
                <AnimatePresence initial={false}>
                  {placed[bin].map((idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: k === 0 ? 40 : -40, scale: 0.9 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      className="truncate rounded-md bg-muted px-2 py-1 text-[11px]"
                    >
                      {CARDS[idx].text}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
              {/* ETL rows arriving in the warehouse */}
              {bin === "olap" && etl && (
                <div className="mt-auto flex gap-1 pt-2">
                  {Array.from({ length: 10 }).map((_, j) => (
                    <motion.span
                      key={j}
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 + j * 0.06 }}
                      className="h-2 flex-1 rounded-sm bg-data/70"
                    />
                  ))}
                </div>
              )}
            </button>
          );
          return binEl;
        })}

        {/* the incoming request */}
        <div className="relative order-first col-span-2 flex min-h-[150px] flex-col items-center justify-center rounded-xl border border-dashed bg-dots p-4 md:order-2 md:col-span-1 md:min-h-[220px]">
          <div className="absolute top-2 left-3 font-mono text-[10px] text-muted-foreground">
            {Math.min(i + 1, CARDS.length)}/{CARDS.length}
          </div>
          {streak >= 2 && !done && (
            <motion.div
              key={streak}
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="absolute top-2 right-3 flex items-center gap-1 font-mono text-[11px] text-warn"
            >
              <Flame className="size-3.5" /> {streak} streak
            </motion.div>
          )}
          <AnimatePresence mode="popLayout">
            {!done ? (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: -30, rotate: -3 }}
                animate={{ opacity: 1, y: 0, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ type: "spring", stiffness: 300, damping: 22 }}
                className="w-full max-w-[240px] rounded-xl border bg-background p-4 text-center shadow-md"
              >
                <div className="mb-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">incoming request</div>
                <div className="text-sm font-medium text-balance">{CARDS[i].text}</div>
              </motion.div>
            ) : (
              <motion.div key="etl" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex w-full flex-col items-center gap-3">
                {/* the pipe */}
                <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
                  {etl &&
                    Array.from({ length: 6 }).map((_, j) => (
                      <motion.span
                        key={j}
                        className="absolute top-0 h-2 w-6 rounded-full bg-data"
                        initial={{ left: "-10%" }}
                        animate={{ left: "110%" }}
                        transition={{ duration: 0.9, delay: j * 0.12, ease: "easeInOut" }}
                      />
                    ))}
                </div>
                <div className="font-mono text-[10px] text-muted-foreground">operational → warehouse</div>
                {!etl && <Button onClick={runEtl}>Run ETL</Button>}
                {etl && <div className="text-xs text-muted-foreground">Best streak: {best}</div>}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <Coach tone={coach.tone} k={`${i}-${last?.ok}-${etl}-${done}`}>
        {coach.text}
      </Coach>

      <div className="flex justify-end">
        <Button variant="ghost" size="sm" onClick={reset}>
          <RotateCcw /> Restart
        </Button>
      </div>
    </div>
  );
}
