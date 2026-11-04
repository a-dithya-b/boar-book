import type { ComponentType } from "react";
import type { ChapterMeta } from "@/content/chapters";

export interface IntroProps {
  meta: ChapterMeta;
  /** 1 on the first visit; higher on repeat visits, so scenes play faster. Divide your timings by it. */
  speed: number;
}

/** A chapter's entrance: a short full-screen scene shown while the chapter loads. */
export interface IntroScene {
  Scene: ComponentType<IntroProps>;
  /** How long the scene needs at speed 1, in ms, before the curtain may lift. */
  duration: number;
}
