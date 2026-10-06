"use client";

import { useEffect } from "react";

const SELECTOR = "[data-tilt]";

/**
 * One delegated listener that gives `[data-tilt]` cards a very small tilt toward the pointer
 * (capped by --tilt-max in CSS). Mouse only, never touch, and nothing at all for reduced motion.
 * Elements animated by Motion are never tagged, so the two never fight over a transform.
 */
export function PointerTilt() {
  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)");
    let active: HTMLElement | null = null;
    const reset = (el: HTMLElement | null) => {
      el?.style.removeProperty("--tx");
      el?.style.removeProperty("--ty");
    };
    const onMove = (event: PointerEvent) => {
      if (!fine.matches || event.pointerType !== "mouse") return;
      const card = (event.target as Element | null)?.closest?.<HTMLElement>(SELECTOR) ?? null;
      if (card !== active) {
        reset(active);
        active = card;
      }
      if (!card) return;
      const box = card.getBoundingClientRect();
      card.style.setProperty("--tx", ((event.clientX - box.left) / box.width - 0.5).toFixed(3));
      card.style.setProperty("--ty", ((event.clientY - box.top) / box.height - 0.5).toFixed(3));
    };
    const onLeave = () => {
      reset(active);
      active = null;
    };
    document.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      document.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      reset(active);
    };
  }, []);
  return null;
}
