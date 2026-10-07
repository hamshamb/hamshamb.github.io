import type { Part } from "./envelope-fields";

/**
 * The exploded envelope, as data. Every physical piece of the 3D envelope, which documented field
 * it stands for, where it rests, where it goes when the envelope is taken apart, and what each
 * stage (pack, seal, relay, open) ends on. envelope3d.ts builds meshes from this; the figure's
 * Anime.js timelines animate between these numbers. No imports at runtime, so it is tested
 * directly. Nothing here adds a protocol field: each piece maps to one in envelope-fields.ts,
 * except the shell, flap and seal, which are the physical envelope itself (the seal is a picture
 * of authenticated encryption, not a separate field).
 */

export const PIECES = [
  "shell", "flap", "seal",
  "header", "tile-magic", "tile-id", "tile-time", "tile-hops", "tile-length",
  "key", "nonce",
  "letter", "sender", "message", "padding",
] as const;
export type PieceId = (typeof PIECES)[number];

/** Pieces that are the envelope itself rather than a field in it. */
export const STRUCTURAL: PieceId[] = ["shell", "flap", "seal", "letter"];

/** Each documented field and the piece (or pieces) that show it. */
export const fieldPieces: Record<string, PieceId[]> = {
  magic: ["tile-magic"],
  id: ["tile-id"],
  time: ["tile-time"],
  ttl: ["tile-time"],
  hops: ["tile-hops"],
  length: ["tile-length"],
  eph: ["key"],
  nonce: ["nonce"],
  sender: ["sender"],
  body: ["message", "padding"],
};

/** The field a piece stands for, for hover and click. The header strip itself is the magic. */
export const pieceField: Partial<Record<PieceId, string>> = {
  header: "magic",
  "tile-magic": "magic",
  "tile-id": "id",
  "tile-time": "time",
  "tile-hops": "hops",
  "tile-length": "length",
  key: "eph",
  nonce: "nonce",
  sender: "sender",
  message: "body",
  padding: "body",
};

/** Every field in the list has a piece; no piece invents a field. */
export function unmappedFields(parts: Part[]) {
  return parts.filter((part) => !fieldPieces[part.id]?.length).map((part) => part.id);
}

/* ---------------------------------------------------------------- geometry --- */

/** Sizes in scene units. The envelope faces +z; y is up. */
export const SIZE = {
  shell: { w: 4.2, h: 2.6, t: 0.12 },
  /** the header is an address label low on the front face */
  header: { w: 2.5, h: 0.66, x: -0.72, y: -0.74 },
  key: { w: 0.86, h: 0.62, x: 1.42, y: -0.66 },
  nonce: { w: 0.96, h: 0.56, x: 1.56, y: -0.8 },
  /** the letter, unfolded: three panels that fold into one */
  letter: { w: 3.4, panel: 1.24 },
} as const;

/** Header tiles, left to right, with their width on the label. */
export const TILES: { id: PieceId; w: number; text: string }[] = [
  { id: "tile-magic", w: 0.34, text: "RVT" },
  { id: "tile-id", w: 0.8, text: "id" },
  { id: "tile-time", w: 0.52, text: "6h" },
  { id: "tile-hops", w: 0.38, text: "0/6" },
  { id: "tile-length", w: 0.3, text: "len" },
];

/* ------------------------------------------------------------------- poses --- */

/** A piece's offset from where it rests in the finished envelope. All zeros is assembled. */
export type Pose = { x: number; y: number; z: number; rx: number; ry: number; rz: number; s: number; o: number };

export const rest = (): Pose => ({ x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0, s: 1, o: 1 });
const at = (pose: Partial<Pose>): Pose => ({ ...rest(), ...pose });

/**
 * The exploded view, like an engineering drawing: the header lifts off the front and its tiles
 * fan out, the key and nonce leave from opposite corners at different depths, the flap opens, the
 * seal comes forward, and the sealed letter drops out with its three layers stepping away from it.
 */
const EXPLODE: Record<PieceId, Pose> = {
  shell: at({}),
  flap: at({ rx: -0.5 }),
  seal: at({ z: 0.55, y: 0.35 }),
  header: at({ y: 2.15, z: 0.75, rx: -0.12, rz: 0.03 }),
  "tile-magic": at({ x: -0.28, y: 0.4, z: 0.12, rz: 0.14 }),
  "tile-id": at({ y: 0.56, z: 0.32 }),
  "tile-time": at({ x: 0.06, y: 0.46, z: 0.18, rz: -0.06 }),
  "tile-hops": at({ x: 0.22, y: 0.52, z: 0.12, rz: -0.16 }),
  "tile-length": at({ x: 0.42, y: 0.36, z: 0.06, rz: -0.24 }),
  key: at({ x: -3.75, y: 1.25, z: 0.9, ry: 0.38, rz: 0.2 }),
  nonce: at({ x: 1.25, y: 1.55, z: 0.45, rx: 0.32, rz: -0.26 }),
  letter: at({ y: -2.25, z: 0.6, rx: 0.18 }),
  sender: at({ x: -2.6, y: -0.15, z: 0.9, ry: 0.22, rz: 0.05 }),
  message: at({ x: 0.1, y: -1.25, z: 1.1, rx: 0.08 }),
  padding: at({ x: 2.6, y: -0.2, z: 0.75, ry: -0.24, rz: -0.06 }),
};

