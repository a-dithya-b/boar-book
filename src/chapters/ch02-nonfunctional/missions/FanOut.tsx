import { useEffect, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, RoundedBox } from "@react-three/drei";
import { motion } from "motion/react";
import * as THREE from "three";
import { Newspaper, PenLine, RotateCcw, Star } from "lucide-react";
import type { MissionProps } from "@/components/chapter/types";
import { Coach, type Tone } from "@/components/chapter/Coach";
import { Goals } from "@/components/chapter/Goals";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Strategy = "read" | "write" | "hybrid";
const STRATEGIES: Record<Strategy, { name: string; sub: string }> = {
  read: { name: "Fan-out on read", sub: "build the timeline when it's opened" },
  write: { name: "Fan-out on write", sub: "copy each post to every follower's timeline" },
  hybrid: { name: "Hybrid", sub: "write for most people, read for celebrities" },
};

// the real-world numbers the meters use (the 3D scene shows a handful)
const FOLLOWS = 200; // accounts a typical user follows
const ALEX_FOLLOWERS = 300;
const CELEB_FOLLOWERS = 30_000_000;
const CELEBS_FOLLOWED = 3;

const N = 14;
const R = 3.3;
const ALEX = 2;
const YOU = 11;
const CELEB = 7;
const ALEX_FANS = [0, 1, 3, 4, 11];

const userPos = (i: number) => {
  const a = (i / N) * Math.PI * 2 + Math.PI / 2;
  return new THREE.Vector3(Math.cos(a) * R, 0.35, Math.sin(a) * R);
};
const boxPos = (i: number) => userPos(i).multiplyScalar(1.28).setY(0.12);
const DB = new THREE.Vector3(0, 0.6, 0);

interface Packet {
  id: number;
  from: THREE.Vector3;
  to: THREE.Vector3;
  start: number;
  dur: number;
  color: string;
}

function Dot({ p, onDone }: { p: Packet; onDone: (id: number) => void }) {
  const ref = useRef<THREE.Mesh>(null);
  const done = useRef(false);
  useFrame(() => {
    const m = ref.current;
    if (!m) return;
    const t = (performance.now() - p.start) / p.dur;
    if (t < 0) {
      m.visible = false;
      return;
    }
    m.visible = true;
    const k = Math.min(1, t);
    m.position.lerpVectors(p.from, p.to, k);
    m.position.y += Math.sin(Math.PI * k) * 0.7;
    if (k >= 1 && !done.current) {
      done.current = true;
      onDone(p.id);
    }
  });
  return (
    <mesh ref={ref} visible={false}>
      <sphereGeometry args={[0.09, 14, 14]} />
      <meshStandardMaterial color={p.color} emissive={p.color} emissiveIntensity={0.5} />
    </mesh>
  );
}

/** A user's cached home timeline; glows blue for a moment when a post lands in it. */
function TimelineBox({ at, flashAt }: { at: THREE.Vector3; flashAt: number }) {
  const mat = useRef<THREE.MeshStandardMaterial>(null);
  const idle = useRef(new THREE.Color("#f4f4f5"));
  const hot = useRef(new THREE.Color("#93c5fd"));
  useFrame(() => {
    if (!mat.current) return;
    const k = Math.max(0, 1 - (performance.now() - flashAt) / 600);
    mat.current.color.copy(idle.current).lerp(hot.current, k);
  });
  return (
    <RoundedBox args={[0.42, 0.14, 0.42]} radius={0.03} position={at} castShadow receiveShadow>
      <meshStandardMaterial ref={mat} color="#f4f4f5" roughness={0.8} />
    </RoundedBox>
  );
}

