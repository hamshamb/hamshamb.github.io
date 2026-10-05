"use client";

import { AnimatePresence, m } from "motion/react";
import { setTheme, useTheme } from "@/lib/client-stores";
import { spring } from "@/lib/motion";
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
          // a small mechanical swap: the old icon turns out, the new one turns in and seats
          initial={{ opacity: 0, rotate: -90, y: 6 }}
          animate={{ opacity: 1, rotate: 0, y: 0 }}
          exit={{ opacity: 0, rotate: 90, y: -6 }}
          transition={spring.soft}
        >
          {theme === "dark" ? <MoonIcon /> : <SunIcon />}
        </m.span>
      </AnimatePresence>
    </button>
  );
}
