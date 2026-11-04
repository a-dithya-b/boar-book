import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link, useNavigate, type LinkProps } from "react-router";
import { motion } from "motion/react";
import { chapterBySlug } from "@/content/chapters";
import { CHAPTER_REGISTRY, introFor } from "@/chapters/registry";

/**
 * Entering a chapter:
 *   cover  – a black circle grows from where you clicked (on the page you're leaving)
 *   scene  – we navigate underneath; the chapter's intro plays while its code loads
 *   reveal – the curtain lifts and the chapter content rises in
 */
type Phase = "idle" | "cover" | "scene" | "reveal";
type Point = { x: number; y: number };
interface State {
  slug: string | null;
  origin: Point | null;
  phase: Phase;
}

interface Ctx {
  enterChapter: (slug: string, origin?: Point) => void;
  /** true once the chapter is visible: use it to start entrance animations */
  revealed: boolean;
}

const TransitionCtx = createContext<Ctx>({ enterChapter: () => {}, revealed: true });
export const useChapterTransition = () => useContext(TransitionCtx);

const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const SLUG_IN_PATH = /^\/chapter\/([^/]+)/;
const seen = new Set<string>(); // intros seen this visit play faster next time

const COVER_MS = 450;
const REVEAL_MS = 550;
const ease = [0.65, 0, 0.35, 1] as const;

export function ChapterTransitionProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  // landing directly on a chapter URL starts with the scene already covering the page
  const [st, setSt] = useState<State>(() => {
    const m = window.location.pathname.match(SLUG_IN_PATH);
    return m && !reducedMotion() ? { slug: m[1], origin: null, phase: "scene" } : { slug: null, origin: null, phase: "idle" };
  });
  const phase = useRef(st.phase);
  phase.current = st.phase;
  const loaded = useRef(false);
  const sceneDone = useRef(false);
  const timer = useRef<number>(0);

  const tryReveal = useCallback(() => {
    if (phase.current === "scene" && loaded.current && sceneDone.current) setSt((s) => ({ ...s, phase: "reveal" }));
  }, []);

  const preload = useCallback(
    (slug: string) => {
      loaded.current = false;
      const entry = CHAPTER_REGISTRY[slug];
      // the chapter route and the chapter itself are both code-split; fetch both under cover
      Promise.all([import("@/pages/Chapter"), entry ? entry.load() : null])
        .catch(() => {})
        .finally(() => {
          loaded.current = true;
          tryReveal();
        });
    },
    [tryReveal],
  );

  // start the scene clock whenever a scene begins
  useEffect(() => {
    if (st.phase !== "scene" || !st.slug) return;
    sceneDone.current = false;
    const fast = seen.has(st.slug);
    const ms = introFor(st.slug).duration / (fast ? 1.8 : 1);
    timer.current = window.setTimeout(() => {
      seen.add(st.slug!);
      sceneDone.current = true;
      tryReveal();
    }, ms);
    return () => clearTimeout(timer.current);
  }, [st.phase, st.slug, tryReveal]);

  // direct visit: load the chapter that's already covered
  useEffect(() => {
    if (st.phase === "scene" && st.slug && !st.origin) preload(st.slug);
    // only on first mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const skip = useCallback(() => {
    if (phase.current !== "scene") return;
    clearTimeout(timer.current);
    if (st.slug) seen.add(st.slug);
    sceneDone.current = true;
    tryReveal();
  }, [st.slug, tryReveal]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && skip();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [skip]);

  const enterChapter = useCallback(
    (slug: string, origin?: Point) => {
      if (phase.current !== "idle") return;
      if (reducedMotion()) {
        navigate(`/chapter/${slug}`);
        return;
      }
      preload(slug);
      setSt({ slug, origin: origin ?? { x: window.innerWidth / 2, y: window.innerHeight / 2 }, phase: "cover" });
    },
    [navigate, preload],
  );

  const onOverlayDone = () => {
    if (phase.current === "cover") {
      navigate(`/chapter/${st.slug}`);
      setSt((s) => ({ ...s, phase: "scene" }));
    } else if (phase.current === "reveal") {
      setSt({ slug: null, origin: null, phase: "idle" });
    }
  };

  const value = useMemo<Ctx>(
    () => ({ enterChapter, revealed: st.phase === "idle" || st.phase === "reveal" }),
    [enterChapter, st.phase],
  );

  const meta = st.slug ? chapterBySlug(st.slug) : undefined;
  const intro = st.slug ? introFor(st.slug) : null;
  const o = st.origin;
  const radius = o ? Math.hypot(Math.max(o.x, window.innerWidth - o.x), Math.max(o.y, window.innerHeight - o.y)) + 20 : 0;

  return (
    <TransitionCtx.Provider value={value}>
      {children}
      {st.phase !== "idle" && meta && intro && (
        <motion.div
          key={`${st.slug}-overlay`}
          role="dialog"
          aria-label={`Entering ${meta.title}`}
          className="fixed inset-0 z-[100] flex cursor-pointer items-center justify-center overflow-hidden bg-[#0a0a0a] text-white"
          initial={o ? { clipPath: `circle(0px at ${o.x}px ${o.y}px)`, y: 0 } : { clipPath: "none", y: 0 }}
          animate={
            st.phase === "reveal"
              ? { y: "-100%", transition: { duration: REVEAL_MS / 1000, ease } }
              : o
                ? { clipPath: `circle(${radius}px at ${o.x}px ${o.y}px)`, transition: { duration: COVER_MS / 1000, ease } }
                : {}
          }
          onAnimationComplete={onOverlayDone}
          onClick={skip}
        >
          <div aria-hidden className="bg-dots absolute inset-0 opacity-[0.07]" />
          {st.phase !== "cover" && (
            <motion.div
              className="relative flex w-full justify-center"
              animate={st.phase === "reveal" ? { opacity: 0, scale: 1.06 } : { opacity: 1, scale: 1 }}
              transition={{ duration: 0.35 }}
            >
              <intro.Scene meta={meta} speed={seen.has(st.slug!) ? 1.8 : 1} />
            </motion.div>
          )}
          {st.phase === "scene" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.45 }}
              transition={{ delay: 0.6 }}
              className="absolute bottom-6 font-mono text-[11px] tracking-wider"
            >
              click or esc to skip
            </motion.div>
          )}
        </motion.div>
      )}
    </TransitionCtx.Provider>
  );
}

/** A Link to a chapter that plays the entrance transition. Modifier-clicks still open normally. */
export function ChapterLink({ slug, onClick, ...props }: Omit<LinkProps, "to"> & { slug: string }) {
  const { enterChapter } = useChapterTransition();
  return (
    <Link
      to={`/chapter/${slug}`}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
        e.preventDefault();
        enterChapter(slug, e.detail === 0 ? undefined : { x: e.clientX, y: e.clientY });
      }}
      {...props}
    />
  );
}
