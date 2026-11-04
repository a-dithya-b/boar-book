import { Suspense, useState } from "react";
import { motion, type Variants } from "motion/react";
import { useChapterTransition } from "@/components/transition/ChapterTransition";
import { Link } from "react-router";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import type { ChapterMeta } from "@/content/chapters";
import { PARTS } from "@/content/chapters";
import type { ChapterContent } from "./types";
import { RecapStrip } from "./RecapStrip";
import { Quiz } from "./Quiz";
import { Reward } from "./Reward";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// content rises in once the entrance curtain lifts
const stagger: Variants = { hidden: {}, shown: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } } };
const rise: Variants = {
  hidden: { opacity: 0, y: 18 },
  shown: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
};

function Section({ id, title, hint, children }: { id: string; title?: string; hint?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-20">
      {title && (
        <div className="mb-3 flex items-baseline justify-between gap-4">
          <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
          {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
        </div>
      )}
      {children}
    </section>
  );
}

export function ChapterShell({ meta, content }: { meta: ChapterMeta; content: ChapterContent }) {
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [active, setActive] = useState(0);
  const [quizDone, setQuizDone] = useState(false);

  const missions = content.missions;
  const mission = missions[active];
  const MissionComp = mission.component;
  const doneCount = missions.filter((m) => done[m.id]).length;
  const { revealed } = useChapterTransition();
  const entrance = revealed ? "shown" : "hidden";

  return (
    <div className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
      {/* hero */}
      <motion.div className="pt-8 pb-8 sm:pt-12" variants={stagger} initial="hidden" animate={entrance}>
        <motion.div variants={rise}>
          <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" /> Bookshelf
          </Link>
        </motion.div>
        <motion.div variants={rise} className="mt-6 flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="font-mono">Ch {String(meta.n).padStart(2, "0")}</Badge>
          <span className="text-xs text-muted-foreground">Part {"I".repeat(meta.part)} · {PARTS[meta.part]}</span>
        </motion.div>
        <motion.h1 variants={rise} className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">{meta.title}</motion.h1>
        <motion.p variants={rise} className="mt-3 max-w-2xl text-muted-foreground text-pretty">{content.tagline}</motion.p>

        {/* progress pills */}
        <motion.div variants={rise} className="mt-6 flex flex-wrap items-center gap-1.5 text-xs">
          {missions.map((m, i) => (
            <a
              key={m.id}
              href="#missions"
              onClick={() => setActive(i)}
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 transition-colors hover:bg-muted",
                done[m.id] && "border-ok/40 bg-ok/8",
              )}
            >
              {done[m.id] ? <Check className="size-3 text-ok" /> : <span className="font-mono text-muted-foreground">{i + 1}</span>}
              {m.title}
            </a>
          ))}
          <a
            href="#recall"
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 transition-colors hover:bg-muted",
              quizDone && "border-ok/40 bg-ok/8",
            )}
          >
            {quizDone && <Check className="size-3 text-ok" />} Recall check
          </a>
        </motion.div>
      </motion.div>

      <motion.div
        className="flex flex-col gap-14"
        initial={{ opacity: 0, y: 24 }}
        animate={revealed ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
        transition={{ duration: 0.6, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
      >
        <Section id="warmup">
          <RecapStrip cards={content.recap} />
        </Section>

        <Section id="missions">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-lg font-semibold tracking-tight">Missions</h2>
            <span className="font-mono text-xs text-muted-foreground">{doneCount}/{missions.length} complete</span>
          </div>
          {/* tabs */}
          <div role="tablist" className="mb-4 grid grid-cols-2 gap-2 md:grid-cols-4">
            {missions.map((m, i) => (
              <button
                key={m.id}
                role="tab"
                aria-selected={i === active}
                onClick={() => setActive(i)}
                className={cn(
                  "flex cursor-pointer flex-col gap-1 rounded-xl border p-3 text-left transition-all",
                  i === active ? "border-foreground bg-foreground text-background" : "hover:border-foreground/30 hover:bg-muted/40",
                )}
              >
                <span className="flex items-center justify-between font-mono text-[11px] opacity-70">
                  <span>Mission {i + 1} · {m.tag}</span>
                  {done[m.id] && <Check className={cn("size-3.5", i === active ? "text-green-400" : "text-ok")} strokeWidth={3} />}
                </span>
                <span className="text-sm font-medium">{m.title}</span>
              </button>
            ))}
          </div>

          <div className="rounded-xl border bg-card">
            <div className="flex flex-col gap-1 border-b px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="font-medium">{mission.title}</div>
                <div className="text-sm text-muted-foreground">{mission.goal}</div>
              </div>
              {done[mission.id] && <Badge variant="ok"><Check /> Complete</Badge>}
            </div>
            <div className="p-4 sm:p-5">
              <Suspense fallback={<div className="h-[420px] animate-pulse rounded-lg bg-muted/50" />}>
                <MissionComp
                  key={mission.id}
                  done={!!done[mission.id]}
                  onComplete={() => setDone((d) => ({ ...d, [mission.id]: true }))}
                />
              </Suspense>
            </div>
            {done[mission.id] && active < missions.length - 1 && (
              <div className="flex justify-end border-t px-5 py-3">
                <Button size="sm" onClick={() => setActive(active + 1)}>
                  Next: {missions[active + 1].title} <ArrowRight />
                </Button>
              </div>
            )}
          </div>
        </Section>

        <Section id="recall" title="Recall check" hint="Predict, don't recite">
          <div className="rounded-xl border bg-card p-5">
            <Quiz questions={content.quiz} onComplete={() => setQuizDone(true)} />
          </div>
        </Section>

        <Section id="reward" title="Your card">
          <Reward
            meta={meta}
            takeaways={content.takeaways}
            checklist={[
              ...missions.map((m) => ({ label: m.title, done: !!done[m.id] })),
              { label: "Recall check", done: quizDone },
            ]}
          />
        </Section>
      </motion.div>
    </div>
  );
}
