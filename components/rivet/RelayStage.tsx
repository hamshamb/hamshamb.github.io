"use client";

import { type KeyboardEvent, type ReactNode, useEffect, useRef, useState } from "react";
import { achieve } from "@/lib/secrets";
import {
  MAX_HOPS,
  phoneById,
  type PhoneId,
  type Scene,
  sceneHandOver,
  sceneInRange,
  sceneMove,
  sceneStart,
} from "@/lib/relay-sim";
import { parts, zoneLabel, zoneReaders, zones } from "./envelope-fields";
import { Poster } from "./Poster";
import { type AnchorMap, isPortraitStage, screenStep } from "./scene-types";
import { useScene } from "./useScene";

type Direction = "left" | "right" | "up" | "down";

const arrows: Record<string, Direction> = { ArrowLeft: "left", ArrowRight: "right", ArrowUp: "up", ArrowDown: "down" };
const glyph: Record<Direction, string> = { left: "←", right: "→", up: "↑", down: "↓" };

/** Names of the phones in range of `id`, as a sentence fragment. */
function rangeNote(scene: Scene, id: PhoneId) {
  const me = phoneById(scene, id);
  const near = scene.phones.filter((other) => sceneInRange(me, other)).map((other) => other.label);
  return near.length ? `in range of ${near.join(" and ")}.` : "not in range of any other phone.";
}

/**
 * The strongest interaction on the site: a table with four phones and one sealed envelope.
 * Drag phones around; when two are close enough a connection line appears, and only then can a
 * copy move. Pick the envelope up and drop it on a phone. A relay stores a sealed copy and cannot
 * read it; the recipient is the only phone that opens it. Everything also works without a pointer:
 * the labels take arrow keys, and there are plain buttons for every action.
 *
 * It is a conceptual visualization. Nothing here is Bluetooth.
 */
