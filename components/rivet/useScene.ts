import { type RefObject, useEffect, useRef, useState } from "react";
import type { SceneEvents, SceneHandle, SceneVariant } from "./scene-types";

export type SceneStatus = "idle" | "loading" | "ready" | "failed";

/** How far below the fold a scene starts loading. Far enough that it is ready by the time you scroll to it. */
const LOAD_MARGIN = "700px 0px";

type Connection = { saveData?: boolean };

/**
 * Loads one Rivet scene when its host element gets near the viewport, and tears it down when the
 * component goes away. three.js is only ever reached through the dynamic import below, so a page
 * that never mounts a scene never downloads it. If anything goes wrong (no WebGL, a lost context,
 * Save-Data on) the status becomes "failed" and the caller shows its fallback instead.
 *
 * `events` may change every render; the scene always calls the latest ones.
 */
export function useScene(variant: SceneVariant, events: SceneEvents): {
  hostRef: RefObject<HTMLDivElement | null>;
  status: SceneStatus;
  handle: SceneHandle | null;
} {
  const hostRef = useRef<HTMLDivElement>(null);
  const eventsRef = useRef(events);
  const [status, setStatus] = useState<SceneStatus>("idle");
  const [handle, setHandle] = useState<SceneHandle | null>(null);

  useEffect(() => {
    eventsRef.current = events;
  });

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let disposed = false;
    let scene: SceneHandle | null = null;
    let inView = true;
    let watcher: IntersectionObserver | null = null;

    const proxy: SceneEvents = {
      movePhone: (id, x, z) => eventsRef.current.movePhone?.(id, x, z),
      dropEnvelope: (from, to) => eventsRef.current.dropEnvelope?.(from, to) ?? false,
      project: (anchors) => eventsRef.current.project?.(anchors),
      grab: (held) => eventsRef.current.grab?.(held),
      lost: () => {
        eventsRef.current.lost?.();
        if (disposed) return;
        scene?.dispose();
        scene = null;
        setHandle(null);
        setStatus("failed");
      },
    };

    const sync = () => scene?.setRunning(inView && document.visibilityState === "visible");

    const start = async () => {
      const saver = (navigator as Navigator & { connection?: Connection }).connection?.saveData;
      if (saver) {
        setStatus("failed");
        return;
      }
      setStatus("loading");
      try {
        const { createScene } = await import("./scene3d");
        if (disposed) return;
        scene = createScene(host, variant, proxy);
        setHandle(scene);
        setStatus("ready");
        watcher = new IntersectionObserver(
          (entries) => {
            inView = entries.some((entry) => entry.isIntersecting);
            sync();
          },
          { rootMargin: "120px 0px" },
        );
        watcher.observe(host);
        document.addEventListener("visibilitychange", sync);
      } catch {
        if (!disposed) setStatus("failed");
      }
    };

    const near = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        near.disconnect();
        void start();
      },
      { rootMargin: LOAD_MARGIN },
    );
    near.observe(host);

    return () => {
      disposed = true;
      near.disconnect();
      watcher?.disconnect();
      document.removeEventListener("visibilitychange", sync);
      scene?.dispose();
    };
  }, [variant]);

  return { hostRef, status, handle };
}
