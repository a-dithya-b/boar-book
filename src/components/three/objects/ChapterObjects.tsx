/**
 * One memorable object per chapter: a mnemonic hook for remembering the chapter.
 * Each fits roughly in a 1×1×1 box with its base at y = 0, built from primitives
 * in a matte "clay" style. `active` makes it come alive (hover / in focus).
 */
import { useMemo, useRef, type ReactNode } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";

export const CLAY = "#f2f2f4";
export const INK = "#1b1b1d";
export const MID = "#a3a3ab";
export const BLUE = "#3b82f6";

const damp = THREE.MathUtils.damp;

type P = { active: boolean };

function Clay({ color = CLAY }: { color?: string }) {
  return <meshStandardMaterial color={color} roughness={0.82} metalness={0} />;
}

/** A cylinder stretched between two points (bonds, strings, legs). */
function Rod({ a, b, r = 0.025, color = INK }: { a: [number, number, number]; b: [number, number, number]; r?: number; color?: string }) {
  const { pos, quat, len } = useMemo(() => {
    const va = new THREE.Vector3(...a);
    const vb = new THREE.Vector3(...b);
    const dir = vb.clone().sub(va);
    return {
      pos: va.clone().add(vb).multiplyScalar(0.5),
      quat: new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize()),
      len: dir.length(),
    };
  }, [a, b]);
  return (
    <mesh position={pos} quaternion={quat} castShadow>
      <cylinderGeometry args={[r, r, len, 10]} />
      <Clay color={color} />
    </mesh>
  );
}

/** 1 · Trade-offs: a balance that keeps tipping. */
function Balance({ active }: P) {
  const beam = useRef<THREE.Group>(null);
  const pans = useRef<THREE.Group[]>([]);
  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime;
    const target = active ? Math.sin(t * 2.2) * 0.32 : Math.sin(t * 0.8) * 0.06;
    if (!beam.current) return;
    beam.current.rotation.z = damp(beam.current.rotation.z, target, 6, dt);
    pans.current.forEach((p) => p && (p.rotation.z = -beam.current!.rotation.z));
  });
  return (
    <group>
      <mesh position={[0, 0.03, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.3, 0.34, 0.06, 32]} />
        <Clay />
      </mesh>
      <Rod a={[0, 0.06, 0]} b={[0, 0.82, 0]} r={0.03} />
      <group ref={beam} position={[0, 0.82, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.98, 0.04, 0.05]} />
          <Clay color={INK} />
        </mesh>
        {[-0.46, 0.46].map((x, i) => (
          <group key={i} position={[x, 0, 0]} ref={(g) => void (pans.current[i] = g!)}>
            <Rod a={[0, 0, 0]} b={[0, -0.38, 0]} r={0.008} color={MID} />
            <mesh position={[0, -0.4, 0]} castShadow>
              <cylinderGeometry args={[0.17, 0.12, 0.05, 28]} />
              <Clay />
            </mesh>
            <mesh position={[0, -0.33, 0]} castShadow>
              {i === 0 ? <boxGeometry args={[0.1, 0.1, 0.1]} /> : <sphereGeometry args={[0.07, 16, 16]} />}
              <Clay color={i === 0 ? INK : MID} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}

/** 2 · Nonfunctional requirements: a latency gauge whose needle spikes to the tail. */
function Gauge({ active }: P) {
  const needle = useRef<THREE.Group>(null);
  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime;
    const target = active ? -1.2 + (Math.sin(t * 3) * 0.5 + 0.5) * 2.2 * (Math.sin(t * 7) > 0.6 ? 1 : 0.55) : 0.6 + Math.sin(t * 1.3) * 0.08;
    if (needle.current) needle.current.rotation.z = damp(needle.current.rotation.z, -target, 8, dt);
  });
  const ticks = Array.from({ length: 9 }, (_, i) => -Math.PI / 2 + (i / 8) * Math.PI);
  return (
    <group position={[0, 0.5, 0]}>
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.46, 0.46, 0.1, 48, 1, false, -Math.PI / 2, Math.PI]} />
        <Clay />
      </mesh>
      {ticks.map((a, i) => (
        <mesh key={i} position={[Math.sin(a) * 0.38, Math.cos(a) * 0.38, 0.055]} rotation={[0, 0, -a]}>
          <boxGeometry args={[0.02, i > 6 ? 0.1 : 0.06, 0.01]} />
          <Clay color={i > 6 ? "#dc2626" : INK} />
        </mesh>
      ))}
      <group ref={needle} position={[0, 0, 0.07]}>
        <mesh position={[0, 0.17, 0]} castShadow>
          <boxGeometry args={[0.025, 0.34, 0.02]} />
          <Clay color={INK} />
        </mesh>
      </group>
      <mesh position={[0, 0, 0.07]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 0.04, 20]} />
        <Clay color={INK} />
      </mesh>
      <mesh position={[0, -0.47, 0]} castShadow>
        <boxGeometry args={[0.6, 0.06, 0.24]} />
        <Clay />
      </mesh>
    </group>
  );
}

