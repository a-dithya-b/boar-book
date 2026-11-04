import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Line, RoundedBox } from "@react-three/drei";
import type { MotionValue } from "motion/react";
import * as THREE from "three";
import { CHAPTERS, PARTS, type ChapterMeta } from "@/content/chapters";
import { ChapterObject, CLAY, INK } from "../objects/ChapterObjects";

export const FLOOR_H = 1.55;
const SLAB = 0.14;
const BAND = 0.34;
const W = 2.5;
const BASE = 0.6;

/** World-space y of chapter floor i (0-based). Parts are separated by a dark band. */
export const floorY = (i: number) => BASE + i * FLOOR_H + (CHAPTERS[i].part - 1) * BAND;

/** Fractional floor -> y, so the camera glides smoothly across the bands. */
const floorYAt = (f: number) => {
  const a = Math.max(0, Math.min(CHAPTERS.length - 1, Math.floor(f)));
  const b = Math.min(CHAPTERS.length - 1, a + 1);
  return THREE.MathUtils.lerp(floorY(a), floorY(b), f - a);
};

function textTexture(text: string, { color = INK, bg = "transparent", size = 44, weight = 600, align = "left" as CanvasTextAlign, w = 1024, h = 64 } = {}) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const g = c.getContext("2d")!;
  if (bg !== "transparent") {
    g.fillStyle = bg;
    g.fillRect(0, 0, w, h);
  }
  g.fillStyle = color;
  g.font = `${weight} ${size}px "Geist Mono Variable", ui-monospace, monospace`;
  g.textBaseline = "middle";
  g.textAlign = align;
  g.fillText(text, align === "center" ? w / 2 : 24, h / 2 + 2);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

