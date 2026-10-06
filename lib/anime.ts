/**
 * The hero's scroll sync. Its timing (the opening and every scroll stage) lives in
 * lib/engine-pose.ts as pure functions; this only says how closely the drawing follows the
 * scrollbar (Anime.js `sync`, 0 to 1: higher is smoother and slightly later).
 */
export const heroEngineMotion = {
  scroll: { smooth: 0.8 },
} as const;

/** Session flag: the full opening plays once per session, later loads show the hero at rest. */
export const INTRO_SEEN_KEY = "portfolio-intro-seen";