/** 3 · Data models: a molecule of connected things (graph model). */
function Molecule({ active }: P) {
  const g = useRef<THREE.Group>(null);
  const atoms: [number, number, number][] = [
    [0, 0, 0],
    [0.3, 0.18, 0.05],
    [-0.28, 0.2, -0.1],
    [0.05, -0.3, 0.18],
    [-0.12, 0.05, 0.32],
    [0.22, -0.12, -0.28],
  ];
  const bonds: [number, number][] = [[0, 1], [0, 2], [0, 3], [0, 4], [1, 5], [3, 5], [2, 4]];
  useFrame((_, dt) => {
    if (!g.current) return;
    g.current.rotation.y += dt * (active ? 1.6 : 0.3);
    g.current.rotation.x = damp(g.current.rotation.x, active ? 0.4 : 0.15, 4, dt);
    const s = damp(g.current.scale.x, active ? 1.12 : 1, 6, dt);
    g.current.scale.setScalar(s);
  });
  return (
    <group position={[0, 0.5, 0]}>
      <group ref={g}>
        {bonds.map(([a, b], i) => (
          <Rod key={i} a={atoms[a]} b={atoms[b]} r={0.02} color={MID} />
        ))}
        {atoms.map((p, i) => (
          <mesh key={i} position={p} castShadow>
            <sphereGeometry args={[i === 0 ? 0.12 : 0.085, 24, 24]} />
            <Clay color={i === 0 ? INK : CLAY} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

/** 4 · Storage: stacked layers that compact together (LSM-tree). */
function Layers({ active }: P) {
  const refs = useRef<THREE.Mesh[]>([]);
  const sizes = [0.9, 0.74, 0.58, 0.42];
  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime;
    const squeeze = active ? (Math.sin(t * 2.5) * 0.5 + 0.5) : 0.15 + Math.sin(t) * 0.05;
    refs.current.forEach((m, i) => {
      if (!m) return;
      const gap = 0.14 * (1 - squeeze) + 0.11;
      m.position.y = damp(m.position.y, 0.06 + i * gap, 8, dt);
    });
  });
  return (
    <group>
      {sizes.map((s, i) => (
        <RoundedBox key={i} args={[s, 0.1, s * 0.75]} radius={0.025} ref={(m: THREE.Mesh) => void (refs.current[i] = m)} position={[0, 0.06 + i * 0.2, 0]} castShadow receiveShadow>
          <Clay color={i % 2 ? CLAY : INK} />
        </RoundedBox>
      ))}
    </group>
  );
}

/** 5 · Encoding: an envelope that opens to show a message (data packed for the trip). */
function Envelope({ active }: P) {
  const flap = useRef<THREE.Group>(null);
  const letter = useRef<THREE.Group>(null);
  const tri = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-0.4, 0);
    s.lineTo(0.4, 0);
    s.lineTo(0, -0.3);
    s.closePath();
    return new THREE.ExtrudeGeometry(s, { depth: 0.02, bevelEnabled: false });
  }, []);
  useFrame(({ clock }, dt) => {
    const open = active ? 1 : 0.08 + Math.sin(clock.elapsedTime) * 0.04;
    if (flap.current) flap.current.rotation.x = damp(flap.current.rotation.x, -open * 2.6, 6, dt);
    if (letter.current) letter.current.position.y = damp(letter.current.position.y, active ? 0.68 : 0.36, 5, dt);
  });
  return (
    <group rotation={[-0.12, 0, 0]}>
      <group ref={letter} position={[0, 0.36, -0.01]}>
        <mesh castShadow>
          <boxGeometry args={[0.66, 0.42, 0.01]} />
          <Clay color="#ffffff" />
        </mesh>
        {[0.1, 0.02, -0.06].map((y, i) => (
          <mesh key={i} position={[-0.05 + i * 0.03, y, 0.008]}>
            <boxGeometry args={[0.42 - i * 0.08, 0.025, 0.005]} />
            <Clay color={INK} />
          </mesh>
        ))}
      </group>
      <mesh position={[0, 0.27, 0.02]} castShadow receiveShadow>
        <boxGeometry args={[0.8, 0.52, 0.04]} />
        <Clay />
      </mesh>
      <group ref={flap} position={[0, 0.53, 0.04]}>
        <mesh geometry={tri} castShadow>
          <Clay color={INK} />
        </mesh>
      </group>
    </group>
  );
}

