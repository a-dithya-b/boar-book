import { useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, RoundedBox } from "@react-three/drei";
import { motion } from "motion/react";
import * as THREE from "three";
import { ArrowLeft, ArrowRight, Cloud, RotateCcw, Server } from "lucide-react";
import type { MissionProps } from "@/components/chapter/types";
import { Coach, type Tone } from "@/components/chapter/Coach";
import { Goals } from "@/components/chapter/Goals";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Side = "cloud" | "self";
interface Factor {
  text: string;
  side: Side;
  why: string;
}
interface Scenario {
  who: string;
  blurb: string;
  factors: Factor[];
}

const SCENARIOS: Scenario[] = [
  {
    who: "Two founders, launching next month",
    blurb: "A small product, no idea yet how many people will show up.",
    factors: [
      { text: "Nobody on the team wants to run servers", side: "cloud", why: "Managed services take the operations work off your plate." },
      { text: "Traffic might spike 10× after a launch post", side: "cloud", why: "Elastic: rent more capacity in minutes, hand it back later." },
      { text: "Worried about getting locked in to one provider", side: "self", why: "Proprietary cloud APIs can be hard to move away from." },
      { text: "It has to ship this month", side: "cloud", why: "No hardware to order, rack or configure." },
    ],
  },
  {
    who: "A large company with a huge, steady workload",
    blurb: "Years of history, busy around the clock, very predictable.",
    factors: [
      { text: "Load is enormous and flat, 24/7", side: "self", why: "Paying for elasticity you never use gets expensive at this scale." },
      { text: "A strong infrastructure team already exists", side: "self", why: "The operations skills are already paid for." },
      { text: "Wants to serve users in a new continent next quarter", side: "cloud", why: "Cloud regions already exist; building a data centre takes years." },
      { text: "One workload needs specially tuned hardware", side: "self", why: "Owning the machines means control down to the disks." },
    ],
  },
];

const BEAM = 4.2;
const DROP = 1.1; // how far the pan hangs below the beam

/** A thin string between two points. */
function String3({ to }: { to: [number, number, number] }) {
  const { pos, quat, len } = useMemo(() => {
    const b = new THREE.Vector3(...to);
    return {
      pos: b.clone().multiplyScalar(0.5),
      quat: new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().normalize()),
      len: b.length(),
    };
  }, [to]);
  return (
    <mesh position={pos} quaternion={quat}>
      <cylinderGeometry args={[0.01, 0.01, len, 6]} />
      <meshStandardMaterial color="#a3a3ab" />
    </mesh>
  );
}
const POST_H = 2.5;

/** A weight that drops onto its pan with a small bounce. */
function Weight({ slot, dark }: { slot: number; dark: boolean }) {
  const ref = useRef<THREE.Mesh>(null);
  const v = useRef(0);
  const rest = 0.17 + Math.floor(slot / 2) * 0.3;
  const x = (slot % 2 === 0 ? -1 : 1) * 0.17;
  useFrame((_, raw) => {
    const m = ref.current;
    if (!m) return;
    const dt = Math.min(raw, 1 / 30);
    if (m.position.y > rest || Math.abs(v.current) > 0.05) {
      v.current -= 22 * dt;
      m.position.y += v.current * dt;
      if (m.position.y < rest) {
        m.position.y = rest;
        v.current = -v.current * 0.3;
      }
    }
  });
  return (
    <RoundedBox ref={ref} args={[0.3, 0.28, 0.3]} radius={0.04} position={[x, rest + 2.4, 0]} castShadow>
      <meshStandardMaterial color={dark ? "#1b1b1d" : "#e4e4e7"} roughness={0.7} />
    </RoundedBox>
  );
}

