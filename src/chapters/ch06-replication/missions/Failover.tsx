import { useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Line, RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { RotateCcw, Send } from "lucide-react";
import type { MissionProps } from "@/components/chapter/types";
import { Coach, type Tone } from "@/components/chapter/Coach";
import { Goals } from "@/components/chapter/Goals";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TOTAL_WRITES, useFailoverSim, type NodeId, type Packet, type SimNode } from "./useFailoverSim";

const POS: Record<NodeId, [number, number, number]> = {
  C: [-4.4, 0, 0.3],
  L: [-1.0, 0, 0.3],
  A: [3.0, 0, -1.9],
  B: [2.4, 0, 2.2],
};

const COLORS = { write: "#2563eb", ack: "#16a34a", conflict: "#d97706" };

function PacketDot({ p }: { p: Packet }) {
  const ref = useRef<THREE.Mesh>(null);
  const from = useMemo(() => new THREE.Vector3(...POS[p.from]).setY(0.75), [p.from]);
  const to = useMemo(() => new THREE.Vector3(...POS[p.to]).setY(0.75), [p.to]);
  useFrame(() => {
    if (!ref.current) return;
    const t = Math.min(1, (performance.now() - p.start) / p.dur);
    ref.current.position.lerpVectors(from, to, t);
    ref.current.position.y += Math.sin(Math.PI * t) * 0.9;
  });
  return (
    <mesh ref={ref} position={from}>
      <sphereGeometry args={[0.13, 20, 20]} />
      <meshStandardMaterial color={COLORS[p.kind]} emissive={COLORS[p.kind]} emissiveIntensity={0.35} />
    </mesh>
  );
}

function Server({ node, clickable, onPick }: { node: SimNode; clickable: boolean; onPick?: () => void }) {
  const ref = useRef<THREE.Group>(null);
  const isLeader = node.role === "leader";
  const down = node.status === "down";
  const zombie = node.status === "zombie";

  useFrame((state, dt) => {
    if (!ref.current) return;
    const g = ref.current;
    const tilt = down ? 0.35 : 0;
    const sink = down ? -0.18 : 0;
    g.rotation.z = THREE.MathUtils.damp(g.rotation.z, tilt, 6, dt);
    g.position.y = THREE.MathUtils.damp(g.position.y, sink + (clickable ? Math.sin(state.clock.elapsedTime * 3) * 0.06 + 0.06 : 0), 8, dt);
  });

  const body = down ? "#a1a1aa" : isLeader ? "#0a0a0a" : "#ffffff";
  const isClient = node.role === "client";

  return (
    <group position={POS[node.id]}>
      <group ref={ref}>
        {isClient ? (
          <RoundedBox args={[0.9, 0.6, 0.12]} radius={0.04} position={[0, 0.55, 0]} castShadow>
            <meshStandardMaterial color="#e4e4e7" roughness={0.6} />
          </RoundedBox>
        ) : (
          <RoundedBox
            args={[1.3, 1.0, 1.3]}
            radius={0.08}
            smoothness={4}
            position={[0, 0.5, 0]}
            castShadow
            onClick={(e) => {
              if (!clickable) return;
              e.stopPropagation();
              onPick?.();
            }}
            onPointerOver={() => clickable && (document.body.style.cursor = "pointer")}
            onPointerOut={() => (document.body.style.cursor = "")}
          >
            <meshStandardMaterial color={body} roughness={0.5} />
          </RoundedBox>
        )}
        {!isClient && !isLeader && !down && (
          <lineSegments position={[0, 0.5, 0]}>
            <edgesGeometry args={[new THREE.BoxGeometry(1.3, 1.0, 1.3)]} />
            <lineBasicMaterial color="#a1a1aa" />
          </lineSegments>
        )}
        {/* status light */}
        {!isClient && (
          <mesh position={[0.45, 0.82, 0.66]}>
            <circleGeometry args={[0.06, 16]} />
            <meshBasicMaterial color={down ? "#dc2626" : zombie ? "#d97706" : "#22c55e"} />
          </mesh>
        )}
        {zombie && (
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
            <ringGeometry args={[0.95, 1.05, 48]} />
            <meshBasicMaterial color="#d97706" transparent opacity={0.8} />
          </mesh>
        )}
      </group>
    </group>
  );
}

const labelY = (id: NodeId) => (id === "C" ? 1.25 : 1.55);

/** Projects each node's label anchor to screen space every frame and moves the DOM labels. */
function Projector({ els }: { els: React.RefObject<Partial<Record<NodeId, HTMLDivElement | null>>> }) {
  const v = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ camera, size }) => {
    (Object.keys(POS) as NodeId[]).forEach((id) => {
      const el = els.current?.[id];
      if (!el) return;
      const p = POS[id];
      v.set(p[0], labelY(id), p[2]).project(camera);
      const x = ((v.x + 1) / 2) * size.width;
      const y = ((1 - v.y) / 2) * size.height;
      el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
    });
  });
  return null;
}

