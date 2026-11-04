import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Cloud, MousePointerClick, Server } from "lucide-react";
import { cn } from "@/lib/utils";

/** Home-page toy for Chapter 1: drop factors on a balance and see where it leans. */
const FACTORS = [
  { label: "Spiky traffic", side: -1 },
  { label: "Tiny team", side: -1 },
  { label: "Huge, steady load", side: 1 },
  { label: "Full control", side: 1 },
  { label: "Ship this month", side: -1 },
];

const CX = 180;
const BEAM_Y = 60;
const L = 120;

const SPRING = { type: "spring" as const, stiffness: 90, damping: 12 };

/** A pan hanging from one end of the beam; it rides up and down with the tilt. */
function Pan({ side, items, sin }: { side: -1 | 1; items: typeof FACTORS; sin: number }) {
  return (
    <motion.g animate={{ y: side * L * sin }} transition={SPRING}>
      <line x1={CX + side * L} y1={BEAM_Y} x2={CX + side * L - 34} y2={BEAM_Y + 62} stroke="#d4d4d8" strokeWidth={1.2} />
      <line x1={CX + side * L} y1={BEAM_Y} x2={CX + side * L + 34} y2={BEAM_Y + 62} stroke="#d4d4d8" strokeWidth={1.2} />
      <path d={`M${CX + side * L - 48},${BEAM_Y + 62} h96 q-8,14 -48,14 q-40,0 -48,-14z`} fill="#0a0a0a" />
      {items.map((f, k) => (
        <motion.g key={f.label} initial={{ y: -60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: "spring", stiffness: 260, damping: 18 }}>
          <rect x={CX + side * L - 52} y={BEAM_Y + 62 - 18 - k * 19} width={104} height={17} rx={4} fill={side < 0 ? "#2563eb" : "#52525b"} />
          <text x={CX + side * L} y={BEAM_Y + 62 - 6 - k * 19} textAnchor="middle" className="fill-white font-mono text-[9px]">
            {f.label}
          </text>
        </motion.g>
      ))}
    </motion.g>
  );
}

export function TradeOffToy() {
  const reduce = useReducedMotion();
  const [on, setOn] = useState<boolean[]>([true, false, true, false, false]);
  const touched = useRef(false);

  const left = FACTORS.filter((f, i) => on[i] && f.side < 0);
  const right = FACTORS.filter((f, i) => on[i] && f.side > 0);
  const tilt = Math.max(-14, Math.min(14, (right.length - left.length) * 6)); // degrees; positive = right side down
  const verdict = left.length === right.length ? "Balanced: it depends" : left.length > right.length ? "Leaning cloud" : "Leaning self-host";

  // idle demo: flip a factor now and then until someone plays
  useEffect(() => {
    if (reduce) return;
    const t = setInterval(() => {
      if (touched.current) return;
      setOn((o) => {
        const i = Math.floor(Math.random() * o.length);
        return o.map((v, j) => (j === i ? !v : v));
      });
    }, 1700);
    return () => clearInterval(t);
  }, [reduce]);

  const toggle = (i: number) => {
    touched.current = true;
    setOn((o) => o.map((v, j) => (j === i ? !v : v)));
  };

  const sin = Math.sin((tilt * Math.PI) / 180);

  return (
    <div className="flex h-full flex-col select-none">
      <svg viewBox="0 0 360 190" className="w-full" role="img" aria-label="A balance weighing cloud against self-hosting">
        <rect x={CX - 3} y={BEAM_Y} width={6} height={112} rx={3} fill="#0a0a0a" />
        <rect x={CX - 40} y={170} width={80} height={8} rx={4} fill="#0a0a0a" />
        <motion.g animate={{ rotate: tilt }} transition={SPRING} style={{ transformOrigin: `${CX}px ${BEAM_Y}px`, transformBox: "view-box" }}>
          <rect x={CX - L - 6} y={BEAM_Y - 3.5} width={2 * L + 12} height={7} rx={3.5} fill="#0a0a0a" />
        </motion.g>
        <circle cx={CX} cy={BEAM_Y} r={6} fill="#fff" stroke="#0a0a0a" strokeWidth={2.5} />
        <Pan side={-1} items={left} sin={sin} />
        <Pan side={1} items={right} sin={sin} />
        <foreignObject x={0} y={0} width={360} height={24}>
          <div className="flex justify-between px-1 text-[10px] font-medium">
            <span className="flex items-center gap-1"><Cloud className="size-3" /> Cloud</span>
            <span className="flex items-center gap-1">Self-host <Server className="size-3" /></span>
          </div>
        </foreignObject>
      </svg>

      <motion.div key={verdict} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="text-center font-mono text-[11px] font-semibold">
        {verdict}
      </motion.div>

      <div className="mt-2 flex flex-wrap justify-center gap-1.5">
        {FACTORS.map((f, i) => (
          <button
            key={f.label}
            onClick={() => toggle(i)}
            className={cn(
              "cursor-pointer rounded-full border px-2.5 py-1 text-[11px] transition-colors",
              on[i] ? (f.side < 0 ? "border-data bg-data text-white" : "border-zinc-600 bg-zinc-600 text-white") : "hover:bg-muted",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>
      <div className="mt-auto flex items-center justify-center gap-1.5 pt-2 text-center text-xs text-muted-foreground">
        <MousePointerClick className="size-3.5 shrink-0" />
        Click a factor to put it on the scale.
      </div>
    </div>
  );
}
