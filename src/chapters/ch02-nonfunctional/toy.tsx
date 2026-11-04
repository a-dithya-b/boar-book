import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { MousePointerClick } from "lucide-react";
import { cn } from "@/lib/utils";

/** Home-page toy for Chapter 2: a live latency histogram; more backend calls per page stretch the tail. */
const CALLS = [1, 5, 10, 20];
const WINDOW = 300; // recent page loads kept
const MAX_MS = 700;
const BINS = 28;
const W = 360;
const H = 160;

const gauss = () => Math.sqrt(-2 * Math.log(Math.random() || 1e-9)) * Math.cos(2 * Math.PI * Math.random());
/** One backend call: usually ~60 ms, slow 1% of the time. */
const call = () => (Math.random() < 0.01 ? 380 + Math.random() * 300 : 60 * Math.exp(0.35 * gauss()));
/** A page waits for all of its calls in parallel: as slow as the slowest. */
const page = (n: number) => Math.max(...Array.from({ length: n }, call));

const pct = (sorted: number[], p: number) => sorted[Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))] ?? 0;

export function LatencyToy() {
  const reduce = useReducedMotion();
  const [n, setN] = useState(1);
  const nRef = useRef(1);
  nRef.current = n;
  const samples = useRef<number[]>(Array.from({ length: WINDOW }, () => page(1)));
  const [, tick] = useState(0);
  const touched = useRef(false);

  // a steady stream of page loads
  useEffect(() => {
    const t = setInterval(() => {
      const s = samples.current;
      for (let k = 0; k < 6; k++) s.push(page(nRef.current));
      samples.current = s.slice(-WINDOW);
      tick((x) => x + 1);
    }, reduce ? 600 : 90);
    return () => clearInterval(t);
  }, [reduce]);

  // idle demo: step through the call counts until someone plays
  useEffect(() => {
    if (reduce) return;
    const t = setInterval(() => {
      if (!touched.current) setN((v) => CALLS[(CALLS.indexOf(v) + 1) % CALLS.length]);
    }, 2600);
    return () => clearInterval(t);
  }, [reduce]);

  const sorted = [...samples.current].sort((a, b) => a - b);
  const p50 = Math.round(pct(sorted, 50));
  const p99 = Math.round(pct(sorted, 99));
  const bins = Array(BINS).fill(0);
  samples.current.forEach((v) => (bins[Math.min(BINS - 1, Math.floor((v / MAX_MS) * BINS))] += 1));
  const peak = Math.max(...bins, 1);
  const x = (ms: number) => (Math.min(ms, MAX_MS) / MAX_MS) * W;

  return (
    <div className="flex h-full flex-col select-none">
      <div className="flex items-center justify-between px-1 text-[10px] text-muted-foreground">
        <span>Page load times, live</span>
        <span className="font-mono">0 – {MAX_MS} ms</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H + 8}`} className="w-full" role="img" aria-label="Live histogram of page load times">
        {bins.map((c, i) => {
          const h = (c / peak) * (H - 30);
          const slow = (i / BINS) * MAX_MS >= p99;
          return (
            <rect
              key={i}
              x={(i / BINS) * W + 1}
              width={W / BINS - 2}
              y={H - h}
              height={h}
              rx={1.5}
              fill={slow ? "#dc2626" : "#0a0a0a"}
              opacity={slow ? 0.9 : 0.85}
              style={{ transition: "y 120ms linear, height 120ms linear" }}
            />
          );
        })}
        <line x1={0} y1={H} x2={W} y2={H} stroke="#e4e4e7" />
        {[
          { v: p50, label: "p50", color: "#16a34a", row: 0 },
          { v: p99, label: "p99", color: "#dc2626", row: 1 },
        ].map((m) => {
          const mx = x(m.v);
          const right = mx > W - 80;
          return (
            <g key={m.label} style={{ transform: `translateX(${mx}px)`, transition: "transform 300ms ease-out" }}>
              <line x1={0} y1={6 + m.row * 14} x2={0} y2={H} stroke={m.color} strokeWidth={1.8} strokeDasharray="3 3" />
              <text x={right ? -4 : 4} y={14 + m.row * 14} textAnchor={right ? "end" : "start"} className="font-mono text-[10px] font-semibold" fill={m.color}>
                {m.label} {m.v} ms
              </text>
            </g>
          );
        })}
      </svg>

      <div className="mt-2 flex items-center justify-center gap-2">
        <span className="text-[11px] text-muted-foreground">Backend calls per page</span>
        <div className="flex rounded-full border p-0.5">
          {CALLS.map((c) => (
            <button
              key={c}
              onClick={() => {
                touched.current = true;
                setN(c);
              }}
              className={cn(
                "relative cursor-pointer rounded-full px-2.5 py-0.5 font-mono text-[11px] transition-colors",
                n === c ? "text-background" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {n === c && <motion.span layoutId="latency-calls" className="absolute inset-0 rounded-full bg-foreground" transition={{ type: "spring", stiffness: 400, damping: 30 }} />}
              <span className="relative">{c}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="mt-auto flex items-center justify-center gap-1.5 pt-2 text-center text-xs text-muted-foreground">
        <MousePointerClick className="size-3.5 shrink-0" />
        More calls per page: the median barely moves, the p99 runs away.
      </div>
    </div>
  );
}
