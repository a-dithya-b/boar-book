import { motion } from "motion/react";
import type { IntroProps, IntroScene } from "@/components/transition/types";

/** Paced to match the Replication intro (timings × 1.5). */
const PACE = 1.5;
const L = 110; // half beam length
const CX = 200;
const BEAM_Y = 70;
const ease = [0.22, 1, 0.36, 1] as const;

// weights land at these times (s, before pacing); the beam reacts to each
const DROPS = [0.35, 0.65, 0.95, 1.25];
const WEIGHTS = [
  { side: -1, label: "ship fast" },
  { side: 1, label: "control" },
  { side: -1, label: "elastic" },
  { side: 1, label: "cost at scale" },
];
const TILT = [0, 0, -10, 8, -5, 0]; // degrees: left-heavy, right-heavy, ... level
const TOTAL = 1.6;
const TIMES = [0, 0.27, 0.34, 0.53, 0.72, 1];

/** A balance tips back and forth as trade-offs land on it, then settles level. */
function Scene({ speed }: IntroProps) {
  const t = (s: number) => (s / speed) * PACE;
  const sin = (deg: number) => Math.sin((deg * Math.PI) / 180);
  // a beam end at x = side·L moves vertically by side·L·sin(tilt)
  const panDy = (side: number) => TILT.map((d) => side * L * sin(d));
  const beam = { duration: t(TOTAL), times: TIMES, ease: "easeOut" as const };

  return (
    <div className="flex w-full max-w-md flex-col items-center px-6">
      <svg viewBox="0 0 400 230" className="w-full overflow-visible" aria-hidden>
        {/* post and base */}
        <motion.g initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: t(0.3), ease }}>
          <rect x={CX - 3} y={BEAM_Y} width={6} height={130} rx={3} fill="#fff" />
          <rect x={CX - 46} y={198} width={92} height={10} rx={5} fill="#fff" />
        </motion.g>

        {/* beam */}
        <motion.g
          initial={{ rotate: 0, opacity: 0 }}
          animate={{ rotate: TILT, opacity: 1 }}
          transition={{ rotate: beam, opacity: { duration: t(0.25) } }}
          style={{ transformOrigin: `${CX}px ${BEAM_Y}px`, transformBox: "view-box" }}
        >
          <rect x={CX - L - 6} y={BEAM_Y - 4} width={2 * L + 12} height={8} rx={4} fill="#fff" />
          <circle cx={CX} cy={BEAM_Y} r={7} fill="#0a0a0a" stroke="#fff" strokeWidth={3} />
        </motion.g>

        {/* pans hang from the beam ends and stay level */}
        {[-1, 1].map((side) => (
          <motion.g
            key={side}
            initial={{ y: 0, opacity: 0 }}
            animate={{ y: panDy(side), opacity: 1 }}
            transition={{ y: beam, opacity: { duration: t(0.25) } }}
          >
            <line x1={CX + side * L} y1={BEAM_Y} x2={CX + side * L - 34} y2={BEAM_Y + 70} stroke="rgba(255,255,255,0.5)" strokeWidth={1.5} />
            <line x1={CX + side * L} y1={BEAM_Y} x2={CX + side * L + 34} y2={BEAM_Y + 70} stroke="rgba(255,255,255,0.5)" strokeWidth={1.5} />
            <path d={`M${CX + side * L - 46},${BEAM_Y + 70} h92 q-8,14 -46,14 q-38,0 -46,-14z`} fill="#fff" />
            {/* the weights that land on this pan */}
            {WEIGHTS.map((w, i) =>
              w.side !== side ? null : (
                <motion.g
                  key={i}
                  initial={{ y: -150, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ y: { duration: t(0.12), delay: t(DROPS[i]), ease: "easeIn" }, opacity: { duration: t(0.05), delay: t(DROPS[i]) } }}
                >
                  <rect
                    x={CX + side * L - 46}
                    y={BEAM_Y + 70 - 20 - (i >= 2 ? 22 : 0)}
                    width={92}
                    height={20}
                    rx={4}
                    fill={i % 2 ? "#0a0a0a" : "#3b82f6"}
                    stroke="#fff"
                    strokeWidth={1.2}
                  />
                  <text
                    x={CX + side * L}
                    y={BEAM_Y + 70 - 6 - (i >= 2 ? 22 : 0)}
                    textAnchor="middle"
                    className="fill-white font-mono text-[10px]"
                  >
                    {w.label}
                  </text>
                </motion.g>
              ),
            )}
          </motion.g>
        ))}
      </svg>

      <div className="mt-5 overflow-hidden text-center">
        <motion.div
          initial={{ y: "110%" }}
          animate={{ y: 0 }}
          transition={{ duration: t(0.45), delay: t(0.4), ease }}
          className="text-4xl font-semibold tracking-tight sm:text-5xl"
        >
          Trade-offs
        </motion.div>
      </div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.8 }}
        transition={{ delay: t(0.7), duration: t(0.4) }}
        className="mt-1 text-lg tracking-tight"
      >
        in Data Systems Architecture
      </motion.div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ delay: t(TOTAL) }}
        className="mt-3 font-mono text-xs uppercase tracking-widest"
      >
        Chapter 01 · it always depends
      </motion.div>
    </div>
  );
}

export const tradeOffsIntro: IntroScene = { Scene, duration: 2700 };
