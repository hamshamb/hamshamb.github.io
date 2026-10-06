"use client";

import { RelayLine } from "./RelayLine";
import { RelayStage } from "./RelayStage";

/**
 * The Rivet case study's one interactive moment: the relay table, without the surrounding article.
 * It plays itself on a loop until the visitor touches it.
 * Lazy like everywhere else (it only starts loading when it is near the screen), and honest about
 * what it is.
 */
export function CaseScene() {
  return (
    <section className="case-rivet" aria-labelledby="case-rivet-title">
      <div className="case-rivet-head">
        <p className="mono case-label">try the idea</p>
        <h2 id="case-rivet-title">move the phones. pass the envelope.</h2>
        <p>
          a relay stores a sealed copy and cannot read it. only the recipient can open it. this is a conceptual visualization of that idea, not the app and not real Bluetooth.
        </p>
      </div>
      <RelayStage fallback={<RelayLine />} autoplay />
    </section>
  );
}
