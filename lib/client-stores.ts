"use client";

import { useSyncExternalStore } from "react";
import { owner } from "@/content/site";

/* ---------------------------------------------------------------- theme -- */

export type Theme = "light" | "dark";
const THEME_EVENT = "theme-change";
const darkQuery = "(prefers-color-scheme: dark)";

function readTheme(): Theme {
  const explicit = document.documentElement.dataset.theme;
  if (explicit === "light" || explicit === "dark") return explicit;
  return window.matchMedia(darkQuery).matches ? "dark" : "light";
}

function subscribeTheme(callback: () => void) {
  const media = window.matchMedia(darkQuery);
  media.addEventListener("change", callback);
  window.addEventListener(THEME_EVENT, callback);
  return () => {
    media.removeEventListener("change", callback);
    window.removeEventListener(THEME_EVENT, callback);
  };
}

export function useTheme(): Theme | null {
  return useSyncExternalStore(subscribeTheme, readTheme, () => null);
}

export function setTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  try {
    window.localStorage.setItem("theme", theme);
  } catch {
    // Storage can be unavailable (private mode). The choice still applies to this page view.
  }
  document.querySelectorAll('meta[name="theme-color"]').forEach((meta) => {
    meta.setAttribute("content", theme === "dark" ? "#0c0e0c" : "#f5f4ef");
  });
  window.dispatchEvent(new Event(THEME_EVENT));
}

/* ----------------------------------------------------------- local time -- */

const timeFormat = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: owner.timeZone,
});

function subscribeClock(callback: () => void) {
  const timer = window.setInterval(callback, 15_000);
  return () => window.clearInterval(timer);
}

/** Owner's local time (IST). Renders a placeholder on the server so static HTML never shows a stale time. */
export function useLocalTime() {
  return useSyncExternalStore(subscribeClock, () => timeFormat.format(new Date()), () => "--:--");
}

/* --------------------------------------------------------- media query -- */

export function useMediaQuery(query: string, serverValue = false) {
  return useSyncExternalStore(
    (callback) => {
      const media = window.matchMedia(query);
      media.addEventListener("change", callback);
      return () => media.removeEventListener("change", callback);
    },
    () => window.matchMedia(query).matches,
    () => serverValue,
  );
}

/* ------------------------------------------------------ command palette -- */

export const PALETTE_EVENT = "palette:open";

export function openPalette() {
  window.dispatchEvent(new Event(PALETTE_EVENT));
}
