/**
 * Where every part of the build engine is, as a pure function of time (the opening) and scroll
 * (everything after). HeroEngine.tsx only applies these numbers to the drawing; Anime.js is the
 * clock and the scroll sync. Kept free of imports so the tests can check every pose directly.
 *
 * Units are SVG user units in screen space. A pose of all zeros (scale 1, opacity 1) is the
 * assembled machine, which is exactly what the server renders.
 */

export const PARTS = ["frame", "local", "protocol", "ring", "core", "network", "privacy", "interface"] as const;
export type PartId = (typeof PARTS)[number];

export type Pose = { x: number; y: number; rotate: number; scale: number; opacity: number; flash: number };

export const REST: Pose = { x: 0, y: 0, rotate: 0, scale: 1, opacity: 1, flash: 0 };

type Offset = Partial<Omit<Pose, "flash">>;

export const clamp01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n);
/** 0 before `from`, 1 after `to`, linear between. */
export const range = (p: number, from: number, to: number) => clamp01((p - from) / (to - from));
export const smooth = (t: number) => t * t * (3 - 2 * t);
export const outQuart = (t: number) => 1 - (1 - t) ** 4;
/** A very small overshoot: about 2%, the amount a part has when it seats against a stop. */
export const seat = (t: number, s = 0.6) => 1 + (s + 1) * (t - 1) ** 3 + s * (t - 1) ** 2;

/* ---------------------------------------------------------------- intro --- */

type Stage = { at: number; dur: number; from?: Offset; overshoot?: boolean };

/**
 * The opening, in milliseconds. Guides, then the frame, then the core rises, the protocol ring
 * turns and locks, storage slides in beneath, the network arrives from depth, the interface from
 * the other side, the privacy shell closes around it all, connectors trace, labels arrive and the
 * headline settles. Every part has its own start, its own travel and its own easing.
 */
export const INTRO = {
  guides: { at: 0, dur: 520 },
  frame: { at: 140, dur: 520, from: { scale: 1.05, opacity: 0 } },
  core: { at: 300, dur: 620, from: { y: 130, opacity: 0 }, overshoot: true },
  protocol: { at: 520, dur: 520, from: { y: 40, opacity: 0 } },
  ring: { at: 600, dur: 700, from: { rotate: -120, y: -14, opacity: 0 }, overshoot: true },
  local: { at: 820, dur: 600, from: { x: -170, y: 98, opacity: 0 } },
  network: { at: 1040, dur: 640, from: { x: 160, y: -112, scale: 0.9, opacity: 0 } },
  interface: { at: 1280, dur: 640, from: { x: -150, y: -150, opacity: 0 } },
  privacy: { at: 1560, dur: 560, from: { scale: 1.3, opacity: 0 } },
  rails: { at: 1860, dur: 440 },
  tags: { at: 2020, dur: 360, stagger: 70 },
  underline: { at: 2300, dur: 480 },
  total: 2800,
} as const satisfies Record<string, unknown>;

const FLASH = 240;

function staged(stage: Stage, t: number): Pose {
  const raw = range(t, stage.at, stage.at + stage.dur);
  const k = stage.overshoot ? seat(raw) : outQuart(raw);
  const from = stage.from ?? {};
  const end = stage.at + stage.dur;
  return {
    x: (from.x ?? 0) * (1 - k),
    y: (from.y ?? 0) * (1 - k),
    rotate: (from.rotate ?? 0) * (1 - k),
    scale: 1 + ((from.scale ?? 1) - 1) * (1 - k),
    opacity: from.opacity === undefined ? 1 : clamp01(raw * 2.2),
    // the moment a part seats, its outline briefly takes the accent colour
    flash: t >= end ? 1 - range(t, end, end + FLASH) : 0,
  };
}

export type IntroPose = {
  parts: Record<PartId, Pose>;
  guides: number;
  rails: number;
  /** One value per tag, in layer order, plus the core's tag last. */
  tags: number[];
  underline: number;
};

