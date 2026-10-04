"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { applyAlg, formatMove, generateScramble, invertAlg, type Move, mulberry32, SOLVED } from "@/lib/cube";
import { Cube3D, type Turn } from "./Cube3D";
import { CubeNet } from "./CubeNet";

const speeds = { slow: 900, normal: 520, fast: 260 } as const;
type Speed = keyof typeof speeds;
type Phase = "scramble" | "undo";

/**
 * The cube lab: a WCA-style scramble, its text, a net and a 3D cube, with playback.
 * "undo scramble" plays the scramble backwards; it is not a solver and never claims to be one.
 */
export function CubeLab() {
  // seeded so the prerendered page and the hydrated one agree; "new scramble" is random
  const [scramble, setScramble] = useState<Move[]>(() => generateScramble(20, mulberry32(2021)));
  const [phase, setPhase] = useState<Phase>("scramble");
  const [pos, setPos] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<Speed>("normal");
  const [turn, setTurn] = useState<Turn | null>(null);
  const [copied, setCopied] = useState(false);
  const busy = useRef(false);
  const reduced = useRef(false);

  useEffect(() => {
    reduced.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  const sequence = useMemo(() => (phase === "scramble" ? scramble : invertAlg(scramble)), [phase, scramble]);
  const base = useMemo(() => (phase === "scramble" ? SOLVED : applyAlg(SOLVED, scramble)), [phase, scramble]);
  const state = useMemo(() => applyAlg(base, sequence.slice(0, pos)), [base, sequence, pos]);
  const done = pos >= sequence.length;

  /** Animate one move on the 3D cube, then commit it. Without motion the commit is immediate. */
  const stepBy = useCallback(
    (direction: 1 | -1) => {
      if (busy.current) return;
      const target = pos + direction;
      if (target < 0 || target > sequence.length) return;
      const move = direction === 1 ? sequence[pos] : invertAlg([sequence[pos - 1]])[0];
      const ms = reduced.current ? 0 : speeds[speed] * 0.8;
      if (!ms) {
        setPos(target);
        return;
      }
      busy.current = true;
      setTurn({ face: move.face, turns: move.turns, ms });
      window.setTimeout(() => {
        setTurn(null);
        setPos(target);
        busy.current = false;
      }, ms + 20);
    },
    [pos, sequence, speed],
  );

  useEffect(() => {
    if (!playing) return;
    if (done) {
      const stop = window.setTimeout(() => setPlaying(false), 0);
      return () => window.clearTimeout(stop);
    }
    const timer = window.setTimeout(() => {
      if (document.visibilityState === "visible") stepBy(1);
    }, reduced.current ? speeds[speed] : speeds[speed] * 0.15);
    return () => window.clearTimeout(timer);
  }, [playing, done, pos, speed, stepBy]);

  const reset = (next?: Move[]) => {
    setPlaying(false);
    setTurn(null);
    busy.current = false;
    setPhase("scramble");
    setPos(0);
    if (next) setScramble(next);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(scramble.map(formatMove).join(" "));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  const describe = phase === "scramble" ? "scramble" : "undoing the scramble";
  const label = `3D cube, ${describe}, ${pos} of ${sequence.length} moves applied. drag it or use the view buttons to look around.`;

  return (
    <div className="cube-lab">
      <div className="cube-lab-stage">
        <Cube3D state={state} turn={turn} label={label} />
        <CubeNet state={state} label={`Cube net after ${pos} of ${sequence.length} moves`} />
      </div>

      <div className="cube-lab-panel">
        <p className="cube-lab-kicker mono">WCA-style 3x3 scramble</p>
        <ol className="cube-moves" aria-label={phase === "scramble" ? "Scramble" : "Scramble, reversed"}>
          {sequence.map((move, index) => (
            <li key={index} data-state={index < pos ? "done" : index === pos ? "next" : undefined}>
              {formatMove(move)}
            </li>
          ))}
        </ol>
        <p className="cube-lab-status mono" aria-live="polite">
          {phase === "undo" ? "undo scramble" : "scramble"} · {pos}/{sequence.length}
          {done && phase === "scramble" ? " · scrambled" : ""}
          {done && phase === "undo" ? " · back to solved" : ""}
        </p>

        <div className="cube-controls">
          <button type="button" className="button button-primary" onClick={() => setPlaying((value) => !value)} disabled={done}>
            {playing ? "pause" : pos === 0 ? (phase === "scramble" ? "play scramble" : "play undo") : "resume"}
          </button>
          <button type="button" className="button" onClick={() => stepBy(-1)} disabled={pos === 0 || playing} aria-label="previous move">← prev</button>
          <button type="button" className="button" onClick={() => stepBy(1)} disabled={done || playing} aria-label="next move">next →</button>
        </div>
        <div className="cube-controls">
          <button type="button" className="button" onClick={() => reset(generateScramble())}>new scramble</button>
          <button type="button" className="button" onClick={copy}>{copied ? "copied" : "copy scramble"}</button>
          <button type="button" className="button" onClick={() => reset()}>reset</button>
          <button
            type="button"
            className="button"
            disabled={phase === "undo" || !done}
            onClick={() => {
              setPlaying(false);
              setPhase("undo");
              setPos(0);
            }}
          >
            undo scramble
          </button>
        </div>
        <fieldset className="cube-speed">
          <legend className="mono">speed</legend>
          {(Object.keys(speeds) as Speed[]).map((key) => (
            <label key={key}>
              <input type="radio" name="cube-speed" value={key} checked={speed === key} onChange={() => setSpeed(key)} />
              <span>{key}</span>
            </label>
          ))}
        </fieldset>
        <p className="cube-lab-note">
          scrambles use WCA notation and its move rules (no face twice in a row, no three turns on one axis), but they are
          random moves, not the official WCA random-state scrambler. undo scramble just plays it backwards. it is not a solver.
        </p>
      </div>
    </div>
  );
}
