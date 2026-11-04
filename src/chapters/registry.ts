import type { ComponentType } from "react";
import type { IntroScene } from "@/components/transition/types";
import { defaultIntro } from "@/components/transition/DefaultIntro";
import { replicationIntro } from "./ch06-replication/intro";
import { tradeOffsIntro } from "./ch01-trade-offs/intro";
import { nonfunctionalIntro } from "./ch02-nonfunctional/intro";

/**
 * Every playable chapter registers here:
 *  - `load`: the chapter page, code-split (it's preloaded while the intro plays)
 *  - `intro`: its entrance scene (keep it small: it's in the main bundle)
 */
export interface ChapterEntry {
  load: () => Promise<{ default: ComponentType }>;
  intro?: IntroScene;
}

export const CHAPTER_REGISTRY: Record<string, ChapterEntry> = {
  "trade-offs": { load: () => import("./ch01-trade-offs"), intro: tradeOffsIntro },
  "nonfunctional-requirements": { load: () => import("./ch02-nonfunctional"), intro: nonfunctionalIntro },
  replication: { load: () => import("./ch06-replication"), intro: replicationIntro },
};

export const introFor = (slug: string): IntroScene => CHAPTER_REGISTRY[slug]?.intro ?? defaultIntro;
