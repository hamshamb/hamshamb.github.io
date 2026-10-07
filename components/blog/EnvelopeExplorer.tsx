"use client";

import { useState } from "react";
import { EnvelopeFigure } from "@/components/rivet/EnvelopeFigure";
import { parts, zoneLabel, zones } from "@/components/rivet/envelope-fields";

/**
 * The envelope, taken apart. The 3D figure and the list below read from the same documented
 * fields (envelope-fields.ts) and stay in step: hovering a piece lights its row, hovering a row
 * lights its piece, and clicking either one selects it in both. The list is the complete,
 * keyboard-friendly explanation on its own; the figure is the same thing, physically.
 */
export function EnvelopeExplorer() {
  const [selected, setSelected] = useState("id");
  const [hovered, setHovered] = useState<string | null>(null);
  const [engaged, setEngaged] = useState(false);
  const part = parts.find((item) => item.id === (hovered ?? selected))!;
  const choose = (id: string) => {
    setSelected(id);
    setEngaged(true);
  };

  return (
    <div className="envelope-x">
      <EnvelopeFigure selected={selected} hovered={hovered} engaged={engaged} onSelect={choose} onHover={setHovered} />
      <div className="envelope-stack" role="group" aria-label="Parts of an envelope">
        {zones.map((zone) => (
          <div key={zone} className="envelope-zone" data-zone={zone}>
            <p className="mono">{zoneLabel[zone]}</p>
            <div className="envelope-parts">
              {parts.filter((item) => item.zone === zone).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={engaged && item.id === selected}
                  data-hover={hovered === item.id || undefined}
                  onClick={() => choose(item.id)}
                  onMouseEnter={() => setHovered(item.id)}
                  onMouseLeave={() => setHovered(null)}
                  onFocus={() => setHovered(item.id)}
                  onBlur={() => setHovered(null)}
                >
                  <span>{item.name}</span>
                  <span className="mono">{item.bytes}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <p className="envelope-text" aria-live="polite">
        <strong>{part.name}.</strong> {part.text}
      </p>
    </div>
  );
}
