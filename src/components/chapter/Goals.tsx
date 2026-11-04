import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function Goals({ items }: { items: { label: string; done: boolean }[] }) {
  return (
    <ol className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm">
      {items.map((g, i) => (
        <li key={i} className={cn("flex items-center gap-1.5", g.done ? "text-foreground" : "text-muted-foreground")}>
          <span
            className={cn(
              "grid size-4 place-items-center rounded-full border text-[10px] font-mono transition-colors",
              g.done ? "border-ok bg-ok text-white" : "border-border",
            )}
          >
            {g.done ? <Check className="size-3" strokeWidth={3} /> : i + 1}
          </span>
          <span className={cn(g.done && "line-through decoration-muted-foreground/40")}>{g.label}</span>
        </li>
      ))}
    </ol>
  );
}
