"use client";

import { useEffect, useRef, useState } from "react";

type Phase = { kind: "idle" } | { kind: "waiting" } | { kind: "go"; at: number } | { kind: "early" } | { kind: "done"; ms: number };

/** Playful, explicitly not science. */
export function classify(ms: number) {
  if (ms < 180) return "suspiciously awake.";
  if (ms < 250) return "fast.";
  if (ms < 350) return "human.";
  return "thinking about something else.";
}

/** Random delay, one signal, one press. Keyboard (space or enter), mouse and touch all count. */
export default function Reaction() {
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const [best, setBest] = useState<number | null>(null);
  const timer = useRef(0);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const press = () => {
    if (phase.kind === "waiting") {
      window.clearTimeout(timer.current);
      setPhase({ kind: "early" });
      return;
    }
    if (phase.kind === "go") {
      const ms = Math.round(performance.now() - phase.at);
      setPhase({ kind: "done", ms });
      setBest((value) => (value === null ? ms : Math.min(value, ms)));
      return;
    }
    setPhase({ kind: "waiting" });
    timer.current = window.setTimeout(() => setPhase({ kind: "go", at: performance.now() }), 1200 + Math.random() * 2800);
  };

  const label = {
    idle: "press to start",
    waiting: "wait for it…",
    go: "now",
    early: "too soon. impressive confidence. press to try again.",
    done: phase.kind === "done" ? `${phase.ms} ms. ${classify(phase.ms)} press to go again.` : "",
  }[phase.kind];

  return (
    <div className="reaction">
      <button type="button" className="reaction-pad" data-phase={phase.kind} onPointerDown={(event) => { if (event.pointerType !== "mouse" || event.button === 0) press(); }} onKeyDown={(event) => { if (event.key === " " || event.key === "Enter") { event.preventDefault(); press(); } }}>
        <span className="reaction-signal" aria-hidden="true" />
        <span className="reaction-label" aria-live="polite">{label}</span>
      </button>
      <p className="toy-foot mono">{best !== null ? `best this time: ${best} ms. ` : ""}not a medical or scientific measurement. browsers add their own delay.</p>
    </div>
  );
}
