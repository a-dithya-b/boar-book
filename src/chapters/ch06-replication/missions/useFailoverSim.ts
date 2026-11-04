import { useCallback, useEffect, useReducer, useRef } from "react";

export type NodeId = "C" | "L" | "A" | "B";
export type Role = "client" | "leader" | "follower";
export type Status = "up" | "down" | "zombie";

export interface SimNode {
  id: NodeId;
  name: string;
  role: Role;
  status: Status;
  sync?: boolean;
  log: string[];
}

export interface Packet {
  id: number;
  from: NodeId;
  to: NodeId;
  kind: "write" | "ack" | "conflict";
  start: number;
  dur: number;
  cancelled?: boolean;
}

export type Phase = "writing" | "crashed" | "wrongPick" | "promoted" | "zombie" | "splitBrain" | "done";

interface State {
  nodes: Record<NodeId, SimNode>;
  packets: Packet[];
  phase: Phase;
  sent: number;
  acked: number[];
  leader: NodeId;
  missing: string[];
}

export const TOTAL_WRITES = 3;
const LAG_B = 4200; // the async follower's slow link

const initial = (): State => ({
  nodes: {
    C: { id: "C", name: "Client", role: "client", status: "up", log: [] },
    L: { id: "L", name: "Node 1", role: "leader", status: "up", log: [] },
    A: { id: "A", name: "Node 2", role: "follower", status: "up", sync: true, log: [] },
    B: { id: "B", name: "Node 3", role: "follower", status: "up", sync: false, log: [] },
  },
  packets: [],
  phase: "writing",
  sent: 0,
  acked: [],
  leader: "L",
  missing: [],
});

/** Imperative little simulation: state lives in a ref, `force` re-renders. */
export function useFailoverSim(onComplete: () => void) {
  const s = useRef<State>(initial());
  const [, force] = useReducer((x: number) => x + 1, 0);
  const timers = useRef<number[]>([]);
  const pid = useRef(0);

  const later = (ms: number, fn: () => void) => {
    timers.current.push(window.setTimeout(fn, ms));
  };

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const send = useCallback((from: NodeId, to: NodeId, kind: Packet["kind"], dur: number, onArrive?: () => void) => {
    const p: Packet = { id: ++pid.current, from, to, kind, start: performance.now(), dur };
    s.current.packets = [...s.current.packets, p];
    force();
    later(dur, () => {
      s.current.packets = s.current.packets.filter((x) => x.id !== p.id);
      const target = s.current.nodes[to];
      if (!p.cancelled && target.status !== "down") onArrive?.();
      force();
    });
  }, []);

  const crashLeader = () => {
    const st = s.current;
    st.nodes.L = { ...st.nodes.L, status: "down" };
    // anything the leader was still sending dies with it
    st.packets.forEach((p) => {
      if (p.from === "L") p.cancelled = true;
    });
    st.packets = st.packets.filter((p) => p.from !== "L");
    st.phase = "crashed";
    force();
  };

  const sendWrite = () => {
    const st = s.current;
    if (st.phase !== "writing" || st.sent >= TOTAL_WRITES) return;
    const n = String(++st.sent);
    force();
    send("C", "L", "write", 650, () => {
      st.nodes.L.log = [...st.nodes.L.log, n];
      // async follower: leader doesn't wait
      send("L", "B", "write", LAG_B, () => {
        st.nodes.B.log = [...st.nodes.B.log, n];
      });
      // sync follower: leader waits for its ack before confirming
      send("L", "A", "write", 550, () => {
        st.nodes.A.log = [...st.nodes.A.log, n];
        send("A", "L", "ack", 400, () => {
          send("L", "C", "ack", 500, () => {
            st.acked = [...st.acked, Number(n)];
            if (st.acked.length === TOTAL_WRITES) later(900, crashLeader);
          });
        });
      });
    });
  };

  const promote = (id: "A" | "B") => {
    const st = s.current;
    if (st.phase !== "crashed") return;
    const node = st.nodes[id];
    const missing = st.acked.map(String).filter((w) => !node.log.includes(w));
    if (missing.length > 0) {
      st.missing = missing;
      st.phase = "wrongPick";
      force();
      return;
    }
    st.nodes[id] = { ...node, role: "leader" };
    st.leader = id;
    st.phase = "promoted";
    force();
    // the other follower catches up from the new leader
    const other = id === "A" ? "B" : "A";
    const behind = node.log.filter((w) => !st.nodes[other].log.includes(w));
    behind.forEach((w, i) =>
      later(i * 250, () =>
        send(id, other, "write", 700, () => {
          st.nodes[other].log = [...st.nodes[other].log, w].sort();
        }),
      ),
    );
    // ...and then the old leader reboots, still convinced it's in charge
    later(2600, () => {
      st.nodes.L = { ...st.nodes.L, status: "zombie" };
      st.phase = "zombie";
      force();
    });
  };

  const undoPick = () => {
    s.current.phase = "crashed";
    s.current.missing = [];
    force();
  };

  const letBothLead = () => {
    const st = s.current;
    if (st.phase !== "zombie") return;
    st.phase = "splitBrain";
    force();
    const nl = st.leader;
    send("C", "L", "conflict", 650, () => {
      st.nodes.L.log = [...st.nodes.L.log, "4a"];
    });
    send("C", nl, "conflict", 650, () => {
      st.nodes[nl].log = [...st.nodes[nl].log, "4b"];
    });
  };

  const rewind = () => {
    const st = s.current;
    (["L", "A", "B"] as NodeId[]).forEach((id) => {
      st.nodes[id].log = st.nodes[id].log.filter((w) => !w.startsWith("4"));
    });
    st.phase = "zombie";
    force();
  };

  const demote = () => {
    const st = s.current;
    if (st.phase !== "zombie") return;
    st.nodes.L = { ...st.nodes.L, role: "follower", status: "up", sync: false };
    st.phase = "done";
    force();
    onComplete();
  };

  const reset = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    s.current = initial();
    force();
  };

  return { state: s.current, sendWrite, promote, undoPick, letBothLead, rewind, demote, reset };
}
