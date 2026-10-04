"use client";

import { type KeyboardEvent, type PointerEvent, useEffect, useRef, useState } from "react";
import { LIFETIME, MAX_HOPS, moveNode, nearby, newSim, RANGE, send, type Sim, tick } from "@/lib/relay-sim";

const TICK_MS = 900;

/**
 * Store-and-forward, as a toy. Phones are draggable (or focus one and use the arrow keys);
 * anything within range swaps copies once per round. Clearly a conceptual simulation: nothing
 * here touches Bluetooth.
 */
export function RelayPlayground() {
  const [sim, setSim] = useState<Sim>(() => newSim());
  const track = useRef<HTMLDivElement>(null);
  const dragging = useRef<string | null>(null);
  const running = sim.status === "queued" || sim.status === "in mesh";

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") setSim((current) => tick(current));
    }, TICK_MS);
    return () => window.clearInterval(timer);
  }, [running]);

  const placeFromPointer = (event: PointerEvent<HTMLElement>) => {
    const box = track.current?.getBoundingClientRect();
    if (!box || !dragging.current) return;
    const id = dragging.current;
    setSim((current) => moveNode(current, id, ((event.clientX - box.left) / box.width) * 100));
  };

  const onKey = (id: string, x: number) => (event: KeyboardEvent<HTMLButtonElement>) => {
    const step = event.shiftKey ? 12 : 4;
    if (event.key === "ArrowLeft") setSim((current) => moveNode(current, id, x - step));
    else if (event.key === "ArrowRight") setSim((current) => moveNode(current, id, x + step));
    else return;
    event.preventDefault();
  };

  const links = sim.nodes.flatMap((a, i) => sim.nodes.slice(i + 1).filter((b) => nearby(a, b)).map((b) => [a, b] as const));
  const lastLog = sim.log.at(-1);

  return (
    <div className="relay-play">
      <div className="relay-head">
        <span className="relay-tag mono">conceptual simulation</span>
        <span className="relay-status mono" data-status={sim.status}>
          {sim.status === "idle" ? "nothing sent" : sim.status}
        </span>
      </div>

      <div
        className="relay-track"
        ref={track}
        onPointerMove={placeFromPointer}
        onPointerUp={() => { dragging.current = null; }}
        onPointerLeave={() => { dragging.current = null; }}
      >
        <svg className="relay-links" viewBox="0 0 100 10" preserveAspectRatio="none" aria-hidden="true" focusable="false">
          {links.map(([a, b]) => (
            <line
              key={`${a.id}-${b.id}`}
              x1={a.x}
              x2={b.x}
              y1="5"
              y2="5"
              data-carrying={sim.holding[a.id] !== undefined && sim.holding[b.id] !== undefined ? "" : undefined}
            />
          ))}
        </svg>
        {sim.nodes.map((node) => {
          const hops = sim.holding[node.id];
          return (
            <button
              key={node.id}
              type="button"
              className="relay-node"
              data-role={node.role}
              data-holding={hops !== undefined || undefined}
              style={{ left: `${node.x}%` }}
              aria-label={`${node.label}, ${hops !== undefined ? "holding a copy" : "no copy"}. use left and right arrows to move.`}
              onPointerDown={(event) => {
                dragging.current = node.id;
                event.currentTarget.setPointerCapture(event.pointerId);
              }}
              onPointerMove={placeFromPointer}
              onPointerUp={() => { dragging.current = null; }}
              onKeyDown={onKey(node.id, node.x)}
            >
              <span className="relay-phone" aria-hidden="true">{hops !== undefined && <i className="relay-env" />}</span>
              <span className="relay-name mono">{node.label}</span>
            </button>
          );
        })}
      </div>

      <div className="relay-controls">
        <button type="button" className="button button-primary" onClick={() => setSim((current) => send(newSim(current.nodes)))}>
          {sim.status === "idle" ? "send" : "send again"}
        </button>
        <button type="button" className="button" onClick={() => setSim(newSim())}>reset</button>
        <p className="relay-rules mono">
          range {RANGE} · max {MAX_HOPS} hops · lifetime {LIFETIME} rounds{running ? ` · round ${sim.age}` : ""}
        </p>
      </div>

      <p className="relay-log" aria-live="polite">
        {lastLog ?? "press send, then drag phones (or focus one and use the arrow keys) to carry the message across the gap."}
      </p>
    </div>
  );
}
