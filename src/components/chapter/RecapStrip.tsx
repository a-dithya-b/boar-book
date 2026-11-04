import { useState } from "react";
import { RotateCw } from "lucide-react";
import type { RecapCard } from "./types";
import { cn } from "@/lib/utils";

/** Flip cards: guess the answer, then flip. */
export function RecapStrip({ cards }: { cards: RecapCard[] }) {
  const [flipped, setFlipped] = useState<boolean[]>(() => cards.map(() => false));
  const count = flipped.filter(Boolean).length;

  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-lg font-semibold tracking-tight">Warm-up</h2>
        <span className="font-mono text-xs text-muted-foreground">
          {count}/{cards.length} flipped
        </span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c, i) => (
          <button
            key={i}
            onClick={() => setFlipped((f) => f.map((v, j) => (j === i ? !v : v)))}
            className="group h-36 cursor-pointer text-left [perspective:900px] focus-visible:outline-none"
            aria-label={flipped[i] ? c.a : `${c.q} (flip for answer)`}
          >
            <div
              className={cn(
                "relative h-full w-full rounded-xl transition-transform duration-500 [transform-style:preserve-3d] group-focus-visible:ring-[3px] group-focus-visible:ring-ring/50",
                flipped[i] && "[transform:rotateY(180deg)]",
              )}
            >
              {/* front */}
              <div className="absolute inset-0 flex flex-col justify-between rounded-xl border bg-card p-4 shadow-xs [backface-visibility:hidden] group-hover:border-foreground/30">
                <span className="font-mono text-[11px] text-muted-foreground">0{i + 1}</span>
                <span className="text-base font-medium leading-snug">{c.q}</span>
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <RotateCw className="size-3" /> think, then flip
                </span>
              </div>
              {/* back */}
              <div className="absolute inset-0 flex items-center rounded-xl bg-primary p-4 text-sm leading-relaxed text-primary-foreground [backface-visibility:hidden] [transform:rotateY(180deg)]">
                {c.a}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
