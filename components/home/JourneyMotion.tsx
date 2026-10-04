"use client";

import { animate, onScroll } from "animejs";
import { animate as motionAnimate } from "motion/mini";
import { useEffect } from "react";
import { duration, easeOut } from "@/lib/motion";

/**
 * The journey's choreography, split by ownership:
 *   Anime.js draws the rail from 2021 to 2026 in step with the scroll (same line as the hero rail).
 *   Motion brings each year's milestones in when that year arrives.
 * The year nearest the middle of the screen is marked active; CSS lights its node and numeral.
 * Nothing here is needed to read the content, and nothing runs with reduced motion.
 */
export function JourneyMotion({ rootId }: { rootId: string }) {
  useEffect(() => {
    const root = document.getElementById(rootId);
    if (!root) return;
    const years = [...root.querySelectorAll<HTMLElement>(".journey-year")];

    const activeObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) years.forEach((year) => year.toggleAttribute("data-active", year === entry.target));
        }
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    years.forEach((year) => activeObserver.observe(year));

    if (!document.documentElement.classList.contains("motion-ok")) {
      return () => activeObserver.disconnect();
    }

    const trace = root.querySelector<HTMLElement>(".journey-trace");
    const scroll = onScroll({ target: root, enter: "70% top", leave: "70% bottom", sync: 0.8 });
    const draw = trace ? animate(trace, { scaleY: [0, 1], ease: "linear", autoplay: scroll }) : null;

    // Only years still below the fold are lowered; anything already on screen stays put.
    const pending = years.filter((year) => year.getBoundingClientRect().top > window.innerHeight * 0.9);
    const itemsOf = (year: HTMLElement) => [...year.querySelectorAll<HTMLElement>(".milestone, .journey-notes, .journey-closing")];
    for (const year of pending) {
      for (const item of itemsOf(year)) motionAnimate(item, { opacity: 0, transform: "translateY(10px)" }, { duration: 0 });
    }
    const revealObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          revealObserver.unobserve(entry.target);
          itemsOf(entry.target as HTMLElement).forEach((item, index) => {
            motionAnimate(
              item,
              { opacity: 1, transform: "translateY(0px)" },
              { duration: duration.slow, ease: [...easeOut], delay: Math.min(index, 6) * 0.06 },
            );
          });
        }
      },
      { rootMargin: "0px 0px -15% 0px" },
    );
    pending.forEach((year) => revealObserver.observe(year));

    return () => {
      activeObserver.disconnect();
      revealObserver.disconnect();
      draw?.revert();
      scroll.revert();
      for (const year of pending) {
        for (const item of itemsOf(year)) {
          item.style.opacity = "";
          item.style.transform = "";
        }
      }
    };
  }, [rootId]);

  return null;
}
