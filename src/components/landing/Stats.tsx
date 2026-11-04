import { useEffect, useRef, useState } from "react";
import { animate, useInView, useReducedMotion } from "motion/react";

function Count({ from, to, duration = 1.2 }: { from: number; to: number; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduce = useReducedMotion();
  const [v, setV] = useState(from);

  useEffect(() => {
    if (!inView) return;
    if (reduce) {
      setV(to);
      return;
    }
    const c = animate(from, to, { duration, ease: [0.22, 1, 0.36, 1], onUpdate: (x) => setV(Math.round(x)) });
    return () => c.stop();
  }, [inView, from, to, duration, reduce]);

  return (
    <span ref={ref} className="tabular-nums">
      {v}
    </span>
  );
}

const STATS = [
  { from: 0, to: 14, prefix: "", label: "chapters on the shelf" },
  { from: 0, to: 4, prefix: "", label: "hands-on missions each" },
  { from: 0, to: 8, prefix: "~", label: "minutes per chapter" },
  { from: 99, to: 0, prefix: "", label: "walls of text", strike: true },
];

export function Stats() {
  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border bg-border md:grid-cols-4">
      {STATS.map((s) => (
        <div key={s.label} className="group bg-background px-5 py-5">
          <div className="font-mono text-3xl font-semibold tracking-tight">
            {s.prefix}
            <Count from={s.from} to={s.to} duration={s.from > s.to ? 1.8 : 1.2} />
          </div>
          <div className="mt-1 text-sm text-muted-foreground">
            {s.strike ? (
              <span className="relative">
                {s.label}
                <span className="absolute top-1/2 left-0 h-px w-0 bg-foreground transition-all duration-500 group-hover:w-full" />
              </span>
            ) : (
              s.label
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