function Users({ inbox, flash }: { inbox: number[]; flash: Record<number, number> }) {
  return (
    <>
      {Array.from({ length: N }, (_, i) => {
        const p = userPos(i);
        const b = boxPos(i);
        const celeb = i === CELEB;
        return (
          <group key={i}>
            <mesh position={p} castShadow>
              <sphereGeometry args={[celeb ? 0.42 : i === ALEX || i === YOU ? 0.26 : 0.2, 24, 24]} />
              <meshStandardMaterial color={celeb ? "#1b1b1d" : i === YOU ? "#3b82f6" : i === ALEX ? "#52525b" : "#e4e4e7"} roughness={0.6} />
            </mesh>
            {celeb && (
              <mesh position={[p.x, p.y + 0.62, p.z]} rotation={[0, 0, Math.PI]}>
                <coneGeometry args={[0.14, 0.24, 5]} />
                <meshStandardMaterial color="#f59e0b" emissive="#f59e0b" emissiveIntensity={0.4} />
              </mesh>
            )}
            {/* this user's cached home timeline */}
            <TimelineBox at={b} flashAt={flash[i] ?? 0} />
            {Array.from({ length: Math.min(inbox[i], 4) }, (_, k) => (
              <mesh key={k} position={[b.x, b.y + 0.1 + k * 0.05, b.z]}>
                <boxGeometry args={[0.3, 0.035, 0.3]} />
                <meshStandardMaterial color="#1b1b1d" />
              </mesh>
            ))}
          </group>
        );
      })}
    </>
  );
}

function Rig() {
  const { camera, size } = useThree();
  useFrame(({ clock }) => {
    const narrow = size.width / size.height < 1.1;
    const a = Math.sin(clock.elapsedTime * 0.15) * 0.15;
    const d = narrow ? 15.5 : 9.5;
    camera.position.set(Math.sin(a) * d, narrow ? 7.5 : 5.6, Math.cos(a) * d);
    camera.lookAt(0, -0.2, 0);
  });
  return null;
}

const fmt = (n: number) => n.toLocaleString("en-US");

