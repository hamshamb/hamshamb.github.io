"use client";

import { useState } from "react";
import { achievements, type ToyId, toys } from "@/content/secrets";
import { resetSecrets, unlockToy, useSecrets } from "@/lib/secrets";
import { achievementLabel, toyboxOpen } from "@/lib/secrets-core";
import { openToy, type OverlayToy, randomDestination, setGravity } from "@/lib/toys";

const overlayToys: readonly ToyId[] = ["reaction", "fidget", "physics", "touch-grass", "map"];

/**
 * The footer's secret corner. Renders nothing at all until the visitor has found three secrets;
 * then it lists only the toys they have actually unlocked, never the locked ones. Achievements
 * show as "n / ??" once there is at least one.
 */
export function Toybox() {
  const state = useSecrets();
  const [open, setOpen] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [confirm, setConfirm] = useState(false);
  if (!state) return null;
  const unlocked = toyboxOpen(state);
  const earned = state.achievements.filter((id): id is keyof typeof achievements => id in achievements);
  if (!unlocked && !earned.length) return null;

  const play = (id: ToyId) => {
    if (overlayToys.includes(id)) openToy(id as OverlayToy);
    else if (id === "gravity") setGravity(false);
    else if (id === "rabbit") window.location.assign(randomDestination());
    else if ("href" in toys[id]) window.location.assign((toys[id] as { href: string }).href);
  };

  return (
    <div className="toybox">
      {earned.length > 0 && (
        <button type="button" className="toybox-count mono" aria-expanded={drawer} onClick={() => setDrawer(!drawer)}>
          {achievementLabel(state)}
        </button>
      )}
      {unlocked && (
        <button type="button" className="toybox-toggle mono" aria-expanded={open} onClick={() => { setOpen(!open); unlockToy("rabbit"); }}>
          toybox
        </button>
      )}
      {drawer && (
        <ul className="toybox-panel toybox-achievements" aria-label="Achievements">
          {earned.map((id) => (
            <li key={id}><b>{achievements[id].title}</b> <span>{achievements[id].note}</span></li>
          ))}
        </ul>
      )}
      {open && (
        <div className="toybox-panel">
          <ul className="toybox-list">
            {state.toys.filter((id): id is ToyId => id in toys).map((id) => (
              <li key={id}>
                <button type="button" onClick={() => play(id)}>
                  <b>{id === "rabbit" ? "send me somewhere" : toys[id].title}</b>
                  <span>{toys[id].note}</span>
                </button>
              </li>
            ))}
          </ul>
          <p className="toybox-foot mono">
            {state.secrets.length} found. everything here lives only in this browser.{" "}
            {confirm ? (
              <>
                <button type="button" className="text-link" onClick={() => { resetSecrets(); setConfirm(false); setOpen(false); }}>forget it all</button>
                {" · "}
                <button type="button" className="text-link" onClick={() => setConfirm(false)}>keep</button>
              </>
            ) : (
              <button type="button" className="text-link" onClick={() => setConfirm(true)}>reset</button>
            )}
          </p>
        </div>
      )}
    </div>
  );
}
