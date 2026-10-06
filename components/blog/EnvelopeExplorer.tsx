"use client";

import { useState } from "react";
import { EnvelopeStage } from "@/components/rivet/EnvelopeStage";
import { parts, zoneLabel, zones } from "@/components/rivet/envelope-fields";

/**
 * The envelope, opened up. The 3D stage above and the list below read from the same documented
 * fields (see envelope-fields.ts), so selecting a part lights up its region in both. The list is
 * the complete explanation on its own; the 3D view is the same thing, seen from the side.
 */
export function EnvelopeExplorer() {
  const [selected, setSelected] = useState("id");
  const [xray, setXray] = useState(true);
  const part = parts.find((item) => item.id === selected)!;

  return (
    <div className="envelope-x">
      <EnvelopeStage zone={part.zone} xray={xray} onXray={setXray} />
      <div className="envelope-stack" role="group" aria-label="Parts of an envelope">
        {zones.map((zone) => (
          <div key={zone} className="envelope-zone" data-zone={zone}>
            <p className="mono">{zoneLabel[zone]}</p>
            <div className="envelope-parts">
              {parts.filter((item) => item.zone === zone).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={item.id === selected}
                  onClick={() => {
                    setSelected(item.id);
                    setXray(true);
                  }}
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
