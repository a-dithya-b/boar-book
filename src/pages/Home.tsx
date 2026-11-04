import { motion } from "motion/react";
import { ArrowRight, ArrowDown } from "lucide-react";
import { CHAPTERS, PARTS, type Part } from "@/content/chapters";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HeroHeadline } from "@/components/landing/HeroHeadline";
import { HeroToys } from "@/components/landing/HeroToys";
import { Magnetic } from "@/components/landing/Magnetic";
import { Stats } from "@/components/landing/Stats";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { cn } from "@/lib/utils";
import { ChapterLink } from "@/components/transition/ChapterTransition";
import { TowerSection } from "@/components/landing/TowerSection";


const ease = [0.22, 1, 0.36, 1] as const;
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay, ease },
});
const reveal = {
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.6, ease },
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div className="mb-4 font-mono text-xs uppercase tracking-wider text-muted-foreground">{children}</div>;
}

export default function Home() {
  const playable = CHAPTERS.find((c) => c.ready)!;
  const playableCount = CHAPTERS.filter((c) => c.ready).length;

  return (
    <div>
      {/* hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="bg-dots pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_70%_60%_at_70%_40%,black,transparent)]"
        />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 pt-12 pb-6 sm:px-6 sm:pt-20 lg:grid-cols-[1.15fr_1fr]">
          <div>
            <motion.div {...fadeUp(0)}>
              <ChapterLink
                slug={playable.slug}
                className="group mb-5 inline-flex items-center gap-2 rounded-full border bg-background/80 py-1 pr-3 pl-2 text-xs backdrop-blur transition-colors hover:border-foreground/30"
              >
                <span className="relative flex size-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ok opacity-60" />
                  <span className="relative inline-flex size-2 rounded-full bg-ok" />
                </span>
                <span className="font-mono">DDIA 2e</span>
                <span className="text-muted-foreground">·</span>
                <span>{playableCount} chapters playable</span>
                <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
              </ChapterLink>
            </motion.div>

            <HeroHeadline />

            <motion.p {...fadeUp(0.55)} className="mt-5 max-w-xl text-lg text-muted-foreground text-pretty">
              Every chapter of <em>Designing Data-Intensive Applications</em> as a few hands-on missions. Break
              things. Fix them. Keep the takeaways.
            </motion.p>

            <motion.div {...fadeUp(0.7)} className="mt-7 flex flex-wrap items-center gap-3">
              <Magnetic>
                <Button asChild size="lg" className="group h-11 px-6">
                  <ChapterLink slug={playable.slug}>
                    Start with Chapter {playable.n}
                    <ArrowRight className="transition-transform duration-200 group-hover:translate-x-1" />
                  </ChapterLink>
                </Button>
              </Magnetic>
              <Button asChild size="lg" variant="ghost" className="group h-11">
                <a href="#chapters">
                  Browse chapters
                  <ArrowDown className="transition-transform duration-200 group-hover:translate-y-0.5" />
                </a>
              </Button>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.35, ease }}
            className="rounded-2xl border bg-background/90 p-4 shadow-sm backdrop-blur"
          >
            <HeroToys />
          </motion.div>
        </div>
      </section>

      {/* the tower: scroll to climb the book */}
      <section className="mx-auto mt-10 max-w-6xl px-4 sm:px-6">
        <SectionLabel>The tower</SectionLabel>
      </section>
      <TowerSection />

      {/* numbers */}
      <motion.section {...reveal} className="mx-auto mt-10 max-w-6xl px-4 sm:px-6">
        <Stats />
      </motion.section>

      {/* how it works */}
      <section className="mx-auto mt-16 max-w-6xl px-4 sm:px-6">
        <motion.div {...reveal}>
          <SectionLabel>How a chapter works</SectionLabel>
        </motion.div>
        <HowItWorks />
      </section>

      {/* chapter list */}
      <section id="chapters" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6">
        <motion.div {...reveal}>
          <SectionLabel>All chapters</SectionLabel>
        </motion.div>
        <div className="grid gap-8 md:grid-cols-3">
          {([1, 2, 3] as Part[]).map((p, pi) => (
            <motion.div key={p} {...reveal} transition={{ ...reveal.transition, delay: pi * 0.08 }}>
              <div className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Part {"I".repeat(p)} · {PARTS[p]}
              </div>
              <ul className="divide-y overflow-hidden rounded-xl border">
                {CHAPTERS.filter((c) => c.part === p).map((c) => (
                  <li key={c.n}>
                    <ChapterLink
                      slug={c.slug}
                      className={cn(
                        "group relative flex items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/60",
                        !c.ready && "text-muted-foreground",
                      )}
                    >
                      <span
                        className={cn(
                          "absolute inset-y-0 left-0 w-0.5 origin-top scale-y-0 transition-transform duration-300 group-hover:scale-y-100",
                          c.ready ? "bg-ok" : "bg-foreground/20",
                        )}
                      />
                      <span className="mt-0.5 font-mono text-xs tabular-nums transition-transform duration-200 group-hover:translate-x-0.5">
                        {String(c.n).padStart(2, "0")}
                      </span>
                      <span className="flex-1">
                        <span className={cn("block text-sm font-medium", c.ready && "text-foreground")}>{c.title}</span>
                        <span className="block text-xs text-muted-foreground">{c.play}</span>
                      </span>
                      {c.ready ? (
                        <span className="flex items-center gap-1">
                          <Badge variant="ok">Play</Badge>
                          <ArrowRight className="size-3.5 -translate-x-1 text-ok opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100" />
                        </span>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">Soon</Badge>
                      )}
                    </ChapterLink>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
