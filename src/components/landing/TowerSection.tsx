import { lazy, Suspense, useRef, useState } from "react";
import { motion, useMotionValueEvent, useScroll } from "motion/react";
import { ArrowDown, ArrowRight } from "lucide-react";
import { CHAPTERS, PARTS, type ChapterMeta } from "@/content/chapters";
import { OBJECT_HOOKS } from "@/components/three/objects/ChapterObjects";
import { ChapterLink, useChapterTransition } from "@/components/transition/ChapterTransition";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const TowerScene = lazy(() => import("@/components/three/tower/TowerScene"));

/** Ideas that recur across chapters; picking one threads its floors together. */
const CONNECTIONS: { label: string; chapters: number[] }[] = [
  { label: "The log", chapters: [4, 6, 10, 12, 13] },
  { label: "Leaders & consensus", chapters: [6, 9, 10] },
  { label: "Time & ordering", chapters: [6, 8, 9, 10, 12] },
  { label: "Schemas & encoding", chapters: [3, 5, 11, 12] },
];

/** How much page scroll each floor gets. */
const VH_PER_FLOOR = 38;

export function TowerSection() {
  const section = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: section, offset: ["start start", "end end"] });
  const [focus, setFocus] = useState(0);
  const [started, setStarted] = useState(false);
  const [conn, setConn] = useState<number | null>(null);
  const { enterChapter } = useChapterTransition();

  useMotionValueEvent(scrollYProgress, "change", (p) => {
    setFocus(Math.round(p * (CHAPTERS.length - 1)));
    setStarted(p > 0.01);
  });

  const ch = CHAPTERS[focus];
  const highlighted = conn === null ? [] : CONNECTIONS[conn].chapters.map((n) => n - 1);

  /** Scroll the page so floor i is in focus. */
  const goTo = (i: number) => {
    const el = section.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY;
    const travel = el.offsetHeight - window.innerHeight;
    window.scrollTo({ top: top + (i / (CHAPTERS.length - 1)) * travel, behavior: "smooth" });
  };

  const open = (c: ChapterMeta, origin: { x: number; y: number }) => enterChapter(c.slug, origin);

  return (
    <section ref={section} className="relative" style={{ height: `${CHAPTERS.length * VH_PER_FLOOR + 60}vh` }}>
      <div className="sticky top-14 h-[calc(100dvh-3.5rem)] overflow-hidden">
        <div className="mx-auto grid h-full max-w-6xl grid-rows-[1fr_auto] px-4 sm:px-6 md:grid-cols-[1fr_340px] md:grid-rows-1 md:gap-6">
          {/* tower */}
          <div className="relative min-h-0">
            <Suspense fallback={<div className="h-full w-full animate-pulse rounded-xl bg-muted/40" />}>
              <TowerScene progress={scrollYProgress} focus={focus} connections={highlighted} onOpen={open} />
            </Suspense>
            <motion.div
              animate={{ opacity: started ? 0 : 1, y: started ? 8 : 0 }}
              className="pointer-events-none absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full border bg-background/90 px-3 py-1.5 text-xs text-muted-foreground backdrop-blur"
            >
              <ArrowDown className="size-3.5 animate-bounce" /> Scroll to climb the book
            </motion.div>
          </div>

          {/* panel */}
          <div className="flex flex-col justify-center gap-4 border-t py-4 md:border-t-0 md:py-0">
            <motion.div key={focus} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}>
              <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
                <span>Floor {String(ch.n).padStart(2, "0")}</span>
                <span>·</span>
                <span className="truncate">Part {"I".repeat(ch.part)} {PARTS[ch.part]}</span>
              </div>
              <h3 className="mt-1.5 text-2xl font-semibold tracking-tight text-balance md:text-3xl">{ch.title}</h3>
              <p className="mt-2 text-sm text-pretty md:text-base">“{OBJECT_HOOKS[ch.n]}”</p>
              <p className="mt-1 hidden text-sm text-muted-foreground md:block">{ch.play}</p>
              <div className="mt-4 flex items-center gap-2">
                <Button asChild size="sm" variant={ch.ready ? "default" : "outline"} className="group">
                  <ChapterLink slug={ch.slug}>
                    {ch.ready ? "Enter chapter" : "Peek inside"}
                    <ArrowRight className="transition-transform group-hover:translate-x-0.5" />
                  </ChapterLink>
                </Button>
                {ch.ready ? <Badge variant="ok">Playable</Badge> : <Badge variant="outline" className="text-muted-foreground">Coming soon</Badge>}
              </div>
            </motion.div>

            <div className="hidden md:block">
              <div className="mb-2 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Connections</div>
              <div className="flex flex-wrap gap-1.5">
                {CONNECTIONS.map((c, i) => (
                  <button
                    key={c.label}
                    onClick={() => setConn(conn === i ? null : i)}
                    className={cn(
                      "cursor-pointer rounded-full border px-2.5 py-1 text-xs transition-colors",
                      conn === i ? "border-data bg-data text-white" : "hover:border-foreground/30 hover:bg-muted",
                    )}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
              {conn !== null && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2 text-xs text-muted-foreground">
                  Shows up on floors {CONNECTIONS[conn].chapters.map((n) => String(n).padStart(2, "0")).join(", ")}.
                </motion.p>
              )}
            </div>
          </div>
        </div>

        {/* elevator */}
        <nav aria-label="Floors" className="absolute top-1/2 right-2 hidden -translate-y-1/2 flex-col-reverse gap-1 lg:flex xl:right-6">
          {CHAPTERS.map((c, i) => {
            const newPart = i > 0 && c.part !== CHAPTERS[i - 1].part;
            return (
              <button
                key={c.n}
                onClick={() => goTo(i)}
                title={c.title}
                className={cn(
                  "group relative flex h-6 w-8 cursor-pointer items-center justify-center rounded-md font-mono text-[10px] transition-all",
                  i === focus ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  highlighted.includes(i) && i !== focus && "text-data",
                  newPart && "mb-2",
                )}
              >
                {String(c.n).padStart(2, "0")}
                {c.ready && <span className="absolute -right-0.5 top-0.5 size-1.5 rounded-full bg-ok" />}
              </button>
            );
          })}
        </nav>
      </div>
    </section>
  );
}
