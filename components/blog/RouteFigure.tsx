"use client";

import { useEffect, useRef, useState } from "react";

const roles = [
  { id: "sender", name: "sender", x: 70, y: 150, does: "seals the message for one recipient, then offers the envelope to whoever is nearby." },
  { id: "relay-a", name: "relay", x: 260, y: 92, does: "cannot read it. keeps the envelope for a while, offers it to the next phone it meets, drops it when it expires." },
  { id: "relay-b", name: "relay", x: 450, y: 150, does: "a stranger's phone, doing the same thing. it only ever sees the plaintext header a relay needs." },
  { id: "recipient", name: "recipient", x: 640, y: 92, does: "the only phone that can open it. it checks the sender's signature inside the sealed part before showing anything." },
];

/** Phone outline centred on its point. */
function Phone({ x, y, active, reached }: { x: number; y: number; active: boolean; reached: boolean }) {
  return (
    <g className="route-phone" data-active={active || undefined} data-reached={reached || undefined} transform={`translate(${x} ${y})`}>
      <rect x="-22" y="-38" width="44" height="76" rx="9" />
      <rect className="route-screen" x="-16" y="-29" width="32" height="54" rx="3" />
      <circle cx="0" cy="31" r="2.5" />
    </g>
  );
}

/**
 * The opening diagram: one envelope travels sender, relay, relay, recipient once, when it scrolls
 * into view. The roles are real buttons, so the explanation is reachable by keyboard and the
 * picture is never the only place the information lives.
 */
export function RouteFigure() {
  const [selected, setSelected] = useState(0);
  const [hop, setHop] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const timers: number[] = [];
    // reduced motion: no travelling, the envelope is simply shown where it ends up
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      timers.push(window.setTimeout(() => setHop(roles.length - 1), 0));
      return () => timers.forEach((timer) => window.clearTimeout(timer));
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        roles.slice(1).forEach((_, index) => timers.push(window.setTimeout(() => setHop(index + 1), 600 + index * 900)));
      },
      { threshold: 0.5 },
    );
    observer.observe(root);
    return () => {
      observer.disconnect();
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, []);

  const at = roles[hop];
  const role = roles[selected];

  return (
    <div className="route-figure" ref={ref}>
      <svg viewBox="0 0 710 230" className="route-svg" aria-hidden="true" focusable="false">
        <path className="route-path" d="M70 150 C150 150 180 92 260 92 S370 150 450 150 S560 92 640 92" />
        {roles.map((item, index) => (
          <g key={item.id} onMouseEnter={() => setSelected(index)}>
            <Phone x={item.x} y={item.y} active={index === selected} reached={index <= hop} />
            <text className="route-label" x={item.x} y={item.y + 62} textAnchor="middle">{item.name}</text>
          </g>
        ))}
        <g className="route-envelope" style={{ transform: `translate(${at.x}px, ${at.y - 56}px)` }}>
          <rect x="-12" y="-8" width="24" height="16" rx="2" />
          <path d="M-12 -7 0 2 12 -7" />
        </g>
      </svg>
      <div className="route-roles" role="group" aria-label="Who does what">
        {roles.map((item, index) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={index === selected}
            onClick={() => setSelected(index)}
            onFocus={() => setSelected(index)}
            onMouseEnter={() => setSelected(index)}
          >
            <span className="mono">{String(index + 1).padStart(2, "0")}</span> {item.name}
          </button>
        ))}
      </div>
      <p className="route-role-text" aria-live="polite">
        <strong>{role.name}.</strong> {role.does}
      </p>
    </div>
  );
}
