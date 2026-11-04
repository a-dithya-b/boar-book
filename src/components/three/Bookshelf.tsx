import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import type { ChapterMeta } from "@/content/chapters";

const SPINE_W = 0.62;
const DEPTH = 1.5;
const GAP = 0.06;
const PART_GAP = 0.55;

/** Draws a book spine (number on top, title running vertically) to a canvas texture. */
function makeSpineTexture(ch: ChapterMeta, height: number) {
  const W = 160;
  const H = Math.round((W * height) / SPINE_W);
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d")!;
  const ink = ch.ready ? "#fafafa" : "#0a0a0a";
  g.fillStyle = ch.ready ? "#0a0a0a" : "#ffffff";
  g.fillRect(0, 0, W, H);

  // number
  g.fillStyle = ink;
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.font = `600 64px "Geist Mono Variable", ui-monospace, monospace`;
  g.fillText(String(ch.n).padStart(2, "0"), W / 2, 72);

  // rule
  g.globalAlpha = ch.ready ? 0.5 : 0.25;
  g.fillRect(W * 0.3, 128, W * 0.4, 3);
  g.globalAlpha = 1;

  // title, vertical
  g.save();
  g.translate(W / 2, 160);
  g.rotate(Math.PI / 2);
  g.textAlign = "left";
  const maxLen = H - 240;
  const font = (s: number) => `500 ${s}px "Geist Variable", ui-sans-serif, sans-serif`;
  const widest = (lines: string[]) => Math.max(...lines.map((l) => g.measureText(l).width));
  // one line if it fits at a readable size, otherwise split near the middle
  let lines = [ch.title];
  let size = 50;
  g.font = font(size);
  while (widest(lines) > maxLen && size > 34) g.font = font((size -= 2));
  if (widest(lines) > maxLen) {
    const words = ch.title.split(" ");
    let best = 1;
    let bestDiff = Infinity;
    for (let i = 1; i < words.length; i++) {
      const diff = Math.abs(words.slice(0, i).join(" ").length - words.slice(i).join(" ").length);
      if (diff < bestDiff) [best, bestDiff] = [i, diff];
    }
    lines = [words.slice(0, best).join(" "), words.slice(best).join(" ")];
    size = 40;
    g.font = font(size);
    while (widest(lines) > maxLen && size > 16) g.font = font((size -= 2));
  }
  g.globalAlpha = ch.ready ? 1 : 0.75;
  const lh = size * 1.15;
  lines.forEach((l, i) => g.fillText(l, 0, (i - (lines.length - 1) / 2) * lh));
  g.restore();

  // status dot at bottom
  g.globalAlpha = 1;
  g.beginPath();
  g.arc(W / 2, H - 50, 9, 0, Math.PI * 2);
  if (ch.ready) {
    g.fillStyle = "#22c55e";
    g.fill();
  } else {
    g.strokeStyle = "#a1a1aa";
    g.lineWidth = 3;
    g.stroke();
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function Book({
  ch,
  x,
  height,
  hovered,
  onHover,
  onOpen,
  fontsReady,
}: {
  ch: ChapterMeta;
  x: number;
  height: number;
  hovered: boolean;
  onHover: (n: number | null) => void;
  onOpen: (ch: ChapterMeta) => void;
  fontsReady: boolean;
}) {
  const ref = useRef<THREE.Group>(null);
  const tex = useMemo(() => makeSpineTexture(ch, height), [ch, height, fontsReady]);
  useEffect(() => () => tex.dispose(), [tex]);

  useFrame((_, dt) => {
    if (!ref.current) return;
    const targetZ = hovered ? 0.6 : 0;
    const targetY = hovered ? 0.08 : 0;
    ref.current.position.z = THREE.MathUtils.damp(ref.current.position.z, targetZ, 10, dt);
    ref.current.position.y = THREE.MathUtils.damp(ref.current.position.y, height / 2 + targetY, 10, dt);
  });

  const cover = ch.ready ? "#0a0a0a" : "#ffffff";
  return (
    <group ref={ref} position={[x, height / 2, 0]}>
      <RoundedBox
        args={[SPINE_W, height, DEPTH]}
        radius={0.03}
        smoothness={3}
        castShadow
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
          onOpen(ch);
        }}
      >
        <meshStandardMaterial color={cover} roughness={0.55} metalness={0.05} />
      </RoundedBox>
      {/* printed spine */}
      <mesh position={[0, 0, DEPTH / 2 + 0.002]} raycast={() => null}>
        <planeGeometry args={[SPINE_W - 0.04, height - 0.04]} />
        <meshBasicMaterial map={tex} toneMapped={false} />
      </mesh>
      {!ch.ready && (
        <lineSegments raycast={() => null}>
          <edgesGeometry args={[new THREE.BoxGeometry(SPINE_W, height, DEPTH)]} />
          <lineBasicMaterial color="#d4d4d8" />
        </lineSegments>
      )}
    </group>
  );
}