function Label({
  node,
  missing,
  onPick,
  clickable,
  elRef,
}: {
  node: SimNode;
  missing: string[];
  clickable: boolean;
  onPick?: () => void;
  elRef: (el: HTMLDivElement | null) => void;
}) {
  const slots = ["1", "2", "3"];
  const extras = node.log.filter((w) => w.startsWith("4"));
  const roleText =
    node.role === "client"
      ? "your app"
      : node.status === "down"
        ? "crashed"
        : node.status === "zombie"
          ? "thinks it's leader"
          : node.role === "leader"
            ? "leader"
            : node.sync
              ? "follower · sync"
              : "follower · async";
  return (
    <div ref={elRef} className="pointer-events-none absolute top-0 left-0 will-change-transform">
      <button
        type="button"
        onClick={onPick}
        disabled={!clickable}
        className={cn(
          "pointer-events-auto flex origin-center flex-col items-center gap-1 rounded-lg border bg-white/95 max-sm:scale-75 px-2 py-1.5 text-center whitespace-nowrap shadow-sm select-none",
          clickable ? "cursor-pointer border-foreground ring-4 ring-foreground/10" : "cursor-default",
        )}
      >
        <span className="text-[11px] font-semibold leading-none">{node.name}</span>
        <span
          className={cn(
            "text-[10px] leading-none",
            node.status === "down" ? "text-fail" : node.status === "zombie" ? "text-warn" : "text-muted-foreground",
          )}
        >
          {roleText}
        </span>
        {node.role !== "client" && (
          <span className="mt-0.5 flex gap-0.5">
            {slots.map((w) => {
              const has = node.log.includes(w);
              const miss = missing.includes(w);
              return (
                <span
                  key={w}
                  className={cn(
                    "grid size-4 place-items-center rounded-[3px] border font-mono text-[9px]",
                    has ? "border-foreground bg-foreground text-background" : "border-dashed text-muted-foreground",
                    miss && "border-fail bg-fail/10 text-fail border-solid",
                  )}
                >
                  {w}
                </span>
              );
            })}
            {extras.map((w) => (
              <span key={w} className="grid h-4 place-items-center rounded-[3px] border border-warn bg-warn px-0.5 font-mono text-[9px] text-white">
                {w === "4a" ? "4" : "4′"}
              </span>
            ))}
          </span>
        )}
      </button>
    </div>
  );
}

function Links({ nodes, leader }: { nodes: Record<NodeId, SimNode>; leader: NodeId }) {
  const lines: { a: NodeId; b: NodeId; dashed: boolean }[] = [];
  lines.push({ a: "C", b: leader, dashed: false });
  (["L", "A", "B"] as NodeId[])
    .filter((id) => id !== leader && nodes[id].status !== "down")
    .forEach((id) => lines.push({ a: leader, b: id, dashed: !nodes[id].sync }));
  if (nodes.L.status === "zombie") lines.push({ a: "C", b: "L", dashed: true });
  return (
    <>
      {lines.map(({ a, b, dashed }, i) => (
        <Line
          key={`${a}-${b}-${i}`}
          points={[new THREE.Vector3(...POS[a]).setY(0.05), new THREE.Vector3(...POS[b]).setY(0.05)]}
          color="#a1a1aa"
          lineWidth={1.5}
          dashed={dashed}
          dashSize={0.15}
          gapSize={0.12}
        />
      ))}
    </>
  );
}

function Rig() {
  const { camera, size } = useThree();
  useFrame(() => {
    const aspect = size.width / size.height;
    // fit the scene's width (client on the left to followers on the right)
    const fov = (32 * Math.PI) / 180;
    const z = Math.max(9.2, 5.6 / (Math.tan(fov / 2) * aspect));
    camera.position.set(0, z * 0.62, z);
    camera.lookAt(-0.3, 0.2, 0.4);
  });
  return null;
}

