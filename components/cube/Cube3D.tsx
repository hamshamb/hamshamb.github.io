"use client";

import { type Ref, useEffect, useImperativeHandle, useRef, useState } from "react";
import type { CubeState, Move } from "@/lib/cube";
import { CssCube, type CssView, type Turn } from "./CssCube";
import type { ThreeCube } from "./three-cube";

export type CubeHandle = {
  /** animate one face turn and resolve when it has landed. The caller commits the new state afterwards. */
  turn: (move: Move, ms: number) => Promise<void>;
};

type Mode = "loading" | "webgl" | "css";

const HOME_VIEW: CssView = { x: -28, y: -38 };

/**
 * The 3D cube. It tries a three.js cube first (loaded on demand, in its own chunk), and keeps the CSS
 * cube as the fallback for browsers without webgl or when the chunk fails to load. The server renders
 * only an empty square, so there is no flash of the wrong cube.
 */
export function Cube3D({ state, label, ref }: { state: CubeState; label: string; ref?: Ref<CubeHandle> }) {
  const [mode, setMode] = useState<Mode>("loading");
  const [cssView, setCssView] = useState<CssView>(HOME_VIEW);
  const [cssTurn, setCssTurn] = useState<Turn | null>(null);
  const host = useRef<HTMLDivElement>(null);
  const cube = useRef<ThreeCube | null>(null);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    let cancelled = false;
    const el = host.current;
    (async () => {
      try {
        if (!el) throw new Error("no host");
        const { createThreeCube } = await import("./three-cube");
        if (cancelled) return;
        cube.current = createThreeCube(el);
        setMode("webgl");
      } catch {
        if (!cancelled) setMode("css");
      }
    })();
    const pending = timers.current;
    return () => {
      cancelled = true;
      cube.current?.dispose();
      cube.current = null;
      for (const id of pending) window.clearTimeout(id);
    };
  }, []);

  // push the facelet state into the webgl cube whenever it changes (or when it first becomes ready)
  useEffect(() => {
    if (mode === "webgl") cube.current?.setState(state);
  }, [mode, state]);

  useImperativeHandle(
    ref,
    () => ({
      turn(move, ms) {
        if (ms <= 0 || mode === "loading") return Promise.resolve();
        if (mode === "webgl" && cube.current) return cube.current.turn(move, ms);
        return new Promise<void>((resolve) => {
          setCssTurn({ face: move.face, turns: move.turns, ms });
          const id = window.setTimeout(() => {
            setCssTurn(null);
            resolve();
          }, ms + 20);
          timers.current.push(id);
        });
      },
    }),
    [mode],
  );

  const nudge = (yaw: number, pitch: number) => {
    if (mode === "webgl") cube.current?.nudge(yaw, pitch);
    else setCssView((v) => ({ x: Math.max(-80, Math.min(80, v.x - pitch)), y: v.y + yaw }));
  };
  const reset = () => {
    if (mode === "webgl") cube.current?.resetView();
    else setCssView(HOME_VIEW);
  };

  return (
    <div className="cube3d-wrap">
      {mode === "css" ? (
        <CssCube state={state} turn={cssTurn} label={label} view={cssView} onView={setCssView} />
      ) : (
        <div ref={host} className="cube3d cube3d-gl" data-mode={mode} role="img" aria-label={label} />
      )}
      <div className="cube3d-turn" role="group" aria-label="Look around the cube">
        <button type="button" onClick={() => nudge(-24, 0)} aria-label="turn the view left">←</button>
        <button type="button" onClick={() => nudge(0, 18)} aria-label="tilt the view up">↑</button>
        <button type="button" onClick={() => nudge(0, -18)} aria-label="tilt the view down">↓</button>
        <button type="button" onClick={() => nudge(24, 0)} aria-label="turn the view right">→</button>
        <button type="button" onClick={reset} aria-label="reset the view" className="cube3d-reset">reset view</button>
      </div>
    </div>
  );
}
