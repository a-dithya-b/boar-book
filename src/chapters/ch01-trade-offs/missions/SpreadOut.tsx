import { useState } from "react";
import { motion } from "motion/react";
import { Check, Plug, RotateCcw, Rocket } from "lucide-react";
import type { MissionProps } from "@/components/chapter/types";
import { Coach, type Tone } from "@/components/chapter/Coach";
import { Goals } from "@/components/chapter/Goals";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Region = "am" | "eu" | "as";
const REGIONS: Record<Region, { name: string; x: number; y: number; w: number; h: number }> = {
  am: { name: "Americas", x: 30, y: 50, w: 170, h: 190 },
  eu: { name: "Europe", x: 240, y: 36, w: 130, h: 160 },
  as: { name: "Asia", x: 400, y: 60, w: 170, h: 160 },
};
const ORDER: Region[] = ["am", "eu", "as"];

/** Rough round-trip times in ms between regions. */
const RTT: Record<Region, Record<Region, number>> = {
  am: { am: 20, eu: 90, as: 170 },
  eu: { am: 90, eu: 20, as: 130 },
  as: { am: 170, eu: 130, as: 20 },
};
const FAST = 50;

interface Scenario {
  title: string;
  blurb: string;
  users: Region[];
  needCrashTest: boolean;
}
const SCENARIOS: Scenario[] = [
  { title: "Internal dashboard", blurb: "40 people, all in one Berlin office.", users: ["eu"], needCrashTest: false },
  { title: "Global chat app", blurb: "Millions of users on every continent. Downtime makes the news.", users: ["am", "eu", "as"], needCrashTest: true },
];

const PROBLEMS = [
  { at: 2, text: "Keeping every copy in sync", ch: "Ch 6" },
  { at: 2, text: "Networks that are slow, or just drop messages", ch: "Ch 9" },
  { at: 3, text: "Getting machines to agree on one answer", ch: "Ch 10" },
];

