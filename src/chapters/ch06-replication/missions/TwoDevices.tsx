import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Laptop, RotateCcw, Smartphone, WifiOff, Wifi, Merge, Clock } from "lucide-react";
import type { MissionProps } from "@/components/chapter/types";
import { Coach, type Tone } from "@/components/chapter/Coach";
import { Goals } from "@/components/chapter/Goals";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type DeviceId = "laptop" | "phone";
interface Doc {
  title: string;
  items: string[];
  /** logical clock of this device's last edit */
  at: number;
  renamed: boolean;
}
const BASE = { title: "Groceries", items: ["Bread"] };
const EDITS: Record<DeviceId, { item: string; rename: string }> = {
  laptop: { item: "Milk", rename: "Weekend shop" },
  phone: { item: "Eggs", rename: "Party supplies" },
};

type Strategy = "lww" | "crdt";
interface Result {
  strategy: Strategy;
  winner?: DeviceId;
  title: string | null;
  titleOptions: string[];
  items: { name: string; state: "kept" | "lost" }[];
}

const fresh = (): Record<DeviceId, Doc> => ({
  laptop: { ...BASE, items: [...BASE.items], at: 0, renamed: false },
  phone: { ...BASE, items: [...BASE.items], at: 0, renamed: false },
});

const clock = (t: number) => `10:0${Math.min(t, 9)}`;

