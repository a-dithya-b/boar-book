import { lazy, Suspense, useState } from "react";
import { Link, useNavigate } from "react-router";
import { ArrowRight, MousePointerClick } from "lucide-react";
import { CHAPTERS, PARTS, type ChapterMeta, type Part } from "@/content/chapters";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const Bookshelf = lazy(() => import("@/components/three/Bookshelf"));

export default function Home() {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState<number | null>(null);
  const open = (ch: ChapterMeta) => navigate(`/chapter/${ch.slug}`);
  const active = CHAPTERS.find((c) => c.n === hovered);

  return (
    <div>
      <section className="mx-auto max-w-6xl px-4 pt-12 sm:px-6 sm:pt-16">
        <Badge variant="outline" className="mb-4 font-mono">DDIA · 2nd edition</Badge>
        <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
          Remember the book by playing with it.
        </h1>
        <p className="mt-4 max-w-xl text-muted-foreground text-pretty">
          Every chapter of <em>Designing Data-Intensive Applications</em> as a few hands-on missions.
          Break things. Fix them. Keep the takeaways.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Button asChild size="lg">
            <Link to="/chapter/replication">
              Start with Replication <ArrowRight />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <a href="#chapters">All chapters</a>
          </Button>
        </div>
      </section>

      {/* 3D shelf */}
      <section className="mx-auto mt-6 max-w-6xl px-2 sm:px-6">
        <div className="relative h-[200px] sm:h-[420px]">
          <Suspense fallback={<div className="h-full w-full animate-pulse rounded-xl bg-muted/50" />}>
            <Bookshelf chapters={CHAPTERS} hovered={hovered} onHover={setHovered} onOpen={open} />
          </Suspense>
        </div>
        <div className="flex min-h-12 items-center justify-center px-4 text-center text-sm" aria-live="polite">
          {active ? (
            <span>
              <span className="font-mono text-muted-foreground">Ch {active.n} · </span>
              <span className="font-medium">{active.title}</span>
              <span className="text-muted-foreground"> — {active.ready ? active.play : "coming soon"}</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-2 text-muted-foreground">
              <MousePointerClick className="size-4" />
              <span className="pointer-coarse:hidden">Hover a spine to pull it out. Click to open.</span>
              <span className="hidden pointer-coarse:inline">Tap a spine to open it.</span>
            </span>
          )}
        </div>
      </section>

      {/* plain list */}
      <section id="chapters" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-14 sm:px-6">
        <h2 className="text-2xl font-semibold tracking-tight">Chapters</h2>
        <div className="mt-6 grid gap-8 md:grid-cols-3">
          {([1, 2, 3] as Part[]).map((p) => (
            <div key={p}>
              <div className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Part {"I".repeat(p)} · {PARTS[p]}
              </div>
              <ul className="divide-y rounded-xl border">
                {CHAPTERS.filter((c) => c.part === p).map((c) => (
                  <li key={c.n}>
                    <Link
                      to={`/chapter/${c.slug}`}
                      className={cn(
                        "group flex items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/60",
                        !c.ready && "text-muted-foreground",
                      )}
                    >
                      <span className="mt-0.5 font-mono text-xs tabular-nums">{String(c.n).padStart(2, "0")}</span>
                      <span className="flex-1">
                        <span className={cn("block text-sm font-medium", c.ready && "text-foreground")}>{c.title}</span>
                        <span className="block text-xs text-muted-foreground">{c.play}</span>
                      </span>
                      {c.ready ? (
                        <Badge variant="ok">Play</Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">Soon</Badge>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
