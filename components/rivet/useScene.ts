import { type RefObject, useEffect, useRef, useState } from "react";
import type { SceneEvents, SceneHandle, SceneVariant } from "./scene-types";

export type SceneStatus = "idle" | "loading" | "ready" | "failed";

/** How far below the fold a scene starts loading. Far enough that it is ready by the time you scroll to it. */
const LOAD_MARGIN = "700px 0px";

type Connection = { saveData?: boolean };
type Lifecycle = { setRunning(running: boolean): void; dispose(): void };

/**
 * Loads a three.js scene when its host element gets near the viewport, runs it only while it is
 * on screen in a visible tab, and tears it down when the component goes away. Every Rivet scene
 * goes through here, so they all share one policy. `load` must reach three through a dynamic
 * import; a page that never mounts a scene never downloads it. If anything goes wrong (no WebGL, a
 * lost context, Save-Data on) the status becomes "failed" and the caller shows its fallback.
 */
export function useLazyScene<H extends Lifecycle>(load: (host: HTMLElement, lost: () => void) => Promise<H>): {
  hostRef: RefObject<HTMLDivElement | null>;
  status: SceneStatus;
  handle: H | null;
} {
  const hostRef = useRef<HTMLDivElement>(null);
  const loadRef = useRef(load);
  const [status, setStatus] = useState<SceneStatus>("idle");
  const [handle, setHandle] = useState<H | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let disposed = false;
    let scene: H | null = null;
    let inView = true;
    let watcher: IntersectionObserver | null = null;

    const lost = () => {
      if (disposed) return;
      scene?.dispose();
      scene = null;
      setHandle(null);
      setStatus("failed");
    };
    const sync = () => scene?.setRunning(inView && document.visibilityState === "visible");

    const start = async () => {
      if ((navigator as Navigator & { connection?: Connection }).connection?.saveData) {
        setStatus("failed");
        return;
      }
      setStatus("loading");
      try {
        const created = await loadRef.current(host, lost);
        if (disposed) {
          created.dispose();
          return;
        }
        scene = created;
        setHandle(created);
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
  }, []);

  return { hostRef, status, handle };
}

/**
 * The relay and route scenes (scene3d.ts). `events` may change every render; the scene always
 * calls the latest ones.
 */
export function useScene(variant: SceneVariant, events: SceneEvents) {
  const eventsRef = useRef(events);
  useEffect(() => {
    eventsRef.current = events;
  });
  return useLazyScene<SceneHandle>(async (host, lost) => {
    const { createScene } = await import("./scene3d");
    return createScene(host, variant, {
      movePhone: (id, x, z) => eventsRef.current.movePhone?.(id, x, z),
      dropEnvelope: (from, to) => eventsRef.current.dropEnvelope?.(from, to) ?? false,
      project: (anchors) => eventsRef.current.project?.(anchors),
      grab: (held) => eventsRef.current.grab?.(held),
      lost: () => {
        eventsRef.current.lost?.();
        lost();
      },
    });
  });
}
