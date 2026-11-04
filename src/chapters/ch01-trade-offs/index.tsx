import { lazy } from "react";
import { chapterBySlug } from "@/content/chapters";
import { ChapterShell } from "@/components/chapter/ChapterShell";
import type { ChapterContent } from "@/components/chapter/types";
import SortWorkload from "./missions/SortWorkload";
import SpreadOut from "./missions/SpreadOut";
import ForgetMe from "./missions/ForgetMe";

const WeighIt = lazy(() => import("./missions/WeighIt"));

const content: ChapterContent = {
  tagline: "No architecture is best at everything. Learn to spot what a choice buys you, and what it costs.",
  recap: [
    {
      q: "OLTP vs OLAP, in one line each?",
      a: "Operational systems serve users: small reads and writes by key. Analytical systems answer questions: big scans and aggregates.",
    },
    {
      q: "Why copy data into a warehouse at all?",
      a: "So heavy analysis doesn't slow down users, and data from many systems can be combined in one place. ETL does the copying.",
    },
    {
      q: "What does the cloud really trade?",
      a: "Less operations work and instant elasticity, in exchange for less control, possible lock-in, and higher cost for big steady loads.",
    },
    {
      q: "When is a single machine not enough?",
      a: "When you need fault tolerance, more capacity than one box, or low latency for users far apart. Otherwise, stay simple.",
    },
  ],
  missions: [
    {
      id: "sort",
      title: "Sort the workload",
      goal: "Route each request to the operational DB or the warehouse, then feed the warehouse.",
      tag: "2D",
      component: SortWorkload,
    },
    {
      id: "weigh",
      title: "Weigh it",
      goal: "Load the scale with each company's factors and see where it tips: cloud or self-host.",
      tag: "3D",
      component: WeighIt,
    },
    {
      id: "spread",
      title: "Spread out?",
      goal: "Place servers on the map. One machine, or many?",
      tag: "2D",
      component: SpreadOut,
    },
    {
      id: "forget",
      title: "Forget me",
      goal: "A user asks to be deleted. Find every copy of her data.",
      tag: "2D",
      component: ForgetMe,
    },
  ],
  quiz: [
    {
      q: "A report scans 200 million rows to compute monthly revenue. Where should it run?",
      options: ["On the database the app writes to", "On the data warehouse", "In the user's browser", "In the load balancer"],
      answer: 1,
      why: "Big scans belong on the analytical copy, where they can't slow down the queries users are waiting on.",
    },
    {
      q: "Which of these is a system of record?",
      options: ["A search index", "A cache", "The database where orders are first written", "A dashboard"],
      answer: 2,
      why: "The system of record holds the authoritative version. Indexes, caches and warehouses are derived from it and can be rebuilt.",
    },
    {
      q: "Keeping data in object storage, separate from compute, mainly lets you…",
      options: ["Scale compute up and down without moving the data", "Skip backups", "Avoid using the network", "Never pay for storage"],
      answer: 0,
      why: "Separating storage from compute is a cloud-native pattern: spin compute up for a spike, shut it down after, and the data stays put.",
    },
    {
      q: "Which is NOT a good reason to make a system distributed?",
      options: ["Users on several continents need low latency", "Surviving a machine failure", "The workload outgrew one machine", "It sounds more modern"],
      answer: 3,
      why: "Distribution adds network failures and harder debugging. Pay that price only for a real need.",
    },
    {
      q: "You delete a user's row from the app database. Where else might their data still be?",
      options: ["Nowhere, it's gone", "Warehouse, search index, logs, backups, ML models", "Only in RAM", "Only on their phone"],
      answer: 1,
      why: "Derived data spreads copies. Honouring a deletion request means tracking all of them down.",
    },
    {
      q: "In a microservices architecture, each service typically…",
      options: ["Owns its data and talks to others over the network", "Shares one big database with every other service", "Runs on the same machine as the others", "Has no state at all"],
      answer: 0,
      why: "Services own their data and communicate over APIs. That gives teams independence, at the cost of more network calls that can fail.",
    },
  ],
  takeaways: [
    "Operational (OLTP) systems serve users with small, keyed reads and writes; analytical (OLAP) systems scan and aggregate huge amounts of data.",
    "Analytics usually run on a separate copy (a warehouse or lake), fed by ETL, so heavy queries don't hurt users.",
    "Systems of record hold the authoritative data; derived data (warehouses, caches, indexes, models) can be rebuilt from them.",
    "Cloud services trade control (and sometimes cost) for less ops work and elasticity. Big, steady workloads can be cheaper self-hosted.",
    "Cloud-native designs separate storage from compute, so compute can scale without moving data.",
    "Distribute for fault tolerance, capacity, latency or compliance. A single node is simpler, and often enough.",
    "Distribution brings slow and failing networks, partial failures and harder debugging; microservices and serverless add more seams.",
    "Data carries legal and human weight. Laws like the GDPR give people rights over it, and collecting less makes them easier to honour.",
  ],
};

export default function TradeOffs() {
  return <ChapterShell meta={chapterBySlug("trade-offs")!} content={content} />;
}
