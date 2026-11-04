import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Bug, Check, Play, RefreshCw, RotateCcw, Wrench } from "lucide-react";
import type { MissionProps } from "@/components/chapter/types";
import { Coach } from "@/components/chapter/Coach";
import { Goals } from "@/components/chapter/Goals";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Guarantee = "ryw" | "mono" | "prefix";

interface Msg {
  author: string;
  text: string;
  you?: boolean;
}
type ReplicaState = Record<string, { has: string[]; pending?: string[] }>;
interface Step {
  button: string;
  kind: "write" | "read";
  target: string[];
  state: ReplicaState;
  view: string[];
  note: string;
  bug?: boolean;
}
interface Scenario {
  title: string;
  symptom: string;
  messages: Record<string, Msg>;
  replicas: { id: string; label: string; slow?: boolean }[];
  initial: ReplicaState;
  initialView: string[];
  steps: Step[];
  fixedSteps: Step[];
  answer: Guarantee;
  fix: string;
}

const GUARANTEES: Record<Guarantee, { name: string; promise: string }> = {
  ryw: { name: "Read-your-writes", promise: "You always see your own writes." },
  mono: { name: "Monotonic reads", promise: "Time never goes backwards for you." },
  prefix: { name: "Consistent prefix reads", promise: "You see writes in the order they happened." },
};

