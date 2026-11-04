import { useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Activity, Check, Copy, GitBranch, HardDrive, Keyboard, Power, RefreshCw, RotateCcw, ShieldCheck, Gauge as GaugeIcon, Bug, Waves, X, Zap } from "lucide-react";
import type { MissionProps } from "@/components/chapter/types";
import { Coach, type Tone } from "@/components/chapter/Coach";
import { Goals } from "@/components/chapter/Goals";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type DefenseId = "replicas" | "restart" | "canary" | "guards" | "limits";

const DEFENSES: Record<DefenseId, { name: string; sub: string; icon: typeof Copy }> = {
  replicas: { name: "Redundant machines & disks", sub: "spare copies take over", icon: Copy },
  restart: { name: "Auto-restart crashed processes", sub: "a supervisor brings them back", icon: RefreshCw },
  canary: { name: "Canary deploys + rollback", sub: "new code reaches 1% first", icon: GitBranch },
  guards: { name: "Guard rails for operators", sub: "staging, confirmations, undo", icon: ShieldCheck },
  limits: { name: "Rate limits & backoff", sub: "shed load before it snowballs", icon: GaugeIcon },
};

const FAULTS: { name: string; kind: "hardware" | "software" | "human"; icon: typeof Copy; stoppedBy: DefenseId }[] = [
  { name: "A disk dies", kind: "hardware", icon: HardDrive, stoppedBy: "replicas" },
  { name: "A machine loses power", kind: "hardware", icon: Power, stoppedBy: "replicas" },
  { name: "A process crashes on bad input", kind: "software", icon: Bug, stoppedBy: "restart" },
  { name: "A deploy ships a bug", kind: "software", icon: Zap, stoppedBy: "canary" },
  { name: "An operator runs a command on the wrong cluster", kind: "human", icon: Keyboard, stoppedBy: "guards" },
  { name: "Clients retry in a storm", kind: "software", icon: Waves, stoppedBy: "limits" },
];

const BUDGET = 3;
const TARGET = 4;

