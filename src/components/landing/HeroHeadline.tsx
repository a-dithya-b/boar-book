import { motion, useAnimate } from "motion/react";

const WORDS = ["Remember", "the", "book", "by", "playing", "with", "it."];

/** Words rise in one by one; a hand-drawn underline sketches itself under "playing". */
export function HeroHeadline() {
  const [scope, animate] = useAnimate();

  const redraw = () => {
    animate("path", { pathLength: [0, 1] }, { duration: 0.6, ease: "easeInOut" });
  };

  return (
    <h1
      ref={scope}
      onPointerEnter={redraw}
      className="max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-6xl sm:leading-[1.05]"
    >
      {WORDS.map((w, i) => (
        <span key={i} className="inline-block overflow-hidden pb-1 align-bottom">
          <motion.span
            className="relative inline-block"
            initial={{ y: "110%" }}
            animate={{ y: 0 }}
            transition={{ duration: 0.6, delay: 0.05 + i * 0.06, ease: [0.22, 1, 0.36, 1] }}
          >
            {w}
            {w === "playing" && (
              <svg
                aria-hidden
                viewBox="0 0 200 20"
                preserveAspectRatio="none"
                className="pointer-events-none absolute -bottom-1 left-0 h-[0.32em] w-full overflow-visible"
              >
                <motion.path
                  d="M2 12 C 40 4, 70 18, 105 9 S 170 4, 198 11"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.7, delay: 0.75, ease: "easeInOut" }}
                />
              </svg>
            )}
          </motion.span>
          {i < WORDS.length - 1 && " "}
        </span>
      ))}
    </h1>
  );
}
