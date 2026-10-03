/**
 * One motion language for the whole site.
 *
 * Motion (React) owns interface state: mount/unmount, layout, hover, nav, dialogs.
 * Anime.js owns choreography: the hero intro and the release timeline draw.
 * Neither library animates an element the other one touches.
 *
 * CSS mirrors these values as --ease-out, --dur-fast, --dur-base and --dur-slow.
 */

/** Durations in seconds (Motion). Multiply by 1000 for Anime.js. */
export const duration = {
  fast: 0.16,
  base: 0.28,
  slow: 0.52,
  intro: 0.72,
} as const;

/** Cubic bezier control points shared by CSS, Motion and Anime.js. */
export const easeOut = [0.22, 1, 0.36, 1] as const;
export const easeInOut = [0.65, 0, 0.35, 1] as const;

export const spring = {
  /** Indicators and highlights that track the pointer or keyboard. */
  snappy: { type: "spring", stiffness: 520, damping: 42, mass: 0.7 },
  /** Panels and small layout changes. */
  soft: { type: "spring", visualDuration: 0.38, bounce: 0.12 },
} as const;

export const stagger = {
  tight: 0.035,
  base: 0.06,
} as const;

/** Travel distances in px. Keep movement small; it should read as settling, not flying. */
export const distance = {
  sm: 6,
  md: 14,
} as const;

export const fadeUp = {
  initial: { opacity: 0, y: distance.sm },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -distance.sm },
  transition: { duration: duration.base, ease: easeOut },
};
