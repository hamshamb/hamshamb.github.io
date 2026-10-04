"use client";

import { m, useInView, useReducedMotion } from "motion/react";
import { useRef } from "react";

/**
 * Rivet has no public logo yet, so it gets a typographic treatment and a diagram of what it
 * actually does: a message hopping through intermediate phones until it reaches its recipient.
 * Diagrammatic on purpose. The envelope only moves while the mark is on screen.
 */
const nodes = [
  { x: 40, y: 150 },
  { x: 120, y: 92 },
  { x: 205, y: 140 },
  { x: 282, y: 70 },
  { x: 360, y: 122 },
  { x: 168, y: 46 },
  { x: 318, y: 172 },
];
const links: [number, number][] = [[0, 1], [1, 2], [2, 3], [3, 4], [1, 5], [5, 3], [2, 6], [6, 4]];
const route = [0, 1, 2, 3, 4];

export function RivetMark({ animated = true, size = "md" }: { animated?: boolean; size?: "md" | "lg" }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "-10% 0px" });
  const reduce = useReducedMotion();
  const move = animated && inView && !reduce;
  const xs = route.map((index) => nodes[index].x);
  const ys = route.map((index) => nodes[index].y);

  return (
    <div ref={ref} className="mark mark-rivet" data-size={size} aria-hidden="true">
      <span className="mark-word">RIVET</span>
      <svg viewBox="0 0 400 200" focusable="false">
        {links.map(([a, b]) => (
          <line
            key={`${a}-${b}`}
            x1={nodes[a].x}
            y1={nodes[a].y}
            x2={nodes[b].x}
            y2={nodes[b].y}
            className={route.includes(a) && route.includes(b) && Math.abs(route.indexOf(a) - route.indexOf(b)) === 1 ? "mesh-route" : "mesh-link"}
          />
        ))}
        {nodes.map((node, index) => (
          <rect
            key={index}
            x={node.x - 7}
            y={node.y - 11}
            width="14"
            height="22"
            rx="3.5"
            className={index === 0 || index === 4 ? "mesh-end" : "mesh-node"}
          />
        ))}
        <m.circle
          r="5"
          className="mesh-envelope"
          initial={{ cx: xs[0], cy: ys[0], opacity: 0 }}
          animate={move ? { cx: xs, cy: ys, opacity: [0, 1, 1, 1, 0] } : { cx: xs[0], cy: ys[0], opacity: 0 }}
          transition={move ? { duration: 3.6, ease: "easeInOut", repeat: Infinity, repeatDelay: 1.4 } : { duration: 0 }}
        />
      </svg>
      <span className="mark-caption">sender · relays · recipient</span>
    </div>
  );
}

/** MX: no logo, just its name and the one path the cryptography is allowed to take. */
export function MxMark({ pipeline }: { pipeline: string[] }) {
  return (
    <div className="mark mark-mx" aria-hidden="true">
      <span className="mark-word mark-word-mx">mx</span>
      <ol className="mark-pipeline">
        {pipeline.map((step) => <li key={step}>{step}</li>)}
      </ol>
    </div>
  );
}
