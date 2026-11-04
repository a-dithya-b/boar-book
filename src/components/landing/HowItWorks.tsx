import { useRef, type ReactNode } from "react";
import { motion, type Variants } from "motion/react";
import { Check } from "lucide-react";

/** Card with a soft spotlight that follows the cursor. */
function SpotCard({ children, i }: { children: ReactNode; i: number }) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <motion.div
      ref={ref}
      initial="rest"
      whileHover="hover"
      whileInView="shown"
      viewport={{ once: true, margin: "-60px" }}
      variants={{ rest: { opacity: 0, y: 16 }, shown: { opacity: 1, y: 0, transition: { delay: i * 0.1 } }, hover: { opacity: 1, y: -3 } }}
      onPointerMove={(e) => {
        const r = ref.current!.getBoundingClientRect();
        ref.current!.style.setProperty("--x", `${e.clientX - r.left}px`);
        ref.current!.style.setProperty("--y", `${e.clientY - r.top}px`);
      }}
      className="group relative flex flex-col overflow-hidden rounded-xl border bg-card p-5 transition-shadow hover:shadow-md"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: "radial-gradient(240px circle at var(--x) var(--y), rgba(0,0,0,0.05), transparent 70%)" }}
      />
      {children}
    </motion.div>
  );
}

const flip: Variants = { rest: { rotateY: 0 }, shown: { rotateY: 0 }, hover: { rotateY: 180, transition: { duration: 0.6 } } };

function FlipIcon() {
  return (
    <div className="h-20 [perspective:600px]">
      <motion.div variants={flip} className="relative mx-auto h-20 w-32 [transform-style:preserve-3d]">
        <div className="absolute inset-0 grid place-items-center rounded-lg border bg-background text-xs font-medium [backface-visibility:hidden]">
          Sync or async?
        </div>
        <div className="absolute inset-0 grid place-items-center rounded-lg bg-foreground px-3 text-center text-[11px] text-background [backface-visibility:hidden] [transform:rotateY(180deg)]">
          Async can lose writes.
        </div>
      </motion.div>
    </div>
  );
}

const node: Variants = {
  rest: { rotate: 0, backgroundColor: "#ffffff", borderColor: "#0a0a0a" },
  shown: { rotate: 0, backgroundColor: "#ffffff", borderColor: "#0a0a0a" },
  hover: {
    rotate: [0, -8, 6, -4, 0],
    backgroundColor: ["#ffffff", "#fee2e2", "#fee2e2", "#dcfce7"],
    borderColor: ["#0a0a0a", "#dc2626", "#dc2626", "#16a34a"],
    transition: { duration: 1.1, times: [0, 0.2, 0.6, 1] },
  },
};
const fixed: Variants = { rest: { scale: 0, opacity: 0 }, shown: { scale: 0, opacity: 0 }, hover: { scale: 1, opacity: 1, transition: { delay: 0.9, type: "spring", stiffness: 400, damping: 15 } } };

function CrashIcon() {
  return (
    <div className="flex h-20 items-center justify-center gap-3">
      <div className="h-12 w-14 rounded-md bg-foreground" />
      <div className="h-px w-6 border-t border-dashed border-muted-foreground" />
      <motion.div variants={node} className="relative grid h-12 w-14 place-items-center rounded-md border-[1.5px]">
        <motion.span variants={fixed} className="grid size-5 place-items-center rounded-full bg-ok text-white">
          <Check className="size-3" strokeWidth={3} />
        </motion.span>
      </motion.div>
    </div>
  );
}

const stamp: Variants = {
  rest: { scale: 1, rotate: -12, opacity: 0.25 },
  shown: { scale: 1, rotate: -12, opacity: 0.25 },
  hover: { scale: [1.8, 0.92, 1], rotate: -12, opacity: 1, transition: { duration: 0.45 } },
};

function StampIcon() {
  return (
    <div className="flex h-20 items-center justify-center">
      <div className="relative h-20 w-32 rounded-lg border bg-background p-2.5">
        <div className="h-1.5 w-14 rounded bg-foreground/80" />
        <div className="mt-2 space-y-1">
          <div className="h-1 w-20 rounded bg-muted-foreground/30" />
          <div className="h-1 w-16 rounded bg-muted-foreground/30" />
          <div className="h-1 w-[72px] rounded bg-muted-foreground/30" />
        </div>
        <motion.div
          variants={stamp}
          className="absolute -right-3 -bottom-3 grid size-12 place-items-center rounded-full border-2 border-ok bg-background font-mono text-[11px] font-bold text-ok"
        >
          06
        </motion.div>
      </div>
    </div>
  );
}

const STEPS = [
  { icon: <FlipIcon />, title: "Warm up", text: "Flip a few cards. Guess first." },
  { icon: <CrashIcon />, title: "Break it, fix it", text: "Crash servers, cause bugs, then repair them." },
  { icon: <StampIcon />, title: "Keep the card", text: "Earn the stamp. Save the takeaways." },
];

export function HowItWorks() {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {STEPS.map((s, i) => (
        <SpotCard key={s.title} i={i}>
          <div className="mb-4 rounded-lg bg-dots py-3">{s.icon}</div>
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-xs text-muted-foreground">0{i + 1}</span>
            <span className="font-medium">{s.title}</span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{s.text}</p>
        </SpotCard>
      ))}
    </div>
  );
}
