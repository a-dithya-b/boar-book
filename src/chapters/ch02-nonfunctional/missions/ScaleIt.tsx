import { useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, ArrowUpFromLine, Minus, Plus, RotateCcw, Scissors, TrendingUp } from "lucide-react";
import type { MissionProps } from "@/components/chapter/types";
import { Coach, type Tone } from "@/components/chapter/Coach";
import { Goals } from "@/components/chapter/Goals";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const LOADS = [2, 6, 20];
const SIZES = [
  { name: "small", cap: 1, cost: 1 },
  { name: "large", cap: 2, cost: 2.5 },
  { name: "x-large", cap: 4, cost: 6 },
  { name: "biggest there is", cap: 8, cost: 15 },
];
const BUDGET = 25;

export default function ScaleIt({ onComplete }: MissionProps) {
  const [stage, setStage] = useState(0);
  const [level, setLevel] = useState(0);
  const [nodes, setNodes] = useState(1);
  const [split, setSplit] = useState(false);
  const [askSplit, setAskSplit] = useState(false);
  const [cleared, setCleared] = useState<boolean[]>([false, false, false]);
  const [hitCeiling, setHitCeiling] = useState(false);
  const completed = useRef(false);

  const load = LOADS[stage];
  const size = SIZES[level];
  const capacity = nodes * size.cap;
  const cost = nodes * size.cost;
  const ok = capacity >= load && cost <= BUDGET;
  const maxBar = Math.max(load, capacity, 8) * 1.1;

  const up = () => {
    if (level >= SIZES.length - 1) return setHitCeiling(true);
    setLevel(level + 1);
  };
  const down = () => {
    setHitCeiling(false);
    if (level > 0) setLevel(level - 1);
  };
  const add = (k: number) => {
    setHitCeiling(false);
    if (!split) return setAskSplit(true);
    setNodes((n) => Math.min(24, n + k));
  };
  const remove = (k: number) => {
    setHitCeiling(false);
    setNodes((n) => Math.max(1, n - k));
  };

  const next = () => {
    const c = cleared.map((v, i) => (i === stage ? true : v));
    setCleared(c);
    if (stage < LOADS.length - 1) {
      setStage(stage + 1);
      setHitCeiling(false);
    } else if (!completed.current) {
      completed.current = true;
      onComplete();
    }
  };

  const reset = () => {
    setStage(0);
    setLevel(0);
    setNodes(1);
    setSplit(false);
    setAskSplit(false);
    setCleared([false, false, false]);
    setHitCeiling(false);
  };

  const coach: { tone: Tone; text: React.ReactNode } = (() => {
    if (cleared[2])
      return {
        tone: "ok",
        text: (
          <>
            <b>Scaling up</b> (one bigger machine, shared-memory) is simple, but it has a ceiling and the price climbs faster than the power.{" "}
            <b>Scaling out</b> (many machines, shared-nothing) grows almost without limit, but the data must be split and the machines must
            coordinate. Shared-disk sits in between.
          </>
        ),
      };
    if (askSplit && !split)
      return { tone: "warn", text: <>All your data lives on one machine. A second machine is useless until you <b>split the data</b> between them.</> };
    if (hitCeiling) return { tone: "fail", text: <>That's the biggest machine money can buy: {SIZES[3].cap}× capacity. Load is {load}×. Time to think differently.</> };
    if (capacity < load) return { tone: "warn", text: <>Traffic is now <b>{load}×</b> what one small machine handles. You're dropping requests.</> };
    if (cost > BUDGET) return { tone: "fail", text: <>It keeps up, but costs {cost} a month against a budget of {BUDGET}. Find a cheaper shape.</> };
    return { tone: "ok", text: <>Keeping up at {cost}/{BUDGET} a month. Ready for more traffic?</> };
  })();

  return (
    <div className="flex flex-col gap-4">
      <Goals items={LOADS.map((l, i) => ({ label: `Handle ${l}× load`, done: cleared[i] }))} />

      <div className="grid gap-4 md:grid-cols-[1fr_260px]">
        <div className="flex flex-col gap-3 rounded-lg border bg-dots p-4">
          {/* load vs capacity */}
          {[
            { label: "Load", value: load, color: "bg-foreground" },
            { label: "Capacity", value: capacity, color: capacity >= load ? "bg-ok" : "bg-fail" },
          ].map((b) => (
            <div key={b.label}>
              <div className="mb-1 flex justify-between text-[11px]">
                <span className="text-muted-foreground">{b.label}</span>
                <span className="font-mono font-semibold">{b.value}×</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-background">
                <motion.div className={cn("h-full rounded-full", b.color)} animate={{ width: `${(b.value / maxBar) * 100}%` }} transition={{ type: "spring", stiffness: 120, damping: 20 }} />
              </div>
            </div>
          ))}

          {/* the fleet */}
          <div className="mt-2 flex min-h-[110px] flex-wrap items-end gap-1.5 rounded-md bg-background/80 p-3">
            <AnimatePresence initial={false}>
              {Array.from({ length: nodes }, (_, i) => (
                <motion.div
                  key={i}
                  layout
                  initial={{ opacity: 0, y: -16, scale: 0.6 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.6 }}
                  className="flex flex-col justify-end gap-[2px] rounded-[4px] bg-foreground p-1"
                  style={{ width: 22 + level * 6, height: 26 + level * 22 }}
                >
                  {Array.from({ length: level + 1 }, (_, k) => (
                    <span key={k} className="h-1 rounded-full bg-ok/80" />
                  ))}
                </motion.div>
              ))}
            </AnimatePresence>
            {split && <span className="ml-auto self-start font-mono text-[10px] text-muted-foreground">data split across machines</span>}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className={cn("rounded-lg border px-3 py-2", cost > BUDGET && "border-fail/40 bg-fail/5")}>
            <div className="flex justify-between text-[11px] text-muted-foreground">
              <span>Monthly cost</span>
              <span>budget {BUDGET}</span>
            </div>
            <div className={cn("font-mono text-xl font-semibold tabular-nums", cost > BUDGET && "text-fail")}>{cost}</div>
            <div className="text-[11px] text-muted-foreground">
              {nodes} × {size.name} ({size.cap}× each, costs {size.cost})
            </div>
          </div>

          <div className="rounded-lg border p-2">
            <div className="mb-1.5 px-1 text-[11px] font-medium text-muted-foreground">Scale up</div>
            <div className="flex gap-1.5">
              <Button size="sm" variant="outline" className="flex-1" onClick={up}>
                <ArrowUpFromLine /> Bigger
              </Button>
              <Button size="sm" variant="ghost" onClick={down} disabled={level === 0} aria-label="Smaller machine">
                <Minus />
              </Button>
            </div>
          </div>
          <div className="rounded-lg border p-2">
            <div className="mb-1.5 px-1 text-[11px] font-medium text-muted-foreground">Scale out</div>
            {askSplit && !split ? (
              <Button size="sm" className="w-full" onClick={() => setSplit(true)}>
                <Scissors /> Split the data across machines
              </Button>
            ) : (
              <div className="flex gap-1.5">
                <Button size="sm" variant="outline" className="flex-1" onClick={() => add(1)}>
                  <Plus /> 1
                </Button>
                <Button size="sm" variant="outline" className="flex-1" onClick={() => add(5)}>
                  <Plus /> 5
                </Button>
                <Button size="sm" variant="ghost" onClick={() => remove(1)} disabled={nodes === 1} aria-label="Remove a machine">
                  <Minus />
                </Button>
              </div>
            )}
          </div>

          {cleared[2] ? (
            <Button variant="ghost" onClick={reset}>
              <RotateCcw /> Play again
            </Button>
          ) : (
            <Button onClick={next} disabled={!ok}>
              {stage < LOADS.length - 1 ? (
                <>
                  <TrendingUp /> Traffic grows
                </>
              ) : (
                <>
                  Done <ArrowRight />
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      <Coach tone={coach.tone} k={`${stage}-${level}-${nodes}-${askSplit}-${split}-${hitCeiling}-${cleared[2]}`}>
        {coach.text}
      </Coach>
    </div>
  );
}
