"use client";

import { useState } from "react";

type Item = { id: string; name: string; text: string };

/** Taken from Rivet's docs/THREAT_MODEL.md. Both columns are equally real. */
const protects: Item[] = [
  { id: "contents", name: "message contents", text: "sealed with XChaCha20-Poly1305 for one recipient. relays carry ciphertext they cannot open." },
  { id: "tampering", name: "tampering", text: "authenticated encryption plus an Ed25519 signature inside the sealed part. a changed envelope fails to open." },
  { id: "impersonation", name: "a swapped contact key", text: "comparing the 60-digit safety number in person shows whether the key you saved is really theirs." },
  { id: "central", name: "a central record", text: "no server, no accounts and no routing table, so there is no single place that knows who talks to whom." },
  { id: "lingering", name: "messages lingering on strangers' phones", text: "a device keeps an envelope for at most six hours, then deletes it." },
];

const doesNot: Item[] = [
  { id: "presence", name: "radio presence", text: "a phone with Bluetooth on announces that a device is there. the advertised tag rotates every fifteen minutes, but the radio itself is visible." },
  { id: "direction", name: "direction finding", text: "with the right equipment, someone can work out roughly where a transmitting phone is. encryption cannot change physics." },
  { id: "sybil", name: "Sybil identities", text: "anyone can generate as many identities as they like. nothing stops one person from running many relays." },
  { id: "unlocked", name: "an unlocked, seized phone", text: "if someone has your phone unlocked, they have what is on it. Rivet does not survive that." },
  { id: "forensic", name: "forensic erasure", text: "emergency reset deletes rows, destroys keys and compacts the database, but cannot guarantee nothing is recoverable." },
  { id: "traffic", name: "traffic analysis", text: "a connected peer sees which envelope ids you offer, and someone watching many radios can correlate timing. reduced, not solved." },
];

export function ThreatModel() {
  const [selected, setSelected] = useState("contents");
  const all = [...protects, ...doesNot];
  const item = all.find((entry) => entry.id === selected)!;
  const solved = protects.some((entry) => entry.id === selected);
  const column = (title: string, items: Item[], kind: string) => (
    <div className="threat-col" data-kind={kind}>
      <p className="mono">{title}</p>
      <ul>
        {items.map((entry) => (
          <li key={entry.id}>
            <button type="button" aria-pressed={entry.id === selected} onClick={() => setSelected(entry.id)}>
              {entry.name}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
  return (
    <div className="threat">
      <div className="threat-cols">
        {column("protects against", protects, "yes")}
        {column("does not solve", doesNot, "no")}
      </div>
      <p className="threat-text" data-kind={solved ? "yes" : "no"} aria-live="polite">
        <span className="mono">{solved ? "protected" : "not solved"}</span> <strong>{item.name}.</strong> {item.text}
      </p>
    </div>
  );
}
