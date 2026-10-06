"use client";

import { RivetLoop } from "../rivet/RivetLoop";

/**
 * Rivet has no public logo yet, so it gets a typographic treatment and a diagram of what it
 * actually does: phones (the rounded rectangles) pass an envelope from a sender, through nearby
 * relay phones, to its recipient. Dashed lines are peers in range that this message did not use.
 *
 * Where there is room, the diagram is replaced by the same 3D route scene as the Rivet post,
 * playing on a loop (RivetLoop). Thumbnails, reduced motion and browsers without WebGL keep the
 * flat diagram, with the envelope resting mid-route so it still reads as "in transit".
 */
const nodes = [
  { x: 40, y: 140, role: "sender" },
  { x: 122, y: 84, role: "relay" },
  { x: 205, y: 132, role: "relay" },
  { x: 284, y: 70, role: "relay" },
  { x: 362, y: 118, role: "recipient" },
  { x: 168, y: 34, role: "" },
  { x: 320, y: 168, role: "" },
];
const links: [number, number][] = [[0, 1], [1, 2], [2, 3], [3, 4], [1, 5], [5, 3], [2, 6], [6, 4]];
const route = [0, 1, 2, 3, 4];
const onRoute = (a: number, b: number) => Math.abs(route.indexOf(a) - route.indexOf(b)) === 1 && route.includes(a) && route.includes(b);
const lift = 24;
const rest = { x: (nodes[1].x + nodes[2].x) / 2, y: (nodes[1].y + nodes[2].y) / 2 - lift };

/** A small envelope glyph centred on its origin. */
function Envelope() {
  return (
    <>
      <rect x="-8" y="-5.5" width="16" height="11" rx="1.5" className="mesh-envelope" />
      <path d="M-8 -5 0 1.2 8 -5" className="mesh-envelope-flap" />
    </>
  );
}

/** The flat diagram: the poster before the 3D loop is ready, and the thumbnail everywhere else. */
function MeshDiagram() {
  return (
    <svg viewBox="0 0 400 200" focusable="false">
      {links.map(([a, b]) => (
        <line
          key={`${a}-${b}`}
          x1={nodes[a].x}
          y1={nodes[a].y}
          x2={nodes[b].x}
          y2={nodes[b].y}
          className={onRoute(a, b) ? "mesh-route" : "mesh-link"}
        />
      ))}
      {nodes.map((node, index) => (
        <g key={index}>
          <rect
            x={node.x - 7}
            y={node.y - 11}
            width="14"
            height="22"
            rx="3.5"
            className={`mesh-phone ${node.role === "sender" || node.role === "recipient" ? "mesh-end" : "mesh-node"}`}
          />
          {node.role && (
            <text x={node.x} y={node.y + 28} textAnchor="middle" className={node.role === "relay" ? "mesh-label mesh-label-quiet" : "mesh-label"}>
              {node.role}
            </text>
          )}
        </g>
      ))}
      <circle cx={nodes[4].x} cy={nodes[4].y} r="15" className="mesh-received" />
      <g className="mesh-packet" style={{ transform: `translate(${rest.x}px, ${rest.y}px)` }}>
        <Envelope />
      </g>
    </svg>
  );
}

export function RivetMark({ animated = true, size = "md" }: { animated?: boolean; size?: "md" | "lg" }) {
  return (
    <div className="mark mark-rivet" data-size={size} aria-hidden="true">
      <span className="mark-word">RIVET</span>
      {animated ? <RivetLoop poster={<MeshDiagram />} /> : <MeshDiagram />}
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
