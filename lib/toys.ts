"use client";

import type { ToyId } from "@/content/secrets";

/**
 * Tiny event API for the hidden toys, so any component (the palette, the toybox, the dev panel)
 * can open one without importing it. SecretLayer listens and lazy-loads the toy on demand.
 */

export const TOY_EVENT = "toys:open";
export const GRAVITY_EVENT = "toys:gravity";

export type OverlayToy = Extract<ToyId, "reaction" | "fidget" | "physics" | "touch-grass" | "map">;

export function openToy(toy: OverlayToy) {
  window.dispatchEvent(new CustomEvent<OverlayToy>(TOY_EVENT, { detail: toy }));
}

export function setGravity(on: boolean) {
  window.dispatchEvent(new CustomEvent<boolean>(GRAVITY_EVENT, { detail: on }));
}

/** Internal places worth landing on at random. Never anywhere off the site. */
export function randomDestination(pick = Math.random) {
  const places = [
    "/work/rivet", "/work/nexus", "/work/studyfilter", "/work/areuhuman", "/work/chc-review-studio", "/work/pyforge",
    "/skills/python", "/skills/typescript", "/skills/react", "/skills/java", "/skills/csharp", "/skills/html-css",
    "/blog/why-i-made-rivet", "/stuff/cubing", "/#stuff", "/#journey", "/#lab", "/nope-this-page-does-not-exist",
  ];
  return places[Math.floor(pick() * places.length) % places.length];
}
