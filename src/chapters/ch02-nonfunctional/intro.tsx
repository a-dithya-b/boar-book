import { motion } from "motion/react";
import type { IntroProps, IntroScene } from "@/components/transition/types";

/** Paced like the other chapter intros (timings × 1.5). */
const PACE = 1.5;
const ease = [0.22, 1, 0.36, 1] as const;

// a latency distribution: a hump of fast requests and a long, thin tail
const BARS = Array.from({ length: 26 }, (_, i) => {
  const x = (i + 1) / 4;
  const ln = Math.log(x / 1.6);
  return Math.exp(-(ln * ln) / (2 * 0.42 * 0.42)) / x;
});
const PEAK = Math.max(...BARS);
const W = 400;
const H = 150;
const BW = W / BARS.length;
const P50 = 6; // bar index of the median
const P99 = 19; // ...and of the 99th percentile

/** A latency histogram builds itself, then the median and the p99 drop in: the tail is where users feel it. */
function Scene({ speed }: IntroProps) {
  const t = (s: number) => (s / speed) * PACE;
  return (
    <div className="flex w-full max-w-md flex-col items-center px-6">
      <svg viewBox={`0 0 ${W} ${H + 30}`} className="w-full overflow-visible" aria-hidden>
        {BARS.map((b, i) => {
          const h = Math.max(3, (b / PEAK) * (H - 30));
          return (
            <motion.rect
              key={i}
              x={i * BW + 2}
              width={BW - 4}
              rx={2}
              initial={{ y: H, height: 0 }}
              animate={{ y: H - h, height: h }}
              transition={{ duration: t(0.35), delay: t(0.05 + i * 0.025), ease }}
              fill={i >= P99 ? "#ef4444" : "#ffffff"}
              opacity={i >= P99 ? 0.95 : 0.9}
            />
          );
        })}
        <motion.line x1={0} y1={H} x2={W} y2={H} stroke="rgba(255,255,255,0.3)" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: t(0.4) }} />

        {[
          { at: P50, label: "p50", color: "#22c55e", delay: 0.85 },
          { at: P99, label: "p99", color: "#ef4444", delay: 1.15 },
        ].map((m) => {
          const x = m.at * BW + BW / 2;
          return (
            <motion.g key={m.label} initial={{ opacity: 0, y: -24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: t(0.3), delay: t(m.delay), ease }}>
              <line x1={x} y1={8} x2={x} y2={H} stroke={m.color} strokeWidth={2} strokeDasharray="4 3" />
              <rect x={x - 22} y={-12} width={44} height={20} rx={10} fill={m.color} />
              <text x={x} y={2} textAnchor="middle" className="fill-black font-mono text-[11px] font-semibold">
                {m.label}
              </text>
            </motion.g>
          );
        })}
        <motion.text
          x={W}
          y={H + 22}
          textAnchor="end"
          className="fill-white/50 font-mono text-[10px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: t(1.2) }}
        >
          the tail →
        </motion.text>
      </svg>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.7 }} transition={{ delay: t(0.4), duration: t(0.3) }} className="mt-6 text-lg tracking-tight">
        Defining
      </motion.div>
      <div className="overflow-hidden text-center">
        <motion.div
          initial={{ y: "110%" }}
          animate={{ y: 0 }}
          transition={{ duration: t(0.45), delay: t(0.45), ease }}
          className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl"
        >
          Nonfunctional Requirements
        </motion.div>
      </div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ delay: t(1.3) }}
        className="mt-3 text-center font-mono text-xs uppercase tracking-widest"
      >
        Chapter 02 · how well, not what
      </motion.div>
    </div>
  );
}

export const nonfunctionalIntro: IntroScene = { Scene, duration: 2500 };