/** 6 · Replication: one leader, two identical copies; a write hops across. */
function Copies({ active }: P) {
  const cubes = useRef<THREE.Mesh[]>([]);
  const dot = useRef<THREE.Mesh>(null);
  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime * (active ? 1.6 : 0.6);
    cubes.current.forEach((c, i) => {
      if (!c) return;
      const bob = Math.max(0, Math.sin(t * 3 - i * 0.9)) * (active ? 0.1 : 0.03);
      c.position.y = damp(c.position.y, 0.16 + bob, 10, dt);
    });
    if (dot.current) {
      const ph = (t % 1.6) / 1.6;
      const side = Math.floor(t / 1.6) % 2 ? 1 : -1;
      dot.current.position.set(side * ph * 0.36, 0.45 + Math.sin(ph * Math.PI) * 0.18, 0);
      dot.current.visible = active;
    }
  });
  return (
    <group>
      <mesh position={[0, 0.02, 0]} receiveShadow>
        <boxGeometry args={[1.0, 0.04, 0.42]} />
        <Clay />
      </mesh>
      {[-0.36, 0, 0.36].map((x, i) => (
        <RoundedBox key={i} args={[0.28, 0.28, 0.28]} radius={0.04} position={[x, 0.16, 0]} ref={(m: THREE.Mesh) => void (cubes.current[i] = m)} castShadow>
          <Clay color={i === 1 ? INK : CLAY} />
        </RoundedBox>
      ))}
      <mesh ref={dot}>
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshStandardMaterial color={BLUE} emissive={BLUE} emissiveIntensity={0.6} />
      </mesh>
    </group>
  );
}

/** 7 · Sharding: a pizza whose slices pull apart. */
function Pizza({ active }: P) {
  const slices = useRef<THREE.Group[]>([]);
  const n = 6;
  useFrame(({ clock }, dt) => {
    const spread = active ? 0.16 + Math.sin(clock.elapsedTime * 3) * 0.04 : 0.03;
    slices.current.forEach((s, i) => {
      if (!s) return;
      const a = ((i + 0.5) / n) * Math.PI * 2;
      s.position.x = damp(s.position.x, Math.sin(a) * spread, 7, dt);
      s.position.z = damp(s.position.z, Math.cos(a) * spread, 7, dt);
    });
  });
  return (
    <group position={[0, 0.08, 0]} rotation={[0.35, 0, 0]}>
      {Array.from({ length: n }, (_, i) => (
        <group key={i} ref={(g) => void (slices.current[i] = g!)}>
          <mesh castShadow receiveShadow>
            <cylinderGeometry args={[0.46, 0.46, 0.07, 24, 1, false, (i / n) * Math.PI * 2, (Math.PI * 2) / n - 0.02]} />
            <Clay color={i % 2 ? CLAY : "#e4e4e7"} />
          </mesh>
          {[0.18, 0.32].map((r, j) => {
            const a = ((i + 0.3 + j * 0.4) / n) * Math.PI * 2;
            return (
              <mesh key={j} position={[Math.sin(a) * r, 0.045, Math.cos(a) * r]}>
                <cylinderGeometry args={[0.04, 0.04, 0.02, 14]} />
                <Clay color={INK} />
              </mesh>
            );
          })}
        </group>
      ))}
    </group>
  );
}

