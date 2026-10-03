"use client";

import { AnimatePresence, m } from "motion/react";
import { setTheme, useTheme } from "@/lib/client-stores";
import { duration, easeOut } from "@/lib/motion";
import { MoonIcon, SunIcon } from "./icons";

export function ThemeToggle() {
  const theme = useTheme();
  const next = theme === "dark" ? "light" : "dark";

  return (
    <button
      type="button"
      className="icon-button"
      onClick={() => setTheme(next)}
      aria-label={theme ? `Switch to ${next} theme` : "Switch colour theme"}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <m.span
          key={theme ?? "unknown"}
          style={{ display: "grid" }}
          initial={{ opacity: 0, rotate: -60, scale: 0.6 }}
          animate={{ opacity: 1, rotate: 0, scale: 1 }}
          exit={{ opacity: 0, rotate: 60, scale: 0.6 }}
          transition={{ duration: duration.base, ease: easeOut }}
        >
          {theme === "dark" ? <MoonIcon /> : <SunIcon />}
        </m.span>
      </AnimatePresence>
    </button>
  );
}
