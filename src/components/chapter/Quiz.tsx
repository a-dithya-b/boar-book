import { useState } from "react";
import { motion } from "motion/react";
import { ArrowRight, Check, RotateCcw, X } from "lucide-react";
import type { QuizQuestion } from "./types";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export function Quiz({ questions, onComplete }: { questions: QuizQuestion[]; onComplete: (score: number) => void }) {
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const q = questions[i];
  const answered = picked !== null;

  const pick = (o: number) => {
    if (answered) return;
    setPicked(o);
    if (o === q.answer) setScore((s) => s + 1);
  };

  const next = () => {
    if (i + 1 >= questions.length) {
      setFinished(true);
      onComplete(score);
      return;
    }
    setI(i + 1);
    setPicked(null);
  };

  const restart = () => {
    setI(0);
    setPicked(null);
    setScore(0);
    setFinished(false);
  };

  if (finished) {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <div className="font-mono text-5xl font-semibold tabular-nums">
          {score}/{questions.length}
        </div>
        <p className="text-sm text-muted-foreground">
          {score === questions.length ? "Flawless. You clearly read the chapter." : "Nice. Every miss is now a memory."}
        </p>
        <Button variant="outline" size="sm" onClick={restart}>
          <RotateCcw /> Go again
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-5 flex items-center gap-3">
        <span className="font-mono text-xs text-muted-foreground tabular-nums">
          {i + 1}/{questions.length}
        </span>
        <Progress value={((i + (answered ? 1 : 0)) / questions.length) * 100} />
      </div>
      <motion.div key={i} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.25 }}>
        <p className="mb-4 text-base font-medium text-pretty">{q.q}</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {q.options.map((o, j) => {
            const isRight = j === q.answer;
            const isPicked = j === picked;
            return (
              <button
                key={j}
                onClick={() => pick(j)}
                disabled={answered}
                className={cn(
                  "flex items-center justify-between gap-3 rounded-lg border px-4 py-3 text-left text-sm transition-colors",
                  !answered && "cursor-pointer hover:border-foreground/40 hover:bg-muted/50",
                  answered && isRight && "border-ok bg-ok/8",
                  answered && isPicked && !isRight && "border-fail bg-fail/8",
                  answered && !isRight && !isPicked && "opacity-50",
                )}
              >
                <span>{o}</span>
                {answered && isRight && <Check className="size-4 shrink-0 text-ok" />}
                {answered && isPicked && !isRight && <X className="size-4 shrink-0 text-fail" />}
              </button>
            );
          })}
        </div>
        {answered && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <p className="text-sm text-muted-foreground text-pretty">
              <span className={cn("font-medium", picked === q.answer ? "text-ok" : "text-fail")}>
                {picked === q.answer ? "Right. " : "Not quite. "}
              </span>
              {q.why}
            </p>
            <Button onClick={next} size="sm" className="shrink-0 self-end sm:self-auto">
              {i + 1 >= questions.length ? "Finish" : "Next"} <ArrowRight />
            </Button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