export default function Failover({ onComplete }: MissionProps) {
  const sim = useFailoverSim(onComplete);
  const { state, sendWrite, promote, undoPick, letBothLead, rewind, demote, reset } = sim;
  const { nodes, packets, phase, sent, acked, missing, leader } = state;
  const picking = phase === "crashed";
  const labelEls = useRef<Partial<Record<NodeId, HTMLDivElement | null>>>({});

  const coach: { tone: Tone; text: React.ReactNode } = (() => {
    switch (phase) {
      case "writing":
        if (sent === 0) return { tone: "info", text: <>Send {TOTAL_WRITES} writes. Watch which follower keeps up.</> };
        if (acked.length < sent)
          return { tone: "info", text: <>The leader confirms only after <b>Node 2 (sync)</b> has the write. <b>Node 3 (async)</b> is on its own schedule.</> };
        return { tone: "info", text: <>{acked.length} of {TOTAL_WRITES} confirmed to your app. Keep going.</> };
      case "crashed":
        return { tone: "fail", text: <><b>The leader just crashed.</b> All {TOTAL_WRITES} writes were confirmed. Click a follower to promote it.</> };
      case "wrongPick":
        return {
          tone: "fail",
          text: (
            <>
              Node 3 never got write {missing.map((m) => `#${m}`).join(" and ")}. Your app was told{" "}
              {missing.length > 1 ? "they were" : "it was"} saved. Promote Node 3 and {missing.length > 1 ? "they're" : "it's"}{" "}
              <b>gone</b>. Async followers lag behind.
            </>
          ),
        };
      case "promoted":
        return { tone: "ok", text: <>Node 2 had every confirmed write, because it was <b>synchronous</b>. Node 3 is catching up from it…</> };
      case "zombie":
        return { tone: "warn", text: <><b>Node 1 rebooted</b> and still thinks it's the leader. Two leaders is <b>split brain</b>. What do you do?</> };
      case "splitBrain":
        return {
          tone: "fail",
          text: <>Both leaders accepted a different write #4. The copies have <b>diverged</b>, and one of them will be thrown away.</>,
        };
      case "done":
        return {
          tone: "ok",
          text: <>One leader again. Real systems enforce this with <b>epoch numbers / fencing</b>, so a stale leader's writes get rejected.</>,
        };
    }
  })();

  return (
    <div className="flex flex-col gap-4">
      <Goals
        items={[
          { label: `Send ${TOTAL_WRITES} writes`, done: acked.length >= TOTAL_WRITES },
          { label: "Promote the right follower", done: ["promoted", "zombie", "splitBrain", "done"].includes(phase) },
          { label: "Deal with the old leader", done: phase === "done" },
        ]}
      />

      <div className="relative h-[340px] overflow-hidden rounded-lg border bg-dots sm:h-[420px]">
        <Canvas shadows dpr={[1, 2]} camera={{ fov: 32, position: [0, 6, 9] }}>
          <ambientLight intensity={1.5} />
          <directionalLight position={[4, 8, 5]} intensity={1.5} castShadow shadow-mapSize={[1024, 1024]} />
          <Rig />
          <Links nodes={nodes} leader={leader} />
          {(Object.values(nodes) as SimNode[]).map((n) => (
            <Server
              key={n.id}
              node={n}
              clickable={picking && (n.id === "A" || n.id === "B")}
              onPick={() => (n.id === "A" || n.id === "B") && promote(n.id)}
            />
          ))}
          <Projector els={labelEls} />
          {packets.map((p) => (
            <PacketDot key={p.id} p={p} />
          ))}
          <ContactShadows position={[0, 0, 0]} opacity={0.2} scale={16} blur={2.4} far={3} />
        </Canvas>
        {(Object.values(nodes) as SimNode[]).map((n) => (
          <Label
            key={n.id}
            node={n}
            elRef={(el) => {
              labelEls.current[n.id] = el;
            }}
            missing={phase === "wrongPick" && n.id === "B" ? missing : []}
            clickable={picking && (n.id === "A" || n.id === "B")}
            onPick={() => (n.id === "A" || n.id === "B") && promote(n.id)}
          />
        ))}
        <div className="pointer-events-none absolute bottom-2 left-2 flex gap-3 rounded-md bg-white/80 px-2 py-1 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-data" /> write</span>
          <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-ok" /> ack</span>
          <span className="flex items-center gap-1"><span className="h-px w-3 border-t border-dashed border-muted-foreground" /> async link</span>
        </div>
      </div>

      <Coach tone={coach.tone} k={`${phase}-${sent}-${acked.length}`}>
        {coach.text}
      </Coach>

      <div className="flex flex-wrap items-center gap-2">
        {phase === "writing" && (
          <Button onClick={sendWrite} disabled={sent >= TOTAL_WRITES}>
            <Send /> Send write #{Math.min(sent + 1, TOTAL_WRITES)}
          </Button>
        )}
        {phase === "crashed" && (
          <>
            <Button variant="outline" onClick={() => promote("A")}>Promote Node 2</Button>
            <Button variant="outline" onClick={() => promote("B")}>Promote Node 3</Button>
          </>
        )}
        {phase === "wrongPick" && <Button onClick={undoPick}>Undo, pick again</Button>}
        {phase === "zombie" && (
          <>
            <Button variant="outline" onClick={letBothLead}>Let both take writes</Button>
            <Button onClick={demote}>Demote Node 1 to follower</Button>
          </>
        )}
        {phase === "splitBrain" && <Button onClick={rewind}>Rewind</Button>}
        <Button variant="ghost" size="sm" className="ml-auto" onClick={reset}>
          <RotateCcw /> Restart
        </Button>
      </div>
    </div>
  );
}
