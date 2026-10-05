"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import {
  applyAlg,
  endsWithRepeats,
  formatAlg,
  formatMove,
  generateScramble,
  invertAlg,
  type Move,
  mulberry32,
  parseAlg,
  SOLVED,
} from "@/lib/cube";
import { achieve, bump, discover } from "@/lib/secrets";
import { Cube3D, type CubeHandle } from "./Cube3D";
import { CubeNet } from "./CubeNet";
import { SessionHistory, SessionStats } from "./SessionPanel";
import { addSolve } from "./session-store";
import { SolveTimer } from "./SolveTimer";

const speeds = { slow: 900, normal: 520, fast: 260 } as const;
type Speed = keyof typeof speeds;
type Phase = "scramble" | "undo";

/** The move pad: one clockwise and one counter-clockwise button per face. */
const PAD: Move[] = parseAlg("R U F L D B R' U' F' L' D' B'");
/** The most familiar four-move trigger. Doing it six times brings the cube back to where it started. */
const TRIGGER = parseAlg("R U R' U'");
const FREE_LIMIT = 300;

/**
 * The cube lab: a WCA-style scramble, a solve timer with the visitor's own session stats, a net and
 * a 3D cube with playback. "undo scramble" plays the scramble backwards; it is not a solver and never
 * claims to be one.
 */
