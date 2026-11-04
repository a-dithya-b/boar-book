import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { MousePointerClick } from "lucide-react";

type F = { log: number; down: boolean; pending: number };
type Packet = { id: number; to: 0 | 1 };

const LEADER = { x: 180, y: 62 };
const FOLLOWERS = [
  { x: 82, y: 190, label: "sync", dur: 0.55 },
  { x: 278, y: 190, label: "async", dur: 1.5 },
];
const W = 92;
const H = 58;
const MAX_TILES = 8;

/** The leader's latest MAX_TILES entries; a tile is filled if this node has that entry. */
function Tiles({ n, head, x, y, dark }: { n: number; head: number; x: number; y: number; dark?: boolean }) {
  const start = Math.max(0, head - MAX_TILES);
  const size = 7;
  const gap = 2.5;
  const total = MAX_TILES * size + (MAX_TILES - 1) * gap;
  return (
    <g>
      {Array.from({ length: MAX_TILES }).map((_, i) => (
        <rect
          key={i}
          x={x - total / 2 + i * (size + gap)}
          y={y}
          width={size}
          height={size}
          rx={1.5}
          className="transition-colors duration-300"
          fill={n >= start + i + 1 && start + i + 1 <= head ? (dark ? "#fafafa" : "#0a0a0a") : "transparent"}
          stroke={dark ? "#52525b" : "#d4d4d8"}
          strokeWidth={1}
        />
      ))}
    </g>
  );
}