function Balance({ left, right, verdict }: { left: number; right: number; verdict: boolean }) {
  const beam = useRef<THREE.Group>(null);
  const pans = useRef<(THREE.Group | null)[]>([]);
  useFrame(({ clock }, dt) => {
    if (!beam.current) return;
    // heavier side goes down; a gentle sway while weighing
    const tilt = THREE.MathUtils.clamp((left - right) * 0.075, -0.28, 0.28);
    const sway = verdict ? 0 : Math.sin(clock.elapsedTime * 1.4) * 0.015;
    beam.current.rotation.z = THREE.MathUtils.damp(beam.current.rotation.z, tilt + sway, 3.5, dt);
    pans.current.forEach((p) => p && (p.rotation.z = -beam.current!.rotation.z));
  });
  return (
    <group position={[0, -1.3, 0]}>
      <mesh position={[0, 0.06, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[0.7, 0.8, 0.12, 48]} />
        <meshStandardMaterial color="#f2f2f4" roughness={0.85} />
      </mesh>
      <mesh position={[0, POST_H / 2 + 0.1, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.08, POST_H, 16]} />
        <meshStandardMaterial color="#1b1b1d" />
      </mesh>
      <group ref={beam} position={[0, POST_H + 0.1, 0]}>
        <RoundedBox args={[BEAM, 0.1, 0.12]} radius={0.04} castShadow>
          <meshStandardMaterial color="#1b1b1d" />
        </RoundedBox>
        <mesh position={[0, 0.1, 0]}>
          <coneGeometry args={[0.08, 0.18, 4]} />
          <meshStandardMaterial color="#1b1b1d" />
        </mesh>
        {[-1, 1].map((sx, i) => (
          <group key={i} position={[(sx * BEAM) / 2 - sx * 0.1, 0, 0]} ref={(g) => void (pans.current[i] = g)}>
            {[-0.44, 0.44].map((dx, j) => (
              <String3 key={j} to={[dx, -DROP, 0]} />
            ))}
            <group position={[0, -DROP, 0]}>
              <mesh receiveShadow castShadow>
                <cylinderGeometry args={[0.55, 0.42, 0.08, 40]} />
                <meshStandardMaterial color="#f2f2f4" roughness={0.85} />
              </mesh>
              {Array.from({ length: i === 0 ? left : right }, (_, k) => (
                <Weight key={k} slot={k} dark={i === 0} />
              ))}
            </group>
          </group>
        ))}
      </group>
    </group>
  );
}

function Rig() {
  const { camera, size } = useThree();
  useFrame(() => {
    const narrow = size.width / size.height < 1.1;
    camera.position.set(0, 1.2, narrow ? 10.5 : 7.6);
    camera.lookAt(0, 0.1, 0);
  });
  return null;
}

export default function WeighIt({ onComplete }: MissionProps) {
  const [sc, setSc] = useState(0);
  const [k, setK] = useState(0); // factor index
  const [placed, setPlaced] = useState<Record<Side, number[]>>({ cloud: [], self: [] });
  const [last, setLast] = useState<{ ok: boolean; why: string } | null>(null);
  const [shake, setShake] = useState(0);
  const [doneScenarios, setDoneScenarios] = useState<boolean[]>([false, false]);

  const S = SCENARIOS[sc];
  const finished = k >= S.factors.length;
  const left = placed.cloud.length;
  const right = placed.self.length;
  const verdict: Side | null = finished ? (left > right ? "cloud" : "self") : null;

  const place = (side: Side) => {
    if (finished) return;
    const f = S.factors[k];
    if (f.side !== side) {
      setLast({ ok: false, why: f.why });
      setShake((n) => n + 1);
      return;
    }
    setLast({ ok: true, why: f.why });
    setPlaced((p) => ({ ...p, [side]: [...p[side], k] }));
    const next = k + 1;
    setK(next);
    if (next >= S.factors.length) {
      const d = doneScenarios.map((v, j) => (j === sc ? true : v));
      setDoneScenarios(d);
      if (d.every(Boolean)) setTimeout(onComplete, 900);
    }
  };

  const openScenario = (i: number) => {
    setSc(i);
    setK(0);
    setPlaced({ cloud: [], self: [] });
    setLast(null);
  };

  const coach: { tone: Tone; text: React.ReactNode } = verdict
    ? {
        tone: "ok",
        text: (
          <>
            The scale tips to <b>{verdict === "cloud" ? "the cloud" : "self-hosting"}</b> for this company. Neither is “right”: change the
            company and the same factors tip it the other way.
          </>
        ),
      }
    : last
      ? { tone: last.ok ? "ok" : "fail", text: <>{last.ok ? "Yes. " : "That weighs on the other side. "}{last.why}</> }
      : { tone: "info", text: <>Put each factor on the side it argues for. Watch which way the scale tips.</> };

  return (
    <div className="flex flex-col gap-4">
      <Goals items={SCENARIOS.map((s, i) => ({ label: s.who, done: doneScenarios[i] }))} />

      <div className="flex gap-1.5">
        {SCENARIOS.map((_, i) => (
          <button
            key={i}
            onClick={() => openScenario(i)}
            className={cn(
              "cursor-pointer rounded-md border px-2.5 py-1 text-xs transition-colors",
              i === sc ? "border-foreground bg-foreground text-background" : "hover:bg-muted",
            )}
          >
            Company {i + 1}
          </button>
        ))}
      </div>

      <div className="relative h-[320px] overflow-hidden rounded-lg border bg-dots sm:h-[380px]">
        <Canvas shadows dpr={[1, 2]} camera={{ fov: 32 }}>
          <hemisphereLight args={["#ffffff", "#e4e4e7", 1.9]} />
          <directionalLight position={[3, 6, 5]} intensity={1.8} castShadow shadow-mapSize={[1024, 1024]} />
          <Rig />
          <Balance left={left} right={right} verdict={!!verdict} />
          <ContactShadows position={[0, -1.3, 0]} opacity={0.25} scale={10} blur={2.4} far={3} />
        </Canvas>
        {/* pan labels */}
        {(["cloud", "self"] as Side[]).map((side) => (
          <div
            key={side}
            className={cn(
              "pointer-events-none absolute top-3 flex max-w-[42%] flex-col gap-1",
              side === "cloud" ? "left-3 items-start" : "right-3 items-end text-right",
            )}
          >
            <div
              className={cn(
                "flex items-center gap-1.5 rounded-full border bg-background/90 px-2.5 py-1 text-xs font-medium transition-colors",
                verdict === side && "border-ok bg-ok text-white",
              )}
            >
              {side === "cloud" ? <Cloud className="size-3.5" /> : <Server className="size-3.5" />}
              {side === "cloud" ? "Cloud" : "Self-host"}
            </div>
            {placed[side].map((idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="hidden rounded bg-background/80 px-1.5 py-0.5 text-[10px] text-muted-foreground sm:block"
              >
                {S.factors[idx].text}
              </motion.div>
            ))}
          </div>
        ))}
      </div>

      {/* the company + the current factor */}
      <div className="grid gap-3 md:grid-cols-[1fr_1.4fr]">
        <div className="rounded-lg border border-dashed px-4 py-3">
          <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">The company</div>
          <div className="mt-1 font-medium">{S.who}</div>
          <div className="text-sm text-muted-foreground">{S.blurb}</div>
        </div>
        {!finished ? (
          <motion.div
            key={`${sc}-${k}-${shake}`}
            initial={{ opacity: 0, y: 8 }}
            animate={shake && last && !last.ok ? { opacity: 1, y: 0, x: [0, -6, 6, -3, 0] } : { opacity: 1, y: 0 }}
            className="flex flex-col gap-2 rounded-lg border bg-card px-4 py-3 shadow-xs sm:flex-row sm:items-center"
          >
            <div className="flex-1">
              <div className="font-mono text-[10px] text-muted-foreground">
                factor {k + 1}/{S.factors.length}
              </div>
              <div className="text-sm font-medium">{S.factors[k].text}</div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => place("cloud")}>
                <ArrowLeft /> Cloud
              </Button>
              <Button variant="outline" size="sm" onClick={() => place("self")}>
                Self-host <ArrowRight />
              </Button>
            </div>
          </motion.div>
        ) : (
          <div className="flex items-center justify-between gap-3 rounded-lg border bg-card px-4 py-3">
            <div className="text-sm">
              Verdict: <b>{verdict === "cloud" ? "Cloud" : "Self-host"}</b>
            </div>
            {sc < SCENARIOS.length - 1 ? (
              <Button size="sm" onClick={() => openScenario(sc + 1)}>
                Next company <ArrowRight />
              </Button>
            ) : (
              <Button variant="ghost" size="sm" onClick={() => openScenario(sc)}>
                <RotateCcw /> Weigh again
              </Button>
            )}
          </div>
        )}
      </div>

      <Coach tone={coach.tone} k={`${sc}-${k}-${last?.ok}-${shake}`}>
        {coach.text}
      </Coach>
    </div>
  );
}
