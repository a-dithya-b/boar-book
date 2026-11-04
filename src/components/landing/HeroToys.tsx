import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { CHAPTERS } from "@/content/chapters";
import { CHAPTER_REGISTRY } from "@/chapters/registry";
import { ChapterLink } from "@/components/transition/ChapterTransition";
import { cn } from "@/lib/utils";

const ROTATE_MS = 9000;

/** The hero's "Try it" card: one small toy per playable chapter, rotating until someone plays. */
export function HeroToys() {
  const toys = CHAPTERS.filter((c) => c.ready && CHAPTER_REGISTRY[c.slug]?.toy);
  const reduce = useReducedMotion();
  const [active, setActive] = useState(0);
  const [auto, setAuto] = useState(!reduce);
  const card = useRef<HTMLDivElement>(null);

  // advance on a timer until the visitor touches anything in the card
  useEffect(() => {
    if (!auto || toys.length < 2) return;
    const t = window.setTimeout(() => setActive((a) => (a + 1) % toys.length), ROTATE_MS);
    return () => clearTimeout(t);
  }, [auto, active, toys.length]);

  if (toys.length === 0) return null;
  const ch = toys[active];
  const { Toy } = CHAPTER_REGISTRY[ch.slug].toy!;

  return (
    <div ref={card} onPointerDownCapture={() => setAuto(false)} className="flex flex-col">
      <div className="mb-2 flex items-center gap-2 px-1">
        <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Try it</span>
        <div role="tablist" className="ml-auto flex gap-1">
          {toys.map((c, i) => (
            <button
              key={c.slug}
              role="tab"
              aria-selected={i === active}
              onClick={() => setActive(i)}
              className={cn(
                "relative cursor-pointer overflow-hidden rounded-md border px-2 py-1 text-[11px] transition-colors",
                i === active ? "border-foreground bg-foreground text-background" : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <span className="font-mono opacity-70">{String(c.n).padStart(2, "0")}</span> {CHAPTER_REGISTRY[c.slug].toy!.label}
              {i === active && auto && toys.length > 1 && (
                <motion.span
                  key={`bar-${active}`}
                  className="absolute bottom-0 left-0 h-0.5 bg-background/60"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: ROTATE_MS / 1000, ease: "linear" }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="relative h-[300px] overflow-hidden">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={ch.slug}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0"
          >
            <Toy />
          </motion.div>
        </AnimatePresence>
      </div>

      <ChapterLink
        slug={ch.slug}
        className="group mt-2 flex items-center justify-between rounded-lg border px-3 py-2 text-xs transition-colors hover:bg-muted"
      >
        <span>
          <span className="font-mono text-muted-foreground">Ch {String(ch.n).padStart(2, "0")} · </span>
          {ch.title}
        </span>
        <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
      </ChapterLink>
    </div>
  );
}