const SCENARIOS: Scenario[] = [
  {
    title: "Vanishing reply",
    symptom: "I replied, hit refresh, and my reply vanished. Did it even save?",
    messages: {
      m1: { author: "Sam", text: "Loved the talk on event logs!" },
      m2: { author: "You", text: "Same. The replay demo was great.", you: true },
    },
    replicas: [
      { id: "L", label: "Leader" },
      { id: "F1", label: "Follower 1" },
      { id: "F2", label: "Follower 2", slow: true },
    ],
    initial: { L: { has: ["m1"] }, F1: { has: ["m1"] }, F2: { has: ["m1"] } },
    initialView: ["m1"],
    steps: [
      {
        button: "Post your reply",
        kind: "write",
        target: ["L"],
        state: { L: { has: ["m1", "m2"] }, F1: { has: ["m1", "m2"] }, F2: { has: ["m1"], pending: ["m2"] } },
        view: ["m1", "m2"],
        note: "Saved on the leader. Follower 1 got it fast. Follower 2 is lagging.",
      },
      {
        button: "Refresh",
        kind: "read",
        target: ["F2"],
        state: { L: { has: ["m1", "m2"] }, F1: { has: ["m1", "m2"] }, F2: { has: ["m1"], pending: ["m2"] } },
        view: ["m1"],
        note: "This read hit Follower 2, which doesn't have your reply yet.",
        bug: true,
      },
    ],
    fixedSteps: [
      {
        button: "Post your reply",
        kind: "write",
        target: ["L"],
        state: { L: { has: ["m1", "m2"] }, F1: { has: ["m1", "m2"] }, F2: { has: ["m1"], pending: ["m2"] } },
        view: ["m1", "m2"],
        note: "Saved on the leader. Follower 2 is lagging again.",
      },
      {
        button: "Refresh",
        kind: "read",
        target: ["L"],
        state: { L: { has: ["m1", "m2"] }, F1: { has: ["m1", "m2"] }, F2: { has: ["m1"], pending: ["m2"] } },
        view: ["m1", "m2"],
        note: "You wrote a moment ago, so your read goes to the leader. Your reply is there.",
      },
    ],
    answer: "ryw",
    fix: "Read anything the user recently changed from the leader (or a replica that has caught up).",
  },
  {
    title: "Time travel",
    symptom: "Priya's reply showed up, I refreshed, and it disappeared.",
    messages: {
      m1: { author: "Sam", text: "Who's coming Friday?" },
      m2: { author: "Priya", text: "Me! Bringing snacks." },
    },
    replicas: [
      { id: "L", label: "Leader" },
      { id: "F1", label: "Follower 1" },
      { id: "F2", label: "Follower 2", slow: true },
    ],
    initial: { L: { has: ["m1", "m2"] }, F1: { has: ["m1", "m2"] }, F2: { has: ["m1"], pending: ["m2"] } },
    initialView: [],
    steps: [
      {
        button: "Refresh",
        kind: "read",
        target: ["F1"],
        state: { L: { has: ["m1", "m2"] }, F1: { has: ["m1", "m2"] }, F2: { has: ["m1"], pending: ["m2"] } },
        view: ["m1", "m2"],
        note: "Served by Follower 1, which is up to date.",
      },
      {
        button: "Refresh again",
        kind: "read",
        target: ["F2"],
        state: { L: { has: ["m1", "m2"] }, F1: { has: ["m1", "m2"] }, F2: { has: ["m1"], pending: ["m2"] } },
        view: ["m1"],
        note: "Served by Follower 2, which is behind. You just went back in time.",
        bug: true,
      },
    ],
    fixedSteps: [
      {
        button: "Refresh",
        kind: "read",
        target: ["F1"],
        state: { L: { has: ["m1", "m2"] }, F1: { has: ["m1", "m2"] }, F2: { has: ["m1"], pending: ["m2"] } },
        view: ["m1", "m2"],
        note: "You're pinned to Follower 1.",
      },
      {
        button: "Refresh again",
        kind: "read",
        target: ["F1"],
        state: { L: { has: ["m1", "m2"] }, F1: { has: ["m1", "m2"] }, F2: { has: ["m1"], pending: ["m2"] } },
        view: ["m1", "m2"],
        note: "Same replica every time, so you never step backwards.",
      },
    ],
    answer: "mono",
    fix: "Pin each user to one replica, e.g. pick it by hashing their user ID.",
  },
  {
    title: "Answer first",
    symptom: "I saw Ben's answer before Ana had even asked the question.",
    messages: {
      m1: { author: "Ana", text: "What time is the launch?" },
      m2: { author: "Ben", text: "3pm sharp. Don't be late." },
    },
    replicas: [
      { id: "S1", label: "Shard 1 replica", slow: true },
      { id: "S2", label: "Shard 2 replica" },
    ],
    initial: { S1: { has: [] }, S2: { has: [] } },
    initialView: [],
    steps: [
      {
        button: "Ana asks",
        kind: "write",
        target: ["S1"],
        state: { S1: { has: [], pending: ["m1"] }, S2: { has: [] } },
        view: [],
        note: "Ana's question is stored on shard 1. Its replica is slow.",
      },
      {
        button: "Ben answers",
        kind: "write",
        target: ["S2"],
        state: { S1: { has: [], pending: ["m1"] }, S2: { has: ["m2"] } },
        view: [],
        note: "Ben's answer is stored on shard 2 and replicates instantly.",
      },
      {
        button: "Read as an observer",
        kind: "read",
        target: ["S1", "S2"],
        state: { S1: { has: [], pending: ["m1"] }, S2: { has: ["m2"] } },
        view: ["m2"],
        note: "Shards replicate independently, so the observer sees the answer first.",
        bug: true,
      },
    ],
    fixedSteps: [
      {
        button: "Ana asks",
        kind: "write",
        target: ["S1"],
        state: { S1: { has: [], pending: ["m1"] }, S2: { has: [] } },
        view: [],
        note: "Question stored on shard 1.",
      },
      {
        button: "Ben answers",
        kind: "write",
        target: ["S1"],
        state: { S1: { has: [], pending: ["m1", "m2"] }, S2: { has: [] } },
        view: [],
        note: "Same conversation, same shard. The answer queues behind the question.",
      },
      {
        button: "Read as an observer",
        kind: "read",
        target: ["S1"],
        state: { S1: { has: ["m1", "m2"] }, S2: { has: [] } },
        view: ["m1", "m2"],
        note: "One shard, one order: question first, then answer.",
      },
    ],
    answer: "prefix",
    fix: "Write causally related messages to the same shard, so they replicate in order.",
  },
];

type Phase = "repro" | "diagnose" | "replay" | "solved";

