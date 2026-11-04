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
  nudge,
  opening,
  index,
  reduce,
  started,
  onHover,
  onOpen,
  fontsReady,
}: {
  ch: ChapterMeta;
  x: number;
  height: number;
  hovered: boolean;
  nudge: boolean;
  opening: boolean;
  index: number;
  reduce: boolean;
  started: boolean;
  onHover: (n: number | null) => void;
  onOpen: (ch: ChapterMeta, origin: { x: number; y: number }) => void;
  fontsReady: boolean;
}) {
  const ref = useRef<THREE.Group>(null);
  const tex = useMemo(() => makeSpineTexture(ch, height), [ch, height, fontsReady]);
  useEffect(() => () => tex.dispose(), [tex]);

  // drop-in: each book falls onto the shelf with a small bounce, staggered left to right
  const drop = useRef({ settled: reduce, vy: 0, wait: 0.15 + index * 0.055 });

  useFrame((_, rawDt) => {
    const g = ref.current;
    if (!g) return;
    const dt = Math.min(rawDt, 1 / 30);
    const rest = height / 2;
    const d = drop.current;
    if (!d.settled) {
      if (d.wait > 0) {
        if (started) d.wait -= dt;
        return;
      }
      d.vy -= 30 * dt;
      g.position.y += d.vy * dt;
      if (g.position.y <= rest) {
        g.position.y = rest;
        d.vy = -d.vy * 0.28;
        if (Math.abs(d.vy) < 0.6) d.settled = true;
      }
      return;
    }
    const targetZ = opening ? 1.7 : hovered ? 0.6 : nudge ? 0.32 : 0;
    const targetY = opening ? 0.2 : hovered ? 0.08 : 0;
    const targetRot = opening ? -0.35 : hovered ? -0.06 : 0;
    g.position.z = THREE.MathUtils.damp(g.position.z, targetZ, opening ? 7 : 10, dt);
    g.position.y = THREE.MathUtils.damp(g.position.y, rest + targetY, 10, dt);
    g.rotation.y = THREE.MathUtils.damp(g.rotation.y, targetRot, 8, dt);
  });

  const cover = ch.ready ? "#0a0a0a" : "#ffffff";
  return (
    <group ref={ref} position={[x, reduce ? height / 2 : height / 2 + 4.5, 0]}>
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
          onOpen(ch, { x: e.nativeEvent.clientX, y: e.nativeEvent.clientY });
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
  started = true,
}: {
  chapters: ChapterMeta[];
  started?: boolean;
  hovered: number | null;
  onHover: (n: number | null) => void;
  onOpen: (ch: ChapterMeta, origin: { x: number; y: number }) => void;
}) {
  const [fontsReady, setFontsReady] = useState(false);
  const [opening, setOpening] = useState<number | null>(null);
  const [nudge, setNudge] = useState(false);
  const touched = useRef(false);
  const reduce = useMemo(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches, []);

  // until someone touches the shelf, the playable chapter peeks out now and then
  useEffect(() => {
    if (reduce) return;
    const timers: number[] = [];
    const t = window.setInterval(() => {
      if (touched.current) return;
      setNudge(true);
      timers.push(window.setTimeout(() => setNudge(false), 650));
    }, 4200);
    return () => {
      clearInterval(t);
      timers.forEach(clearTimeout);
    };
  }, [reduce]);

  // the pointer cursor set on hover must not outlive the shelf
  useEffect(() => () => void (document.body.style.cursor = ""), []);

  const hover = (n: number | null) => {
    if (n !== null) touched.current = true;
    onHover(n);
  };
  const open = (ch: ChapterMeta, origin: { x: number; y: number }) => {
    touched.current = true;
    if (reduce) return onOpen(ch, origin);
    // pull the book out, then let the chapter transition take over from the click point
    setOpening(ch.n);
    window.setTimeout(() => onOpen(ch, origin), 220);
  };
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
      {layout.items.map(({ ch, x, height }, i) => (
        <Book
          key={ch.n}
          ch={ch}
          x={x}
          height={height}
          index={i}
          reduce={reduce}
          started={started}
          hovered={hovered === ch.n}
          nudge={nudge && ch.ready && hovered === null}
          opening={opening === ch.n}
          onHover={hover}
          onOpen={open}
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
