import { motion } from "motion/react";
import type { IntroProps, IntroScene } from "@/components/transition/types";

const LEADER = { x: 200, y: 60 };
const FOLLOWERS = [
  { x: 70, y: 175, lag: 0.3 }, // sync: arrives fast
  { x: 330, y: 175, lag: 0.75 }, // async: lags behind
];
const W = 92;
const H = 56;
const ease = [0.22, 1, 0.36, 1] as const;

/** One node copies itself into a leader and two followers, a write replicates, and the title converges from lagging copies. */
function Scene({ speed }: IntroProps) {
  const t = (s: number) => (s / speed)*1.5;
  return (
    <div className="flex w-full max-w-md flex-col items-center px-6">
      <svg viewBox="0 0 400 220" className="w-full overflow-visible" aria-hidden>
        {/* links draw in once the copies have split off */}
        {FOLLOWERS.map((f, i) => (
          <motion.line
            key={`l${i}`}
            x1={LEADER.x}
            y1={LEADER.y + H / 2}
            x2={f.x}
            y2={f.y - H / 2}
            stroke="rgba(255,255,255,0.35)"
            strokeWidth={1.5}
            strokeDasharray={i === 1 ? "5 4" : undefined}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: t(0.3), delay: t(0.55) }}
          />
        ))}

        {/* followers peel off the leader */}
        {FOLLOWERS.map((f, i) => (
          <motion.g
            key={`f${i}`}
            initial={{ x: LEADER.x - f.x, y: LEADER.y - f.y, opacity: 0 }}
            animate={{ x: 0, y: 0, opacity: 1 }}
            transition={{ duration: t(0.5), delay: t(0.25), ease }}
          >
            <motion.rect
              x={f.x - W / 2}
              y={f.y - H / 2}
              width={W}
              height={H}
              rx={10}
              stroke="#fff"
              strokeWidth={1.5}
              initial={{ fill: "rgba(255,255,255,0)" }}
              animate={{ fill: ["rgba(255,255,255,0)", "rgba(255,255,255,0)", "rgba(37,99,235,0.45)", "rgba(255,255,255,0.08)"] }}
              transition={{ duration: t(0.9 + f.lag), times: [0, (0.75 + f.lag) / (0.9 + f.lag) - 0.05, (0.75 + f.lag) / (0.9 + f.lag), 1], delay: t(0.2) }}
            />
            <text x={f.x} y={f.y + 4} textAnchor="middle" className="fill-white/70 font-mono text-[11px]">
              {i === 0 ? "sync" : "async"}
            </text>
          </motion.g>
        ))}

        {/* the write */}
        {FOLLOWERS.map((f, i) => (
          <motion.circle
            key={`p${i}`}
            r={6}
            fill="#3b82f6"
            initial={{ cx: LEADER.x, cy: LEADER.y + H / 2, opacity: 0 }}
            animate={{ cx: f.x, cy: f.y - H / 2, opacity: [0, 1, 1, 0] }}
            transition={{ duration: t(f.lag), delay: t(0.8), ease: "easeInOut", opacity: { duration: t(f.lag + 0.05), delay: t(0.8), times: [0, 0.1, 0.9, 1] } }}
          />
        ))}

        {/* leader, drawn last so copies slide out from under it */}
        <motion.g
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: t(0.35), ease }}
          style={{ transformOrigin: `${LEADER.x}px ${LEADER.y}px`, transformBox: "view-box" }}
        >
          <rect x={LEADER.x - W / 2} y={LEADER.y - H / 2} width={W} height={H} rx={10} fill="#fff" />
          <text x={LEADER.x} y={LEADER.y + 5} textAnchor="middle" className="fill-black text-[13px] font-semibold">
            leader
          </text>
        </motion.g>
      </svg>

      {/* the title replicates: two lagging copies converge onto the original */}
      <div className="relative mt-6 text-4xl font-semibold tracking-tight sm:text-5xl">
        <motion.span
          className="absolute inset-0 text-white/30"
          initial={{ y: -28, opacity: 0 }}
          animate={{ y: 0, opacity: [0, 1, 0] }}
          transition={{ duration: t(0.45), delay: t(0.55), ease }}
          aria-hidden
        >
          Replication
        </motion.span>
        <motion.span
          className="absolute inset-0 text-blue-400/40"
          initial={{ y: 28, opacity: 0 }}
          animate={{ y: 0, opacity: [0, 1, 0] }}
          transition={{ duration: t(0.9), delay: t(0.55), ease }}
          aria-hidden
        >
          Replication
        </motion.span>
        <motion.span
          className="relative"
          initial={{ opacity: 0, filter: "blur(6px)" }}
          animate={{ opacity: 1, filter: "blur(0px)" }}
          transition={{ duration: t(0.5), delay: t(0.5) }}
        >
          Replication
        </motion.span>
      </div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ delay: t(0.9) }}
        className="mt-3 font-mono text-xs uppercase tracking-widest"
      >
        Chapter 06 · same data, many machines
      </motion.div>
    </div>
  );
}

export const replicationIntro: IntroScene = { Scene, duration: 2400 };