function AppView({ sc, view, bug, missing }: { sc: Scenario; view: string[]; bug: boolean; missing: string[] }) {
  return (
    <div className="flex h-full flex-col rounded-lg border bg-background">
      <div className="flex items-center justify-between border-b px-3 py-2">
        <span className="text-xs font-medium">#general</span>
        <span className="text-[10px] text-muted-foreground">your app</span>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-3">
        <AnimatePresence initial={false}>
          {view.map((id) => {
            const m = sc.messages[id];
            return (
              <motion.div
                key={id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className={cn("max-w-[85%] rounded-lg px-3 py-2 text-sm", m.you ? "self-end bg-foreground text-background" : "bg-muted")}
              >
                <div className={cn("text-[10px] font-semibold", m.you ? "opacity-70" : "text-muted-foreground")}>{m.author}</div>
                {m.text}
              </motion.div>
            );
          })}
        </AnimatePresence>
        {view.length === 0 && <div className="m-auto text-xs text-muted-foreground">Nothing yet</div>}
        {bug && missing.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-auto rounded-md border border-dashed border-fail/50 px-3 py-2 text-center text-xs text-fail"
          >
            Missing: {missing.map((id) => (sc.messages[id].you ? "your reply" : `${sc.messages[id].author}'s message`)).join(", ")}
          </motion.div>
        )}
      </div>
    </div>
  );
}

