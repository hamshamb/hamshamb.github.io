"use client";

import { type ReactNode, useEffect, useRef } from "react";
import { phoneIds } from "@/lib/relay-sim";
import { LOOP_MS, loopProgress } from "./loop";
import type { AnchorMap } from "./scene-types";
import { useScene } from "./useScene";

const names = ["sender", "relay", "relay", "recipient"];

/**
 * Rivet's mark, alive: the same 3D route scene as the post, playing on a loop. The envelope
 * waits at the sender, stops at each relay, opens at the recipient and starts over. It loads
 * only near the viewport, renders only while on screen, and shows `poster` (the flat diagram)
 * until it is ready, for good if WebGL is unavailable, and as a still with reduced motion.
 */
export function RivetLoop({ poster }: { poster: ReactNode }) {
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
    const host = hostRef.current;
    if (!handle || !host) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      handle.setProgress(0.5, true);
      return;
    }
    let frame = 0;
    let visible = false;
    let started = 0;
    let last = -1;
    const tick = (now: number) => {
      started ||= now;
      const t = ((now - started) % LOOP_MS) / LOOP_MS;
      const progress = loopProgress(t);
      // a new cycle jumps straight back to the sender instead of travelling backwards
      handle.setProgress(progress, progress < last);
      last = progress;
      frame = visible ? requestAnimationFrame(tick) : 0;
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !frame) frame = requestAnimationFrame(tick);
    });
    observer.observe(host);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [handle, hostRef]);

  return (
    <div className="rv-loop" data-status={status}>
      <div className="rv-host" ref={hostRef} />
      {status !== "ready" && <div className="rv-loop-poster">{poster}</div>}
      {status === "ready" && (
        <div className="rv-labels" aria-hidden="true">
          {names.map((name, index) => (
            <span key={index} className="rv-label rv-label-plain" ref={(element) => { labels.current[index] = element; }}>
              <span className="rv-label-name mono">{name}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
