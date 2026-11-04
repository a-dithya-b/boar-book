import { useState } from "react";
import { motion } from "motion/react";
import { BookOpen, PenLine, RotateCcw } from "lucide-react";
import type { MissionProps } from "@/components/chapter/types";
import { Coach, type Tone } from "@/components/chapter/Coach";
import { Goals } from "@/components/chapter/Goals";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

const N = 5;
const CX = 150;
const CY = 140;
const R = 100;
const pos = (i: number) => {
  const a = -Math.PI / 2 + (i * 2 * Math.PI) / N;
  return { x: CX + R * Math.cos(a), y: CY + R * Math.sin(a) };
};

interface Op {
  kind: "write" | "read";
  ok: boolean;
  nodes: number[];
  result?: number;
  repaired: number[];
  msg: string;
  id: number;
}

export default function Quorum({ onComplete }: MissionProps) {
  const [versions, setVersions] = useState<number[]>(() => Array(N).fill(1));
  const [down, setDown] = useState<boolean[]>(() => Array(N).fill(false));
  const [w, setW] = useState(1);
  const [r, setR] = useState(1);
  const [latest, setLatest] = useState(1);
  const [lastWrite, setLastWrite] = useState<{ w: number; down: number } | null>(null);
  const [offset, setOffset] = useState(0);
  const [op, setOp] = useState<Op | null>(null);
  const [goals, setGoals] = useState({ stale: false, fresh: false, tolerant: false });

  const alive = down.map((d, i) => (d ? -1 : i)).filter((i) => i >= 0);
  const downCount = N - alive.length;
  const overlap = w + r > N;

  const toggle = (i: number) => {
    if (!down[i] && downCount >= N - 1) return;
    setDown((d) => d.map((v, j) => (j === i ? !v : v)));
  };

  const write = () => {
    if (alive.length < w) {
      setOp({ kind: "write", ok: false, nodes: [], repaired: [], msg: `Write failed: only ${alive.length} nodes up, but w = ${w}.`, id: Date.now() });
      return;
    }
    const v = latest + 1;
    // rotate who gets it, so different nodes end up stale
    const order = [...alive.slice(offset % alive.length), ...alive.slice(0, offset % alive.length)];
    const targets = order.slice(0, w);
    setOffset((o) => o + 1);
    setVersions((vs) => vs.map((x, i) => (targets.includes(i) ? v : x)));
    setLatest(v);
    setLastWrite({ w, down: downCount });
    setOp({ kind: "write", ok: true, nodes: targets, repaired: [], msg: `v${v} confirmed by ${w} node${w > 1 ? "s" : ""}. The rest didn't get it yet.`, id: Date.now() });
  };

  const read = () => {
    if (alive.length < r) {
      setOp({ kind: "read", ok: false, nodes: [], repaired: [], msg: `Read failed: only ${alive.length} nodes up, but r = ${r}.`, id: Date.now() });
      return;
    }
    // worst case: the read happens to ask the stalest nodes first
    const picked = [...alive].sort((a, b) => versions[a] - versions[b] || a - b).slice(0, r);
    const result = Math.max(...picked.map((i) => versions[i]));
    const repaired = picked.filter((i) => versions[i] < result);
    setVersions((vs) => vs.map((x, i) => (repaired.includes(i) ? result : x)));
    const isFresh = result === latest;
    setOp({
      kind: "read",
      ok: isFresh,
      nodes: picked,
      result,
      repaired,
      msg: isFresh
        ? `Read got v${result}, the latest.${repaired.length ? ` Read repair fixed ${repaired.length} stale node${repaired.length > 1 ? "s" : ""}.` : ""}`
        : `Stale read! Got v${result}, but v${latest} was confirmed.`,
      id: Date.now(),
    });
    const g = { ...goals };
    if (!isFresh) g.stale = true;
    const quorum = isFresh && lastWrite !== null && lastWrite.w + r > N;
    if (quorum) g.fresh = true;
    if (quorum && lastWrite!.down >= 1 && downCount >= 1) g.tolerant = true;
    setGoals(g);
    if (g.stale && g.fresh && g.tolerant && !(goals.stale && goals.fresh && goals.tolerant)) onComplete();
  };

  const reset = () => {
    setVersions(Array(N).fill(1));
    setDown(Array(N).fill(false));
    setW(1);
    setR(1);
    setLatest(1);
    setLastWrite(null);
    setOp(null);
    setOffset(0);
    setGoals({ stale: false, fresh: false, tolerant: false });
  };

  const coach: { tone: Tone; text: React.ReactNode } = op
    ? { tone: op.ok ? (op.kind === "read" ? "ok" : "info") : "fail", text: op.msg }
    : { tone: "info", text: <>No leader here: the client writes to <b>w</b> nodes and reads from <b>r</b> nodes. Start with a write, then a read.</> };

  const nextHint = !goals.stale
    ? "Write, then read. With w = 1 and r = 1, can the read miss it?"
    : !goals.fresh
      ? "Raise w and r until every read must hit the latest write."
      : !goals.tolerant
        ? "Click a node to take it down. Can you still write and read fresh data?"
        : "Quorum mastered.";

  return (
    <div className="flex flex-col gap-4">
      <Goals
        items={[
          { label: "Get a stale read", done: goals.stale },
          { label: "Make every read fresh", done: goals.fresh },
          { label: "Stay fresh with a node down", done: goals.tolerant },
        ]}
      />

      <div className="grid gap-4 md:grid-cols-[1fr_280px]">
        <div className="rounded-lg border bg-dots">
          <svg viewBox="0 0 300 280" className="mx-auto block w-full max-w-[420px]" role="img" aria-label="Five replicas in a ring">
            {/* client in the middle */}
            {op?.nodes.map((i) => {
              const p = pos(i);
              return (
                <motion.line
                  key={`${op.id}-${i}`}
                  x1={CX}
                  y1={CY}
                  x2={p.x}
                  y2={p.y}
                  stroke={op.kind === "write" ? "#2563eb" : "#0a0a0a"}
                  strokeWidth={1.5}
                  strokeDasharray={op.kind === "read" ? "4 3" : undefined}
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.35 }}
                />
              );
            })}
            <rect x={CX - 26} y={CY - 13} width={52} height={26} rx={6} fill="#fff" stroke="#e4e4e7" />
            <text x={CX} y={CY + 4} textAnchor="middle" className="fill-foreground text-[10px] font-medium">client</text>

            {versions.map((v, i) => {
              const p = pos(i);
              const isDown = down[i];
              const stale = !isDown && v < latest;
              const repaired = op?.repaired.includes(i);
              return (
                <g key={i} onClick={() => toggle(i)} className="cursor-pointer" role="button" aria-label={`Node ${i + 1}, ${isDown ? "down" : `v${v}`}. Click to toggle.`}>
                  {repaired && (
                    <motion.circle
                      key={`rep-${op!.id}`}
                      cx={p.x}
                      cy={p.y}
                      r={24}
                      fill="none"
                      stroke="#16a34a"
                      strokeWidth={2}
                      initial={{ r: 24, opacity: 1 }}
                      animate={{ r: 38, opacity: 0 }}
                      transition={{ duration: 0.9 }}
                    />
                  )}
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={24}
                    fill={isDown ? "#f4f4f5" : v === latest ? "#0a0a0a" : "#fff"}
                    stroke={isDown ? "#d4d4d8" : stale ? "#d97706" : "#0a0a0a"}
                    strokeWidth={1.5}
                    strokeDasharray={isDown ? "3 3" : undefined}
                  />
                  <text x={p.x} y={p.y + 4} textAnchor="middle" className={cn("font-mono text-[12px] font-semibold", isDown ? "fill-zinc-400" : v === latest ? "fill-white" : "fill-amber-600")}>
                    {isDown ? "✕" : `v${v}`}
                  </text>
                  <text x={p.x} y={p.y + (p.y > CY ? 40 : -32)} textAnchor="middle" className="fill-zinc-500 text-[9px]">
                    node {i + 1}
                  </text>
                </g>
              );
            })}
          </svg>
          <div className="pb-2 text-center text-[11px] text-muted-foreground">Click a node to take it down or bring it back.</div>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <div className="mb-1 flex justify-between text-sm">
              <span>Write quorum <b className="font-mono">w</b></span>
              <span className="font-mono font-semibold">{w}</span>
            </div>
            <Slider min={1} max={N} step={1} value={[w]} onValueChange={([v]) => setW(v)} aria-label="w" />
          </div>
          <div>
            <div className="mb-1 flex justify-between text-sm">
              <span>Read quorum <b className="font-mono">r</b></span>
              <span className="font-mono font-semibold">{r}</span>
            </div>
            <Slider min={1} max={N} step={1} value={[r]} onValueChange={([v]) => setR(v)} aria-label="r" />
          </div>

          <div className={cn("rounded-lg border px-3 py-2.5 font-mono text-sm", overlap ? "border-ok/40 bg-ok/8" : "border-warn/40 bg-warn/8")}>
            w + r = {w + r} {overlap ? ">" : "≤"} n = {N}
            <div className="mt-0.5 font-sans text-xs text-muted-foreground">
              {overlap ? "Read and write sets must overlap." : "A read can miss every node that has the write."}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
            <div className="rounded-md bg-muted/60 px-2 py-1.5">Writes survive <b className="text-foreground">{N - w}</b> down</div>
            <div className="rounded-md bg-muted/60 px-2 py-1.5">Reads survive <b className="text-foreground">{N - r}</b> down</div>
          </div>

          <div className="flex gap-2">
            <Button className="flex-1" onClick={write}>
              <PenLine /> Write v{latest + 1}
            </Button>
            <Button className="flex-1" variant="outline" onClick={read}>
              <BookOpen /> Read
            </Button>
          </div>
        </div>
      </div>

      <Coach tone={coach.tone} k={op ? String(op.id) : "intro"}>
        {coach.text}
      </Coach>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>Next: {nextHint}</span>
        <Button variant="ghost" size="sm" className="ml-auto" onClick={reset}>
          <RotateCcw /> Restart
        </Button>
      </div>
    </div>
  );
}
