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
