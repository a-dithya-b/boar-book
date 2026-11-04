import { useRef, useState } from "react";
import { motion } from "motion/react";
import { Check, Download, Lock } from "lucide-react";
import { toPng } from "html-to-image";
import type { ChapterMeta } from "@/content/chapters";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function Stamp({ n, title }: { n: number; title: string }) {
  return (
    <motion.div
      initial={{ scale: 2.2, opacity: 0, rotate: -30 }}
      animate={{ scale: 1, opacity: 1, rotate: -12 }}
      transition={{ type: "spring", stiffness: 260, damping: 14, delay: 0.15 }}
      className="grid size-28 shrink-0 place-items-center rounded-full border-[3px] border-ok text-ok"
    >
      <div className="grid size-[92px] place-items-center rounded-full border border-dashed border-ok/60 text-center">
        <div>
          <div className="font-mono text-[10px] tracking-widest">CHAPTER</div>
          <div className="font-mono text-3xl leading-none font-bold">{String(n).padStart(2, "0")}</div>
          <div className="mt-0.5 max-w-[76px] truncate text-[10px] font-semibold uppercase tracking-wide">{title}</div>
        </div>
      </div>
    </motion.div>
  );
}

export function Reward({
  meta,
  takeaways,
  checklist,
}: {
  meta: ChapterMeta;
  takeaways: string[];
  checklist: { label: string; done: boolean }[];
}) {
  const earned = checklist.every((c) => c.done);
  const cardRef = useRef<HTMLDivElement>(null);
  const [saving, setSaving] = useState(false);

  const download = async () => {
    if (!cardRef.current) return;
    setSaving(true);
    try {
      const url = await toPng(cardRef.current, { pixelRatio: 2, backgroundColor: "#ffffff" });
      const a = document.createElement("a");
      a.href = url;
      a.download = `ddia-ch${meta.n}-${meta.slug}.png`;
      a.click();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_260px]">
      <div ref={cardRef} className="rounded-xl border bg-card p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="font-mono text-xs text-muted-foreground">DDIA 2e · Chapter {meta.n}</div>
            <div className="mt-1 text-2xl font-semibold tracking-tight">{meta.title}</div>
            <div className="text-sm text-muted-foreground">Takeaways</div>
          </div>
          {earned && <Stamp n={meta.n} title={meta.title} />}
        </div>
        <ol className="mt-5 grid gap-3 sm:grid-cols-2">
          {takeaways.map((t, i) => (
            <li key={i} className="flex gap-3 text-sm leading-snug">
              <span className="font-mono text-xs text-muted-foreground tabular-nums">{String(i + 1).padStart(2, "0")}</span>
              <span className="text-pretty">{t}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="flex flex-col gap-4">
        <div className="rounded-xl border p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium">
            {earned ? <Check className="size-4 text-ok" /> : <Lock className="size-4 text-muted-foreground" />}
            {earned ? "Stamp earned" : "Earn the chapter stamp"}
          </div>
          <ul className="space-y-1.5 text-sm">
            {checklist.map((c) => (
              <li key={c.label} className={cn("flex items-center gap-2", c.done ? "text-foreground" : "text-muted-foreground")}>
                <span className={cn("size-1.5 rounded-full", c.done ? "bg-ok" : "bg-border")} />
                {c.label}
              </li>
            ))}
          </ul>
        </div>
        <Button variant="outline" onClick={download} disabled={saving}>
          <Download /> {saving ? "Saving…" : "Save card as image"}
        </Button>
      </div>
    </div>
  );
}
