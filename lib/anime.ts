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
 * The opening sequence, in one place. Milliseconds; offsets are when each stage starts.
 * The identity (meta + first words) reads within ~500ms; everything settles by ~1.7s.
 */
export const heroMotion = {
  metaDuration: 300,
  metaRise: 8,
  wordStart: 120,
  wordDuration: 620,
  wordStagger: 70,
  underlineStart: 760,
  underlineDuration: 650,
  ledeStart: 620,
  ledeDuration: 420,
  ledeRise: 10,
  controlStart: 820,
  controlDuration: 320,
  controlStagger: 50,
  footStart: 980,
  footDuration: 480,
  footStagger: 90,
  footRise: 12,
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
