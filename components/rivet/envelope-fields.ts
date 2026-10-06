import type { Zone } from "./scene-types";

export type Part = { id: string; name: string; bytes: string; zone: Zone; text: string };

/**
 * Fields as defined in Rivet's docs/PROTOCOL.md for a sealed direct message. Nothing invented, and
 * the 3D x-ray panel and the explorer below it read from this one list so they cannot disagree.
 */
export const parts: Part[] = [
  { id: "magic", name: "magic + version + type", bytes: "4 bytes", zone: "header", text: "lets a phone recognise a Rivet envelope, which protocol version made it, and what kind it is (sealed message, inventory, request or custody acknowledgement)." },
  { id: "id", name: "envelope id", bytes: "16 bytes", zone: "header", text: "random. relays use it to avoid storing or sending the same envelope twice. it is not derived from who sent it." },
  { id: "time", name: "created at", bytes: "6 bytes", zone: "header", text: "rounded down to the minute, so it is coarse on purpose. together with the lifetime it decides when copies get deleted." },
  { id: "ttl", name: "lifetime", bytes: "4 bytes", zone: "header", text: "what the sender asked for. whatever it says, a device keeps an envelope for at most six hours." },
  { id: "hops", name: "hop count + max hops", bytes: "2 bytes", zone: "header", text: "how far this copy has travelled and how far it may go. Rivet caps it at six hops." },
  { id: "length", name: "payload length", bytes: "2 bytes", zone: "header", text: "the size of what follows. payloads are padded to fixed buckets, so this says less than it seems." },
  { id: "eph", name: "ephemeral public key", bytes: "32 bytes", zone: "outer", text: "a one-off X25519 key for this message. visible, but meaningless without the recipient's private key." },
  { id: "nonce", name: "nonce", bytes: "24 bytes", zone: "outer", text: "the random value XChaCha20-Poly1305 needs. visible, and safe to be visible." },
  { id: "sender", name: "sender keys + signature", bytes: "128 bytes", zone: "sealed", text: "who sent it and an Ed25519 signature over the message. inside the ciphertext, so relays never learn the sender." },
  { id: "body", name: "message body + padding", bytes: "padded", zone: "sealed", text: "the actual message, padded to a fixed bucket size. only the recipient can decrypt it, and tampering breaks the authentication tag." },
];

export const zoneLabel: Record<Zone, string> = {
  header: "plaintext header (relays read this)",
  outer: "visible, but useless on its own",
  sealed: "encrypted for the recipient",
};

/** Who can read each region. The sealed part is the recipient's alone, wherever the envelope is. */
export const zoneReaders: Record<Zone, string> = {
  header: "every relay and the recipient",
  outer: "anyone who holds it, but it opens nothing alone",
  sealed: "the recipient only",
};

export const zones: Zone[] = ["header", "outer", "sealed"];
