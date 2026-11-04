import { lazy } from "react";
import { chapterBySlug } from "@/content/chapters";
import { ChapterShell } from "@/components/chapter/ChapterShell";
import type { ChapterContent } from "@/components/chapter/types";
import BugTriage from "./missions/BugTriage";
import TwoDevices from "./missions/TwoDevices";
import Quorum from "./missions/Quorum";

const Failover = lazy(() => import("./missions/Failover"));

const content: ChapterContent = {
  tagline: "Same data on many machines. Keep the copies in step, survive crashes, and handle the oddities that lag creates.",
  recap: [
    { q: "Why keep copies of the same data?", a: "To survive machine failures, to stay close to users, and to spread reads across more machines." },
    { q: "What separates the three replication styles?", a: "Who may accept writes: a single leader, several leaders, or any replica (leaderless)." },
    { q: "Sync or async follower: which one can lose data?", a: "Async. The leader confirms before the follower has the write, so a crash can lose it. Sync waits, and pays for it in latency." },
    { q: "What is replication lag?", a: "How far a follower trails the leader. Usually milliseconds; under load, seconds or minutes. Users notice." },
  ],
  missions: [
    {
      id: "failover",
      title: "Keep the lights on",
      goal: "Send writes, survive a leader crash, and handle its comeback.",
      tag: "3D",
      component: Failover,
    },
    {
      id: "lag",
      title: "Bug triage",
      goal: "Reproduce three lag bugs and name the guarantee that fixes each.",
      tag: "2D",
      component: BugTriage,
    },
    {
      id: "multi-leader",
      title: "Two devices, one list",
      goal: "Edit offline on two devices, then sync without losing data.",
      tag: "2D",
      component: TwoDevices,
    },
    {
      id: "quorum",
      title: "Quorum dial",
      goal: "Tune w and r so reads stay fresh, even with nodes down.",
      tag: "2D",
      component: Quorum,
    },
  ],
  quiz: [
    {
      q: "A leader confirms a write, then crashes before its async follower receives it. That follower gets promoted. What happens to the write?",
      options: ["It's lost", "It's replayed automatically", "It waits for the old leader", "It's merged in later"],
      answer: 0,
      why: "With async replication, “confirmed” doesn't mean “on another machine”. Promote a lagging follower and confirmed writes disappear.",
    },
    {
      q: "n = 3, w = 2, r = 1. Is every read guaranteed to see the latest successful write?",
      options: ["Yes, a majority stored it", "No, 2 + 1 is not greater than 3"],
      answer: 1,
      why: "You need w + r > n, so the read set must overlap the write set by at least one node.",
    },
    {
      q: "Statement-based replication sends `UPDATE users SET token = RANDOM()` to every follower. What goes wrong?",
      options: ["Followers reject it", "Nothing, it's deterministic", "It only runs on the leader", "Each replica stores a different value"],
      answer: 3,
      why: "Non-deterministic functions evaluate differently on each replica. That's why most systems ship row-level (logical) changes instead.",
    },
    {
      q: "You see a friend's new photo, refresh, and it's gone. Which guarantee is missing?",
      options: ["Read-your-writes", "Consistent prefix reads", "Monotonic reads", "Durability"],
      answer: 2,
      why: "Your second read hit a replica further behind, so time went backwards. Pinning you to one replica fixes it.",
    },
    {
      q: "Two offline phones each add an item to a shared list. Which approach keeps both items without asking anyone?",
      options: ["A CRDT (e.g. an add-wins set)", "Last write wins", "Reading from the leader", "A bigger timeout"],
      answer: 0,
      why: "CRDTs are data types designed so concurrent edits merge automatically. Last write wins picks one version and silently drops the other.",
    },
    {
      q: "After failover, the old leader comes back still believing it's the leader. What is the danger?",
      options: ["Slower reads", "Nothing, it steps down by itself", "Hinted handoff fills the disk", "Split brain: two nodes accept conflicting writes"],
      answer: 3,
      why: "Two leaders means diverging data. Systems use epoch numbers or fencing to make the stale leader's writes fail.",
    },
  ],
  takeaways: [
    "Replication keeps copies of the same data on several machines: for availability, lower latency, and read scaling.",
    "Single-leader: every write goes through one node; followers replay its log. Simple, until failover.",
    "Async followers keep writes fast, but a crashing leader can take confirmed writes with it. Sync trades latency for safety.",
    "Failover pitfalls: promoting a stale follower (lost writes) and split brain when the old leader returns.",
    "Lag shows up as user-visible bugs. Read-your-writes, monotonic reads and consistent prefix reads are the targeted fixes.",
    "Multi-leader (regions, offline devices, sync engines) means concurrent writes conflict. LWW silently loses data; CRDTs merge.",
    "Leaderless: write to w and read from r of n replicas. w + r > n forces overlap; read repair heals stale copies.",
    "Ship a logical (row-level) change log, not raw statements, so non-determinism can't make replicas diverge.",
  ],
};

export default function Replication() {
  return <ChapterShell meta={chapterBySlug("replication")!} content={content} />;
}
