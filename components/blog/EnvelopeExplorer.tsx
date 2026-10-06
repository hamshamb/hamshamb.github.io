"use client";

import { useState } from "react";
import { EnvelopeInstrument } from "@/components/rivet/EnvelopeInstrument";
import { parts, zoneLabel, zones } from "@/components/rivet/envelope-fields";

/**
 * The envelope, opened up. The instrument above and the list below read from the same
 * documented fields (see envelope-fields.ts), so selecting a part lights up its bytes in both.
 * The list is the complete explanation on its own; the instrument is the same thing, moving.
 */
export function EnvelopeExplorer() {
  const [selected, setSelected] = useState("id");
  const part = parts.find((item) => item.id === selected)!;

  return (
    <div className="envelope-x">
      <EnvelopeInstrument selected={selected} onSelect={setSelected} />
      <div className="envelope-stack" role="group" aria-label="Parts of an envelope">
        {zones.map((zone) => (
          <div key={zone} className="envelope-zone" data-zone={zone}>
            <p className="mono">{zoneLabel[zone]}</p>
            <div className="envelope-parts">
              {parts.filter((item) => item.zone === zone).map((item) => (
                <button key={item.id} type="button" aria-pressed={item.id === selected} onClick={() => setSelected(item.id)}>
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