export default function FanOut({ onComplete }: MissionProps) {
  const [strategy, setStrategy] = useState<Strategy>("read");
  const [packets, setPackets] = useState<Packet[]>([]);
  const [inbox, setInbox] = useState<number[]>(() => Array(N).fill(0));
  const [flash, setFlash] = useState<Record<number, number>>({});
  const [last, setLast] = useState<{ what: string; writes?: number; reads?: number } | null>(null);
  const [meters, setMeters] = useState<{ writes?: number; reads?: number }>({});
  const [goals, setGoals] = useState({ readLoad: false, writeCeleb: false, hybrid: { celeb: false, load: false } });
  const pid = useRef(0);
  const arrivals = useRef<Record<number, () => void>>({});
  const completed = useRef(false);

  const send = (from: THREE.Vector3, to: THREE.Vector3, delay: number, dur: number, color: string, onArrive?: () => void) => {
    const id = ++pid.current;
    if (onArrive) arrivals.current[id] = onArrive;
    setPackets((ps) => [...ps, { id, from: from.clone(), to: to.clone(), start: performance.now() + delay, dur, color }]);
  };
  const arrived = (id: number) => {
    arrivals.current[id]?.();
    delete arrivals.current[id];
    setPackets((ps) => ps.filter((p) => p.id !== id));
  };
  const deliver = (i: number) => {
    setInbox((b) => b.map((v, j) => (j === i ? v + 1 : v)));
    setFlash((f) => ({ ...f, [i]: performance.now() }));
  };

  const post = (who: "alex" | "celeb") => {
    const author = who === "alex" ? ALEX : CELEB;
    const fans = who === "alex" ? ALEX_FANS : Array.from({ length: N }, (_, i) => i).filter((i) => i !== CELEB);
    const pushToFans = strategy === "write" || (strategy === "hybrid" && who === "alex");
    send(userPos(author), DB, 0, 500, "#1b1b1d", () => {
      if (pushToFans) fans.forEach((f, k) => send(DB, boxPos(f), k * 45, 650, "#3b82f6", () => deliver(f)));
    });
    const writes = pushToFans ? (who === "alex" ? ALEX_FOLLOWERS : CELEB_FOLLOWERS) : 1;
    setLast({ what: who === "alex" ? "Alex posted" : "The celebrity posted", writes });
    setMeters((m) => ({ ...m, writes }));
    if (who === "celeb" && strategy === "write") setGoals((g) => ({ ...g, writeCeleb: true }));
    if (who === "celeb" && strategy === "hybrid") setGoals((g) => ({ ...g, hybrid: { ...g.hybrid, celeb: true } }));
  };

  const load = () => {
    const you = userPos(YOU);
    if (strategy === "read") {
      // query every account you follow, then merge
      for (let k = 0; k < 6; k++) send(DB, you, k * 110, 600, "#a1a1aa");
      setLast({ what: "You opened your timeline", reads: FOLLOWS });
      setMeters((m) => ({ ...m, reads: FOLLOWS }));
      setGoals((g) => ({ ...g, readLoad: true }));
    } else {
      send(boxPos(YOU), you, 0, 450, "#3b82f6");
      if (strategy === "hybrid") send(DB, you, 120, 600, "#f59e0b");
      const reads = strategy === "write" ? 1 : 1 + CELEBS_FOLLOWED;
      setLast({ what: "You opened your timeline", reads });
      setMeters((m) => ({ ...m, reads }));
      if (strategy === "hybrid") setGoals((g) => ({ ...g, hybrid: { ...g.hybrid, load: true } }));
    }
  };

  const hybridDone = goals.hybrid.celeb && goals.hybrid.load;
  useEffect(() => {
    if (goals.readLoad && goals.writeCeleb && hybridDone && !completed.current) {
      completed.current = true;
      onComplete();
    }
  }, [goals, hybridDone, onComplete]);

  const reset = () => {
    setPackets([]);
    setInbox(Array(N).fill(0));
    setLast(null);
    setMeters({});
    arrivals.current = {};
  };

  const writesNow = last?.writes;
  const readsNow = last?.reads;
  const heavy = (writesNow ?? 0) > 1_000_000 || (readsNow ?? 0) > 50;

  const coach: { tone: Tone; text: React.ReactNode } = (() => {
    if (!last) return { tone: "info", text: <>Each user has a cached home timeline (the box next to them). Post something, or open your timeline (blue).</> };
    if (writesNow && writesNow >= CELEB_FOLLOWERS)
      return { tone: "fail", text: <>One celebrity post just became <b>{fmt(writesNow)} timeline writes</b>. That's the celebrity problem with fan-out on write.</> };
    if (readsNow && readsNow >= FOLLOWS)
      return { tone: "warn", text: <>Opening a timeline meant looking up <b>{FOLLOWS} accounts</b> and merging them. Cheap to post, expensive to read, and people read far more than they post.</> };
    if (strategy === "hybrid" && hybridDone)
      return { tone: "ok", text: <>Hybrid: normal posts are pushed to followers ahead of time; celebrity posts are fetched and merged when you read. Both stay cheap.</> };
    return { tone: "info", text: <>{last.what}: {writesNow !== undefined ? `${fmt(writesNow)} write${writesNow > 1 ? "s" : ""}` : `${fmt(readsNow!)} read${readsNow! > 1 ? "s" : ""}`}.</> };
  })();

  return (
    <div className="flex flex-col gap-4">
      <Goals
        items={[
          { label: "Open a timeline with fan-out on read", done: goals.readLoad },
          { label: "Celebrity posts with fan-out on write", done: goals.writeCeleb },
          { label: "Find the strategy where both stay cheap", done: hybridDone },
        ]}
      />

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {(Object.keys(STRATEGIES) as Strategy[]).map((s) => (
          <button
            key={s}
            onClick={() => {
              setStrategy(s);
              setMeters({});
              setLast(null);
            }}
            className={cn(
              "cursor-pointer rounded-lg border px-3 py-2 text-left transition-colors",
              strategy === s ? "border-foreground bg-foreground text-background" : "hover:bg-muted",
            )}
          >
            <div className="text-sm font-medium">{STRATEGIES[s].name}</div>
            <div className={cn("text-[11px]", strategy === s ? "opacity-70" : "text-muted-foreground")}>{STRATEGIES[s].sub}</div>
          </button>
        ))}
      </div>

      <div className="relative h-[340px] overflow-hidden rounded-lg border bg-dots sm:h-[400px]">
        <Canvas shadows dpr={[1, 2]} camera={{ fov: 32 }}>
          <hemisphereLight args={["#ffffff", "#e4e4e7", 1.9]} />
          <directionalLight position={[4, 8, 5]} intensity={1.6} castShadow shadow-mapSize={[1024, 1024]} />
          <Rig />
          {/* posts database */}
          <mesh position={[0, 0.3, 0]} castShadow>
            <cylinderGeometry args={[0.55, 0.55, 0.6, 32]} />
            <meshStandardMaterial color="#1b1b1d" roughness={0.6} />
          </mesh>
          <mesh position={[0, 0.62, 0]}>
            <cylinderGeometry args={[0.55, 0.55, 0.04, 32]} />
            <meshStandardMaterial color="#52525b" />
          </mesh>
          <Users inbox={inbox} flash={flash} />
          {packets.map((p) => (
            <Dot key={p.id} p={p} onDone={arrived} />
          ))}
          <ContactShadows position={[0, 0, 0]} opacity={0.2} scale={14} blur={2.4} far={2} />
        </Canvas>
        <div className="pointer-events-none absolute bottom-2 left-2 flex flex-wrap gap-3 rounded-md bg-white/85 px-2 py-1 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-[#52525b]" /> Alex</span>
          <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-[#1b1b1d]" /> celebrity</span>
          <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-data" /> you</span>
          <span className="flex items-center gap-1"><span className="size-2 rounded-sm border bg-muted" /> cached timeline</span>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
        {[
          { label: "Writes for the last post", value: meters.writes, bad: (meters.writes ?? 0) > 1_000_000 },
          { label: "Reads to open a timeline", value: meters.reads, bad: (meters.reads ?? 0) > 50 },
        ].map((m) => (
          <div key={m.label} className={cn("rounded-lg border px-3 py-2", m.bad && "border-fail/40 bg-fail/5")}>
            <div className="text-[11px] text-muted-foreground">{m.label}</div>
            <motion.div key={String(m.value)} initial={{ scale: 1.15 }} animate={{ scale: 1 }} className={cn("font-mono text-xl font-semibold tabular-nums", m.bad && "text-fail")}>
              {m.value === undefined ? "—" : fmt(m.value)}
            </motion.div>
          </div>
        ))}
        <div className="flex flex-wrap items-center gap-2 sm:flex-col sm:items-stretch">
          <Button size="sm" variant="outline" onClick={() => post("alex")}>
            <PenLine /> Alex posts
          </Button>
          <Button size="sm" variant="outline" onClick={() => post("celeb")}>
            <Star /> Celebrity posts
          </Button>
          <Button size="sm" onClick={load}>
            <Newspaper /> Open my timeline
          </Button>
        </div>
      </div>

      <Coach tone={coach.tone} k={`${strategy}-${last?.what}-${writesNow}-${readsNow}-${hybridDone}-${heavy}`}>
        {coach.text}
      </Coach>

      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <span>
          Counters use real-world scale: {FOLLOWS} follows each, Alex has {ALEX_FOLLOWERS} followers, the celebrity {fmt(CELEB_FOLLOWERS)}.
        </span>
        <Button variant="ghost" size="sm" onClick={reset}>
          <RotateCcw /> Reset
        </Button>
      </div>
    </div>
  );
}
