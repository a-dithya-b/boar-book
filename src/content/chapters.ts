export type Part = 1 | 2 | 3;

export interface ChapterMeta {
  n: number;
  slug: string;
  title: string;
  part: Part;
  /** one short line: what you'll do */
  play: string;
  ready: boolean;
}

export const PARTS: Record<Part, string> = {
  1: "Foundations of Data Systems",
  2: "Distributed Data",
  3: "Derived Data",
};

export const CHAPTERS: ChapterMeta[] = [
  { n: 1, slug: "trade-offs", title: "Trade-offs in Data Systems Architecture", part: 1, play: "Sort OLTP from analytics, weigh cloud vs self-hosting, place servers, delete a user everywhere.", ready: true },
  { n: 2, slug: "nonfunctional-requirements", title: "Defining Nonfunctional Requirements", part: 1, play: "Run a home-timeline fan-out and read latency percentiles.", ready: false },
  { n: 3, slug: "data-models", title: "Data Models and Query Languages", part: 1, play: "Model the same data as relational, document and graph.", ready: false },
  { n: 4, slug: "storage", title: "Storage and Retrieval", part: 1, play: "Flush and compact an LSM-tree; split pages in a B-tree.", ready: false },
  { n: 5, slug: "encoding", title: "Encoding and Evolution", part: 1, play: "Evolve a schema without breaking old or new code.", ready: false },
  { n: 6, slug: "replication", title: "Replication", part: 2, play: "Fail over a leader, triage lag bugs, merge offline edits, tune a quorum.", ready: true },
  { n: 7, slug: "sharding", title: "Sharding", part: 2, play: "Cool down a hot shard and rebalance a cluster.", ready: false },
  { n: 8, slug: "transactions", title: "Transactions", part: 2, play: "Catch lost updates and write skew; pick the isolation level.", ready: false },
  { n: 9, slug: "distributed-trouble", title: "The Trouble with Distributed Systems", part: 2, play: "Stop a zombie leader with fencing tokens.", ready: false },
  { n: 10, slug: "consensus", title: "Consistency and Consensus", part: 2, play: "Check histories for linearizability; elect a leader.", ready: false },
  { n: 11, slug: "batch", title: "Batch Processing", part: 3, play: "Assemble a dataflow pipeline from inputs to outputs.", ready: false },
  { n: 12, slug: "stream", title: "Stream Processing", part: 3, play: "Move consumer offsets and replay an event log.", ready: false },
  { n: 13, slug: "streaming-philosophy", title: "A Philosophy of Streaming Systems", part: 3, play: "Derive several views from one log of events.", ready: false },
  { n: 14, slug: "doing-the-right-thing", title: "Doing the Right Thing", part: 3, play: "Make the call on real-world data-ethics dilemmas.", ready: false },
];

export const chapterBySlug = (slug: string) => CHAPTERS.find((c) => c.slug === slug);
