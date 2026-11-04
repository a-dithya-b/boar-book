import type { ComponentType } from "react";
import { ReplicaToy } from "@/components/landing/ReplicaToy";
import { TradeOffToy } from "./ch01-trade-offs/toy";
import { LatencyToy } from "./ch02-nonfunctional/toy";
import type { IntroScene } from "@/components/transition/types";
import { defaultIntro } from "@/components/transition/DefaultIntro";
import { replicationIntro } from "./ch06-replication/intro";
import { tradeOffsIntro } from "./ch01-trade-offs/intro";
import { nonfunctionalIntro } from "./ch02-nonfunctional/intro";

/**
 * Every playable chapter registers here:
 *  - `load`: the chapter page, code-split (it's preloaded while the intro plays)
 *  - `intro`: its entrance scene (keep it small: it's in the main bundle)
 *  - `toy`: a small interactive teaser for the home page's "Try it" card (also main bundle)
 */
export interface ChapterEntry {
  load: () => Promise<{ default: ComponentType }>;
  intro?: IntroScene;
  toy?: { Toy: ComponentType; label: string };
}

export const CHAPTER_REGISTRY: Record<string, ChapterEntry> = {
  "trade-offs": { load: () => import("./ch01-trade-offs"), intro: tradeOffsIntro, toy: { Toy: TradeOffToy, label: "Trade-offs" } },
  "nonfunctional-requirements": {
    load: () => import("./ch02-nonfunctional"),
    intro: nonfunctionalIntro,
    toy: { Toy: LatencyToy, label: "Latency" },
  },
  replication: { load: () => import("./ch06-replication"), intro: replicationIntro, toy: { Toy: ReplicaToy, label: "Replication" } },
};

export const introFor = (slug: string): IntroScene => CHAPTER_REGISTRY[slug]?.intro ?? defaultIntro;