/** A tiny leader/follower cluster you can poke: the site's idea in one glance. */
export function ReplicaToy() {
  const reduce = useReducedMotion();
  const [leader, setLeader] = useState(0);
  const [fs, setFs] = useState<F[]>([
    { log: 0, down: false, pending: 0 },
    { log: 0, down: false, pending: 0 },
  ]);
  const [packets, setPackets] = useState<Packet[]>([]);
  const [ripple, setRipple] = useState(0);
  const pid = useRef(0);
  const lastTouch = useRef(0);
  const fsRef = useRef(fs);
  fsRef.current = fs;

  const launch = useCallback((to: 0 | 1) => {
    setPackets((p) => [...p, { id: ++pid.current, to }]);
  }, []);

  const write = useCallback(() => {
    setLeader((l) => (l >= 24 ? 1 : l + 1));
    setRipple((r) => r + 1);
    if (leader >= 24) {
      // start a fresh log rather than growing forever
      setFs([
        { log: 0, down: fsRef.current[0].down, pending: 0 },
        { log: 0, down: fsRef.current[1].down, pending: 0 },
      ]);
      setPackets([]);
    }
    fsRef.current.forEach((f, i) => {
      if (f.down) setFs((s) => s.map((x, j) => (j === i ? { ...x, pending: x.pending + 1 } : x)));
      else launch(i as 0 | 1);
    });
  }, [launch, leader]);

  const deliver = (p: Packet) => {
    setPackets((ps) => ps.filter((x) => x.id !== p.id));
    setFs((s) =>
      s.map((x, j) => (j !== p.to ? x : x.down ? { ...x, pending: x.pending + 1 } : { ...x, log: x.log + 1 })),
    );
  };

  const toggle = (i: 0 | 1) => {
    lastTouch.current = Date.now();
    const f = fsRef.current[i];
    if (f.down) {
      // back online: catch up on everything it missed
      for (let k = 0; k < f.pending; k++) setTimeout(() => launch(i), k * 140);
      setFs((s) => s.map((x, j) => (j === i ? { ...x, down: false, pending: 0 } : x)));
    } else {
      setFs((s) => s.map((x, j) => (j === i ? { ...x, down: true } : x)));
    }
  };

  // keep it alive while nobody is playing with it
  useEffect(() => {
    if (reduce) return;
    const t = setInterval(() => {
      if (Date.now() - lastTouch.current > 6000 && document.visibilityState === "visible") write();
    }, 2400);
    return () => clearInterval(t);
  }, [write, reduce]);

  const userWrite = () => {
    lastTouch.current = Date.now();
    write();
  };

  const lagging = fs.map((f) => leader - f.log);

  return (
    <div className="relative flex h-full flex-col select-none">
      <svg viewBox="0 0 360 250" className="max-h-[262px] w-full flex-1" role="img" aria-label="A leader and two followers replicating writes">
        {/* links */}
        {FOLLOWERS.map((f, i) => (
          <line
            key={i}
            x1={LEADER.x}
            y1={LEADER.y + H / 2}
            x2={f.x}
            y2={f.y - H / 2}
            stroke={fs[i].down ? "#fca5a5" : "#d4d4d8"}
            strokeWidth={1.5}
            strokeDasharray={f.label === "async" || fs[i].down ? "5 4" : undefined}
            className="transition-colors"
          />
        ))}

        {/* packets */}
        {packets.map((p) => {
          const f = FOLLOWERS[p.to];
          return (
            <motion.circle
              key={p.id}
              r={5}
              fill="#2563eb"
              initial={{ cx: LEADER.x, cy: LEADER.y + H / 2 }}
              animate={{ cx: f.x, cy: f.y - H / 2 }}
              transition={{ duration: reduce ? 0.01 : f.dur, ease: "easeInOut" }}
              onAnimationComplete={() => deliver(p)}
            />
          );
        })}

        {/* leader */}
        <motion.g
          onClick={userWrite}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.94 }}
          style={{ transformOrigin: `${LEADER.x}px ${LEADER.y}px`, transformBox: "view-box" }}
          className="cursor-pointer"
          role="button"
          aria-label="Send a write to the leader"
        >
          <AnimatePresence>
            <motion.rect
              key={ripple}
              x={LEADER.x - W / 2}
              y={LEADER.y - H / 2}
              width={W}
              height={H}
              rx={10}
              fill="none"
              stroke="#0a0a0a"
              strokeWidth={1.5}
              initial={{ opacity: ripple ? 0.5 : 0, scale: 1 }}
              animate={{ opacity: 0, scale: 1.35 }}
              transition={{ duration: 0.7 }}
              style={{ transformOrigin: `${LEADER.x}px ${LEADER.y}px`, transformBox: "view-box" }}
            />
          </AnimatePresence>
          <rect x={LEADER.x - W / 2} y={LEADER.y - H / 2} width={W} height={H} rx={10} fill="#0a0a0a" />
          <text x={LEADER.x} y={LEADER.y - 6} textAnchor="middle" className="fill-white text-[11px] font-semibold">
            leader
          </text>
          <Tiles n={leader} head={leader} x={LEADER.x} y={LEADER.y + 6} dark />
        </motion.g>

        {/* followers */}
        {FOLLOWERS.map((f, i) => {
          const st = fs[i];
          return (
            <motion.g
              key={i}
              onClick={() => toggle(i as 0 | 1)}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.94 }}
              animate={st.down ? { rotate: [0, -4, 3, -2, 0] } : { rotate: 0 }}
              transition={{ duration: 0.4 }}
              style={{ transformOrigin: `${f.x}px ${f.y}px`, transformBox: "view-box" }}
              className="cursor-pointer"
              role="button"
              aria-label={`${f.label} follower, ${st.down ? "offline, click to bring back" : "click to take offline"}`}
            >
              <rect
                x={f.x - W / 2}
                y={f.y - H / 2}
                width={W}
                height={H}
                rx={10}
                fill={st.down ? "#fef2f2" : "#fff"}
                stroke={st.down ? "#dc2626" : "#0a0a0a"}
                strokeWidth={1.5}
                strokeDasharray={st.down ? "4 3" : undefined}
                className="transition-colors"
              />
              <text x={f.x} y={f.y - 6} textAnchor="middle" className={st.down ? "fill-red-600 text-[11px] font-semibold" : "fill-zinc-900 text-[11px] font-semibold"}>
                {st.down ? "offline" : `follower · ${f.label}`}
              </text>
              <Tiles n={st.log} head={leader} x={f.x} y={f.y + 6} />
              <text x={f.x} y={f.y + H / 2 + 16} textAnchor="middle" className="fill-zinc-500 font-mono text-[10px]">
                {st.down ? `${st.pending} missed` : lagging[i] > 0 ? `${lagging[i]} behind` : "in sync"}
              </text>
            </motion.g>
          );
        })}
      </svg>
      <div className="mt-1 flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
        <MousePointerClick className="size-3.5 shrink-0" />
        Click the leader to write. Click a follower to knock it offline.
      </div>
    </div>
  );
}
