"use client";

import { useEffect, useRef, useState } from "react";
import { RouteStage } from "@/components/rivet/RouteStage";

const roles = [
  { id: "sender", name: "sender", does: "seals the message for one recipient, then offers the envelope to whoever is nearby." },
  { id: "relay-a", name: "relay", does: "cannot read it. keeps the envelope for a while, offers it to the next phone it meets, drops it when it expires." },
  { id: "relay-b", name: "relay", does: "a stranger's phone, doing the same thing. it only ever sees the plaintext header a relay needs." },
  { id: "recipient", name: "recipient", does: "the only phone that can open it. it checks the sender's signature inside the sealed part before showing anything." },
];

/** Where each phone sits in the flat drawing, for a wide screen and for a phone held upright. */
const layouts = {
  wide: {
    box: "0 0 710 230",
    path: "M70 150 C150 150 180 92 260 92 S370 150 450 150 S560 92 640 92",
    at: [{ x: 70, y: 150 }, { x: 260, y: 92 }, { x: 450, y: 150 }, { x: 640, y: 92 }],
    label: (x: number, y: number) => ({ x, y: y + 62, anchor: "middle" as const }),
  },
  tall: {
    box: "0 0 300 440",
    path: "M80 62 C80 120 210 106 210 164 S80 208 80 266 S210 252 210 368",
    at: [{ x: 80, y: 62 }, { x: 210, y: 164 }, { x: 80, y: 266 }, { x: 210, y: 368 }],
    label: (x: number, y: number) => (x < 150 ? { x: x + 36, y: y + 5, anchor: "start" as const } : { x: x - 36, y: y + 5, anchor: "end" as const }),
  },
};

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

function RouteSvg({ layout, hop, selected, onSelect }: { layout: keyof typeof layouts; hop: number; selected: number; onSelect: (index: number) => void }) {
  const shape = layouts[layout];
  const at = shape.at[hop];
  return (
    <svg viewBox={shape.box} className="route-svg" data-layout={layout} aria-hidden="true" focusable="false">
      <path className="route-path" d={shape.path} />
      {roles.map((item, index) => {
        const point = shape.at[index];
        const label = shape.label(point.x, point.y);
        return (
          <g key={item.id} onMouseEnter={() => onSelect(index)}>
            <Phone x={point.x} y={point.y} active={index === selected} reached={index <= hop} />
            <text className="route-label" x={label.x} y={label.y} textAnchor={label.anchor}>{item.name}</text>
          </g>
        );
      })}
      <g className="route-envelope" style={{ transform: `translate(${at.x}px, ${at.y - 56}px)` }}>
        <rect x="-12" y="-8" width="24" height="16" rx="2" />
        <path d="M-12 -7 0 2 12 -7" />
      </g>
    </svg>
  );
}

/**
 * The opening figure: one envelope passes sender, relay, relay, recipient as you scroll past it,
 * in 3D once the scene has loaded and as a flat drawing before that (or if WebGL is missing).
 * It follows the page's own scroll and never holds it. The roles are real buttons, so the
 * explanation is reachable by keyboard and the picture is never the only place it lives.
 */
export function RouteFigure() {
  const [selected, setSelected] = useState(0);
  const [progress, setProgress] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    // reduced motion: no travelling, the envelope is simply shown where it ends up
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const timer = window.setTimeout(() => setProgress(1), 0);
      return () => window.clearTimeout(timer);
    }
    let frame = 0;
    let listening = false;
    const update = () => {
      frame = 0;
      const box = root.getBoundingClientRect();
      const height = window.innerHeight || 1;
      // 0 as the figure enters at the bottom of the screen, 1 by the time it is near the middle
      const through = (height - box.top) / (height + box.height);
      const next = Math.max(0, Math.min(1, (through - 0.08) / 0.4));
      setProgress(Math.round(next * 200) / 200);
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !listening) {
          listening = true;
          window.addEventListener("scroll", onScroll, { passive: true });
          window.addEventListener("resize", onScroll, { passive: true });
          onScroll();
        } else if (!entry.isIntersecting && listening) {
          listening = false;
          window.removeEventListener("scroll", onScroll);
          window.removeEventListener("resize", onScroll);
        }
      },
      { rootMargin: "120px 0px" },
    );
    observer.observe(root);
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  const hop = Math.min(roles.length - 1, Math.round(progress * (roles.length - 1)));
  const role = roles[selected];

  return (
    <div className="route-figure" ref={ref}>
      <p className="rv-tag mono">conceptual visualization</p>
      <RouteStage
        progress={progress}
        selected={selected}
        poster={
          <>
            <RouteSvg layout="wide" hop={hop} selected={selected} onSelect={setSelected} />
            <RouteSvg layout="tall" hop={hop} selected={selected} onSelect={setSelected} />
          </>
        }
      />
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
      <p className="rv-note">not real Bluetooth in the browser. the envelope only travels as far as you scroll.</p>
    </div>
  );
}
