import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { CHAPTERS, type ChapterMeta } from "@/content/chapters";
import { ChapterObject, CLAY, INK } from "../objects/ChapterObjects";

const CW = 1.5; // cubby width
const CH = 1.42; // cubby height
const D = 1.25; // depth
const POST = 0.07; // vertical dividers
const SHELF = 0.17; // shelves (thick enough to carry a label)
const CELLS = 15; // 14 chapters + the maker's plaque

/** Cell index -> [col, row]. Wide: one row per Part (5/5/4 + plaque). Narrow: 3 columns in reading order. */
function placement(cols: number) {
  return (cell: number): [number, number] => [cell % cols, Math.floor(cell / cols)];
}

/** Overshoots a little, then settles: a soft "pop". */
const easeOutBack = (x: number) => 1 + 2.70158 * Math.pow(x - 1, 3) + 1.70158 * Math.pow(x - 1, 2);

function texture(draw: (g: CanvasRenderingContext2D, w: number, h: number) => void, w = 512, h = 64) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  draw(c.getContext("2d")!, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

function Cubby({
  ch,
  x,
  y,
  index,
  started,
  hovered,
  fontsReady,
  onHover,
  onOpen,
}: {
  ch: ChapterMeta;
  x: number;
  y: number;
  index: number;
  started: boolean;
  hovered: boolean;
  fontsReady: boolean;
  onHover: (n: number | null) => void;
  onOpen: (ch: ChapterMeta, origin: { x: number; y: number }) => void;
}) {
  const obj = useRef<THREE.Group>(null);
  const glow = useRef<THREE.PointLight>(null);
  const born = useRef<number | null>(null);
  const label = useMemo(
    () =>
      texture((g, w, h) => {
        g.fillStyle = INK;
        g.font = `600 30px "Geist Mono Variable", ui-monospace, monospace`;
        g.textBaseline = "middle";
        g.textAlign = "center";
        const t = `${String(ch.n).padStart(2, "0")} ${ch.title.toUpperCase()}`;
        let size = 30;
        while (g.measureText(t).width > w - 30 && size > 16) g.font = `600 ${(size -= 2)}px "Geist Mono Variable", ui-monospace, monospace`;
        g.fillText(t, w / 2, h / 2 + 2);
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ch, fontsReady],
  );
  useEffect(() => () => label.dispose(), [label]);

  useFrame(({ clock }, dt) => {
    const g = obj.current;
    if (!g) return;
    // pop in, staggered, once the cabinet scrolls into view
    if (started && born.current === null) born.current = clock.elapsedTime + 0.15 + index * 0.06;
    const t = born.current === null ? 0 : Math.max(0, clock.elapsedTime - born.current);
    const pop = t <= 0 ? 0 : easeOutBack(Math.min(1, t / 0.55));
    const s = (hovered ? 1.12 : 0.92) * Math.max(0, pop);
    g.scale.setScalar(THREE.MathUtils.damp(g.scale.x, s, 12, dt));
    g.position.z = THREE.MathUtils.damp(g.position.z, hovered ? 0.28 : 0, 8, dt);
    g.rotation.y = THREE.MathUtils.damp(g.rotation.y, hovered ? 0 : -0.35, 5, dt);
    if (glow.current) glow.current.intensity = THREE.MathUtils.damp(glow.current.intensity, hovered ? 2.2 : ch.ready ? 0.6 : 0, 6, dt);
  });

  const floorY = y - CH / 2;
  return (
    <group
      onPointerOver={(e) => {
        e.stopPropagation();
        onHover(ch.n);
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
      {/* invisible hit area covering the whole cubby */}
      <mesh position={[x, y, D / 2 - 0.05]}>
        <planeGeometry args={[CW, CH]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      {/* plinth */}
      <RoundedBox args={[0.92, 0.06, 0.62]} radius={0.02} position={[x, floorY + 0.03, 0.05]} receiveShadow castShadow>
        <meshStandardMaterial color={ch.ready ? INK : "#e8e8eb"} roughness={0.8} />
      </RoundedBox>
      <group ref={obj} position={[x, floorY + 0.06, 0.05]} scale={0}>
        <group position={[0, 0, 0]}>
          <ChapterObject n={ch.n} active={hovered} />
        </group>
      </group>
      <pointLight ref={glow} position={[x, y + CH / 2 - 0.15, 0.3]} intensity={0} distance={2.2} decay={2} color="#fff7ed" />
      {/* engraved label on the shelf edge below */}
      <mesh position={[x, floorY - SHELF / 2, D / 2 + 0.002]}>
        <planeGeometry args={[CW, CW * (64 / 512)]} />
        <meshBasicMaterial map={label} transparent toneMapped={false} />
      </mesh>
      {ch.ready && (
        <mesh position={[x + CW / 2 - 0.12, floorY - SHELF / 2, D / 2 + 0.004]}>
          <circleGeometry args={[0.025, 16]} />
          <meshBasicMaterial color="#22c55e" toneMapped={false} />
        </mesh>
      )}
    </group>
  );
}

function Plaque({ x, y, fontsReady }: { x: number; y: number; fontsReady: boolean }) {
  const tex = useMemo(
    () =>
      texture(
        (g, w, h) => {
          g.fillStyle = INK;
          g.fillRect(0, 0, w, h);
          g.fillStyle = "#fafafa";
          g.textAlign = "center";
          g.font = `600 44px "Geist Variable", ui-sans-serif, sans-serif`;
          g.fillText("Boar Book", w / 2, h / 2 - 10);
          g.globalAlpha = 0.6;
          g.font = `500 22px "Geist Mono Variable", ui-monospace, monospace`;
          g.fillText("DDIA 2E · 14 OBJECTS", w / 2, h / 2 + 34);
        },
        512,
        256,
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fontsReady],
  );
  return (
    <mesh position={[x, y, -D / 2 + 0.06]} rotation={[0, 0, 0]}>
      <planeGeometry args={[1.1, 0.55]} />
      <meshBasicMaterial map={tex} toneMapped={false} />
    </mesh>
  );
}

function Frame({ cols, rows }: { cols: number; rows: number }) {
  const W = cols * CW + (cols + 1) * POST;
  const H = rows * CH + (rows + 1) * SHELF;
  const mat = <meshStandardMaterial color={CLAY} roughness={0.92} />;
  return (
    <group>
      {/* back */}
      <mesh position={[0, 0, -D / 2]} receiveShadow>
        <boxGeometry args={[W, H, 0.06]} />
        <meshStandardMaterial color="#f7f7f8" roughness={1} />
      </mesh>
      {/* shelves */}
      {Array.from({ length: rows + 1 }, (_, r) => (
        <RoundedBox key={`s${r}`} args={[W, SHELF, D]} radius={0.02} position={[0, H / 2 - SHELF / 2 - r * (CH + SHELF), 0]} receiveShadow castShadow>
          {mat}
        </RoundedBox>
      ))}
      {/* posts */}
      {Array.from({ length: cols + 1 }, (_, c) => (
        <mesh key={`p${c}`} position={[-W / 2 + POST / 2 + c * (CW + POST), 0, 0]} receiveShadow castShadow>
          <boxGeometry args={[POST, H, D]} />
          {mat}
        </mesh>
      ))}
      {/* plinth the cabinet stands on */}
      <RoundedBox args={[W + 0.3, 0.12, D + 0.2]} radius={0.03} position={[0, -H / 2 - 0.06, 0.05]} receiveShadow>
        <meshStandardMaterial color={INK} roughness={0.7} />
      </RoundedBox>
    </group>
  );
}

/** Fits the cabinet in view and tilts it gently toward the cursor. */
function Rig({ width, height, group }: { width: number; height: number; group: React.RefObject<THREE.Group | null> }) {
  const { camera, size, pointer } = useThree();
  useFrame((_, dt) => {
    const cam = camera as THREE.PerspectiveCamera;
    const aspect = size.width / size.height;
    const vfov = (cam.fov * Math.PI) / 180;
    const distH = (height / 2 + 0.35) / Math.tan(vfov / 2);
    const distW = (width / 2 + 0.35) / (Math.tan(vfov / 2) * aspect);
    const z = Math.max(distH, distW) + 0.6;
    cam.position.set(0, 0.25, z);
    cam.lookAt(0, -0.05, 0);
    if (group.current) {
      group.current.rotation.y = THREE.MathUtils.damp(group.current.rotation.y, pointer.x * 0.12, 3, dt);
      group.current.rotation.x = THREE.MathUtils.damp(group.current.rotation.x, -pointer.y * 0.06, 3, dt);
    }
  });
  return null;
}

export default function CabinetScene({
  hovered,
  onHover,
  onOpen,
  started,
  narrow,
}: {
  hovered: number | null;
  onHover: (n: number | null) => void;
  onOpen: (ch: ChapterMeta, origin: { x: number; y: number }) => void;
  started: boolean;
  narrow: boolean;
}) {
  const [fontsReady, setFontsReady] = useState(false);
  const group = useRef<THREE.Group>(null);
  useEffect(() => {
    Promise.all([document.fonts.load(`600 30px "Geist Mono Variable"`), document.fonts.load(`600 40px "Geist Variable"`)]).finally(() =>
      setFontsReady(true),
    );
    return () => void (document.body.style.cursor = "");
  }, []);

  const cols = narrow ? 3 : 5;
  const rows = Math.ceil(CELLS / cols);
  const W = cols * CW + (cols + 1) * POST;
  const H = rows * CH + (rows + 1) * SHELF;
  const at = placement(cols);
  const center = (cell: number) => {
    const [c, r] = at(cell);
    return {
      x: -W / 2 + POST + CW / 2 + c * (CW + POST),
      y: H / 2 - SHELF - CH / 2 - r * (CH + SHELF),
    };
  };
  const plaque = center(CELLS - 1);

  return (
    <Canvas shadows dpr={[1, 2]} camera={{ fov: 26, position: [0, 0, 20] }}>
      <color attach="background" args={["#ffffff"]} />
      <hemisphereLight args={["#ffffff", "#e4e4e7", 2.1]} />
      <ambientLight intensity={0.55} />
      <directionalLight position={[3, 5, 8]} intensity={1.6} castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-6} shadow-camera-right={6} shadow-camera-top={6} shadow-camera-bottom={-6} shadow-bias={-0.0004} />
      <Rig width={W} height={H} group={group} />
      <group ref={group}>
        <Frame cols={cols} rows={rows} />
        {CHAPTERS.map((ch, i) => {
          const p = center(i);
          return (
            <Cubby
              key={ch.n}
              ch={ch}
              x={p.x}
              y={p.y}
              index={i}
              started={started}
              hovered={hovered === ch.n}
              fontsReady={fontsReady}
              onHover={onHover}
              onOpen={onOpen}
            />
          );
        })}
        <Plaque x={plaque.x} y={plaque.y} fontsReady={fontsReady} />
      </group>
    </Canvas>
  );
}