/** 8 · Transactions: a padlock, all or nothing. */
function Padlock({ active }: P) {
  const shackle = useRef<THREE.Group>(null);
  useFrame(({ clock }, dt) => {
    if (!shackle.current) return;
    const open = active ? Math.max(0, Math.sin(clock.elapsedTime * 3)) : 0;
    shackle.current.position.y = damp(shackle.current.position.y, 0.5 + open * 0.14, 10, dt);
    shackle.current.rotation.y = damp(shackle.current.rotation.y, open * 0.9, 10, dt);
  });
  return (
    <group>
      <group ref={shackle} position={[0, 0.5, 0]}>
        <group position={[0.13, 0, 0]}>
          <mesh position={[-0.13, 0.08, 0]} castShadow>
            <torusGeometry args={[0.13, 0.04, 14, 32, Math.PI]} />
            <Clay color={MID} />
          </mesh>
          <Rod a={[-0.26, 0.08, 0]} b={[-0.26, -0.08, 0]} r={0.04} color={MID} />
          <Rod a={[0, 0.08, 0]} b={[0, -0.08, 0]} r={0.04} color={MID} />
        </group>
      </group>
      <RoundedBox args={[0.5, 0.44, 0.22]} radius={0.06} position={[0, 0.24, 0]} castShadow receiveShadow>
        <Clay color={INK} />
      </RoundedBox>
      <mesh position={[0, 0.25, 0.115]}>
        <cylinderGeometry args={[0.04, 0.04, 0.01, 16]} />
        <Clay color={CLAY} />
      </mesh>
    </group>
  );
}

/** 9 · Trouble with distributed systems: a clock you can't trust. */
function Clock({ active }: P) {
  const hour = useRef<THREE.Group>(null);
  const minute = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime;
    if (minute.current) minute.current.rotation.z -= dt * (active ? 9 * Math.sign(Math.sin(t * 1.5)) : 0.6);
    if (hour.current) hour.current.rotation.z -= dt * (active ? -2.5 : 0.05);
    if (body.current) body.current.rotation.z = damp(body.current.rotation.z, active ? Math.sin(t * 18) * 0.05 : 0.06, 10, dt);
  });
  return (
    <group ref={body} position={[0, 0.48, 0]}>
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.4, 0.4, 0.12, 48]} />
        <Clay />
      </mesh>
      <mesh position={[0, 0, 0.06]}>
        <torusGeometry args={[0.4, 0.035, 12, 48]} />
        <Clay color={INK} />
      </mesh>
      {[-0.22, 0.22].map((x, i) => (
        <mesh key={i} position={[x, 0.42, 0]} castShadow>
          <sphereGeometry args={[0.1, 20, 20, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <Clay color={INK} />
        </mesh>
      ))}
      {[-0.25, 0.25].map((x, i) => (
        <Rod key={i} a={[x * 0.9, -0.3, 0]} b={[x * 1.3, -0.48, 0]} r={0.025} />
      ))}
      <group ref={minute} position={[0, 0, 0.075]}>
        <mesh position={[0, 0.14, 0]}>
          <boxGeometry args={[0.025, 0.28, 0.015]} />
          <Clay color={INK} />
        </mesh>
      </group>
      <group ref={hour} position={[0, 0, 0.085]} rotation={[0, 0, -1]}>
        <mesh position={[0, 0.09, 0]}>
          <boxGeometry args={[0.035, 0.18, 0.015]} />
          <Clay color="#dc2626" />
        </mesh>
      </group>
    </group>
  );
}

/** 10 · Consensus: a ballot box everyone votes into. */
function BallotBox({ active }: P) {
  const card = useRef<THREE.Group>(null);
  useFrame(({ clock }, dt) => {
    if (!card.current) return;
    if (active) {
      const ph = (clock.elapsedTime * 1.2) % 1;
      card.current.position.y = 0.9 - ph * 0.55;
    } else {
      card.current.position.y = damp(card.current.position.y, 0.8 + Math.sin(clock.elapsedTime * 1.5) * 0.03, 5, dt);
    }
  });
  return (
    <group>
      <RoundedBox args={[0.62, 0.48, 0.46]} radius={0.04} position={[0, 0.24, 0]} castShadow receiveShadow>
        <Clay />
      </RoundedBox>
      <mesh position={[0, 0.485, 0]}>
        <boxGeometry args={[0.3, 0.01, 0.05]} />
        <Clay color={INK} />
      </mesh>
      <mesh position={[0, 0.24, 0.232]}>
        <boxGeometry args={[0.2, 0.2, 0.005]} />
        <Clay color={INK} />
      </mesh>
      <mesh position={[0, 0.24, 0.236]}>
        <boxGeometry args={[0.08, 0.025, 0.005]} />
        <Clay color={CLAY} />
      </mesh>
      <group ref={card} position={[0, 0.8, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.26, 0.34, 0.012]} />
          <Clay color="#ffffff" />
        </mesh>
        <mesh position={[0, 0.03, 0.008]} rotation={[0, 0, 0.7]}>
          <boxGeometry args={[0.1, 0.025, 0.004]} />
          <Clay color={INK} />
        </mesh>
        <mesh position={[0.045, 0.05, 0.008]} rotation={[0, 0, -0.9]}>
          <boxGeometry args={[0.15, 0.025, 0.004]} />
          <Clay color={INK} />
        </mesh>
      </group>
    </group>
  );
}