export default function Chaos({ onComplete }: MissionProps) {
  const [picked, setPicked] = useState<DefenseId[]>([]);
  const [shown, setShown] = useState(0); // faults revealed so far
  const [running, setRunning] = useState(false);
  const timers = useRef<number[]>([]);
  const completed = useRef(false);

  const finished = shown === FAULTS.length && !running;
  const absorbed = FAULTS.slice(0, shown).filter((f) => picked.includes(f.stoppedBy)).length;
  const failures = shown - absorbed;

  const toggle = (d: DefenseId) => {
    if (running || shown > 0) return;
    setPicked((p) => (p.includes(d) ? p.filter((x) => x !== d) : p.length < BUDGET ? [...p, d] : p));
  };

  const run = () => {
    setRunning(true);
    setShown(0);
    FAULTS.forEach((_, i) =>
      timers.current.push(
        window.setTimeout(() => {
          setShown(i + 1);
          if (i === FAULTS.length - 1) {
            setRunning(false);
            const ok = FAULTS.filter((f) => picked.includes(f.stoppedBy)).length >= TARGET;
            if (ok && !completed.current) {
              completed.current = true;
              setTimeout(onComplete, 600);
            }
          }
        }, 500 + i * 700),
      ),
    );
  };

  const reset = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setRunning(false);
    setShown(0);
  };

  const uptime = shown === 0 ? 100 : Math.round(100 - (failures / FAULTS.length) * 9);

  const coach: { tone: Tone; text: React.ReactNode } = (() => {
    if (shown === 0 && !running)
      return { tone: "info", text: <>Something will break. You can afford <b>{BUDGET} defences</b>. Pick them, then unleash the chaos test.</> };
    if (running) return { tone: "info", text: <>Injecting faults…</> };
    if (absorbed >= TARGET)
      return {
        tone: "ok",
        text: (
          <>
            {absorbed} of {FAULTS.length} faults never reached users. Faults are inevitable; <b>reliability</b> means they don't turn into{" "}
            <b>failures</b>. Redundancy covers whole classes of hardware faults at once. Software and human faults each need their own defence.
          </>
        ),
      };
    return {
      tone: "fail",
      text: (
        <>
          {failures} faults became user-facing failures. Look at which defence covers <i>more than one</i> fault. Reset and pick again.
        </>
      ),
    };
  })();

  return (
    <div className="flex flex-col gap-4">
      <Goals
        items={[
          { label: `Pick ${BUDGET} defences`, done: picked.length === BUDGET },
          { label: `Absorb at least ${TARGET} of ${FAULTS.length} faults`, done: finished && absorbed >= TARGET },
        ]}
      />

      <div className="grid gap-4 md:grid-cols-[1fr_1.2fr]">
        {/* defences */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            <span>Defences</span>
            <span className="font-mono normal-case">
              budget {picked.length}/{BUDGET}
            </span>
          </div>
          {(Object.keys(DEFENSES) as DefenseId[]).map((d) => {
            const D = DEFENSES[d];
            const on = picked.includes(d);
            const full = !on && picked.length >= BUDGET;
            return (
              <motion.button
                key={d}
                onClick={() => toggle(d)}
                whileTap={{ scale: 0.98 }}
                disabled={shown > 0 || running}
                className={cn(
                  "flex items-center gap-3 rounded-lg border px-3 py-2 text-left transition-colors",
                  on ? "border-foreground bg-foreground text-background" : "hover:bg-muted",
                  full && "opacity-45",
                  (shown > 0 || running) && "cursor-default",
                  !(shown > 0 || running) && "cursor-pointer",
                )}
              >
                <D.icon className="size-4 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium">{D.name}</div>
                  <div className={cn("text-[11px]", on ? "opacity-70" : "text-muted-foreground")}>{D.sub}</div>
                </div>
                {on && <Check className="size-4" />}
              </motion.button>
            );
          })}
        </div>

        {/* the chaos run */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            <span>Chaos test</span>
            <span className="flex items-center gap-1 font-mono normal-case">
              <Activity className="size-3" /> users served {uptime}%
            </span>
          </div>
          <div className="flex flex-col gap-2">
            {FAULTS.map((f, i) => {
              const visible = i < shown;
              const ok = picked.includes(f.stoppedBy);
              return (
                <div key={f.name} className="relative h-[46px]">
                  <AnimatePresence>
                    {visible ? (
                      <motion.div
                        initial={{ opacity: 0, x: 24, rotate: 2 }}
                        animate={{ opacity: 1, x: 0, rotate: 0 }}
                        className={cn(
                          "absolute inset-0 flex items-center gap-3 rounded-lg border px-3",
                          ok ? "border-ok/40 bg-ok/8" : "border-fail/40 bg-fail/8",
                        )}
                      >
                        <f.icon className={cn("size-4 shrink-0", ok ? "text-ok" : "text-fail")} />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm">{f.name}</div>
                          <div className="font-mono text-[10px] text-muted-foreground">{f.kind} fault</div>
                        </div>
                        <span className={cn("flex shrink-0 items-center gap-1 text-[11px] font-medium", ok ? "text-ok" : "text-fail")}>
                          {ok ? <Check className="size-3.5" /> : <X className="size-3.5" />}
                          {ok ? "absorbed" : "users hit errors"}
                        </span>
                      </motion.div>
                    ) : (
                      <div className="absolute inset-0 rounded-lg border border-dashed" />
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
          {shown === 0 && !running ? (
            <Button onClick={run} disabled={picked.length < BUDGET}>
              <Zap /> Unleash the chaos test
            </Button>
          ) : (
            <Button variant="outline" onClick={reset} disabled={running}>
              <RotateCcw /> Reset and pick again
            </Button>
          )}
        </div>
      </div>

      <Coach tone={coach.tone} k={`${shown}-${running}-${picked.length}`}>
        {coach.text}
      </Coach>
    </div>
  );
}
