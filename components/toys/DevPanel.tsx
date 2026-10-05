"use client";

import { useEffect, useRef, useState } from "react";
import { achievementLabel, BOLTS } from "@/lib/secrets-core";
import { unlockToy, useSecrets } from "@/lib/secrets";
import { openToy } from "@/lib/toys";

/**
 * Ctrl + Shift + . : a small diagnostics panel. Half of it is real (viewport, theme, motion
 * preference, what you have found), half of it is not. Nothing is fingerprinted or sent anywhere.
 */
export default function DevPanel({ onClose }: { onClose: () => void }) {
  const state = useSecrets();
  const [env, setEnv] = useState({ viewport: "", theme: "", motion: "" });
  const close = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    close.current?.focus();
    return () => {
      if (opener?.isConnected) opener.focus({ preventScroll: true });
    };
  }, []);

  useEffect(() => {
    const read = () => {
      const theme = document.documentElement.dataset.theme ?? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark (system)" : "light (system)");
      setEnv({
        viewport: `${window.innerWidth} x ${window.innerHeight}`,
        theme,
        motion: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "reduced" : "full",
      });
    };
    read();
    window.addEventListener("resize", read);
    return () => window.removeEventListener("resize", read);
  }, []);

  const rows: [string, string][] = [
    ["build", "stable"],
    ["curiosity", "elevated"],
    ["tabs", "excessive"],
    ["unfinished", "yes"],
    ["sleep", "unknown"],
    ["viewport", env.viewport],
    ["theme", env.theme],
    ["motion", env.motion],
    ["secrets", state ? String(state.secrets.length) : "0"],
    ["bolts", state ? `${state.bolts.length} / ${BOLTS.length}` : `0 / ${BOLTS.length}`],
    ["achievements", state ? achievementLabel(state) : "0 / ??"],
  ];

  return (
    <aside className="dev-panel mono" aria-label="Diagnostics">
      <header>
        <span>diagnostics</span>
        <button ref={close} type="button" onClick={onClose} aria-label="Close diagnostics">×</button>
      </header>
      <dl>
        {rows.map(([key, value]) => (
          <div key={key}>
            <dt>{key}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <button
        type="button"
        className="tool-button mono"
        onClick={() => {
          unlockToy("reaction");
          openToy("reaction");
          onClose();
        }}
      >
        run reaction diagnostics
      </button>
    </aside>
  );
}
