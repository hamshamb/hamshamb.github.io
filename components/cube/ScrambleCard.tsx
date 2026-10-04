"use client";

import { useMemo, useState } from "react";
import { applyAlg, formatAlg, generateScramble, mulberry32, SOLVED } from "@/lib/cube";
import { CubeNet } from "./CubeNet";

/** The home-page taste of the cube lab: a scramble and its net. The 3D cube lives on its own page. */
export function ScrambleCard() {
  const [scramble, setScramble] = useState(() => generateScramble(20, mulberry32(1)));
  const [copied, setCopied] = useState(false);
  const state = useMemo(() => applyAlg(SOLVED, scramble), [scramble]);
  const text = formatAlg(scramble);

  return (
    <div className="scramble-card">
      <CubeNet state={state} label="Cube net of this scramble" />
      <p className="scramble-text mono" aria-live="polite">{text}</p>
      <div className="scramble-actions">
        <button type="button" className="cube-button" onClick={() => setScramble(generateScramble())}>new scramble</button>
        <button
          type="button"
          className="cube-button"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(text);
              setCopied(true);
              window.setTimeout(() => setCopied(false), 1500);
            } catch {
              setCopied(false);
            }
          }}
        >
          {copied ? "copied" : "copy"}
        </button>
      </div>
    </div>
  );
}
