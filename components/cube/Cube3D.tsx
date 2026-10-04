"use client";

import { type PointerEvent, useRef, useState } from "react";
import { type CubeState, type Face, faceNormal, inLayer, stickers } from "@/lib/cube";

const SIZE = 46; // one cubie, in px
const all = stickers();

type Vec = [number, number, number];
const toCss = ([x, y, z]: Vec): Vec => [x, -y, z];
const cross = (a: Vec, b: Vec): Vec => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

/** A square facing `normal`, centred on the sticker. CSS space: x right, y down, z toward you. */
function placement(position: Vec, normal: Vec) {
  const n = toCss(normal);
  const centre = toCss(position).map((v, i) => v * SIZE + n[i] * (SIZE / 2 - 0.5)) as Vec;
  const v: Vec = Math.abs(n[1]) === 1 ? [0, 0, n[1]] : [0, 1, 0];
  const u = cross(v, n);
  const m = [...u, 0, ...v, 0, ...n, 0, ...centre, 1].map((x) => (Math.abs(x) < 1e-9 ? 0 : x));
  return `matrix3d(${m.join(",")})`;
}

const placed = all.map((sticker) => ({ ...sticker, base: placement(sticker.position, sticker.normal) }));

export type Turn = { face: Face; turns: 1 | 2 | 3; ms: number };

/**
 * A CSS 3D cube drawn from the facelet state: 54 stickers around a dark core. A face turn rotates
 * the 21 stickers in that layer around the face's axis; the parent then swaps in the new state.
 * Drag to look around, or use the four view buttons under it.
 */
export function Cube3D({ state, turn, label }: { state: CubeState; turn: Turn | null; label: string }) {
  const [view, setView] = useState({ x: -28, y: -38 });
  const drag = useRef<{ x: number; y: number; vx: number; vy: number } | null>(null);

  const axis = turn ? toCss(faceNormal(turn.face)) : ([0, 1, 0] as Vec);
  const angle = turn ? (turn.turns === 3 ? -90 : turn.turns * 90) : 0;

  const nudge = (dx: number, dy: number) => () =>
    setView((current) => ({ x: Math.max(-80, Math.min(80, current.x + dx)), y: current.y + dy }));

  return (
    <div className="cube3d-wrap">
      <div
        className="cube3d"
        onPointerDown={(event: PointerEvent<HTMLDivElement>) => {
          drag.current = { x: event.clientX, y: event.clientY, vx: view.x, vy: view.y };
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          const start = drag.current;
          if (!start) return;
          setView({ x: Math.max(-80, Math.min(80, start.vx - (event.clientY - start.y) * 0.5)), y: start.vy + (event.clientX - start.x) * 0.5 });
        }}
        onPointerUp={() => { drag.current = null; }}
        onPointerCancel={() => { drag.current = null; }}
      >
        <div className="cube3d-view" role="img" aria-label={label} style={{ transform: `rotateX(${view.x}deg) rotateY(${view.y}deg)` }}>
          <div className="cube3d-core" />
          {placed.map((sticker) => {
            const moving = turn && inLayer(turn.face, sticker.index);
            const spin = `rotate3d(${axis.join(",")}, ${moving ? angle : 0}deg)`;
            return (
              <i
                key={sticker.index}
                className="cube3d-sticker"
                data-c={state[sticker.index]}
                style={{
                  transform: `${spin} ${sticker.base}`,
                  transitionDuration: moving ? `${turn.ms}ms` : "0ms",
                }}
              />
            );
          })}
        </div>
      </div>
      <div className="cube3d-turn" role="group" aria-label="Look around the cube">
        <button type="button" onClick={nudge(0, -20)} aria-label="turn the view left">←</button>
        <button type="button" onClick={nudge(15, 0)} aria-label="tilt the view up">↑</button>
        <button type="button" onClick={nudge(-15, 0)} aria-label="tilt the view down">↓</button>
        <button type="button" onClick={nudge(0, 20)} aria-label="turn the view right">→</button>
      </div>
    </div>
  );
}