function Rig({ width }: { width: number }) {
  const { camera, size, pointer } = useThree();
  useFrame((_, dt) => {
    const aspect = size.width / size.height;
    // fit the shelf horizontally
    const fov = (35 * Math.PI) / 180;
    const fitZ = (width / 2 + 0.6) / (Math.tan(fov / 2) * aspect);
    const z = Math.max(7.5, fitZ);
    camera.position.x = THREE.MathUtils.damp(camera.position.x, pointer.x * 0.7, 3, dt);
    camera.position.y = THREE.MathUtils.damp(camera.position.y, 2.6 + pointer.y * 0.3, 3, dt);
    camera.position.z = THREE.MathUtils.damp(camera.position.z, z, 4, dt);
    camera.lookAt(0, aspect < 1.2 ? 1.25 : 1.05, 0);
  });
  return null;
}

export function Bookshelf({
  chapters,
  hovered,
  onHover,
  onOpen,
}: {
  chapters: ChapterMeta[];
  hovered: number | null;
  onHover: (n: number | null) => void;
  onOpen: (ch: ChapterMeta) => void;
}) {
  const [fontsReady, setFontsReady] = useState(false);
  useEffect(() => {
    Promise.all([
      document.fonts.load(`500 40px "Geist Variable"`),
      document.fonts.load(`600 40px "Geist Mono Variable"`),
    ]).finally(() => setFontsReady(true));
  }, []);

  const layout = useMemo(() => {
    let x = 0;
    const items = chapters.map((ch, i) => {
      if (i > 0 && ch.part !== chapters[i - 1].part) x += PART_GAP;
      const item = { ch, x, height: 2.1 + ((ch.n * 37) % 5) * 0.09 };
      x += SPINE_W + GAP;
      return item;
    });
    const width = x - GAP;
    return { items: items.map((it) => ({ ...it, x: it.x - width / 2 + SPINE_W / 2 })), width };
  }, [chapters]);

  return (
    <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 2.6, 12], fov: 35 }} onPointerMissed={() => onHover(null)}>
      <color attach="background" args={["#ffffff"]} />
      <ambientLight intensity={1.6} />
      <directionalLight position={[3, 6, 5]} intensity={1.6} castShadow shadow-mapSize={[1024, 1024]} />
      <directionalLight position={[-4, 3, 2]} intensity={0.5} />
      <Rig width={layout.width} />
      {layout.items.map(({ ch, x, height }) => (
        <Book
          key={ch.n}
          ch={ch}
          x={x}
          height={height}
          hovered={hovered === ch.n}
          onHover={onHover}
          onOpen={onOpen}
          fontsReady={fontsReady}
        />
      ))}
      {/* shelf */}
      <mesh position={[0, -0.06, 0.1]} receiveShadow>
        <boxGeometry args={[layout.width + 0.8, 0.12, DEPTH + 0.6]} />
        <meshStandardMaterial color="#fafafa" roughness={0.9} />
      </mesh>
      <ContactShadows position={[0, -0.13, 0]} opacity={0.25} scale={20} blur={2.5} far={4} />
    </Canvas>
  );
}

export default Bookshelf;
