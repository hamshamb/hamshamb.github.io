"use client";

import { createDrawable, createScope, createTimeline, stagger, utils } from "animejs";
import { useEffect } from "react";
import { animeEaseOut, heroMotion as t, INTRO_SEEN_KEY } from "@/lib/anime";

/**
 * The opening sequence, owned entirely by Anime.js (Motion never touches these nodes).
 *
 *   0ms      meta: name and "student developer / india / coding since 2021"
 *   120ms    headline words rise out of their masks, one by one
 *   620ms    lede and range line settle
 *   760ms    the hand-drawn underline draws once under "existed."
 *   820ms    the two actions arrive (usable throughout)
 *   980ms    currently / latest release / elsewhere, in document order
 *
 * Everything is real, server-rendered content: this only controls the reveal. The hidden
 * starting state exists only when the boot script has confirmed JS and motion are welcome,
 * and a 2.5s failsafe in that script reveals the hero even if this bundle never runs.
 * It plays once per session; later loads show the hero at rest.
 */
export function HeroIntro({ rootId }: { rootId: string }) {
  useEffect(() => {
    const html = document.documentElement;
    const root = document.getElementById(rootId);
    const finish = () => html.classList.add("hero-ready", "intro-done");
    // Opened in a background tab: there is nobody to perform for, so show the hero at rest.
    const hidden = document.visibilityState === "hidden";
    if (!root || hidden || !html.classList.contains("motion-ok") || html.classList.contains("hero-ready")) {
      finish();
      return;
    }
    try {
      window.sessionStorage.setItem(INTRO_SEEN_KEY, "1");
    } catch {
      // Storage can be unavailable; the intro simply plays again next time.
    }

    const scope = createScope({ root }).add(() => {
      const words = root.querySelectorAll<HTMLElement>(".word-inner");
      const meta = root.querySelector<HTMLElement>("[data-hero='meta']");
      const lede = root.querySelector<HTMLElement>("[data-hero='lede']");
      const controls = root.querySelectorAll<HTMLElement>("[data-hero='actions'] > *");
      const foot = root.querySelectorAll<HTMLElement>("[data-hero='foot'] > *");
      const [underline] = createDrawable(".hero-underline path");

      // Hold the starting state inline, then drop the CSS holding class in the same frame.
      utils.set(words, { y: "110%" });
      utils.set([meta, lede, ...controls, ...foot].filter(Boolean) as HTMLElement[], { opacity: 0 });
      utils.set(underline, { draw: "0 0" });
      html.classList.add("hero-ready");

      createTimeline({ defaults: { ease: animeEaseOut }, onComplete: () => html.classList.add("intro-done") })
        .add(meta!, { opacity: [0, 1], y: [t.metaRise, 0], duration: t.metaDuration }, 0)
        .add(words, { y: ["110%", "0%"], duration: t.wordDuration, ease: "outExpo", delay: stagger(t.wordStagger) }, t.wordStart)
        .add(lede!, { opacity: [0, 1], y: [t.ledeRise, 0], duration: t.ledeDuration }, t.ledeStart)
        .add(underline, { draw: ["0 0", "0 1"], duration: t.underlineDuration, ease: "inOut(2.2)" }, t.underlineStart)
        .add(controls, { opacity: [0, 1], y: [4, 0], duration: t.controlDuration, delay: stagger(t.controlStagger) }, t.controlStart)
        .add(foot, { opacity: [0, 1], y: [t.footRise, 0], duration: t.footDuration, delay: stagger(t.footStagger) }, t.footStart);
    });

    return () => {
      scope.revert();
      finish();
    };
  }, [rootId]);

  return null;
}