export function CubeLab() {
  // seeded so the prerendered page and the hydrated one agree; "new scramble" is random
  const [scramble, setScramble] = useState<Move[]>(() => generateScramble(20, mulberry32(2021)));
  const [phase, setPhase] = useState<Phase>("scramble");
  const [pos, setPos] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<Speed>("normal");
  const [copied, setCopied] = useState(false);
  const [free, setFree] = useState<Move[]>([]);
  const [quiet, setQuiet] = useState<string | null>(null);
  const cube = useRef<CubeHandle>(null);
  const busy = useRef(false);
  const reduced = useRef(false);
  const generation = useRef(0); // bumped on every reset so a turn in flight cannot commit into a new scramble
  const freeRef = useRef<Move[]>([]);
  const queue = useRef<Move[]>([]);
  const draining = useRef(false);

  useEffect(() => {
    reduced.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  const sequence = useMemo(() => (phase === "scramble" ? scramble : invertAlg(scramble)), [phase, scramble]);
  const base = useMemo(() => (phase === "scramble" ? SOLVED : applyAlg(SOLVED, scramble)), [phase, scramble]);
  const played = useMemo(() => applyAlg(base, sequence.slice(0, pos)), [base, sequence, pos]);
  const state = useMemo(() => applyAlg(played, free), [played, free]);
  const done = pos >= sequence.length;
  const scrambleText = useMemo(() => formatAlg(scramble), [scramble]);
  const touched = free.length > 0;

  /** Animate one move on the 3D cube, then commit it. Without motion the commit is immediate. */
  const stepBy = useCallback(
    async (direction: 1 | -1) => {
      if (busy.current || freeRef.current.length > 0) return;
      const target = pos + direction;
      if (target < 0 || target > sequence.length) return;
      const move = direction === 1 ? sequence[pos] : invertAlg([sequence[pos - 1]])[0];
      const ms = reduced.current ? 0 : speeds[speed] * 0.8;
      if (!ms) {
        setPos(target);
        return;
      }
      const mine = generation.current;
      busy.current = true;
      await cube.current?.turn(move, ms);
      if (mine !== generation.current) return;
      busy.current = false;
      setPos(target);
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
      if (document.visibilityState === "visible") void stepBy(1);
    }, reduced.current ? speeds[speed] : speeds[speed] * 0.15);
    return () => window.clearTimeout(timer);
  }, [playing, done, pos, speed, stepBy]);

  const reset = (next?: Move[]) => {
    generation.current += 1;
    busy.current = false;
    draining.current = false;
    queue.current = [];
    freeRef.current = [];
    setFree([]);
    setQuiet(null);
    setPlaying(false);
    setPhase("scramble");
    setPos(0);
    if (next) setScramble(next);
  };

  const newScramble = () => {
    reset(generateScramble());
    if (bump("scrambles") === 10) achieve("cube-person");
  };

  /** A finished solve is stored in the visitor's session, then the next scramble is ready. */
  const onSolve = (result: { ms: number; penalty: "ok" | "+2" | "DNF" }) => {
    addSolve({ ...result, scramble: scrambleText });
    newScramble();
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(scrambleText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  /** Pad moves run one at a time, even when pressed faster than they animate. */
  const drain = async () => {
    if (draining.current || busy.current) return;
    draining.current = true;
    const mine = generation.current;
    while (queue.current.length > 0) {
      const move = queue.current.shift() as Move;
      busy.current = true;
      if (!reduced.current) await cube.current?.turn(move, 170);
      if (mine !== generation.current) return;
      const next = [...freeRef.current, move];
      freeRef.current = next;
      // commit and flush before the next turn so the 3D cube has re-synced its state
      flushSync(() => setFree(next));
      busy.current = false;
      if (endsWithRepeats(next, TRIGGER, 6)) {
        discover("cube-sequence");
        setQuiet("six times, and the cube is back where it started. R U R' U' has order six.");
      }
    }
    draining.current = false;
  };

  const press = (move: Move) => {
    if (playing || (busy.current && !draining.current)) return; // a playback step is still landing
    if (freeRef.current.length + queue.current.length >= FREE_LIMIT) return;
    setQuiet(null);
    queue.current.push(move);
    void drain();
  };

  const clearMoves = () => {
    generation.current += 1;
    busy.current = false;
    draining.current = false;
    queue.current = [];
    freeRef.current = [];
    setFree([]);
    setQuiet(null);
  };

  const describe = phase === "scramble" ? "scramble" : "undoing the scramble";
  const label = `3D cube, ${describe}, ${pos} of ${sequence.length} moves applied${touched ? `, plus ${free.length} of your own` : ""}. drag it or use the view buttons to look around.`;
  const locked = playing || touched;

  return (
    <div className="cube-lab">
      <section className="cube-lab-scramble" aria-label="Scramble">
        <p className="cube-lab-kicker mono">WCA-style 3x3 scramble</p>
        <ol className="cube-moves" aria-label={phase === "scramble" ? "Scramble" : "Scramble, reversed"}>
          {sequence.map((move, index) => (
            <li key={index} data-state={index < pos ? "done" : index === pos ? "next" : undefined}>
              {formatMove(move)}
            </li>
          ))}
        </ol>
        <div className="cube-controls">
          <button type="button" className="button" onClick={newScramble}>new scramble</button>
          <button type="button" className="button" onClick={copy}>{copied ? "copied" : "copy scramble"}</button>
        </div>
      </section>

      <section className="cube-lab-timer" aria-label="Solve timer">
        <SolveTimer onSolve={onSolve} />
      </section>

      <section className="cube-lab-stats" aria-label="Session">
        <SessionStats />
      </section>

      <div className="cube-lab-stage">
        <Cube3D ref={cube} state={state} label={label} />
        <CubeNet state={state} label={`Cube net after ${pos} of ${sequence.length} moves${touched ? ` and ${free.length} of yours` : ""}`} />

        <p className="cube-lab-status mono" aria-live="polite">
          {phase === "undo" ? "undo scramble" : "scramble"} · {pos}/{sequence.length}
          {done && phase === "scramble" ? " · scrambled" : ""}
          {done && phase === "undo" ? " · back to solved" : ""}
          {touched ? ` · +${free.length} of yours` : ""}
        </p>

        <div className="cube-controls">
          <button type="button" className="button button-primary" onClick={() => setPlaying((value) => !value)} disabled={done || touched}>
            {playing ? "pause" : pos === 0 ? (phase === "scramble" ? "play scramble" : "play undo") : "resume"}
          </button>
          <button type="button" className="button" onClick={() => void stepBy(-1)} disabled={pos === 0 || locked} aria-label="previous move">← prev</button>
          <button type="button" className="button" onClick={() => void stepBy(1)} disabled={done || locked} aria-label="next move">next →</button>
        </div>
        <div className="cube-controls">
          <button
            type="button"
            className="button"
            disabled={phase === "undo" || !done || touched}
            onClick={() => {
              setPlaying(false);
              setPhase("undo");
              setPos(0);
            }}
          >
            undo scramble
          </button>
          <button
            type="button"
            className="button"
            disabled={done || locked}
            onClick={() => {
              generation.current += 1;
              busy.current = false;
              setPos(sequence.length);
            }}
          >
            {phase === "scramble" ? "show scrambled" : "show solved"}
          </button>
          <button type="button" className="button" onClick={() => reset()}>reset</button>
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

        <div className="cube-pad">
          <p className="cube-pad-title mono">turn it yourself</p>
          <div className="cube-pad-grid" role="group" aria-label="Turn a face. A letter is clockwise, a letter with a prime is counter-clockwise.">
            {PAD.map((move) => (
              <button
                key={formatMove(move)}
                type="button"
                className="cube-pad-key mono"
                disabled={playing}
                onClick={() => press(move)}
                aria-label={`turn ${move.face} ${move.turns === 3 ? "counter-clockwise" : "clockwise"}`}
              >
                {formatMove(move)}
              </button>
            ))}
          </div>
          {touched && (
            <div className="cube-pad-log">
              <span className="mono">{formatAlg(free.slice(-18))}</span>
              <button type="button" className="cube-pad-clear" onClick={clearMoves}>clear moves</button>
            </div>
          )}
          <p className="cube-quiet" aria-live="polite">{quiet}</p>
        </div>

        <p className="cube-lab-note">
          scrambles use WCA notation and its move rules (no face twice in a row, no three turns on one axis), but they are
          random moves, not the official WCA random-state scrambler. undo scramble just plays it backwards. it is not a solver.
        </p>
      </div>

      <section className="cube-lab-history" aria-label="Solve history">
        <SessionHistory />
      </section>
    </div>
  );
}
