/**
 * How the hero starts, decided from what the page knows at hydration. Kept free of imports so
 * the test suite can check every case directly.
 *
 *   static  nothing animates: reduced motion, or the boot script never confirmed motion is welcome.
 *           The server-rendered hero, drawing included, is already complete.
 *   scroll  no timed opening (it already played this session, or the tab was opened in the
 *           background), but scrolling still drives the build engine.
 *   ignite  first visit in a visible tab: the short timed opening plays, then scroll takes over.
 */
export type HeroStart = "static" | "scroll" | "ignite";

export function heroStart(env: { motionOk: boolean; heroReady: boolean; hidden: boolean }): HeroStart {
  if (!env.motionOk) return "static";
  if (env.hidden || env.heroReady) return "scroll";
  return "ignite";
}
