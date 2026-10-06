"use client";

import { useEffect, useRef, useState } from "react";
import {
  COURIER_DEADLINE,
  COURIER_RANGE,
  type Courier,
  FRIEND,
  YOU,
  handOver,
  newGame,
  options,
  positionOf,
  step,
  TRACK,
} from "@/lib/courier";
import { discover, unlockToy } from "@/lib/secrets";

const TICK_MS = 1500;

/**
 * Packet courier: a small game about carrying a message. The friend is far away and the phones in
 * between drift in and out of range on every tick. Hand a sealed copy to any phone that is close
 * enough, and keep doing it until the friend is in reach, before every copy expires. Winning
 * unlocks the toy in the toybox. A conceptual simulation: nothing here is Bluetooth.
 */
export function PacketCourier() {
  const [game, setGame] = useState<Courier>(() => newGame(1));
  const [started, setStarted] = useState(false);
  const [paused, setPaused] = useState(false);
  const rewarded = useRef(false);

  const playing = started && !paused && game.status === "playing";

  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") setGame((current) => step(current));
    }, TICK_MS);
    return () => window.clearInterval(timer);
  }, [playing]);

  useEffect(() => {
    // reduced motion: start paused, so the visitor steps the clock themselves
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setTimeout(() => setPaused(true), 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (game.status !== "won" || rewarded.current) return;
    rewarded.current = true;
    discover("packet-courier");
    unlockToy("courier");
  }, [game.status]);

  const open = new Set(options(game).map((option) => option.id));
  const last = game.log.at(-1);
  const left = Math.max(0, game.deadline - game.tick);
  const holders = game.phones.filter((phone) => game.copies[phone.id] !== undefined);

  const restart = () => {
    rewarded.current = false;
    setGame((current) => newGame(current.seed + 1));
    setStarted(true);
    setPaused(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  };

  return (
    <div className="cr">
      <div className="rv-head">
        <span className="rv-tag mono">conceptual simulation</span>
        <span className="rv-chip mono" data-state={game.status === "won" ? "delivered" : "idle"}>
          {game.status === "won" ? "delivered" : game.status === "lost" ? "expired" : started ? `tick ${game.tick} of ${COURIER_DEADLINE}` : "ready"}
        </span>
      </div>

      <div className="cr-track" aria-hidden="true">
        <div className="cr-lanes">
          {holders.map((holder) => {
            const at = positionOf(holder, game.tick);
            const from = Math.max(0, at - COURIER_RANGE);
            const to = Math.min(TRACK, at + COURIER_RANGE);
            return <span key={holder.id} className="cr-band" style={{ left: `${from}%`, width: `${to - from}%` }} />;
          })}
          {game.phones.map((phone, lane) => {
            const holds = game.copies[phone.id] !== undefined;
            return (
              <span
                key={phone.id}
                className="cr-phone"
                data-holds={holds || undefined}
                data-near={open.has(phone.id) || undefined}
                data-end={phone.id === FRIEND || undefined}
                style={{ left: `${positionOf(phone, game.tick)}%`, top: `${lane * 34}px` }}
              >
                <i className="cr-phone-icon" />
                <span className="mono">{phone.name}</span>
              </span>
            );
          })}
        </div>
      </div>

      <progress className="cr-clock" max={COURIER_DEADLINE} value={left} aria-label="Time left before every copy expires" />

      <p className="sr-only" aria-live="polite">{game.status === "won" ? "delivered." : game.status === "lost" ? "expired. nothing was delivered." : ""}</p>
      <p className="rv-status">
        {!started
          ? "the friend is out of range. press start, then hand a sealed copy to any phone that is close enough. keep going until the friend is close enough too."
          : last}
      </p>

      <div className="rv-group" role="group" aria-label="Hand a sealed copy to">
        <span className="rv-group-title mono">hand a sealed copy to</span>
        <div className="rv-row">
          {game.phones.filter((phone) => phone.id !== YOU).map((phone) => {
            const has = game.copies[phone.id] !== undefined;
            const near = open.has(phone.id);
            return (
              <button
                key={phone.id}
                type="button"
                className="rv-btn"
                data-near={near || undefined}
                aria-disabled={!started || game.status !== "playing" || has || undefined}
                onClick={() => {
                  if (!started || game.status !== "playing") return;
                  setGame((current) => handOver(current, phone.id));
                }}
              >
                {phone.name}
                <span className="mono cr-btn-state">{has ? "has a copy" : near ? "in range" : "out of range"}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="rv-row cr-controls">
        {!started || game.status !== "playing" ? (
          <button type="button" className="rv-btn rv-btn-primary" onClick={() => (started ? restart() : setStarted(true))}>
            {game.status === "won" ? "play again" : game.status === "lost" ? "try another route" : "start"}
          </button>
        ) : (
          <>
            <button type="button" className="rv-btn" aria-pressed={paused} onClick={() => setPaused((value) => !value)}>
              {paused ? "resume" : "pause"}
            </button>
            <button type="button" className="rv-btn" onClick={() => setGame((current) => step(current))}>
              next tick
            </button>
          </>
        )}
        <p className="cr-rules mono">
          range {COURIER_RANGE} · {game.handovers} handover{game.handovers === 1 ? "" : "s"} · {left} ticks left
        </p>
      </div>

      <p className="rv-note">
        not real Bluetooth behaviour. positions, range and ticks are drawing units. what it does show is the real idea: a phone you hand a copy to keeps it, so the message can wait for the next one to drift close.
      </p>
    </div>
  );
}
