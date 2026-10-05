"use client";

import { useState } from "react";

/** `places` are the parts of the drawing this item is about; the drawing lights them up. */
type Item = { id: string; name: string; text: string; places: string };

/** Taken from Rivet's docs/THREAT_MODEL.md. Both columns are equally real. */
const protects: Item[] = [
  { id: "contents", name: "message contents", places: "envelope", text: "sealed with XChaCha20-Poly1305 for one recipient. relays carry ciphertext they cannot open." },
  { id: "tampering", name: "tampering", places: "envelope", text: "authenticated encryption plus an Ed25519 signature inside the sealed part. a changed envelope fails to open." },
  { id: "impersonation", name: "a swapped contact key", places: "safety", text: "comparing the 60-digit safety number in person shows whether the key you saved is really theirs." },
  { id: "central", name: "a central record", places: "server", text: "no server, no accounts and no routing table, so there is no single place that knows who talks to whom." },
  { id: "lingering", name: "messages lingering on strangers' phones", places: "relays", text: "a device keeps an envelope for at most six hours, then deletes it." },
];

const doesNot: Item[] = [
  { id: "presence", name: "radio presence", places: "radio", text: "a phone with Bluetooth on announces that a device is there. the advertised tag rotates every fifteen minutes, but the radio itself is visible." },
  { id: "direction", name: "direction finding", places: "radio", text: "with the right equipment, someone can work out roughly where a transmitting phone is. encryption cannot change physics." },
  { id: "sybil", name: "Sybil identities", places: "relays", text: "anyone can generate as many identities as they like. nothing stops one person from running many relays." },
  { id: "unlocked", name: "an unlocked, seized phone", places: "phone", text: "if someone has your phone unlocked, they have what is on it. Rivet does not survive that." },
  { id: "forensic", name: "forensic erasure", places: "phone", text: "emergency reset deletes rows, destroys keys and compacts the database, but cannot guarantee nothing is recoverable." },
  { id: "traffic", name: "traffic analysis", places: "radio links", text: "a connected peer sees which envelope ids you offer, and someone watching many radios can correlate timing. reduced, not solved." },
];

const phonesAt = [
  { x: 90, name: "sender" },
  { x: 260, name: "relay" },
  { x: 460, name: "relay" },
  { x: 630, name: "recipient" },
];

/**
 * Where each item lives. One small drawing of the same four phones as the opening figure; the
 * selected item lights up the part of it the item is about. Decorative: every item is also a
 * button with its own text, so nothing is only in the picture.
 */
function ThreatMap({ places, kind }: { places: string; kind: "yes" | "no" }) {
  const focus = places.split(" ");
  const on = (own: string) => own.split(" ").some((place) => focus.includes(place)) || undefined;
  return (
    <svg className="threat-map" viewBox="0 0 720 270" data-kind={kind} aria-hidden="true" focusable="false">
      <g data-place="safety" data-on={on("safety")}>
        <path d="M90 108 C200 6 520 6 630 108" />
        <text x="360" y="40" textAnchor="middle">safety number</text>
      </g>
      <g data-place="server" data-on={on("server")}>
        <rect x="294" y="216" width="132" height="38" rx="8" />
        <path d="M304 222 416 248" />
        <text x="360" y="240" textAnchor="middle">no server</text>
      </g>
      <g data-place="links" data-on={on("links")}>
        <path d="M118 150H232M288 150H432M488 150H602" />
      </g>
      <g data-place="radio" data-on={on("radio")}>
        {phonesAt.map((phone) => (
          <g key={phone.x} transform={`translate(${phone.x} 150)`}>
            <path d="M-46 -26 A52 52 0 0 0 -46 26" />
            <path d="M46 -26 A52 52 0 0 1 46 26" />
          </g>
        ))}
      </g>
      {phonesAt.map((phone, index) => (
        <g key={phone.x} data-place="phone" data-on={on(index === 1 || index === 2 ? "phone relays" : "phone")} transform={`translate(${phone.x} 150)`}>
          <rect className="threat-map-slab" x="-20" y="-34" width="40" height="68" rx="9" />
          <rect className="threat-map-screen" x="-14" y="-27" width="28" height="54" rx="4" />
          <text y="62" textAnchor="middle">{phone.name}</text>
        </g>
      ))}
      <g data-place="envelope" data-on={on("envelope")} transform="translate(360 112)">
        <rect x="-22" y="-15" width="44" height="30" rx="4" />
        <path d="M-22 -13 0 5 22 -13" />
      </g>
    </svg>
  );
}

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
      <ThreatMap places={item.places} kind={solved ? "yes" : "no"} />
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
