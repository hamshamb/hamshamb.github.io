import type { Part } from "./envelope-fields";

/**
 * Byte arithmetic on the documented fields in envelope-fields.ts, for the envelope figure's
 * annotations. Nothing here is measured or benchmarked: it is sums of the protocol notes. A pure
 * function of the field list, so the tests build it from the same data the page uses.
 */

/** Documented limits: hops per copy, hours on any one device. */
export const MAX_HOPS = 6;
export const MAX_HOURS = 6;

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

export function envelopeModel(parts: Part[]) {
  // the message body is padded to a bucket, so it has no fixed size
  const sized = parts.filter(isSized);
  const bytesIn = (zone: Part["zone"]) => sized.filter((part) => part.zone === zone).reduce((sum, part) => sum + size(part), 0);
  const headerBytes = bytesIn("header");
  const outerBytes = bytesIn("outer");
  const sealedFixedBytes = bytesIn("sealed");
  const idBytes = size(parts.find((part) => part.id === "id")!);
  return {
    /** what a relay has to read to do its job: the plaintext header */
    headerBytes,
    /** visible, but opens nothing alone: the ephemeral key and the nonce */
    outerBytes,
    /** inside the ciphertext, before the message: sender keys and the signature */
    sealedFixedBytes,
    /** everything that rides along with a message, before the padded body */
    fixedBytes: headerBytes + outerBytes + sealedFixedBytes,
    idBytes,
    /** a meeting offers ids, not envelopes */
    offerBytes: meeting.offered.length * idBytes,
  };
}