export function RelayStage({ fallback }: { fallback: ReactNode }) {
  const [scene, setScene] = useState<Scene>(sceneStart);
  const sceneRef = useRef(scene);
  const [xray, setXray] = useState(false);
  const [selected, setSelected] = useState<PhoneId>("relay-a");
  const [hinted, setHinted] = useState(false);
  const labels = useRef<Record<string, HTMLElement | null>>({});
  const stage = useRef<HTMLDivElement>(null);

  const commit = (next: Scene) => {
    sceneRef.current = next;
    setScene(next);
  };

  const report = (outcome: string) => {
    if (outcome === "delivered") achieve("network-engineer");
  };

  const place = (anchors: AnchorMap) => {
    for (const [key, anchor] of Object.entries(anchors)) {
      const element = labels.current[key];
      if (!element) continue;
      element.style.transform = `translate3d(${anchor.x.toFixed(1)}px, ${anchor.y.toFixed(1)}px, 0) translate(-50%, -50%)`;
      if (anchor.visible) element.dataset.placed = "1";
      else delete element.dataset.placed;
    }
  };

  const { hostRef, status, handle } = useScene("relay", {
    movePhone: (id, x, z) => commit(sceneMove(sceneRef.current, id, x, z)),
    dropEnvelope: (from, to) => {
      const result = sceneHandOver(sceneRef.current, to, from);
      commit(result.scene);
      report(result.outcome);
      return result.outcome === "stored" || result.outcome === "delivered";
    },
    project: place,
    grab: (held) => {
      if (held) setHinted(true);
    },
  });

  useEffect(() => {
    handle?.setScene(scene);
  }, [handle, scene]);
  useEffect(() => {
    handle?.setXray(xray);
  }, [handle, xray]);
  useEffect(() => {
    handle?.setSelected(selected);
  }, [handle, selected]);

  const portrait = () => {
    const box = stage.current?.getBoundingClientRect();
    return box ? isPortraitStage(box.width, box.height) : false;
  };

  const nudge = (id: PhoneId, direction: Direction, big = false) => {
    const step = screenStep(direction, portrait());
    const me = phoneById(sceneRef.current, id);
    const size = big ? 1.6 : 0.7;
    const moved = sceneMove(sceneRef.current, id, me.x + step.x * size, me.z + step.z * size);
    commit({ ...moved, note: `${me.label} moved. ${rangeNote(moved, id)}` });
  };

  const handTo = (id: PhoneId) => {
    setHinted(true);
    const result = sceneHandOver(sceneRef.current, id);
    commit(result.scene);
    report(result.outcome);
  };

  const onLabelKey = (id: PhoneId) => (event: KeyboardEvent<HTMLButtonElement>) => {
    const direction = arrows[event.key];
    if (!direction) return;
    event.preventDefault();
    nudge(id, direction, event.shiftKey);
  };

  const holders = scene.phones.filter((item) => scene.copies[item.id] !== undefined);
  const recipientOpened = scene.delivered;
  const state = scene.delivered ? "delivered" : holders.length > 1 ? `${holders.length} phones hold a copy` : "waiting at the sender";

  if (status === "failed") {
    return (
      <div className="rv" data-status="failed">
        <p className="rv-tag mono">conceptual simulation</p>
        <p className="rv-note">the 3d view is not available here, so this is the flat version of the same idea. not real Bluetooth either way.</p>
        {fallback}
      </div>
    );
  }

  const ready = status === "ready";

  return (
    <div className="rv" data-status={status}>
      <div className="rv-head">
        <span className="rv-tag mono">conceptual visualization</span>
        <span className="rv-chip mono" data-state={scene.delivered ? "delivered" : "idle"}>{ready ? state : "loading the 3d view"}</span>
      </div>

      <div className="rv-stage" ref={stage}>
        <div className="rv-host" ref={hostRef} />
        {!ready && (
          <div className="rv-poster">
            <Poster kind="relay" />
          </div>
        )}
        {ready && (
          <div className="rv-labels">
            {scene.phones.map((item) => {
              const copy = scene.copies[item.id];
              return (
                <button
                  key={item.id}
                  type="button"
                  className="rv-label"
                  data-holds={copy !== undefined || undefined}
                  ref={(element) => { labels.current[item.id] = element; }}
                  onFocus={() => setSelected(item.id)}
                  onKeyDown={onLabelKey(item.id)}
                  onClick={() => handTo(item.id)}
                  aria-label={`${item.label}, ${copy !== undefined ? "holding a sealed copy" : "no copy"}. arrow keys move it, shift for bigger steps. enter hands the envelope to it.`}
                >
                  <span className="rv-label-name mono">{item.label}</span>
                  {copy !== undefined && <span className="rv-label-copy mono">{item.role === "recipient" && recipientOpened ? "opened" : "sealed copy"}</span>}
                </button>
              );
            })}
            {!hinted && (
              <span className="rv-hint mono" aria-hidden="true" ref={(element) => { labels.current["env:sender"] = element; }}>
                drag the envelope
              </span>
            )}
          </div>
        )}
      </div>

      {ready && (
        <>
          <p className="rv-status" aria-live="polite">{scene.note}</p>

          <div className="rv-controls">
            <div className="rv-group" role="group" aria-label="Move a phone">
              <span className="rv-group-title mono">move a phone</span>
              <div className="rv-row">
                {scene.phones.map((item) => (
                  <button key={item.id} type="button" className="rv-btn" aria-pressed={selected === item.id} onClick={() => setSelected(item.id)}>
                    {item.label}
                  </button>
                ))}
              </div>
              <div className="rv-row rv-dpad">
                {(["left", "up", "down", "right"] as Direction[]).map((direction) => (
                  <button key={direction} type="button" className="rv-btn rv-btn-square" onClick={() => nudge(selected, direction)} aria-label={`move ${phoneById(scene, selected).label} ${direction}`}>
                    {glyph[direction]}
                  </button>
                ))}
              </div>
            </div>

            <div className="rv-group" role="group" aria-label="Hand over the envelope">
              <span className="rv-group-title mono">hand the envelope to</span>
              <div className="rv-row">
                {scene.phones.filter((item) => item.role !== "sender").map((item) => (
                  <button key={item.id} type="button" className="rv-btn" onClick={() => handTo(item.id)}>
                    {item.label}
                  </button>
                ))}
              </div>
              <div className="rv-row">
                <button type="button" className="rv-btn" aria-pressed={xray} onClick={() => setXray((on) => !on)}>
                  inspect envelope
                </button>
                <button type="button" className="rv-btn" onClick={() => commit(sceneStart())}>
                  reset
                </button>
              </div>
            </div>
          </div>

          {xray && (
            <div className="rv-xray">
              <p className="rv-xray-title mono">inside the envelope. fields from Rivet&apos;s protocol notes.</p>
              <div className="rv-xray-grid">
                {zones.map((zone) => (
                  <div key={zone} className="rv-xray-zone" data-zone={zone}>
                    <p className="rv-xray-name">{zoneLabel[zone]}</p>
                    <p className="rv-xray-readers mono">readable by: {zoneReaders[zone]}</p>
                    <ul>
                      {parts.filter((part) => part.zone === zone).map((part) => (
                        <li key={part.id}>
                          {part.name} <span className="mono">{part.bytes}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
              <p className="rv-xray-copy">
                <span className="mono">{holders.map((item) => `${item.label}: hop ${scene.copies[item.id]} of ${MAX_HOPS}`).join(", ")}.</span>{" "}
                {recipientOpened ? "the sealed part was opened by the recipient only." : "the sealed part stays closed on every relay."}
              </p>
            </div>
          )}
        </>
      )}

      <p className="rv-note">
        {ready ? "drag a phone to move it. drag the envelope onto a phone to hand it over. " : ""}
        not real Bluetooth in the browser. the range ring is a drawing aid, not a measured distance.
      </p>
    </div>
  );
}
