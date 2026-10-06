/**
 * The build engine: the hero's technical drawing, described once and shared by the static SVG
 * (BuildEngine.tsx, server rendered) and the scroll choreography (HeroEngine.tsx).
 *
 * It is an exploded assembly drawn in isometric projection: five plates stacked on a spindle
 * around a small core. Each plate is one of the kinds of problem the projects keep running into.
 * The project names attached to them are a visual metaphor, not an architecture claim.
 *
 * Units are SVG user units; the view box shows x 150 to 960 and y 0 to 760. Plates are authored flat, on a square plane
 * from -100 to 100, then projected; z lifts a plate up the screen.
 */

/** The visible window onto the drawing: nothing lives left of x = 150, so it is cropped away. */
export const VIEW = { x: 150, width: 810, height: 760 } as const;
export const CENTER = { x: 446, y: 384 } as const;
export const PLATE_SCALE = 1.5;
const K = PLATE_SCALE;
const COS = 0.866;

export type Point = readonly [number, number];

/** Plane (x, y) at height z to screen coordinates. */
export function project(x: number, y: number, z = 0): Point {
  return [CENTER.x + (x - y) * COS * K, CENTER.y + (x + y) * 0.5 * K - z];
}

const r1 = (n: number) => Math.round(n * 10) / 10;

export function path(points: Point[], close = false) {
  return `M${points.map(([x, y]) => `${r1(x)} ${r1(y)}`).join("L")}${close ? "Z" : ""}`;
}

/** A rectangle on the plane. */
export function quad(x0: number, y0: number, x1: number, y1: number, z: number) {
  return path([project(x0, y0, z), project(x1, y0, z), project(x1, y1, z), project(x0, y1, z)], true);
}

/** A straight line on the plane. */
export function segment(x0: number, y0: number, x1: number, y1: number, z: number) {
  return path([project(x0, y0, z), project(x1, y1, z)]);
}

/** A circle on the plane: an axis-aligned ellipse once projected. */
export function ring(r: number, z: number, cx = 0, cy = 0) {
  const [x, y] = project(cx, cy, z);
  const rx = r1(r * 1.2247 * K);
  const ry = r1(r * 0.7071 * K);
  return `M${r1(x - rx)} ${r1(y)}A${rx} ${ry} 0 1 0 ${r1(x + rx)} ${r1(y)}A${rx} ${ry} 0 1 0 ${r1(x - rx)} ${r1(y)}`;
}

/** Only the near half of a projected circle, for the sides of cylinders. */
export function nearArc(r: number, z: number, cx = 0, cy = 0) {
  const [x, y] = project(cx, cy, z);
  const rx = r1(r * 1.2247 * K);
  const ry = r1(r * 0.7071 * K);
  return `M${r1(x - rx)} ${r1(y)}A${rx} ${ry} 0 0 0 ${r1(x + rx)} ${r1(y)}`;
}

/** The two visible side faces of a plate of half-size s and thickness t. */
export function plateSides(s: number, z: number, t: number) {
  const left = project(-s, s, z);
  const bottom = project(s, s, z);
  const right = project(s, -s, z);
  const down = (p: Point): Point => [p[0], p[1] + t];
  return {
    face: path([left, bottom, right, down(right), down(bottom), down(left)], true),
    edges: [path([left, down(left), down(bottom), down(right), right]), path([bottom, down(bottom)])],
  };
}

export type LayerId = "interface" | "privacy" | "network" | "protocol" | "local";

export type EngineLayer = {
  id: LayerId;
  index: string;
  label: string;
  /** Assembled height on the spindle. */
  z: number;
  /** Half-size of the plate. */
  size: number;
  /** Plate thickness; 0 for open layers that do not hide what is below them. */
  thickness: number;
  note: [string, string];
  /** 1 shows everywhere, 2 from mid-size screens, 3 only on wide desktops. */
  priority: 1 | 2 | 3;
  projects: { name: string; short: string }[];
  /** Where the layer waits before it slides into the assembly (x and z offsets). */
  from: { x: number; z: number; rotate?: number };
  /** Where it sits in the exploded view. */
  explode: { x: number; z: number };
};