function Replicas({ sc, state, step }: { sc: Scenario; state: ReplicaState; step?: Step }) {
  return (
    <div className="flex flex-col gap-2">
      {sc.replicas.map((r) => {
        const st = state[r.id] ?? { has: [] };
        const active = step?.target.includes(r.id);
        return (
          <div
            key={r.id}
            className={cn(
              "flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-all",
              active && step?.kind === "read" && "border-data ring-2 ring-data/15",
              active && step?.kind === "write" && "border-foreground ring-2 ring-foreground/10",
            )}
          >
            <div className="w-28 shrink-0">
              <div className="text-xs font-medium">{r.label}</div>
              <div className="text-[10px] text-muted-foreground">{r.slow ? "lagging" : "in sync"}</div>
            </div>
            <div className="flex flex-1 flex-wrap gap-1">
              {st.has.map((id) => (
                <span key={id} className="rounded bg-foreground px-1.5 py-0.5 text-[10px] font-medium text-background">
                  {sc.messages[id].author}
                </span>
              ))}
              {(st.pending ?? []).map((id) => (
                <span key={id} className="animate-pulse rounded border border-dashed border-warn px-1.5 py-0.5 text-[10px] text-warn">
                  {sc.messages[id].author} · replicating…
                </span>
              ))}
              {st.has.length === 0 && !(st.pending ?? []).length && <span className="text-[10px] text-muted-foreground">empty</span>}
            </div>
            {active && (
              <span className={cn("shrink-0 font-mono text-[10px] font-semibold", step?.kind === "read" ? "text-data" : "text-foreground")}>
                ← {step?.kind}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function BugTriage({ onComplete }: MissionProps) {
  const [idx, setIdx] = useState(0);
  const [solved, setSolved] = useState<boolean[]>([false, false, false]);
  const [phase, setPhase] = useState<Phase>("repro");
  const [stepI, setStepI] = useState(-1);
  const [wrong, setWrong] = useState<Guarantee | null>(null);

  const sc = SCENARIOS[idx];
  const steps = phase === "replay" || phase === "solved" ? sc.fixedSteps : sc.steps;
  const step = stepI >= 0 ? steps[stepI] : undefined;
  const state = step?.state ?? sc.initial;
  const view = step?.view ?? sc.initialView;
  const isBug = !!step?.bug && phase !== "replay" && phase !== "solved";
  const expected = isBug ? Object.keys(sc.messages).filter((id) => !view.includes(id)) : [];

  const open = (i: number) => {
    setIdx(i);
    setPhase(solved[i] ? "solved" : "repro");
    setStepI(solved[i] ? SCENARIOS[i].fixedSteps.length - 1 : -1);
    setWrong(null);
  };

  const advance = () => {
    const next = stepI + 1;
    setStepI(next);
    if (phase === "repro" && next === sc.steps.length - 1) setTimeout(() => setPhase("diagnose"), 400);
    if (phase === "replay" && next === sc.fixedSteps.length - 1) {
      setPhase("solved");
      const s = solved.map((v, j) => (j === idx ? true : v));
      setSolved(s);
      if (s.every(Boolean)) onComplete();
    }
  };

  const diagnose = (g: Guarantee) => {
    if (g !== sc.answer) {
      setWrong(g);
      return;
    }
    setWrong(null);
    setPhase("replay");
    setStepI(-1);
  };

  const nextStep = steps[stepI + 1];

  return (
    <div className="flex flex-col gap-4">
      <Goals items={SCENARIOS.map((s, i) => ({ label: s.title, done: solved[i] }))} />

      <div className="flex gap-1.5">
        {SCENARIOS.map((_, i) => (
          <button
            key={i}
            onClick={() => open(i)}
            className={cn(
              "inline-flex cursor-pointer items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs transition-colors",
              i === idx ? "border-foreground bg-foreground text-background" : "hover:bg-muted",
            )}
          >
            {solved[i] ? <Check className="size-3" /> : <Bug className="size-3" />} Bug #{i + 1}
          </button>
        ))}
      </div>

      {/* bug report */}
      <div className="rounded-lg border border-dashed px-4 py-3">
        <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">User report</div>
        <div className="mt-1 text-base">“{sc.symptom}”</div>
      </div>

      <div className="grid gap-3 md:grid-cols-[1fr_1.3fr]">
        <div className="min-h-[200px]">
          <AppView sc={sc} view={view} bug={isBug} missing={expected} />
        </div>
        <div className="flex flex-col gap-2">
          <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Behind the scenes</div>
          <Replicas sc={sc} state={state} step={step} />
        </div>
      </div>

      {step && (
        <Coach tone={isBug ? "fail" : phase === "solved" ? "ok" : "info"} k={`${idx}-${phase}-${stepI}`}>
          {step.note}
          {phase === "solved" && (
            <>
              {" "}
              <b>{GUARANTEES[sc.answer].name}</b> restored.
            </>
          )}
        </Coach>
      )}

      {/* actions */}
      {(phase === "repro" || phase === "replay") && nextStep && (
        <div className="flex items-center gap-2">
          <Button onClick={advance}>
            {nextStep.kind === "read" ? <RefreshCw /> : <Play />} {nextStep.button}
          </Button>
          <span className="text-xs text-muted-foreground">
            {phase === "repro" ? "Reproduce the bug" : (
              <span className="inline-flex items-center gap-1"><Wrench className="size-3" /> Replaying with your fix</span>
            )}
          </span>
        </div>
      )}

      {phase === "diagnose" && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-2">
          <div className="text-sm font-medium">Which guarantee was broken?</div>
          <div className="grid gap-2 sm:grid-cols-3">
            {(Object.keys(GUARANTEES) as Guarantee[]).map((g) => (
              <button
                key={g}
                onClick={() => diagnose(g)}
                className={cn(
                  "cursor-pointer rounded-lg border px-3 py-2.5 text-left transition-colors hover:border-foreground/40 hover:bg-muted/50",
                  wrong === g && "animate-[shake_0.3s] border-fail bg-fail/5",
                )}
              >
                <div className="text-sm font-medium">{GUARANTEES[g].name}</div>
                <div className="text-xs text-muted-foreground">{GUARANTEES[g].promise}</div>
              </button>
            ))}
          </div>
          {wrong && (
            <div className="text-xs text-fail">
              Not that one. Look at <i>whose</i> data went missing, and <i>when</i>.
            </div>
          )}
        </motion.div>
      )}

      {phase === "replay" && stepI === -1 && (
        <div className="rounded-lg bg-muted/60 px-4 py-3 text-sm">
          <span className="font-medium">{GUARANTEES[sc.answer].name}.</span> Fix: {sc.fix}
        </div>
      )}

      {phase === "solved" && (
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex-1 rounded-lg bg-muted/60 px-4 py-3 text-sm">
            <span className="font-medium">Fix:</span> {sc.fix}
          </div>
          {idx < SCENARIOS.length - 1 ? (
            <Button onClick={() => open(idx + 1)}>Next bug</Button>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => { setPhase("repro"); setStepI(-1); }}>
              <RotateCcw /> Replay this bug
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
