"use client";

import { useEffect, useState } from "react";
import { Poster } from "./Poster";
import type { Zone } from "./scene-types";
import { useScene } from "./useScene";

/**
 * One sealed envelope, large, and an inspect switch that turns the shell translucent and pulls the
 * three regions apart. Drag it (or use the turn buttons) to look from another side. If the 3D view
 * cannot load, this renders nothing and the explorer's own list carries the whole explanation.
 */
export function EnvelopeStage({ zone, xray, onXray }: { zone: Zone | null; xray: boolean; onXray: (on: boolean) => void }) {
  const { hostRef, status, handle } = useScene("envelope", {});
  const [yaw, setYaw] = useState(0);

  useEffect(() => {
    handle?.setXray(xray);
  }, [handle, xray]);
  useEffect(() => {
    handle?.setZoneFocus(zone);
  }, [handle, zone]);
  useEffect(() => {
    handle?.setYaw(yaw);
  }, [handle, yaw]);

  if (status === "failed") return null;
  const ready = status === "ready";

  return (
    <div className="rv-envelope" data-status={status}>
      <div className="rv-head">
        <span className="rv-tag mono">conceptual visualization</span>
        <span className="rv-chip mono">{ready ? (xray ? "inspecting" : "sealed") : "loading the 3d view"}</span>
      </div>
      <div className="rv-envelope-stage">
        <div className="rv-host" ref={hostRef} />
        {!ready && (
          <div className="rv-poster">
            <Poster kind="envelope" />
          </div>
        )}
      </div>
      {ready && (
        <div className="rv-row rv-envelope-controls">
          <button type="button" className="rv-btn" aria-pressed={xray} onClick={() => onXray(!xray)}>
            inspect envelope
          </button>
          <button type="button" className="rv-btn" onClick={() => setYaw((value) => Math.max(-1.1, value - 0.4))} aria-label="turn the envelope left">
            ← turn
          </button>
          <button type="button" className="rv-btn" onClick={() => setYaw((value) => Math.min(1.1, value + 0.4))} aria-label="turn the envelope right">
            turn →
          </button>
        </div>
      )}
    </div>
  );
}
