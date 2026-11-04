import { lazy } from "react";
import { chapterBySlug } from "@/content/chapters";
import { ChapterShell } from "@/components/chapter/ChapterShell";
import type { ChapterContent } from "@/components/chapter/types";
import ReadTheTail from "./missions/ReadTheTail";
import Chaos from "./missions/Chaos";
import ScaleIt from "./missions/ScaleIt";

const FanOut = lazy(() => import("./missions/FanOut"));

const content: ChapterContent = {
  tagline: "Not what a system does, but how well: fast enough, up when it matters, ready to grow, and easy to keep changing.",
  recap: [
    {
      q: "What makes a requirement “nonfunctional”?",
      a: "It's about how well the system works, not what it does: speed, reliability, scalability, and how easy it is to run and change.",
    },
    {
      q: "Why not just report the average response time?",
      a: "A few very slow requests hide inside the mean. Percentiles like p99 show what your unluckiest users actually feel.",
    },
    {
      q: "Fault or failure: what's the difference?",
      a: "A fault is one part going wrong. A failure is users noticing. Good design stops the first from becoming the second.",
    },
    {
      q: "Scale up or scale out?",
      a: "Up: one bigger machine, simple but capped and pricey. Out: more machines, nearly unlimited, but the data must be split.",
    },
  ],
  missions: [
    {
      id: "fanout",
      title: "Timeline fan-out",
      goal: "Run a tiny social network. Find a timeline strategy that survives a celebrity.",
      tag: "3D",
      component: FanOut,
    },
    {
      id: "tail",
      title: "Read the tail",
      goal: "Guess the median and the p99, then watch one slow call slow a whole page.",
      tag: "2D",
      component: ReadTheTail,
    },
    {
      id: "chaos",
      title: "Fault, not failure",
      goal: "Choose three defences, then run a chaos test.",
      tag: "2D",
      component: Chaos,
    },
    {
      id: "scale",
      title: "Scale it",
      goal: "Keep up as traffic grows 2×, 6×, 20× on a fixed budget.",
      tag: "2D",
      component: ScaleIt,
    },
  ],
  quiz: [
    {
      q: "Median response time is 80 ms, but 1 request in 100 takes 2 seconds. Which number shows that?",
      options: ["The mean", "The median", "The p99", "The minimum"],
      answer: 2,
      why: "The p99 is the time 99% of requests beat. It's where the slow tail shows up; the median ignores it and the mean blurs it.",
    },
    {
      q: "A page waits on 10 backend calls in parallel. Each is slow 1% of the time. Roughly how often is the page slow?",
      options: ["About 10%", "About 1%", "About 0.1%", "Never"],
      answer: 0,
      why: "1 − 0.99¹⁰ ≈ 10%. A request is as slow as its slowest dependency: tail latency amplification.",
    },
    {
      q: "With fan-out on write, what happens when someone posts?",
      options: [
        "Followers' timelines are built when they open the app",
        "Nothing until a follower asks",
        "The post is copied into each follower's cached timeline",
        "The post is deleted after a day",
      ],
      answer: 2,
      why: "Writes do the work up front so reads are cheap. It breaks down for accounts with millions of followers.",
    },
    {
      q: "Which is a failure, not just a fault?",
      options: ["One disk in a replicated set dies", "Users can't load the page", "A process restarts after a crash", "A canary deploy is rolled back"],
      answer: 1,
      why: "A fault is a component going wrong; a failure is the system as a whole stopping service to users.",
    },
    {
      q: "In a shared-nothing architecture, each node…",
      options: ["has its own CPU, memory and disk, and coordinates over the network", "shares one big disk with the others", "is a thread on one huge machine", "stores no data"],
      answer: 0,
      why: "Shared-nothing scales out across ordinary machines, at the cost of splitting data and coordinating over a network.",
    },
    {
      q: "Operability, simplicity and evolvability are all part of…",
      options: ["Latency", "Maintainability", "Throughput", "Fan-out"],
      answer: 1,
      why: "Most of a system's cost comes after launch. Maintainability is about keeping it easy to run, understand and change.",
    },
  ],
  takeaways: [
    "Nonfunctional requirements describe how well a system works: performance, reliability, scalability and maintainability.",
    "Describe load with the numbers that drive your system, like posts per second, timeline reads per second, and fan-out.",
    "Timelines: fan-out on read is cheap to post and costly to read; fan-out on write is the reverse. Celebrities push you to a hybrid.",
    "Response time is a distribution. Use the median for the typical case and p95/p99/p999 for the tail; averages hide outliers.",
    "Tail latency amplifies: a request that waits on many backends is as slow as the slowest one.",
    "Faults are inevitable. Reliability means tolerating them so they don't become failures. Hardware, software and human faults need different defences.",
    "Scaling up (shared-memory) is simple but capped and pricey; scaling out (shared-nothing) grows further but needs data split and coordination.",
    "Maintainability is operability, simplicity and evolvability: most of a system's cost comes after it ships.",
  ],
};

export default function Nonfunctional() {
  return <ChapterShell meta={chapterBySlug("nonfunctional-requirements")!} content={content} />;
}
