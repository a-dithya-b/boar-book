import { motion } from "motion/react";
import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type Tone = "info" | "ok" | "fail" | "warn";

const icons = { info: Info, ok: CheckCircle2, fail: XCircle, warn: AlertTriangle };
const styles: Record<Tone, string> = {
  info: "border-border bg-muted/50 text-foreground",
  ok: "border-ok/30 bg-ok/8 text-foreground",
  fail: "border-fail/30 bg-fail/8 text-foreground",
  warn: "border-warn/30 bg-warn/8 text-foreground",
};
const iconColor: Record<Tone, string> = {
  info: "text-muted-foreground",
  ok: "text-ok",
  fail: "text-fail",
  warn: "text-warn",
};

/** The single line that tells you what's going on / what to do next. */
export function Coach({ tone = "info", children, k }: { tone?: Tone; children: React.ReactNode; k: string }) {
  const Icon = icons[tone];
  return (
    <div className="min-h-[52px]" aria-live="polite">
      <motion.div
          key={k}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className={cn("flex items-start gap-2.5 rounded-lg border px-3.5 py-3 text-sm", styles[tone])}
        >
          <Icon className={cn("mt-0.5 size-4 shrink-0", iconColor[tone])} />
          <div className="text-pretty">{children}</div>
        </motion.div>
    </div>
  );
}
