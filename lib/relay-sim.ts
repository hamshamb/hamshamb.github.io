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

/* ------------------------------------------------------------------------------------------
 * The spatial version, for the 3D scene. Same idea as above, on a flat table instead of a line:
 * four phones, one sealed envelope, and a made-up "transfer range" measured in scene units. The
 * range is a drawing aid. It is not a Bluetooth distance and nothing here measures one.
 * ---------------------------------------------------------------------------------------- */

export type PhoneId = "sender" | "relay-a" | "relay-b" | "recipient";
export type ScenePhone = { id: PhoneId; label: string; role: "sender" | "relay" | "recipient"; x: number; z: number };
export type Scene = {
  phones: ScenePhone[];
  /** Hops the sealed copy on each phone has taken. Absent means that phone holds nothing. */
  copies: Partial<Record<PhoneId, number>>;
  delivered: boolean;
  /** The latest thing worth telling the visitor, in plain words. */
  note: string;
};

export const SCENE_RANGE = 4;
/** Half the table, in scene units. Phones cannot be dragged off it. */
export const SCENE_HALF = { x: 6.4, z: 3.3 };
/** Two phones never sit closer than this, so slabs do not pass through each other. */
export const SCENE_GAP = 1.8;

export const phoneIds: PhoneId[] = ["sender", "relay-a", "relay-b", "recipient"];

const startPhones: ScenePhone[] = [
  { id: "sender", label: "sender", role: "sender", x: -5, z: 0.8 },
  { id: "relay-a", label: "relay a", role: "relay", x: -1.8, z: -0.6 },
  { id: "relay-b", label: "relay b", role: "relay", x: 2.4, z: 0.9 },
  { id: "recipient", label: "recipient", role: "recipient", x: 5.6, z: -0.8 },
];

export const sceneIntro = "the envelope is sealed and sitting on the sender. drag it onto a phone that is in range.";

export function sceneStart(): Scene {
  return { phones: startPhones.map((phone) => ({ ...phone })), copies: { sender: 0 }, delivered: false, note: sceneIntro };
}

export const phoneById = (scene: Scene, id: PhoneId) => scene.phones.find((phone) => phone.id === id)!;

export const sceneDistance = (a: { x: number; z: number }, b: { x: number; z: number }) => Math.hypot(a.x - b.x, a.z - b.z);

export const sceneInRange = (a: ScenePhone, b: ScenePhone) => a.id !== b.id && sceneDistance(a, b) <= SCENE_RANGE;

/** Every pair of phones close enough to exchange a copy. */
export function sceneLinks(scene: Scene): [PhoneId, PhoneId][] {
  const links: [PhoneId, PhoneId][] = [];
  scene.phones.forEach((a, index) => {
    for (const b of scene.phones.slice(index + 1)) if (sceneInRange(a, b)) links.push([a.id, b.id]);
  });
  return links;
}

const clamp = (value: number, low: number, high: number) => Math.max(low, Math.min(high, value));
const hundredth = (value: number) => Math.round(value * 100) / 100;

/** Moves a phone, keeping it on the table and out of the other phones. */
export function sceneMove(scene: Scene, id: PhoneId, x: number, z: number): Scene {
  let nx = clamp(x, -SCENE_HALF.x, SCENE_HALF.x);
  let nz = clamp(z, -SCENE_HALF.z, SCENE_HALF.z);
  for (const other of scene.phones) {
    if (other.id === id) continue;
    const dx = nx - other.x;
    const dz = nz - other.z;
    const distance = Math.hypot(dx, dz);
    if (distance >= SCENE_GAP) continue;
    const ux = distance < 1e-6 ? 1 : dx / distance;
    const uz = distance < 1e-6 ? 0 : dz / distance;
    nx = other.x + ux * SCENE_GAP;
    nz = other.z + uz * SCENE_GAP;
  }
  nx = hundredth(clamp(nx, -SCENE_HALF.x, SCENE_HALF.x));
  nz = hundredth(clamp(nz, -SCENE_HALF.z, SCENE_HALF.z));
  return { ...scene, phones: scene.phones.map((phone) => (phone.id === id ? { ...phone, x: nx, z: nz } : phone)) };
}

export type HandOutcome = "stored" | "delivered" | "already" | "out-of-range" | "nowhere" | "hop-limit";
export type HandResult = { scene: Scene; outcome: HandOutcome };

/**
 * The visitor drops the envelope on `to` (or on nothing, when `to` is null). When `from` is given
 * the copy comes from that phone; otherwise from whichever phone holding one is nearest in range.
 * A phone only ever receives a sealed copy. The recipient is the one place it gets opened.
 */
export function sceneHandOver(scene: Scene, to: PhoneId | null, from?: PhoneId): HandResult {
  const keep = (note: string, outcome: HandOutcome): HandResult => ({ scene: { ...scene, note }, outcome });
  if (to === null) return keep("dropped on empty ground. it stays sealed where it was.", "nowhere");
  const target = phoneById(scene, to);
  if (scene.copies[to] !== undefined) return keep(`${target.label} already holds a sealed copy.`, "already");

  const holders = scene.phones.filter((phone) => scene.copies[phone.id] !== undefined);
  const source = from
    ? holders.find((phone) => phone.id === from)
    : holders
        .filter((phone) => sceneInRange(phone, target))
        .sort((a, b) => sceneDistance(a, target) - sceneDistance(b, target))[0];
  if (!source || !sceneInRange(source, target)) {
    const origin = source ? source.label : "any phone holding it";
    return keep(`${target.label} is out of range of ${origin}. no connection, so nothing moves. drag a phone closer.`, "out-of-range");
  }
  const hops = (scene.copies[source.id] ?? 0) + 1;
  if (hops > MAX_HOPS) return keep(`this copy has already used all ${MAX_HOPS} hops. it stops here.`, "hop-limit");

  const copies = { ...scene.copies, [to]: hops };
  if (target.role === "recipient") {
    return {
      scene: { ...scene, copies, delivered: true, note: "delivered. the recipient opened it with its own key and checked the signature inside." },
      outcome: "delivered",
    };
  }
  return {
    scene: { ...scene, copies, note: `${target.label} stored a sealed copy. it can read the header, not the message.` },
    outcome: "stored",
  };
}
