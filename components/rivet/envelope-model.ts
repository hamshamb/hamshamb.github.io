import type { Part } from "./envelope-fields";

/**
 * The envelope instrument's geometry, derived only from the documented fields in
 * envelope-fields.ts. Every tick on the ring is one real byte; nothing here is measured or
 * benchmarked, it is arithmetic on the protocol notes. A pure function of the field list, so
 * the tests can build it from the same data the page uses.
 */

export const CX = 300;
export const CY = 300;

/** Documented limits: hops per copy, hours on any one device. */
export const MAX_HOPS = 6;
export const MAX_HOURS = 6;

export type Field = Part & { n: number; start: number; end: number };
export type Tick = { i: number; field: string; zone: Part["zone"]; angle: number; first: boolean };

const GAP = 1.4; // degrees between fields
const isSized = (part: Part) => /^\d+ bytes$/.test(part.bytes);
const size = (part: Part) => Number.parseInt(part.bytes, 10);

/**
 * When two phones meet they offer envelope ids, not envelopes, and only the missing ones move
 * (as the post describes). A fixed example: five offered, three already held.
 */
export const meeting = {
  offered: ["a3f1", "07c9", "e5b2", "9d40", "51ee"],
  held: ["07c9", "9d40", "51ee"],
};
export const missing = meeting.offered.filter((id) => !meeting.held.includes(id));

/** Byte totals and ring layout for a list of documented fields. */
export function envelopeModel(parts: Part[]) {
  // the message body is padded to a bucket, so it has no fixed size and is not on the ring
  const sized = parts.filter(isSized);
  const bytesIn = (zone: Part["zone"]) => sized.filter((part) => part.zone === zone).reduce((sum, part) => sum + size(part), 0);
  const headerBytes = bytesIn("header");
  const outerBytes = bytesIn("outer");
  const sealedFixedBytes = bytesIn("sealed");
  const fixedBytes = headerBytes + outerBytes + sealedFixedBytes;
  const perByte = (360 - GAP * sized.length) / fixedBytes;

  let at = -90 + GAP / 2;
  const fields: Field[] = sized.map((part) => {
    const field = { ...part, n: size(part), start: at, end: at + size(part) * perByte };
    at = field.end + GAP;
    return field;
  });
  const ticks: Tick[] = fields
    .flatMap((field) => Array.from({ length: field.n }, (_, b) => ({ i: 0, field: field.id, zone: field.zone, angle: field.start + (b + 0.5) * perByte, first: b === 0 })))
    .map((tick, i) => ({ ...tick, i }));
  const idBytes = size(parts.find((part) => part.id === "id")!);

  return {
    fields,
    ticks,
    /** what a relay has to read to do its job: the plaintext header */
    headerBytes,
    /** visible, but opens nothing alone: the ephemeral key and the nonce */
    outerBytes,
    /** inside the ciphertext, before the message: sender keys and the signature */
    sealedFixedBytes,
    /** everything that rides along with a message, before the padded body */
    fixedBytes,
    idBytes,
    /** a meeting offers ids, not envelopes */
    offerBytes: meeting.offered.length * idBytes,
  };
}

export function polar(r: number, deg: number): [number, number] {
  const rad = (deg * Math.PI) / 180;
  return [CX + r * Math.cos(rad), CY + r * Math.sin(rad)];
}

const f1 = (n: number) => Math.round(n * 10) / 10;

export function arc(r: number, a0: number, a1: number) {
  const [x0, y0] = polar(r, a0);
  const [x1, y1] = polar(r, a1);
  return `M${f1(x0)} ${f1(y0)}A${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${f1(x1)} ${f1(y1)}`;
}

/* ------------------------------------------------------------- the body --- */

const BAR_TOP = 199;
const BAR_STEP = 7;
const INNER = 150;

/** A tiny seeded generator, so the "ciphertext" looks random but renders the same everywhere. */
function seeded(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

/** Message lines first, then padding up to the bucket: the shape the recipient sees. */
const MESSAGE = [0.94, 0.88, 0.97, 0.52, 0, 0.9, 0.95, 0.83, 0.91, 0.36, 0, 0.86, 0.72];

export type Bar = { y: number; width: number; x: number; open: number; sealed: number; padding: boolean };

export const bars: Bar[] = (() => {
  const noise = seeded(7);
  return Array.from({ length: 29 }, (_, i) => {
    const y = BAR_TOP + i * BAR_STEP;
    const dy = Math.abs(y + 1.6 - CY);
    const width = Math.round(2 * Math.sqrt(Math.max(INNER * INNER - dy * dy, 0)) * 0.84);
    const padding = i >= MESSAGE.length;
    return { y, width, x: CX - width / 2, open: padding ? 1 : MESSAGE[i], sealed: 0.22 + noise() * 0.78, padding };
  });
})();

/* ---------------------------------------------------------- the hop track --- */

export const HOP_R = 196;
const HOP_FROM = 150;
const HOP_TO = 390;
/** Station 0 is the sender; stations 1 to 6 are the hops a copy may take. */
export const stations = Array.from({ length: MAX_HOPS + 1 }, (_, i) => HOP_FROM + ((HOP_TO - HOP_FROM) * i) / MAX_HOPS);
export const hopDots = Array.from({ length: 73 }, (_, i) => HOP_FROM + ((HOP_TO - HOP_FROM) * i) / 72);