/** Top to bottom. Painted bottom first so solid plates cover what is under them. */
export const layers: EngineLayer[] = [
  {
    id: "interface",
    index: "01",
    label: "INTERFACE",
    z: 76,
    size: 100,
    thickness: 8,
    note: ["the visible part is usually", "not the hard part."],
    priority: 3,
    projects: [{ name: "STUDYFILTER", short: "SF" }, { name: "AREUHUMAN", short: "AUH" }],
    from: { x: 0, z: 44 },
    explode: { x: -18, z: 80 },
  },
  {
    id: "privacy",
    index: "02",
    label: "PRIVACY",
    z: 38,
    size: 106,
    thickness: 0,
    note: ["less infrastructure.", "less data collected."],
    priority: 2,
    projects: [{ name: "RIVET", short: "RIVET" }],
    from: { x: 0, z: 0 },
    explode: { x: 12, z: 40 },
  },
  {
    id: "network",
    index: "03",
    label: "NETWORK",
    z: 0,
    size: 100,
    thickness: 0,
    note: ["what happens when", "the obvious path disappears?"],
    priority: 1,
    projects: [{ name: "RIVET", short: "RIVET" }, { name: "NEXUS", short: "NX" }],
    from: { x: 96, z: 0 },
    explode: { x: 16, z: 0 },
  },
  {
    id: "protocol",
    index: "04",
    label: "PROTOCOL",
    z: -38,
    size: 100,
    thickness: 6,
    note: ["simple ideas get complicated", "between two devices."],
    priority: 2,
    projects: [{ name: "NEXUS", short: "NX" }],
    from: { x: 0, z: 0, rotate: -9 },
    explode: { x: 16, z: -40 },
  },
  {
    id: "local",
    index: "05",
    label: "LOCAL FIRST",
    z: -76,
    size: 100,
    thickness: 10,
    note: ["your machine should", "sometimes be enough."],
    priority: 1,
    projects: [{ name: "CHC REVIEW STUDIO", short: "CRS" }],
    from: { x: -16, z: -72 },
    explode: { x: -24, z: -80 },
  },
];

/** The core does not move: everything else separates around it. */
export const core = {
  index: "06",
  label: "SYSTEM CORE",
  half: 20,
  top: 4,
  bottom: -40,
  projects: [{ name: "PYFORGE", short: "PF" }],
} as const;

/** Labels hang off each plate's right-hand corner. */
export const TAG_X = 748;

export function tagY(layer: EngineLayer) {
  return project(layer.size, -layer.size, layer.z)[1];
}

/* ------------------------------------------------- engine 2.0 additions --- */

/** The protocol ring is its own part: it turns in its plane and locks. */
export const RING = { z: -38, outer: 84, inner: 62 } as const;

/** Ring ticks at an in-plane angle (degrees). Re-projected every frame, so the ticks really travel. */
export function ringTicks(angle: number) {
  const offset = (angle * Math.PI) / 180;
  const parts: string[] = [];
  for (let i = 0; i < 24; i += 1) {
    const a = (i / 24) * Math.PI * 2 + offset;
    const outer = i % 3 === 0 ? 80 : 74;
    parts.push(segment(Math.cos(a) * 66, Math.sin(a) * 66, Math.cos(a) * outer, Math.sin(a) * outer, RING.z));
  }
  return parts.join("");
}

/** The two accent keys on the ring that line up with the protocol plate's slots when locked. */
export function ringKeys(angle: number) {
  const offset = (angle * Math.PI) / 180;
  return [0, Math.PI]
    .map((base) => {
      const a = base + offset;
      return segment(Math.cos(a) * 62, Math.sin(a) * 62, Math.cos(a) * 84, Math.sin(a) * 84, RING.z);
    })
    .join("");
}

/** The outer frame: corner brackets in screen space around the assembled machine. */
export const FRAME = { x0: 166, x1: 734, y0: 142, y1: 640, arm: 22 } as const;

export function frameCorners(): Point[] {
  return [[FRAME.x0, FRAME.y0], [FRAME.x1, FRAME.y0], [FRAME.x1, FRAME.y1], [FRAME.x0, FRAME.y1]];
}

export function frameBrackets() {
  const { arm } = FRAME;
  return frameCorners()
    .map(([x, y]) => {
      const sx = x < CENTER.x ? 1 : -1;
      const sy = y < CENTER.y ? 1 : -1;
      return `M${x + sx * arm} ${y}H${x}V${y + sy * arm}`;
    })
    .join("");
}

/** A small hex bolt head, as drawn in a manual. */
export function hexBolt(x: number, y: number, r = 5) {
  const points = Array.from({ length: 6 }, (_, i): Point => {
    const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
    return [x + Math.cos(a) * r, y + Math.sin(a) * r * 0.82];
  });
  return path(points, true);
}

/** Where a plate's left corner (its rail mount) sits, assembled. */
export function mountPoint(layer: EngineLayer): Point {
  return project(-layer.size, layer.size, layer.z);
}

/** The point each part scales around. */
export function partCenter(z: number): Point {
  return project(0, 0, z);
}