/** On a phone everything moves less, so the object stays large and recognisable. */
export function explodedPose(id: PieceId, compact: boolean): Pose {
  const pose = EXPLODE[id];
  if (!compact) return { ...pose };
  const k = 0.62;
  return { ...pose, x: pose.x * k, y: pose.y * k, z: pose.z * k };
}

/* ------------------------------------------------------------------ stages --- */

export const STAGES = ["pack", "seal", "relay", "open"] as const;
export type Stage = (typeof STAGES)[number];

/** Everything about the envelope that is not a piece position. */
export type Scalars = {
  /** 0 flat letter, 1 folded in three */
  fold: number;
  /** 0 readable, 1 encrypted texture, per layer */
  cipher: { sender: number; message: number; padding: number };
  /** 0 out of the envelope (above it), 1 inside */
  inside: number;
  /** 0 closed, 1 open */
  flap: number;
  /** 0 no seal, 1 locked */
  seal: number;
  /** the header lit as a relay reads it */
  read: number;
  /** hops this copy has taken */
  hops: number;
  /** 0 hidden, 1 the four phones are on stage */
  phones: number;
  /** where the envelope is along sender, relay a, relay b, recipient (0 to 3) */
  route: number;
  /** the padding pulled away from the message after opening */
  apart: number;
};

export const MAX_HOPS = 6;
export const ROUTE_STOPS = 3;

/** The state each stage ends on: what a button press animates to, and reduced motion jumps to. */
export function stageEnd(stage: Stage): Scalars {
  switch (stage) {
    case "pack":
      return { fold: 0, cipher: { sender: 0, message: 0, padding: 0 }, inside: 0, flap: 1, seal: 0, read: 0, hops: 0, phones: 0, route: 0, apart: 0 };
    case "seal":
      return { fold: 1, cipher: { sender: 1, message: 1, padding: 1 }, inside: 1, flap: 0, seal: 1, read: 0, hops: 0, phones: 0, route: 0, apart: 0 };
    case "relay":
      return { fold: 1, cipher: { sender: 1, message: 1, padding: 1 }, inside: 1, flap: 0, seal: 1, read: 0, hops: ROUTE_STOPS, phones: 1, route: ROUTE_STOPS, apart: 0 };
    case "open":
      return { fold: 0, cipher: { sender: 0, message: 0, padding: 0 }, inside: 0, flap: 1, seal: 0, read: 0, hops: ROUTE_STOPS, phones: 0, route: ROUTE_STOPS, apart: 1 };
  }
}

/** The order the tabs run in; "play next" goes round. */
export function nextStage(stage: Stage): Stage {
  return STAGES[(STAGES.indexOf(stage) + 1) % STAGES.length];
}

/**
 * Where a visit starts. With motion: the finished, sealed envelope (the opening builds it). With
 * reduced motion: the same envelope already taken apart, so everything is visible without
 * anything having to move.
 */
export function initialView(reduced: boolean): { stage: Stage; exploded: boolean } {
  return reduced ? { stage: "seal", exploded: true } : { stage: "seal", exploded: false };
}

/* ------------------------------------------------------------------ labels --- */

export type Label = { piece: PieceId; title: string; note: string; dx: number; dy: number };

/**
 * Engineering annotations. The numbers are arithmetic on envelope-fields.ts (see
 * envelopeModel); `bytes` is passed in so this file stays free of runtime imports.
 */
export function labels(bytes: { header: number; key: number; nonce: number; sender: number }): Label[] {
  return [
    { piece: "header", title: "header", note: `${bytes.header} B · relay readable`, dx: -1, dy: -1 },
    { piece: "key", title: "ephemeral key", note: `${bytes.key} B · visible`, dx: -1, dy: -0.6 },
    { piece: "nonce", title: "nonce", note: `${bytes.nonce} B · visible`, dx: 1, dy: -1 },
    { piece: "sender", title: "sender", note: `${bytes.sender} B · sealed`, dx: -1, dy: 0.6 },
    { piece: "message", title: "message", note: "sealed", dx: -0.4, dy: 1 },
    { piece: "padding", title: "padding", note: "to a fixed bucket · sealed", dx: 1, dy: 0.6 },
  ];
}

/** Fewer labels on a phone: the three that carry the idea. */
export const COMPACT_LABELS: PieceId[] = ["header", "key", "message"];

/** Short, honest stage captions: pack, pad, seal, relay, open. Sizes only ever grow to the bucket. */
export const stageCaption: Record<Stage, string> = {
  pack: "pack: the message is written, the sender's keys and signature go on top, and padding fills the sheet to a fixed bucket size.",
  seal: "seal: the letter is encrypted for the recipient and folded inside. the ephemeral key and nonce ride outside, the header goes on the front, and the seal closes it.",
  relay: "relay: each phone reads only the header. the hop count goes up, the sealed letter stays dark, and when two phones meet they trade ids first, and only the envelopes the other does not already hold get sent.",
  open: "open: only the recipient's key opens it. the seal releases, the letter comes out, and the message reads again. the padding falls away.",
};
