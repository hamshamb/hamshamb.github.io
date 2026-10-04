"use client";

import { createScope, createTimeline, stagger, utils } from "animejs";
import { useLayoutEffect, useRef } from "react";
import { animeEaseOut, meshMotion as t } from "@/lib/anime";

/**
 * Rivet has no public logo yet, so it gets a typographic treatment and a diagram of what it
 * actually does: phones (the rounded rectangles) pass an envelope from a sender, through nearby
 * relay phones, to its recipient. Dashed lines are peers in range that this message did not use.
 *
 * Anime.js plays the store-and-forward story once when the mark comes into view: the peers
 * appear, the envelope leaves the sender, each relay takes it and passes it on, the recipient
 * receives it, and it stops. With reduced motion (or in small thumbnails) the envelope simply
 * rests mid-route so the still image still reads as "in transit".
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

export function RivetMark({ animated = true, size = "md" }: { animated?: boolean; size?: "md" | "lg" }) {
  const ref = useRef<HTMLDivElement>(null);

  // Layout effect: the starting state is applied before the browser paints a freshly mounted mark.
  useLayoutEffect(() => {
    const root = ref.current;
    if (!root || !animated) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const phones = [...root.querySelectorAll<SVGRectElement>(".mesh-phone")];
    const envelope = root.querySelector<SVGGElement>(".mesh-packet");
    if (!envelope) return;

    const scope = createScope({ root }).add(() => {
      utils.set(phones, { scale: 0.4, opacity: 0 });
      utils.set(envelope, { x: nodes[0].x, y: nodes[0].y - lift, opacity: 0 });
    });

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        scope.add(() => {
          const tl = createTimeline({ defaults: { ease: animeEaseOut } })
            .add(phones, { scale: [0.4, 1], opacity: [0, 1], duration: t.nodeDuration, delay: stagger(t.nodeStagger) }, 0)
            .add(envelope, { opacity: [0, 1], duration: 200 }, "+=80");
          route.slice(1).forEach((index) => {
            const node = nodes[index];
            tl.add(envelope, { x: node.x, y: node.y - lift, duration: t.hopDuration, ease: "inOut(2)" }, `+=${t.hopPause}`)
              .add(phones[index], { scale: [1, 1.18, 1], duration: t.receiveDuration }, "<");
          });
          tl.add(root.querySelector(".mesh-received")!, { opacity: [0, 1], duration: t.receiveDuration }, "<");
        });
      },
      { threshold: 0.5 },
    );
    observer.observe(root);

    return () => {
      observer.disconnect();
      scope.revert();
    };
  }, [animated]);

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