function Floor({
  ch,
  i,
  focused,
  hovered,
  highlighted,
  fontsReady,
  onHover,
  onOpen,
}: {
  ch: ChapterMeta;
  i: number;
  focused: boolean;
  hovered: boolean;
  highlighted: boolean;
  fontsReady: boolean;
  onHover: (i: number | null) => void;
  onOpen: (ch: ChapterMeta, origin: { x: number; y: number }) => void;
}) {
  const y = floorY(i);
  const obj = useRef<THREE.Group>(null);
  const strip = useRef<THREE.MeshStandardMaterial>(null);
  const label = useMemo(
    () => textTexture(`${String(ch.n).padStart(2, "0")}  ${ch.title.toUpperCase()}`, { size: ch.title.length > 30 ? 30 : 36 }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ch, fontsReady],
  );
  useEffect(() => () => label.dispose(), [label]);

  useFrame((_, dt) => {
    if (obj.current) {
      const s = THREE.MathUtils.damp(obj.current.scale.x, focused ? 1.3 : hovered ? 1.15 : 1, 6, dt);
      obj.current.scale.setScalar(s);
    }
    if (strip.current) {
      const target = highlighted ? new THREE.Color("#3b82f6") : focused ? new THREE.Color(INK) : ch.ready ? new THREE.Color("#22c55e") : new THREE.Color("#d4d4d8");
      strip.current.color.lerp(target, 1 - Math.exp(-8 * dt));
      strip.current.emissive.copy(strip.current.color).multiplyScalar(highlighted || ch.ready ? 0.35 : 0);
    }
  });

  const colH = FLOOR_H - SLAB;
  return (
    <group
      position={[0, y, 0]}
      onPointerOver={(e) => {
        e.stopPropagation();
        onHover(i);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        onHover(null);
        document.body.style.cursor = "";
      }}
      onClick={(e) => {
        e.stopPropagation();
        onOpen(ch, { x: e.nativeEvent.clientX, y: e.nativeEvent.clientY });
      }}
    >
      <RoundedBox args={[W, SLAB, W]} radius={0.03} smoothness={3} position={[0, SLAB / 2, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={CLAY} roughness={0.9} />
      </RoundedBox>
      {/* engraved floor name on the front edge */}
      <mesh position={[0, SLAB / 2, W / 2 + 0.002]}>
        <planeGeometry args={[W, SLAB]} />
        <meshBasicMaterial map={label} transparent toneMapped={false} />
      </mesh>
      {/* status strip under the front edge: green = playable, blue = connection, ink = in focus */}
      <mesh position={[0, -0.012, W / 2 - 0.02]}>
        <boxGeometry args={[W - 0.1, 0.025, 0.04]} />
        <meshStandardMaterial ref={strip} color="#d4d4d8" />
      </mesh>
      {/* corner columns */}
      {[-1, 1].flatMap((sx) =>
        [-1, 1].map((sz) => (
          <mesh key={`${sx}${sz}`} position={[sx * (W / 2 - 0.07), SLAB + colH / 2, sz * (W / 2 - 0.07)]} castShadow>
            <boxGeometry args={[0.07, colH, 0.07]} />
            <meshStandardMaterial color={CLAY} roughness={0.9} />
          </mesh>
        )),
      )}
      <group ref={obj} position={[0, SLAB, 0]} scale={1}>
        <ChapterObject n={ch.n} active={focused || hovered} />
      </group>
    </group>
  );
}

function PartBand({ part, y, fontsReady }: { part: 1 | 2 | 3; y: number; fontsReady: boolean }) {
  const isBase = part === 1;
  const h = isBase ? BASE : BAND;
  const w = isBase ? W + 0.9 : W + 0.12;
  const tex = useMemo(
    () => textTexture(`PART ${"I".repeat(part)} · ${PARTS[part].toUpperCase()}`, { color: "#fafafa", size: isBase ? 34 : 30, align: "center", w: 1024, h: 80 }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [part, fontsReady],
  );
  return (
    <group position={[0, y + h / 2, 0]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[w, h, w]} />
        <meshStandardMaterial color={INK} roughness={0.7} />
      </mesh>
      <mesh position={[0, 0, w / 2 + 0.002]}>
        <planeGeometry args={[Math.min(w, 2.6), Math.min(w, 2.6) * (80 / 1024)]} />
        <meshBasicMaterial map={tex} transparent toneMapped={false} />
      </mesh>
    </group>
  );
}

function Roof({ y }: { y: number }) {
  const light = useRef<THREE.MeshBasicMaterial>(null);
  useFrame(({ clock }) => {
    if (light.current) light.current.color.set(Math.sin(clock.elapsedTime * 3) > 0.3 ? "#ef4444" : "#7f1d1d");
  });
  return (
    <group position={[0, y, 0]}>
      <RoundedBox args={[W, SLAB, W]} radius={0.03} position={[0, SLAB / 2, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={CLAY} roughness={0.9} />
      </RoundedBox>
      <mesh position={[0.6, 0.6, -0.5]} castShadow>
        <cylinderGeometry args={[0.02, 0.03, 1, 8]} />
        <meshStandardMaterial color={INK} />
      </mesh>
      <mesh position={[0.6, 1.12, -0.5]}>
        <sphereGeometry args={[0.05, 12, 12]} />
        <meshBasicMaterial ref={light} color="#ef4444" />
      </mesh>
    </group>
  );
}

/** Glides the camera up the tower as the page scrolls, slowly circling the building. */
function Rig({ progress }: { progress: MotionValue<number> }) {
  const { camera, size, scene } = useThree();
  const look = useRef(new THREE.Vector3(0, floorY(0), 0));
  const light = useRef<THREE.DirectionalLight>(null);
  useEffect(() => {
    if (light.current) scene.add(light.current.target);
  }, [scene]);

  useFrame((_, dt) => {
    const f = progress.get() * (CHAPTERS.length - 1);
    const y = floorYAt(f);
    const narrow = size.width / size.height < 0.9;
    const R = narrow ? 13 : 11.5;
    const angle = -0.7 + (f / (CHAPTERS.length - 1)) * 1.1;
    const k = 1 - Math.exp(-4 * dt);
    camera.position.lerp(new THREE.Vector3(Math.sin(angle) * R, y + 3.1, Math.cos(angle) * R), k);
    look.current.lerp(new THREE.Vector3(0, y + 0.75, 0), k);
    // haze that travels with the camera: floors above and below fade to white
    if (scene.fog instanceof THREE.Fog) {
      scene.fog.near = R - 1.5;
      scene.fog.far = R + 5;
    }
    camera.lookAt(look.current);
    if (light.current) {
      light.current.position.set(look.current.x + 4, look.current.y + 6, look.current.z + 5);
      light.current.target.position.copy(look.current);
    }
  });

  return (
    <directionalLight
      ref={light}
      intensity={2.1}
      castShadow
      shadow-mapSize={[1024, 1024]}
      shadow-camera-left={-3}
      shadow-camera-right={3}
      shadow-camera-top={3}
      shadow-camera-bottom={-3}
      shadow-camera-near={1}
      shadow-camera-far={20}
      shadow-bias={-0.0005}
    />
  );
}

/** Thin threads up the side of the tower linking floors that share an idea. */
function Threads({ floors }: { floors: number[] }) {
  if (floors.length < 2) return null;
  // the front-left corner faces the camera for the whole climb
  const x = -(W / 2 + 0.3);
  const z = W / 2 + 0.3;
  const pts = floors.map((i) => new THREE.Vector3(x, floorY(i) + 0.5, z));
  return (
    <group>
      <Line points={pts} color="#3b82f6" lineWidth={2} />
      {pts.map((p, k) => (
        <mesh key={k} position={p}>
          <sphereGeometry args={[0.07, 16, 16]} />
          <meshStandardMaterial color="#3b82f6" emissive="#3b82f6" emissiveIntensity={0.6} />
        </mesh>
      ))}
    </group>
  );
}

export default function TowerScene({
  progress,
  focus,
  connections,
  onOpen,
}: {
  progress: MotionValue<number>;
  focus: number;
  connections: number[];
  onOpen: (ch: ChapterMeta, origin: { x: number; y: number }) => void;
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const [fontsReady, setFontsReady] = useState(false);
  useEffect(() => {
    document.fonts.load(`600 40px "Geist Mono Variable"`).finally(() => setFontsReady(true));
    return () => void (document.body.style.cursor = "");
  }, []);

  const top = floorY(CHAPTERS.length - 1) + FLOOR_H;
  const bands = ([1, 2, 3] as const).map((p) => {
    const first = CHAPTERS.findIndex((c) => c.part === p);
    return { part: p, y: p === 1 ? 0 : floorY(first) - BAND };
  });

  return (
    <Canvas shadows dpr={[1, 2]} camera={{ fov: 22, position: [0, 4, 12] }}>
      <color attach="background" args={["#ffffff"]} />
      <fog attach="fog" args={["#ffffff", 10, 16]} />
      <hemisphereLight args={["#ffffff", "#e4e4e7", 1.9]} />
      <ambientLight intensity={0.45} />
      <Rig progress={progress} />
      {bands.map((b) => (
        <PartBand key={b.part} part={b.part} y={b.y} fontsReady={fontsReady} />
      ))}
      {CHAPTERS.map((ch, i) => (
        <Floor
          key={ch.n}
          ch={ch}
          i={i}
          focused={focus === i}
          hovered={hovered === i}
          highlighted={connections.includes(i)}
          fontsReady={fontsReady}
          onHover={setHovered}
          onOpen={onOpen}
        />
      ))}
      <Roof y={top} />
      <Threads floors={connections} />
      {/* ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.001, 0]} receiveShadow>
        <circleGeometry args={[30, 48]} />
        <meshStandardMaterial color="#ffffff" roughness={1} />
      </mesh>
    </Canvas>
  );
}
