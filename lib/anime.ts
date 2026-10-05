import { cubicBezier } from "animejs";
import { duration, easeOut } from "./motion";

/** Anime.js versions of the shared tokens in lib/motion.ts (milliseconds, easing functions). */
export const animeEaseOut = cubicBezier(easeOut[0], easeOut[1], easeOut[2], easeOut[3]);

export const animeDuration = {
  fast: duration.fast * 1000,
  base: duration.base * 1000,
  slow: duration.slow * 1000,
  intro: duration.intro * 1000,
} as const;

export function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * The hero's scroll sync. Its timing (the opening and every scroll stage) lives in
 * lib/engine-pose.ts as pure functions; this only says how closely the drawing follows the
 * scrollbar (Anime.js `sync`, 0 to 1: higher is smoother and slightly later).
 */
export const heroEngineMotion = {
  scroll: { smooth: 0.8 },
} as const;

/** Rivet's store-and-forward diagram: one pass, then it stops. */
export const meshMotion = {
  nodeDuration: 320,
  nodeStagger: 60,
  hopDuration: 520,
  hopPause: 140,
  receiveDuration: 220,
} as const;

/** Session flag: the full opening plays once per session, later loads show the hero at rest. */
export const INTRO_SEEN_KEY = "portfolio-intro-seen";
