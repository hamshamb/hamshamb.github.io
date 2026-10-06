"use client";

import { type ReactNode, useEffect, useRef } from "react";
import { phoneIds } from "@/lib/relay-sim";
import type { AnchorMap } from "./scene-types";
import { useScene } from "./useScene";

const names = ["sender", "relay", "relay", "recipient"];

/**
 * The opening 3D mesh: four phones and one envelope, driven by how far the figure has scrolled.
 * It never captures the scroll, never waits for anything, and the drawing passed as `poster` is
 * what shows until the scene is ready (and for good if WebGL is not available).
 */
export function RouteStage({ progress, selected, poster }: { progress: number; selected: number; poster: ReactNode }) {
  const labels = useRef<(HTMLElement | null)[]>([]);

  const { hostRef, status, handle } = useScene("route", {
    project: (anchors: AnchorMap) => {
      phoneIds.forEach((id, index) => {
        const anchor = anchors[id];
        const element = labels.current[index];
        if (!anchor || !element) return;
        element.style.transform = `translate3d(${anchor.x.toFixed(1)}px, ${anchor.y.toFixed(1)}px, 0) translate(-50%, -50%)`;
        element.dataset.placed = "1";
      });
    },
  });

  useEffect(() => {
    handle?.setProgress(progress);
  }, [handle, progress]);
  useEffect(() => {
    handle?.setSelected(phoneIds[selected] ?? null);
  }, [handle, selected]);

  return (
    <div className="rv-route" data-status={status}>
      <div className="rv-host" ref={hostRef} />
      {status !== "ready" && <div className="rv-poster">{poster}</div>}
      {status === "ready" && (
        <div className="rv-labels" aria-hidden="true">
          {names.map((name, index) => (
            <span key={index} className="rv-label rv-label-plain" data-active={index === selected || undefined} ref={(element) => { labels.current[index] = element; }}>
              <span className="rv-label-name mono">{name}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
