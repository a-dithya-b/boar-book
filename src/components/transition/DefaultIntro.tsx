import { motion } from "motion/react";
import { PARTS } from "@/content/chapters";
import type { IntroProps, IntroScene } from "./types";

/** Used by any chapter that doesn't ship its own entrance. */
function Scene({ meta, speed }: IntroProps) {
  const t = (s: number) => s / speed;
  return (
    <div className="flex flex-col items-center text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: t(0.5), ease: [0.22, 1, 0.36, 1] }}
        className="font-mono text-7xl font-semibold tracking-tighter sm:text-8xl"
      >
        {String(meta.n).padStart(2, "0")}
      </motion.div>
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: t(0.4), delay: t(0.3) }}
        className="my-5 h-px w-24 origin-left bg-white/40"
      />
      <div className="overflow-hidden">
        <motion.div
          initial={{ y: "110%" }}
          animate={{ y: 0 }}
          transition={{ duration: t(0.5), delay: t(0.4), ease: [0.22, 1, 0.36, 1] }}
          className="text-3xl font-semibold tracking-tight sm:text-4xl"
        >
          {meta.title}
        </motion.div>
      </div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ delay: t(0.7) }}
        className="mt-3 font-mono text-xs uppercase tracking-widest"
      >
        Part {"I".repeat(meta.part)} · {PARTS[meta.part]}
      </motion.div>
    </div>
  );
}

export const defaultIntro: IntroScene = { Scene, duration: 1100 };
