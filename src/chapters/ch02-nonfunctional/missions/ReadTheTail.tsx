import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import { Lock, RotateCcw } from "lucide-react";
import type { MissionProps } from "@/components/chapter/types";
import { Coach, type Tone } from "@/components/chapter/Coach";
import { Goals } from "@/components/chapter/Goals";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

/** Seeded RNG so everyone sees the same traffic. */
function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

function makeSamples() {
  const r = rng(7);
  const gauss = () => Math.sqrt(-2 * Math.log(r() || 1e-9)) * Math.cos(2 * Math.PI * r());
  return Array.from({ length: 400 }, () => (r() < 0.03 ? 300 + r() * 420 : 90 * Math.exp(0.45 * gauss()))).map(Math.round);
}

const pct = (sorted: number[], p: number) => sorted[Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))];

const W = 900;
const H = 200;
const BINS = 36;

type Step = "p50" | "p99" | "amp";

export default function ReadTheTail({ onComplete }: MissionProps) {
  const samples = useMemo(makeSamples, []);
  const sorted = useMemo(() => [...samples].sort((a, b) => a - b), [samples]);
  const p50 = pct(sorted, 50);
  const p99 = pct(sorted, 99);
  const mean = Math.round(samples.reduce((a, b) => a + b, 0) / samples.length);
  const max = Math.ceil((p99 * 1.25) / 100) * 100;
  const bins = useMemo(() => {
    const b = Array(BINS).fill(0);
    samples.forEach((v) => (b[Math.min(BINS - 1, Math.floor((v / max) * BINS))] += 1));
    return b;
  }, [samples, max]);
  const peak = Math.max(...bins);
  const x = (ms: number) => (Math.min(ms, max) / max) * W;

  const [step, setStep] = useState<Step>("p50");
  const [guess, setGuess] = useState(Math.round(max * 0.6));
  const [locked, setLocked] = useState<{ p50?: number; p99?: number }>({});
  const [calls, setCalls] = useState(1);
  const [ampDone, setAmpDone] = useState(false);
  const svg = useRef<SVGSVGElement>(null);
  const dragging = useRef(false);
  const completed = useRef(false);

  const slowPages = Math.round(100 * (1 - Math.pow(0.99, calls)));

  useEffect(() => {
    if (slowPages >= 25 && !ampDone) setAmpDone(true);
  }, [slowPages, ampDone]);
  useEffect(() => {
    if (locked.p50 !== undefined && locked.p99 !== undefined && ampDone && !completed.current) {
      completed.current = true;
      onComplete();
    }
  }, [locked, ampDone, onComplete]);

  const setFromPointer = (clientX: number) => {
    const r = svg.current?.getBoundingClientRect();
    if (!r) return;
    const v = Math.round(((clientX - r.left) / r.width) * max);
    setGuess(Math.max(0, Math.min(max, v)));
  };

  const lock = () => {
    if (step === "p50") {
      setLocked((l) => ({ ...l, p50: guess }));
      setStep("p99");
      setGuess(Math.round(max * 0.4));
    } else if (step === "p99") {
      setLocked((l) => ({ ...l, p99: guess }));
      setStep("amp");
    }
  };

  const verdict = (g: number, truth: number) => {
    const err = Math.abs(g - truth) / truth;
    return err < 0.15 ? "Spot on." : err < 0.4 ? "Close." : "Way off, and that's the point.";
  };

  const reset = () => {
    setStep("p50");
    setLocked({});
    setGuess(Math.round(max * 0.6));
    setCalls(1);
  };

  const coach: { tone: Tone; text: React.ReactNode } = (() => {
    if (step === "p50")
      return { tone: "info", text: <>{samples.length} requests just landed. Drag the marker to where you think the <b>median</b> is: half the requests faster, half slower.</> };
    if (step === "p99")
      return {
        tone: "info",
        text: (
          <>
            {verdict(locked.p50!, p50)} The median was <b>{p50} ms</b>. Now the <b>p99</b>: 99 in 100 requests are faster than this. Where is it?
          </>
        ),
      };
    if (!ampDone)
      return {
        tone: "warn",
        text: (
          <>
            {verdict(locked.p99!, p99)} p99 was <b>{p99} ms</b>, {Math.round(p99 / p50)}× the median. The mean (<b>{mean} ms</b>) hides that tail
            entirely. Now: one page waits for several backend calls in parallel, each slow 1% of the time. Add calls until 1 in 4 pages is slow.
          </>
        ),
      };
    return {
      tone: "ok",
      text: (
        <>
          With {calls} backend calls, <b>{slowPages}%</b> of pages hit a slow one. A page is as slow as its slowest call: that's <b>tail latency
          amplification</b>, and why services set targets on p99, not the mean.
        </>
      ),
    };
  })();

  const markerX = step === "amp" ? null : x(guess);

  return (
    <div className="flex flex-col gap-4">
      <Goals
        items={[
          { label: "Guess the median", done: locked.p50 !== undefined },
          { label: "Guess the p99", done: locked.p99 !== undefined },
          { label: "Make 1 in 4 pages slow", done: ampDone },
        ]}
      />

      <div className="rounded-lg border bg-card p-3">
        <div className="mb-1 flex items-center justify-between text-[11px] text-muted-foreground">
          <span>Response times · {samples.length} requests</span>
          <span className="font-mono">0 – {max} ms{bins[BINS - 1] ? "+" : ""}</span>
        </div>
        <svg
          ref={svg}
          viewBox={`0 0 ${W} ${H + 26}`}
          className={cn("w-full touch-none select-none", step !== "amp" && "cursor-ew-resize")}
          onPointerDown={(e) => {
            if (step === "amp") return;
            dragging.current = true;
            (e.target as Element).setPointerCapture?.(e.pointerId);
            setFromPointer(e.clientX);
          }}
          onPointerMove={(e) => dragging.current && setFromPointer(e.clientX)}
          onPointerUp={() => (dragging.current = false)}
          role="img"
          aria-label="Histogram of response times"
        >
          {bins.map((c, i) => {
            const h = (c / peak) * (H - 20);
            const slowBin = (i + 1) * (max / BINS) > p99;
            return (
              <motion.rect
                key={i}
                x={(i / BINS) * W + 1}
                width={W / BINS - 2}
                rx={2}
                initial={{ y: H, height: 0 }}
                animate={{ y: H - h, height: h }}
                transition={{ duration: 0.6, delay: i * 0.025, ease: [0.22, 1, 0.36, 1] }}
                fill={locked.p99 !== undefined && slowBin ? "#dc2626" : "#1b1b1d"}
                opacity={locked.p99 !== undefined && !slowBin ? 0.25 : 0.9}
              />
            );
          })}
          <line x1={0} y1={H} x2={W} y2={H} stroke="#d4d4d8" />
          {[0, 0.25, 0.5, 0.75, 1].map((f) => (
            <text key={f} x={f * W} y={H + 16} textAnchor={f === 0 ? "start" : f === 1 ? "end" : "middle"} className="fill-zinc-400 font-mono text-[10px]">
              {Math.round(f * max)}
            </text>
          ))}

          {/* revealed truths */}
          {locked.p50 !== undefined && <Marker x={x(p50)} label={`p50 ${p50}`} color="#16a34a" row={0} />}
          {locked.p99 !== undefined && (
            <>
              <Marker x={x(p99)} label={`p99 ${p99}`} color="#dc2626" row={0} />
              <Marker x={x(mean)} label={`mean ${mean}`} color="#71717a" dashed row={1} />
            </>
          )}
          {/* your guess */}
          {markerX !== null && (
            <g>
              <line x1={markerX} y1={4} x2={markerX} y2={H} stroke="#2563eb" strokeWidth={2} />
              <rect x={markerX - 34} y={0} width={68} height={18} rx={9} fill="#2563eb" />
              <text x={markerX} y={13} textAnchor="middle" className="fill-white font-mono text-[10px] font-semibold">
                {guess} ms
              </text>
            </g>
          )}
        </svg>

        {step !== "amp" ? (
          <div className="mt-2 flex items-center gap-3">
            <Slider min={0} max={max} step={5} value={[guess]} onValueChange={([v]) => setGuess(v)} aria-label="Your guess" />
            <Button size="sm" onClick={lock} className="shrink-0">
              <Lock /> Lock in {step === "p50" ? "median" : "p99"}
            </Button>
          </div>
        ) : null}
      </div>

      {step === "amp" && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="grid gap-4 rounded-lg border p-3 md:grid-cols-[1fr_240px]">
          <div>
            <div className="mb-2 flex items-center justify-between text-[11px] text-muted-foreground">
              <span>100 page loads</span>
              <span className={cn("font-mono", slowPages >= 25 && "font-semibold text-fail")}>{slowPages} slow</span>
            </div>
            <div className="grid max-w-md gap-1" style={{ gridTemplateColumns: "repeat(20, minmax(0, 1fr))" }}>
              {Array.from({ length: 100 }, (_, i) => (
                <motion.span
                  key={i}
                  animate={{ backgroundColor: i < slowPages ? "#dc2626" : "#e4e4e7", scale: i < slowPages ? 1 : 0.85 }}
                  transition={{ duration: 0.2, delay: (i % 20) * 0.005 }}
                  className="aspect-square rounded-sm"
                />
              ))}
            </div>
          </div>
          <div className="flex flex-col justify-center gap-2">
            <div className="flex justify-between text-sm">
              <span>Backend calls per page</span>
              <span className="font-mono font-semibold">{calls}</span>
            </div>
            <Slider min={1} max={40} step={1} value={[calls]} onValueChange={([v]) => setCalls(v)} aria-label="Backend calls per page" />
            <div className="text-[11px] text-muted-foreground">Each call is slow 1% of the time.</div>
          </div>
        </motion.div>
      )}

      <Coach tone={coach.tone} k={`${step}-${ampDone}`}>
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

function Marker({ x, label, color, dashed, row }: { x: number; label: string; color: string; dashed?: boolean; row: number }) {
  const right = x > W - 110;
  return (
    <motion.g initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
      <line x1={x} y1={22} x2={x} y2={H} stroke={color} strokeWidth={2} strokeDasharray={dashed ? "4 3" : undefined} />
      <text x={right ? x - 5 : x + 5} y={36 + row * 16} textAnchor={right ? "end" : "start"} className="font-mono text-[10px] font-semibold" fill={color}>
        {label} ms
      </text>
    </motion.g>
  );
}
