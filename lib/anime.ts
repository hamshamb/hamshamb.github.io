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
 * The hero, in one place.
 *
 * `intro` is the short timed ignition on a first visit (milliseconds; each value is when that
 * stage starts unless it says otherwise). It only sets the scene and is finished by ~1.1s.
 *
 * `scroll` is everything after that, as fractions of the hero's scroll distance (0 to 1).
 * Scroll owns the build engine completely; nothing here ever waits on a timer.
 */
export const heroEngineMotion = {
  intro: {
    meta: 0,
    metaDuration: 280,
    machine: 90,
    machineDuration: 760,
    words: 120,
    wordDuration: 560,
    wordStagger: 50,
    lede: 330,
    ledeDuration: 380,
    actions: 440,
    actionsDuration: 300,
    underline: 600,
    underlineDuration: 500,
    rise: 8,
  },
  scroll: {
    drawStart: 0.1,
    drawEnd: 0.25,
    detailEnd: 0.34,
    assemblyStart: 0.25,
    assemblyEnd: 0.4,
    emphasisEnd: 0.52,
    explodeStart: 0.52,
    explodeEnd: 0.68,
    projectsStart: 0.68,
    projectsEnd: 0.82,
    exitStart: 0.82,
    /** Degrees. A few, never dramatic. */
    tilt: -2.5,
    /** How far the drawing recedes as the hero releases. */
    exitScale: 0.92,
    exitOpacity: 0.4,
    /** Smoothing between scroll position and drawing (Anime.js `sync`, 0 to 1). */
    smooth: 0.8,
  },
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
