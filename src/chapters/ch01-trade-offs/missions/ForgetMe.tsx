import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Archive, BrainCircuit, Database, FileText, Mail, RotateCcw, Search, Trash2, Warehouse } from "lucide-react";
import type { MissionProps } from "@/components/chapter/types";
import { Coach, type Tone } from "@/components/chapter/Coach";
import { Goals } from "@/components/chapter/Goals";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Sys {
  id: string;
  name: string;
  kind: "record" | "derived";
  icon: typeof Database;
  how: string;
}

const SYSTEMS: Sys[] = [
  { id: "db", name: "App database", kind: "record", icon: Database, how: "Gone from the system of record. That was the easy part." },
  { id: "search", name: "Search index", kind: "derived", icon: Search, how: "Built from the database, so it kept its own copy. Delete it there too." },
  { id: "dwh", name: "Data warehouse", kind: "derived", icon: Warehouse, how: "ETL copied her rows here last night. Remove them, or they'll feed every report." },
  { id: "logs", name: "Event logs", kind: "derived", icon: FileText, how: "Logs are append-only: you can't just edit a line. Rewrite them, or let them expire." },
  { id: "backup", name: "Nightly backups", kind: "derived", icon: Archive, how: "Hard to edit. One trick: encrypt each person's data with their own key, then delete the key." },
  { id: "model", name: "Recommendation model", kind: "derived", icon: BrainCircuit, how: "It learned from her clicks. The honest fix is to retrain it without her data." },
];

export default function ForgetMe({ onComplete }: MissionProps) {
  const [deleted, setDeleted] = useState<string[]>([]);
  const [last, setLast] = useState<Sys | null>(null);
  const started = deleted.includes("db");
  const remaining = SYSTEMS.filter((s) => !deleted.includes(s.id));
  const done = remaining.length === 0;

  const wipe = (s: Sys) => {
    if (deleted.includes(s.id)) return;
    if (!started && s.id !== "db") return;
    const d = [...deleted, s.id];
    setDeleted(d);
    setLast(s);
    if (d.length === SYSTEMS.length) setTimeout(onComplete, 700);
  };

  const coach: { tone: Tone; text: React.ReactNode } = done
    ? {
        tone: "ok",
        text: (
          <>
            Six places, one person. <b>Derived data multiplies copies</b>, and laws like the GDPR give people the right to have their data
            erased. The easiest data to delete is data you never collected.
          </>
        ),
      }
    : !started
      ? { tone: "info", text: <>Alice wants her account and all her data deleted. Start with the database.</> }
      : last && last.id === "db"
        ? { tone: "warn", text: <>Done? Not quite. Alice still shows up in {remaining.length} other systems. Find them.</> }
        : { tone: "info", text: <>{last?.how} {remaining.length} to go.</> };

  return (
    <div className="flex flex-col gap-4">
      <Goals
        items={[
          { label: "Delete Alice from the database", done: started },
          { label: `Find every other copy (${SYSTEMS.length - 1 - remaining.length}/${SYSTEMS.length - 1})`, done },
        ]}
      />

      {/* the request */}
      <div className="flex items-start gap-3 rounded-lg border border-dashed px-4 py-3">
        <Mail className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <div className="text-sm">
          <div className="font-medium">From: Alice</div>
          <div className="text-muted-foreground">“Please delete my account and everything you have about me.”</div>
        </div>
        {done && <Badge variant="ok" className="ml-auto">Request completed</Badge>}
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {SYSTEMS.map((s) => {
          const gone = deleted.includes(s.id);
          const locked = !started && s.id !== "db";
          const hasAlice = !gone && (started || s.id === "db");
          return (
            <motion.button
              key={s.id}
              onClick={() => wipe(s)}
              disabled={gone || locked}
              whileHover={!gone && !locked ? { y: -2 } : undefined}
              className={cn(
                "relative flex min-h-[124px] flex-col rounded-xl border p-3 text-left transition-colors",
                !gone && !locked && "cursor-pointer hover:border-foreground/40",
                gone && "bg-muted/40",
                s.kind === "record" && "border-foreground/40",
              )}
            >
              <div className="flex items-center gap-2">
                <s.icon className="size-4" />
                <span className="text-sm font-medium">{s.name}</span>
              </div>
              <div className="mt-0.5 font-mono text-[10px] text-muted-foreground">{s.kind === "record" ? "system of record" : "derived data"}</div>
              <div className="mt-auto flex flex-wrap gap-1 pt-3">
                {/* other people's data, always there */}
                {["Bo", "Chen"].map((n) => (
                  <span key={n} className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                    {n}
                  </span>
                ))}
                <AnimatePresence>
                  {hasAlice && (
                    <motion.span
                      key="alice"
                      initial={{ scale: 0.6, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.4, opacity: 0, rotate: -20 }}
                      className="rounded bg-foreground px-1.5 py-0.5 text-[10px] font-medium text-background"
                    >
                      Alice
                    </motion.span>
                  )}
                </AnimatePresence>
                {gone && <span className="text-[10px] text-ok">deleted</span>}
              </div>
              {!gone && !locked && (
                <span className="absolute top-3 right-3 text-muted-foreground">
                  <Trash2 className="size-3.5" />
                </span>
              )}
              {locked && <div className="absolute inset-0 rounded-xl bg-background/50" />}
            </motion.button>
          );
        })}
      </div>

      <Coach tone={coach.tone} k={`${deleted.length}`}>
        {coach.text}
      </Coach>

      <div className="flex justify-end">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setDeleted([]);
            setLast(null);
          }}
        >
          <RotateCcw /> Restart
        </Button>
      </div>
    </div>
  );
}