export function introPose(t: number, tagCount: number): IntroPose {
  const parts = {} as Record<PartId, Pose>;
  for (const id of PARTS) parts[id] = staged(INTRO[id], t);
  return {
    parts,
    guides: smooth(range(t, INTRO.guides.at, INTRO.guides.at + INTRO.guides.dur)),
    rails: smooth(range(t, INTRO.rails.at, INTRO.rails.at + INTRO.rails.dur)),
    tags: Array.from({ length: tagCount }, (_, i) => {
      const at = INTRO.tags.at + i * INTRO.tags.stagger;
      return outQuart(range(t, at, at + INTRO.tags.dur));
    }),
    underline: smooth(range(t, INTRO.underline.at, INTRO.underline.at + INTRO.underline.dur)),
  };
}

/** The finished opening: identical to the server-rendered drawing. */
export const BUILT = introPose(INTRO.total, 6);

/* --------------------------------------------------------------- scroll --- */

/**
 * The exploded view, like an engineering manual: interface up and a little left, network right,
 * the protocol ring turns and comes forward, storage drops, the privacy shell opens outward, and
 * the core stays exactly where it is.
 */
export const EXPLODE: Record<PartId, Offset> = {
  frame: { scale: 1.04 },
  interface: { x: -12, y: -100 },
  privacy: { y: -50, scale: 1.1 },
  network: { x: 22, y: -2 },
  core: {},
  ring: { x: -18, y: 56, rotate: 48 },
  protocol: { x: -12, y: 40 },
  local: { x: -8, y: 104 },
};

/** Scroll fractions (0 to 1 of the hero's scroll distance). */
export const SCROLL = {
  explode: [0.06, 0.36],
  notesIn: [0.3, 0.36],
  notesOut: [0.5, 0.54],
  projectsIn: [0.55, 0.6],
  projectsOut: [0.72, 0.76],
  reassemble: [0.72, 0.92],
  labelsOut: [0.84, 0.9],
  recede: [0.8, 1],
  /** Degrees and fractions. Small on purpose: framing, not a camera flight. */
  tilt: -2.2,
  zoom: 0.025,
  pan: 8,
  exitScale: 0.92,
  exitOpacity: 0.4,
  exitLift: -4,
} as const;

export type ScrollPose = {
  /** 0 assembled, 1 fully exploded. */
  explode: number;
  camera: { rotate: number; scale: number; x: number };
  notes: number;
  projects: number;
  labels: number;
  machine: { scale: number; opacity: number; y: number };
};

export function scrollPose(p: number): ScrollPose {
  const s = SCROLL;
  const out = smooth(range(p, s.explode[0], s.explode[1]));
  const back = smooth(range(p, s.reassemble[0], s.reassemble[1]));
  const explode = out * (1 - back);
  const recede = range(p, s.recede[0], s.recede[1]);
  return {
    explode,
    camera: { rotate: s.tilt * explode, scale: 1 - s.zoom * explode, x: s.pan * explode },
    notes: range(p, s.notesIn[0], s.notesIn[1]) * (1 - range(p, s.notesOut[0], s.notesOut[1])),
    projects: range(p, s.projectsIn[0], s.projectsIn[1]) * (1 - range(p, s.projectsOut[0], s.projectsOut[1])),
    labels: 1 - range(p, s.labelsOut[0], s.labelsOut[1]),
    machine: {
      scale: 1 - (1 - s.exitScale) * recede,
      opacity: 1 - (1 - s.exitOpacity) * recede,
      y: recede ? s.exitLift * recede : 0,
    },
  };
}

/* -------------------------------------------------------------- combine --- */

/**
 * One part's final pose: where the opening has it, plus how far the scroll has pulled it out.
 * `travel` shrinks the explosion on small screens; `alt` is the bolt-collector variant, which
 * pulls everything a little further apart.
 */
export function combine(intro: Pose, id: PartId, explode: number, travel = 1, alt = false): Pose {
  const e = explode * travel * (alt ? 1.22 : 1);
  const o = EXPLODE[id];
  return {
    x: intro.x + (o.x ?? 0) * e,
    y: intro.y + (o.y ?? 0) * e,
    rotate: intro.rotate + (o.rotate ?? 0) * explode * (alt ? 2 : 1),
    scale: intro.scale * (1 + ((o.scale ?? 1) - 1) * explode),
    opacity: intro.opacity,
    flash: intro.flash,
  };
}

/** Depth parallax: higher parts drift a touch more when the frame pans. */
export function parallax(pan: number, z: number) {
  return pan * (z / 76) * 0.6;
}
