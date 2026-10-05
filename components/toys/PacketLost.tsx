"use client";

import { useMemo, useState } from "react";
import { discover } from "@/lib/secrets";

type Node = { id: number; x: number; y: number; label?: string };

const nodes: Node[] = [
  { id: 0, x: 40, y: 120, label: "you" },
  { id: 1, x: 130, y: 50 },
  { id: 2, x: 140, y: 190 },
  { id: 3, x: 240, y: 110 },
  { id: 4, x: 330, y: 40 },
  { id: 5, x: 340, y: 200 },
  { id: 6, x: 440, y: 120, label: "home" },
];
const links: [number, number][] = [[0, 1], [0, 2], [1, 3], [2, 3], [1, 4], [3, 4], [3, 5], [2, 5], [4, 6], [5, 6]];
const HOPS = 5;

/** Two random links are down each round, but there is always a way home. */
function roll(): Set<string> {
  for (;;) {
    const down = new Set<string>();
    while (down.size < 2) {
      const [a, b] = links[Math.floor(Math.random() * links.length)];
      down.add(`${a}-${b}`);
    }
    const seen = new Set([0]);
    const queue = [0];
    while (queue.length) {
      const at = queue.shift()!;
      for (const [a, b] of links) {
        if (down.has(`${a}-${b}`)) continue;
        const next = a === at ? b : b === at ? a : -1;
        if (next >= 0 && !seen.has(next)) {
          seen.add(next);
          queue.push(next);
        }
      }
    }
    if (seen.has(6)) return down;
  }
}

/**
 * The 404's optional mini game: route the lost packet home within five hops. Every node is a
 * button, so it plays by keyboard too. The real way home is always the link above it.
 */
export function PacketLost() {
  const [round, setRound] = useState(0);
  // the first round is fixed so the server HTML and the first client render agree
  const down = useMemo(() => (round === 0 ? new Set(["1-3", "2-5"]) : roll()), [round]);
  const [at, setAt] = useState(0);
  const [path, setPath] = useState<number[]>([0]);
  const hopsLeft = HOPS - (path.length - 1);
  const done = at === 6;
  const expired = !done && hopsLeft <= 0;
  const linked = (a: number, b: number) => links.some(([x, y]) => ((x === a && y === b) || (x === b && y === a)) && !down.has(`${x}-${y}`));

  const hop = (to: number) => {
    if (done || expired || !linked(at, to)) return;
    setAt(to);
    setPath([...path, to]);
    if (to === 6) discover("packet-lost");
  };
  const reset = () => {
    setRound(round + 1);
    setAt(0);
    setPath([0]);
  };

  return (
    <div className="packet-game">
      <div className="packet-board">
        <svg viewBox="0 0 480 240" aria-hidden="true" focusable="false">
          {links.map(([a, b]) => (
            <line
              key={`${a}-${b}`}
              x1={nodes[a].x}
              y1={nodes[a].y}
              x2={nodes[b].x}
              y2={nodes[b].y}
              data-down={down.has(`${a}-${b}`) || undefined}
              data-path={path.some((n, i) => i > 0 && ((path[i - 1] === a && n === b) || (path[i - 1] === b && n === a))) || undefined}
            />
          ))}
        </svg>
        {nodes.map((node) => (
          <button
            key={node.id}
            type="button"
            className="packet-node mono"
            style={{ left: `${(node.x / 480) * 100}%`, top: `${(node.y / 240) * 100}%` }}
            data-here={node.id === at || undefined}
            data-home={node.id === 6 || undefined}
            disabled={node.id !== at && (done || expired || !linked(at, node.id))}
            aria-current={node.id === at ? "location" : undefined}
            onClick={() => hop(node.id)}
            aria-label={`${node.label ?? `relay ${node.id}`}${node.id === at ? ", the packet is here" : ""}`}
          >
            {node.label ?? node.id}
          </button>
        ))}
      </div>
      <p className="packet-status mono" aria-live="polite">
        {done ? "delivered. that is more than most packets manage." : expired ? "packet expired. it happens." : `hops left: ${hopsLeft}. dashed links are down.`}{" "}
        {(done || expired) && <button type="button" className="text-link" onClick={reset}>again</button>}
      </p>
    </div>
  );
}