/** 11 · Batch: a conveyor processing boxes in bulk. */
function Conveyor({ active }: P) {
  const boxes = useRef<THREE.Mesh[]>([]);
  const offset = useRef(0);
  useFrame((_, dt) => {
    offset.current = (offset.current + dt * (active ? 0.7 : 0.12)) % 1;
    boxes.current.forEach((b, i) => {
      if (!b) return;
      const p = (offset.current + i / 3) % 1;
      b.position.x = -0.45 + p * 0.9;
      b.scale.setScalar(Math.min(1, Math.min(p, 1 - p) * 8));
    });
  });
  return (
    <group>
      {[-0.42, 0.42].map((x, i) => (
        <Rod key={i} a={[x, 0, 0.12]} b={[x, 0.26, 0.12]} r={0.025} color={MID} />
      ))}
      {[-0.42, 0.42].map((x, i) => (
        <Rod key={`b${i}`} a={[x, 0, -0.12]} b={[x, 0.26, -0.12]} r={0.025} color={MID} />
      ))}
      <RoundedBox args={[1.0, 0.07, 0.34]} radius={0.03} position={[0, 0.3, 0]} castShadow receiveShadow>
        <Clay color={INK} />
      </RoundedBox>
      {[-0.5, 0.5].map((x, i) => (
        <mesh key={i} position={[x, 0.3, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.05, 0.05, 0.36, 20]} />
          <Clay color={MID} />
        </mesh>
      ))}
      {[0, 1, 2].map((i) => (
        <RoundedBox key={i} args={[0.16, 0.16, 0.16]} radius={0.02} position={[0, 0.42, 0]} ref={(m: THREE.Mesh) => void (boxes.current[i] = m)} castShadow>
          <Clay color={i === 1 ? "#e4e4e7" : CLAY} />
        </RoundedBox>
      ))}
    </group>
  );
}

/** 12 · Streams: events flowing along a river that never ends. */
function Stream({ active }: P) {
  const curve = useMemo(
    () =>
      new THREE.CatmullRomCurve3(
        Array.from({ length: 7 }, (_, i) => new THREE.Vector3(-0.5 + i / 6, 0.25 + Math.sin(i * 1.1) * 0.12, Math.cos(i * 1.3) * 0.18)),
      ),
    [],
  );
  const dots = useRef<THREE.Mesh[]>([]);
  const off = useRef(0);
  useFrame((_, dt) => {
    off.current = (off.current + dt * (active ? 0.5 : 0.1)) % 1;
    dots.current.forEach((d, i) => {
      if (!d) return;
      const p = (off.current + i / 6) % 1;
      d.position.copy(curve.getPoint(p)).add(new THREE.Vector3(0, 0.06, 0));
    });
  });
  return (
    <group>
      <mesh castShadow receiveShadow>
        <tubeGeometry args={[curve, 64, 0.06, 12, false]} />
        <Clay color={MID} />
      </mesh>
      {Array.from({ length: 6 }, (_, i) => (
        <mesh key={i} ref={(m) => void (dots.current[i] = m!)} castShadow>
          <sphereGeometry args={[0.045, 16, 16]} />
          <Clay color={i === 0 ? BLUE : INK} />
        </mesh>
      ))}
      {[-0.5, 0.5].map((x, i) => (
        <mesh key={`s${i}`} position={[x, 0.12, curve.getPoint(i).z]}>
          <cylinderGeometry args={[0.03, 0.05, 0.24, 12]} />
          <Clay />
        </mesh>
      ))}
    </group>
  );
}

