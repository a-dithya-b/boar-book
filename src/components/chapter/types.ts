import type { ComponentType } from "react";

export interface RecapCard {
  q: string;
  a: string;
}

export interface MissionProps {
  onComplete: () => void;
  done: boolean;
}

export interface Mission {
  id: string;
  title: string;
  /** one line, what you'll do */
  goal: string;
  tag: "3D" | "2D";
  component: ComponentType<MissionProps>;
}

export interface QuizQuestion {
  q: string;
  options: string[];
  answer: number;
  why: string;
}

export interface ChapterContent {
  tagline: string;
  recap: RecapCard[];
  missions: Mission[];
  quiz: QuizQuestion[];
  takeaways: string[];
}
