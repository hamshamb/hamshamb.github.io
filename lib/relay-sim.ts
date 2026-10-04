/**
 * A conceptual store-and-forward simulation for the Rivet post. It borrows Rivet's shape (copies
 * spread to anyone in range, a hop limit, a lifetime) but none of its radio behaviour: no
 * Bluetooth, no timing, no real distances. Phones sit on a line; two phones closer than RANGE
 * are "nearby".
 */

export type SimNode = { id: string; label: string; x: number; role: "sender" | "relay" | "recipient" };
/** Hops the copy on this phone has taken, or undefined when it holds nothing. */
export type Holding = Record<string, number | undefined>;
export type SimStatus = "idle" | "queued" | "in mesh" | "delivered" | "expired";
export type Sim = { nodes: SimNode[]; holding: Holding; age: number; status: SimStatus; log: string[] };

export const RANGE = 26;
export const MAX_HOPS = 6;
/** Ticks a copy may live. Stands in for Rivet's six-hour cap; the number itself means nothing. */
export const LIFETIME = 14;

export const startNodes: SimNode[] = [
  { id: "you", label: "you", x: 6, role: "sender" },
  { id: "a", label: "relay a", x: 28, role: "relay" },
  { id: "b", label: "relay b", x: 50, role: "relay" },
  { id: "c", label: "relay c", x: 66, role: "relay" },
  { id: "friend", label: "friend", x: 94, role: "recipient" },
];

export function newSim(nodes: SimNode[] = startNodes): Sim {
  return { nodes, holding: {}, age: 0, status: "idle", log: [] };
}

export const nearby = (a: SimNode, b: SimNode) => Math.abs(a.x - b.x) <= RANGE;

export function send(sim: Sim): Sim {
  const sender = sim.nodes.find((node) => node.role === "sender")!;
  return { ...sim, holding: { [sender.id]: 0 }, age: 0, status: "queued", log: [`${sender.label}: sealed a message and queued it.`] };
}

export function moveNode(sim: Sim, id: string, x: number): Sim {
  const clamped = Math.max(0, Math.min(100, Math.round(x)));
  return { ...sim, nodes: sim.nodes.map((node) => (node.id === id ? { ...node, x: clamped } : node)) };
}

/** One exchange round: every phone holding a copy offers it to every nearby phone without one. */
export function tick(sim: Sim): Sim {
  if (sim.status !== "queued" && sim.status !== "in mesh") return sim;
  const age = sim.age + 1;
  if (age > LIFETIME) {
    return { ...sim, age, holding: {}, status: "expired", log: [...sim.log, "every copy reached its lifetime and was deleted. nothing was delivered."] };
  }
  const holding: Holding = { ...sim.holding };
  const log = [...sim.log];
  let delivered = false;
  for (const from of sim.nodes) {
    const hops = sim.holding[from.id];
    if (hops === undefined || hops >= MAX_HOPS) continue;
    for (const to of sim.nodes) {
      if (to.id === from.id || holding[to.id] !== undefined || !nearby(from, to)) continue;
      holding[to.id] = hops + 1;
      if (to.role === "recipient") {
        delivered = true;
        log.push(`${to.label}: received it from ${from.label} and opened it.`);
      } else {
        log.push(`${to.label}: took a copy from ${from.label}. it cannot read it.`);
      }
    }
  }
  const spread = Object.keys(holding).length > 1;
  const status: SimStatus = delivered ? "delivered" : spread ? "in mesh" : "queued";
  return { ...sim, age, holding, status, log };
}
