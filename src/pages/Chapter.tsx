import { lazy, Suspense, type ComponentType, type LazyExoticComponent } from "react";
import { Link, useParams } from "react-router";
import { CHAPTER_REGISTRY } from "@/chapters/registry";
import { ChapterLink } from "@/components/transition/ChapterTransition";
import { ArrowLeft, ArrowRight, Hammer } from "lucide-react";
import { chapterBySlug, PARTS } from "@/content/chapters";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

/** One lazy component per registered chapter (see src/chapters/registry.ts). */
const MODULES: Record<string, LazyExoticComponent<ComponentType>> = Object.fromEntries(
  Object.entries(CHAPTER_REGISTRY).map(([slug, entry]) => [slug, lazy(entry.load)]),
);

export default function ChapterPage() {
  const { slug = "" } = useParams();
  const meta = chapterBySlug(slug);
  const Module = MODULES[slug];

  if (meta && Module) {
    return (
      <Suspense fallback={<div className="h-[60vh]" />}>
        <Module />
      </Suspense>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Bookshelf
      </Link>
      {meta ? (
        <div className="mt-8">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono">Ch {String(meta.n).padStart(2, "0")}</Badge>
            <span className="text-xs text-muted-foreground">Part {"I".repeat(meta.part)} · {PARTS[meta.part]}</span>
          </div>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">{meta.title}</h1>
          <div className="mt-8 rounded-xl border border-dashed p-6">
            <div className="flex items-center gap-2 font-medium">
              <Hammer className="size-4" /> Under construction
            </div>
            <p className="mt-2 text-sm text-muted-foreground">Planned: {meta.play}</p>
          </div>
        </div>
      ) : (
        <h1 className="mt-8 text-3xl font-semibold tracking-tight">That chapter isn't on the shelf.</h1>
      )}
      <Button asChild className="mt-8">
        <ChapterLink slug="replication">
          Try Replication <ArrowRight />
        </ChapterLink>
      </Button>
    </div>
  );
}
