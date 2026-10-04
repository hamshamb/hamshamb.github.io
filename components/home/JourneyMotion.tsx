"use client";

import { createScope, createTimeline, stagger, utils } from "animejs";
import { animate as motionAnimate } from "motion/mini";
import { useEffect } from "react";
import { animeEaseOut } from "@/lib/anime";
import { duration, easeOut } from "@/lib/motion";

/**
 * The journey's choreography, split by ownership:
 *   Anime.js draws the rail from 2021 to 2026, lands each year node, then lifts the numerals.
 *   Motion staggers the dated events in once their year has arrived.
 * Neither touches the other's elements. On the vertical (narrow) layout the year in the middle of
 * the screen is marked active as you scroll. Nothing here is needed to read the content.
 */
export function JourneyMotion({ rootId }: { rootId: string }) {
  useEffect(() => {
    const root = document.getElementById(rootId);
    if (!root) return;
    const years = [...root.querySelectorAll<HTMLElement>(".journey-year")];
    const vertical = window.matchMedia("(max-width: 999px)");

    // Active year on the vertical layout.
    const activeObserver = new IntersectionObserver(
      (entries) => {
        if (!vertical.matches) return;
        for (const entry of entries) {
          if (entry.isIntersecting) years.forEach((year) => year.toggleAttribute("data-active", year === entry.target));
        }
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    years.forEach((year) => activeObserver.observe(year));

    const html = document.documentElement;
    const startsVisible = root.getBoundingClientRect().top < window.innerHeight * 0.85;
    if (!html.classList.contains("motion-ok") || startsVisible) {
      return () => activeObserver.disconnect();
    }

    const trace = root.querySelector<HTMLElement>(".journey-trace");
    const nodes = root.querySelectorAll<HTMLElement>(".journey-node");
    const numerals = root.querySelectorAll<HTMLElement>(".journey-numeral");
    const events = [...root.querySelectorAll<HTMLElement>(".journey-event")];
    const axis = vertical.matches ? "scaleY" : "scaleX";
    const step = 190;

    const scope = createScope({ root }).add(() => {
      utils.set(trace!, { [axis]: 0 });
      utils.set(nodes, { scale: 0 });
      utils.set(numerals, { opacity: 0, y: 12 });
    });
    events.forEach((event) => motionAnimate(event, { opacity: 0, transform: "translateX(-8px)" }, { duration: 0 }));

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        scope.add(() => {
          createTimeline({ defaults: { ease: animeEaseOut } })
            .add(trace!, { [axis]: [0, 1], duration: step * years.length + 260, ease: "inOut(2)" }, 0)
            .add(nodes, { scale: [0, 1], duration: 420, delay: stagger(step) }, 80)
            .add(numerals, { opacity: [0, 1], y: [12, 0], duration: 560, delay: stagger(step) }, 120);
          // The busy years arrive last, so their events follow the rail.
          const firstEventDelay = (step * (years.length - 2) + 300) / 1000;
          events.forEach((event, index) => {
            motionAnimate(
              event,
              { opacity: 1, transform: "translateX(0px)" },
              { duration: duration.slow, ease: [...easeOut], delay: firstEventDelay + index * 0.06 },
            );
          });
        });
      },
      { threshold: 0.2 },
    );
    observer.observe(root);

    return () => {
      observer.disconnect();
      activeObserver.disconnect();
      scope.revert();
      events.forEach((event) => {
        event.style.opacity = "";
        event.style.transform = "";
      });
    };
  }, [rootId]);

  return null;
}
