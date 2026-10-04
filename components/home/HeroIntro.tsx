"use client";

import { createDrawable, createScope, createTimeline, stagger, utils } from "animejs";
import { useEffect } from "react";
import { animeEaseOut } from "@/lib/anime";

/**
 * Signature intro, owned entirely by Anime.js (Motion never touches these nodes).
 *
 *   0ms    headline words rise out of their clip masks, staggered
 *   120ms  meta row settles
 *   300ms  lede and actions follow
 *   440ms  the hand-drawn underline is drawn under "existed."
 *   520ms  the "currently / latest" strip settles
 *
 * Core movement finishes by roughly 1.1s. Nothing is interactive-blocking: links are
 * clickable from the first frame. With reduced motion (or no JS) the hero is static.
 */
export function HeroIntro({ rootId }: { rootId: string }) {
  useEffect(() => {
    const html = document.documentElement;
    const root = document.getElementById(rootId);
    if (!root || !html.classList.contains("motion-ok") || html.classList.contains("hero-ready")) {
      html.classList.add("hero-ready");
      return;
    }

    const scope = createScope({ root }).add(() => {
      const fadeTargets = "[data-hero]:not([data-hero='title'])";
      utils.set(".word-inner", { y: "108%" });
      utils.set(fadeTargets, { opacity: 0, y: 10 });
      const [underline] = createDrawable(".hero-underline path");
      utils.set(underline, { draw: "0 0" });
      html.classList.add("hero-ready");

      createTimeline({ defaults: { ease: animeEaseOut, duration: 720 } })
        .add(".word-inner", { y: ["108%", "0%"], delay: stagger(65) }, 0)
        .add("[data-hero='meta']", { opacity: [0, 1], y: [10, 0], duration: 560 }, 120)
        .add("[data-hero='lede'], [data-hero='actions']", { opacity: [0, 1], y: [10, 0], delay: stagger(80) }, 300)
        .add(underline, { draw: ["0 0", "0 1"], duration: 620, ease: "inOut(2.4)" }, 440)
        .add("[data-hero='foot']", { opacity: [0, 1], y: [12, 0], duration: 640 }, 520);
    });

    return () => {
      scope.revert();
    };
  }, [rootId]);

  return null;
}