function Device({
  id,
  doc,
  online,
  onAdd,
  onRename,
  locked,
}: {
  id: DeviceId;
  doc: Doc;
  online: boolean;
  onAdd: () => void;
  onRename: () => void;
  locked: boolean;
}) {
  const Icon = id === "laptop" ? Laptop : Smartphone;
  const e = EDITS[id];
  const added = doc.items.includes(e.item);
  return (
    <div className="flex flex-col rounded-xl border bg-background">
      <div className="flex items-center justify-between border-b px-3 py-2">
        <span className="flex items-center gap-1.5 text-xs font-medium capitalize">
          <Icon className="size-3.5" /> {id}
        </span>
        <Badge variant={online ? "ok" : "outline"} className="text-[10px]">
          {online ? <Wifi /> : <WifiOff />} {online ? "online" : "offline"}
        </Badge>
      </div>
      <div className="flex-1 p-3">
        <div className="text-sm font-semibold">{doc.title}</div>
        <ul className="mt-2 space-y-1">
          {doc.items.map((it) => (
            <li key={it} className="flex items-center gap-2 text-sm">
              <span className="size-3 rounded-sm border" /> {it}
            </li>
          ))}
        </ul>
        {doc.at > 0 && (
          <div className="mt-2 flex items-center gap-1 font-mono text-[10px] text-muted-foreground">
            <Clock className="size-3" /> last edit {clock(doc.at)}
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5 border-t p-2">
        <Button size="sm" variant="outline" onClick={onAdd} disabled={locked || added}>
          + {e.item}
        </Button>
        <Button size="sm" variant="ghost" onClick={onRename} disabled={locked || doc.renamed}>
          Rename → “{e.rename}”
        </Button>
      </div>
    </div>
  );
}

export default function TwoDevices({ onComplete, done }: MissionProps) {
  const [docs, setDocs] = useState(fresh);
  const [t, setT] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const [solved, setSolved] = useState(done);

  const bothEdited = docs.laptop.items.length > 1 && docs.phone.items.length > 1;

  const edit = (id: DeviceId, kind: "add" | "rename") => {
    const nt = t + 1;
    setT(nt);
    setDocs((d) => {
      const doc = d[id];
      const next =
        kind === "add"
          ? { ...doc, items: [...doc.items, EDITS[id].item], at: nt }
          : { ...doc, title: EDITS[id].rename, renamed: true, at: nt };
      return { ...d, [id]: next };
    });
  };

  const sync = (strategy: Strategy) => {
    const { laptop, phone } = docs;
    const allItems = Array.from(new Set([...laptop.items, ...phone.items]));
    if (strategy === "lww") {
      const winner: DeviceId = laptop.at > phone.at ? "laptop" : "phone";
      const w = docs[winner];
      setResult({
        strategy,
        winner,
        title: w.title,
        titleOptions: [],
        items: allItems.map((name) => ({ name, state: w.items.includes(name) ? "kept" : "lost" })),
      });
      return;
    }
    // CRDT: items are an add-wins set (union); the title is a register that may hold concurrent values
    const titles = Array.from(new Set([laptop.title, phone.title].filter((x) => x !== BASE.title)));
    const title = titles.length === 0 ? BASE.title : titles.length === 1 ? titles[0] : null;
    setResult({ strategy, title, titleOptions: titles.length > 1 ? titles : [], items: allItems.map((name) => ({ name, state: "kept" })) });
    if (title !== null) finish();
  };

  const finish = () => {
    setSolved(true);
    onComplete();
  };

  const pickTitle = (title: string) => {
    if (!result) return;
    setResult({ ...result, title, titleOptions: [] });
    finish();
  };

  const reset = () => {
    setDocs(fresh());
    setT(0);
    setResult(null);
  };

  const lost = result?.items.filter((i) => i.state === "lost") ?? [];

  const coach: { tone: Tone; text: React.ReactNode } = !bothEdited
    ? { tone: "info", text: <>Both devices are offline. Each one accepts writes like a leader. Add an item on <b>each</b> device; renaming is optional.</> }
    : !result
      ? { tone: "info", text: <>Two leaders, two versions. Bring them back online. How should the copies be reconciled?</> }
      : result.strategy === "lww"
        ? {
            tone: "fail",
            text: (
              <>
                <b>Last write wins</b> kept the {result.winner}'s copy (edited later) and <b>silently dropped</b>{" "}
                {lost.map((l) => l.name).join(", ")}. Nobody was asked.
              </>
            ),
          }
        : result.title === null
          ? { tone: "warn", text: <>Every item survived. But both devices renamed the list, and a set can't merge one title. Pick which to keep.</> }
          : { tone: "ok", text: <>A <b>CRDT</b> merged both sets of edits automatically. This is how sync engines and local-first apps work.</> };

  return (
    <div className="flex flex-col gap-4">
      <Goals
        items={[
          { label: "Edit the list on both devices", done: bothEdited || solved },
          { label: "Sync without losing anyone's item", done: solved },
        ]}
      />

      <div className="grid items-stretch gap-3 md:grid-cols-[1fr_1.1fr_1fr]">
        <Device id="laptop" doc={docs.laptop} online={!!result} locked={!!result} onAdd={() => edit("laptop", "add")} onRename={() => edit("laptop", "rename")} />

        <div className="flex flex-col justify-center rounded-xl border border-dashed bg-dots p-3">
          <AnimatePresence mode="wait">
            {!result ? (
              <motion.div key="pick" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-2 text-center">
                <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Reconnect & sync using</div>
                <Button className="w-full" variant="outline" disabled={!bothEdited} onClick={() => sync("lww")}>
                  <Clock /> Last write wins
                </Button>
                <Button className="w-full" disabled={!bothEdited} onClick={() => sync("crdt")}>
                  <Merge /> Merge (CRDT)
                </Button>
              </motion.div>
            ) : (
              <motion.div key="res" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="rounded-lg border bg-background p-3">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Synced copy</span>
                  <Badge variant={result.strategy === "lww" ? "fail" : "ok"} className="text-[10px]">
                    {result.strategy === "lww" ? "LWW" : "CRDT"}
                  </Badge>
                </div>
                {result.title !== null ? (
                  <div className="text-sm font-semibold">{result.title}</div>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {result.titleOptions.map((o) => (
                      <button
                        key={o}
                        onClick={() => pickTitle(o)}
                        className="cursor-pointer rounded border border-warn bg-warn/10 px-2 py-0.5 text-xs font-medium text-warn hover:bg-warn/20"
                      >
                        {o}
                      </button>
                    ))}
                  </div>
                )}
                <ul className="mt-2 space-y-1">
                  {result.items.map((it) => (
                    <li key={it.name} className={cn("flex items-center gap-2 text-sm", it.state === "lost" && "text-fail line-through")}>
                      <span className={cn("size-3 rounded-sm border", it.state === "lost" && "border-fail")} /> {it.name}
                      {it.state === "lost" && <span className="text-[10px] no-underline">lost</span>}
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <Device id="phone" doc={docs.phone} online={!!result} locked={!!result} onAdd={() => edit("phone", "add")} onRename={() => edit("phone", "rename")} />
      </div>

      <Coach tone={coach.tone} k={`${bothEdited}-${result?.strategy}-${result?.title}`}>
        {coach.text}
      </Coach>

      <div className="flex gap-2">
        {result?.strategy === "lww" && <Button onClick={() => setResult(null)}>Try another strategy</Button>}
        <Button variant="ghost" size="sm" className="ml-auto" onClick={reset}>
          <RotateCcw /> Restart
        </Button>
      </div>
    </div>
  );
}