/** 13 · Philosophy of streaming: a scroll; the log is the source of truth. */
function Scroll({ active }: P) {
  const sheet = useRef<THREE.Group>(null);
  const lines = useRef<THREE.Mesh[]>([]);
  useFrame(({ clock }, dt) => {
    const len = active ? 0.62 + Math.sin(clock.elapsedTime * 2) * 0.08 : 0.42;
    if (!sheet.current) return;
    sheet.current.scale.y = damp(sheet.current.scale.y, len, 6, dt);
    lines.current.forEach((l, i) => {
      if (!l) return;
      l.visible = (i + 1) * 0.1 < sheet.current!.scale.y;
    });
  });
  return (
    <group position={[0, 0.86, 0]}>
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.08, 0.08, 0.72, 24]} />
        <Clay />
      </mesh>
      {[-0.39, 0.39].map((x, i) => (
        <mesh key={i} position={[x, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.03, 0.03, 0.08, 12]} />
          <Clay color={INK} />
        </mesh>
      ))}
      <group ref={sheet} scale={[1, 0.42, 1]}>
        <mesh position={[0, -0.5, 0.05]} castShadow>
          <boxGeometry args={[0.62, 1, 0.01]} />
          <Clay color="#ffffff" />
        </mesh>
      </group>
      {Array.from({ length: 6 }, (_, i) => (
        <mesh key={i} ref={(m) => void (lines.current[i] = m!)} position={[-0.04 + (i % 2) * 0.04, -0.08 - i * 0.1, 0.06]}>
          <boxGeometry args={[0.42 - (i % 3) * 0.06, 0.025, 0.005]} />
          <Clay color={i === 5 ? BLUE : INK} />
        </mesh>
      ))}
    </group>
  );
}

/** 14 · Doing the right thing: a compass that finds north. */
function Compass({ active }: P) {
  const needle = useRef<THREE.Group>(null);
  const vel = useRef(0);
  useFrame(({ clock }, dt) => {
    if (!needle.current) return;
    // a springy needle: disturbed when active, settles on north
    const target = active ? Math.sin(clock.elapsedTime * 1.3) * 1.6 : 0;
    const k = 30;
    const c = 4;
    vel.current += (-(needle.current.rotation.y - target) * k - vel.current * c) * Math.min(dt, 1 / 30);
    needle.current.rotation.y += vel.current * Math.min(dt, 1 / 30);
  });
  return (
    <group rotation={[0.55, 0, 0]} position={[0, 0.3, 0]}>
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[0.44, 0.46, 0.1, 48]} />
        <Clay />
      </mesh>
      <mesh position={[0, 0.05, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.42, 0.03, 12, 48]} />
        <Clay color={INK} />
      </mesh>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} position={[Math.sin((i * Math.PI) / 2) * 0.33, 0.06, Math.cos((i * Math.PI) / 2) * 0.33]}>
          <boxGeometry args={[0.03, 0.01, 0.06]} />
          <Clay color={INK} />
        </mesh>
      ))}
      <group ref={needle} position={[0, 0.09, 0]}>
        <mesh position={[0, 0, -0.14]} rotation={[-Math.PI / 2, 0, 0]} castShadow>
          <coneGeometry args={[0.05, 0.28, 4]} />
          <Clay color="#dc2626" />
        </mesh>
        <mesh position={[0, 0, 0.14]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <coneGeometry args={[0.05, 0.28, 4]} />
          <Clay color={INK} />
        </mesh>
        <mesh>
          <sphereGeometry args={[0.04, 16, 16]} />
          <Clay color={MID} />
        </mesh>
      </group>
    </group>
  );
}

const OBJECTS: Record<number, (p: P) => ReactNode> = {
  1: Balance,
  2: Gauge,
  3: Molecule,
  4: Layers,
  5: Envelope,
  6: Copies,
  7: Pizza,
  8: Padlock,
  9: Clock,
  10: BallotBox,
  11: Conveyor,
  12: Stream,
  13: Scroll,
  14: Compass,
};

/** The memory hook: what the object is and why it stands for the chapter. */
export const OBJECT_HOOKS: Record<number, string> = {
  1: "A balance: every architecture choice is a trade-off.",
  2: "A gauge: measure what users feel, out at the tail.",
  3: "A molecule: data as things and the links between them.",
  4: "Stacked layers: write fast now, merge them later.",
  5: "An envelope: pack data so old and new code can both read it.",
  6: "Three copies, one leader.",
  7: "A pizza: split the data into slices.",
  8: "A padlock: all or nothing.",
  9: "A clock you can't trust.",
  10: "A ballot box: everyone agrees on one answer.",
  11: "A conveyor: process everything, in bulk.",
  12: "A stream: events that never stop arriving.",
  13: "A scroll: the log is the source of truth.",
  14: "A compass: do right by the people in the data.",
};

export function ChapterObject({ n, active }: { n: number; active: boolean }) {
  const Obj = OBJECTS[n];
  return Obj ? <Obj active={active} /> : null;
}