export default function SpreadOut({ onComplete }: MissionProps) {
  const [sc, setSc] = useState(0);
  const [servers, setServers] = useState<Record<Region, boolean>>({ am: false, eu: false, as: false });
  const [crashed, setCrashed] = useState<Region | null>(null);
  const [survived, setSurvived] = useState(false);
  const [verdict, setVerdict] = useState<{ ok: boolean; text: string } | null>(null);
  const [solved, setSolved] = useState<boolean[]>([false, false]);

  const S = SCENARIOS[sc];
  const up = ORDER.filter((r) => servers[r] && r !== crashed);
  const count = ORDER.filter((r) => servers[r]).length;
  const latency = (u: Region) => (up.length ? Math.min(...up.map((s) => RTT[u][s])) : Infinity);
  const nearest = (u: Region) => up.reduce<Region | null>((best, s) => (best === null || RTT[u][s] < RTT[u][best] ? s : best), null);
  const allFast = S.users.every((u) => latency(u) < FAST);

  const finish = (i: number) => {
    const s = solved.map((v, j) => (j === i ? true : v));
    setSolved(s);
    if (s.every(Boolean)) setTimeout(onComplete, 600);
  };

  const toggle = (r: Region) => {
    if (crashed) return;
    setServers((s) => ({ ...s, [r]: !s[r] }));
    setVerdict(null);
    setSurvived(false);
  };

  const ship = () => {
    if (!allFast) return setVerdict({ ok: false, text: "Someone is still waiting over 50 ms. Put a server closer to them." });
    if (count > 1)
      return setVerdict({ ok: false, text: `It works, but ${count} servers for 40 people in one office is complexity you pay for and don't need.` });
    setVerdict({ ok: true, text: "One machine, close to its users. Simpler, cheaper, easier to debug. Plenty of systems never need more." });
    finish(0);
  };

  const crashTest = () => {
    // pull the plug on the busiest server
    const victim = ORDER.filter((r) => servers[r]).sort(
      (a, b) => S.users.filter((u) => nearest(u) === b).length - S.users.filter((u) => nearest(u) === a).length,
    )[0];
    if (!victim) return;
    setCrashed(victim);
    const still = ORDER.filter((r) => servers[r] && r !== victim);
    const ok = still.length > 0;
    setTimeout(() => {
      setCrashed(null);
      if (ok) {
        setSurvived(true);
        if (allFast) finish(1);
      }
    }, 2200);
    setVerdict(
      ok
        ? { ok: true, text: `${REGIONS[victim].name} went dark. Its users were rerouted (slower, but still online).` }
        : { ok: false, text: "That was the only server. Everyone is offline. One machine is one point of failure." },
    );
  };

  const open = (i: number) => {
    setSc(i);
    setServers({ am: false, eu: false, as: false });
    setCrashed(null);
    setSurvived(false);
    setVerdict(null);
  };

  const coach: { tone: Tone; text: React.ReactNode } = verdict
    ? { tone: verdict.ok ? "ok" : "fail", text: verdict.text }
    : count === 0
      ? { tone: "info", text: <>Click a region to put a server there. Users connect to the nearest live one.</> }
      : !allFast
        ? { tone: "warn", text: <>Some users are far from any server. Distance is latency.</> }
        : { tone: "info", text: S.needCrashTest ? <>Everyone is fast. Now: what happens when a machine dies?</> : <>Everyone is fast. Ship it?</> };

  const latColor = (ms: number) => (ms < FAST ? "#16a34a" : ms < 120 ? "#d97706" : "#dc2626");

  return (
    <div className="flex flex-col gap-4">
      <Goals items={SCENARIOS.map((s, i) => ({ label: s.title, done: solved[i] }))} />

      <div className="flex flex-wrap items-center gap-1.5">
        {SCENARIOS.map((s, i) => (
          <button
            key={i}
            onClick={() => open(i)}
            className={cn(
              "inline-flex cursor-pointer items-center gap-1 rounded-md border px-2.5 py-1 text-xs transition-colors",
              i === sc ? "border-foreground bg-foreground text-background" : "hover:bg-muted",
            )}
          >
            {solved[i] && <Check className="size-3" />} {s.title}
          </button>
        ))}
        <span className="ml-2 text-sm text-muted-foreground">{S.blurb}</span>
      </div>

      <div className="grid gap-4 md:grid-cols-[1fr_250px]">
        <div className="rounded-lg border bg-dots">
          <svg viewBox="0 0 600 280" className="w-full" role="img" aria-label="World map with server slots">
            {ORDER.map((r) => {
              const R = REGIONS[r];
              const hasUsers = S.users.includes(r);
              const on = servers[r];
              const dead = crashed === r;
              return (
                <g key={r}>
                  <rect x={R.x} y={R.y} width={R.w} height={R.h} rx={36} fill="#f4f4f5" stroke="#e4e4e7" />
                  <text x={R.x + 16} y={R.y + 22} className="fill-zinc-500 font-mono text-[10px] uppercase tracking-wider">
                    {R.name}
                  </text>
                  {/* users */}
                  {hasUsers &&
                    Array.from({ length: S.users.length === 1 ? 4 : 6 }, (_, k) => (
                      <circle key={k} cx={R.x + R.w / 2 - 30 + (k % 3) * 30} cy={R.y + R.h - 52 + Math.floor(k / 3) * 14} r={4.5} fill="#71717a" />
                    ))}
                  {/* server slot */}
                  <motion.g
                    onClick={() => toggle(r)}
                    className="cursor-pointer"
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.92 }}
                    animate={dead ? { rotate: [0, -6, 5, 0] } : {}}
                    style={{ transformOrigin: `${R.x + R.w / 2}px ${R.y + 50}px`, transformBox: "view-box" }}
                    role="button"
                    aria-label={`${on ? "Remove" : "Add"} a server in ${R.name}`}
                  >
                    <rect
                      x={R.x + R.w / 2 - 22}
                      y={R.y + 32}
                      width={44}
                      height={34}
                      rx={7}
                      fill={dead ? "#fee2e2" : on ? "#0a0a0a" : "#ffffff"}
                      stroke={dead ? "#dc2626" : on ? "#0a0a0a" : "#a1a1aa"}
                      strokeWidth={1.5}
                      strokeDasharray={on ? undefined : "4 3"}
                    />
                    <text x={R.x + R.w / 2} y={R.y + 53} textAnchor="middle" className={cn("text-[10px] font-semibold", on && !dead ? "fill-white" : dead ? "fill-red-600" : "fill-zinc-400")}>
                      {dead ? "dead" : on ? "server" : "+ add"}
                    </text>
                  </motion.g>
                </g>
              );
            })}
            {/* connections from users to their nearest server (drawn on top of the regions) */}
            {S.users.map((u) => {
              const s = nearest(u);
              if (!s) return null;
              const a = REGIONS[u];
              const b = REGIONS[s];
              const ms = latency(u);
              const x1 = a.x + a.w / 2;
              const y1 = a.y + a.h - 40;
              const x2 = b.x + b.w / 2;
              const y2 = b.y + 31; // top edge of the server box
              return (
                <g key={`l${u}`}>
                  {u !== s && (
                    <motion.path
                      d={`M${x1},${y1} Q${(x1 + x2) / 2},${Math.min(y1, y2) - 60} ${x2},${y2}`}
                      fill="none"
                      stroke={latColor(ms)}
                      strokeWidth={1.8}
                      strokeDasharray="5 4"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.5 }}
                    />
                  )}
                  <rect x={x1 - 26} y={y1 + 14} width={52} height={18} rx={9} fill="#fff" stroke={latColor(ms)} />
                  <text x={x1} y={y1 + 27} textAnchor="middle" className="font-mono text-[11px] font-semibold" fill={latColor(ms)}>
                    {ms === Infinity ? "down" : `${ms} ms`}
                  </text>
                </g>
              );
            })}

          </svg>
        </div>

        <div className="flex flex-col gap-3">
          <div className="rounded-lg border p-3">
            <div className="mb-1 flex justify-between text-xs">
              <span className="text-muted-foreground">Servers</span>
              <span className="font-mono font-semibold">{count}</span>
            </div>
            <div className="mb-1 mt-2 text-xs text-muted-foreground">New things that can go wrong</div>
            <div className="flex flex-col gap-1">
              {PROBLEMS.map((p) => (
                <motion.div
                  key={p.text}
                  animate={{ opacity: count >= p.at ? 1 : 0.3 }}
                  className={cn("flex items-start justify-between gap-2 rounded-md px-2 py-1 text-[11px]", count >= p.at ? "bg-warn/10 text-foreground" : "bg-muted")}
                >
                  <span>{p.text}</span>
                  <span className="shrink-0 font-mono text-muted-foreground">{p.ch}</span>
                </motion.div>
              ))}
            </div>
          </div>
          {S.needCrashTest ? (
            <Button onClick={crashTest} disabled={count === 0 || !!crashed} variant={survived ? "outline" : "default"}>
              <Plug /> {crashed ? "Unplugged…" : survived ? "Survived. Again?" : "Pull the plug"}
            </Button>
          ) : (
            <Button onClick={ship} disabled={count === 0}>
              <Rocket /> Ship it
            </Button>
          )}
          <div className="text-[11px] text-muted-foreground">
            Goal: everyone under {FAST} ms{S.needCrashTest ? ", and still online when a server dies" : ", with as little machinery as possible"}.
          </div>
        </div>
      </div>

      <Coach tone={coach.tone} k={`${sc}-${count}-${verdict?.text}-${allFast}`}>
        {coach.text}
      </Coach>

      <div className="flex justify-end">
        <Button variant="ghost" size="sm" onClick={() => open(sc)}>
          <RotateCcw /> Restart
        </Button>
      </div>
    </div>
  );
}
