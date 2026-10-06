"use client";

import { useState } from "react";
import { mapLinks, mapNodes } from "@/content/project-map";

const byId = Object.fromEntries(mapNodes.map((node) => [node.id, node]));

/**
 * The projects as a constellation. Lines are themes, not dependencies. Every node is a real link
 * (keyboard reachable); hovering or focusing one lights up what it is connected to.
 */
export default function ProjectMap() {
  const [active, setActive] = useState<string | null>(null);
  const near = new Set(mapLinks.filter((link) => link.a === active || link.b === active).flatMap((link) => [link.a, link.b]));

  return (
    <div className="pmap">
      <svg className="pmap-svg" viewBox="0 0 620 400" role="presentation" aria-hidden="true" focusable="false">
        {mapLinks.map((link) => {
          const [a, b] = [byId[link.a], byId[link.b]];
          const lit = active === link.a || active === link.b;
          return (
            <g key={`${link.a}-${link.b}`} className="pmap-link" data-lit={lit || undefined}>
              <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} />
              <text x={(a.x + b.x) / 2} y={(a.y + b.y) / 2 - 8} textAnchor="middle">{link.theme}</text>
            </g>
          );
        })}
        {mapNodes.map((node) => (
          <circle key={node.id} className="pmap-dot" data-lit={node.id === active || near.has(node.id) || undefined} cx={node.x} cy={node.y} r={node.id === active ? 9 : 6} />
        ))}
      </svg>
      <ul className="pmap-nodes">
        {mapNodes.map((node) => {
          const external = node.href.startsWith("http");
          return (
            <li key={node.id} style={{ left: `${(node.x / 620) * 100}%`, top: `${(node.y / 400) * 100}%` }}>
              <a
                href={node.href}
                className="pmap-node mono"
                data-lit={node.id === active || near.has(node.id) || undefined}
                onPointerEnter={() => setActive(node.id)}
                onPointerLeave={() => setActive(null)}
                onFocus={() => setActive(node.id)}
                onBlur={() => setActive(null)}
                {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              >
                {node.name}
                {external && <span aria-hidden="true"> ↗</span>}
              </a>
            </li>
          );
        })}
      </ul>
      <p className="toy-foot mono">thematic, not architectural. nothing here shares code. it mostly shares questions.</p>
    </div>
  );
}
