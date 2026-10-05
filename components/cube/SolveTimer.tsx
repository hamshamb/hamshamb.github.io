"use client";

import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { formatMs } from "@/lib/cube-stats";
import {
  createTimer,
  HOLD_MS,
  inspectionLabel,
  liveMs,
  reduceTimer,
  type TimerEvent,
  type TimerPenalty,
  type TimerState,
} from "@/lib/cube-timer";

/** Controls where the space bar must keep its normal job. The pad itself is exempt. */
const OTHER_CONTROLS =
  "input, textarea, select, button, a[href], summary, [contenteditable], [role='button'], [role='checkbox'], [role='switch'], [role='dialog'], dialog";

/** Key and pointer timestamps share performance.now()'s clock; fall back if a browser disagrees. */
function stamp(event: { timeStamp: number }) {
  const now = performance.now();
  return event.timeStamp > 0 && Math.abs(event.timeStamp - now) < 1000 ? event.timeStamp : now;
}

/** The two input styles share one sentence slot: css shows the one that matches the device. */
function Both({ keys, touch }: { keys: string; touch: string }) {
  return (
    <>
      <span className="when-keys">{keys}</span>
      <span className="when-touch">{touch}</span>
    </>
  );
}

function Readout({ state }: { state: TimerState }) {
  const [now, setNow] = useState(0);
  const live = state.phase === "running" || state.inspectStart !== null;

  useEffect(() => {
    if (!live) return;
    let frame = 0;
    const loop = () => {
      setNow(performance.now());
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [live]);

  if (state.inspectStart !== null) return <span className="timer-digits">{inspectionLabel(state, now)}</span>;
  if (state.phase === "running") return <span className="timer-digits">{formatMs(liveMs(state, now))}</span>;
  if (state.phase === "stopped") {
    if (state.penalty === "DNF") {
      return (
        <span className="timer-digits">
          DNF<small>{formatMs(state.elapsed)}</small>
        </span>
      );
    }
    const plus = state.penalty === "+2";
    return (
      <span className="timer-digits">
        {formatMs(state.elapsed + (plus ? 2000 : 0))}
        {plus && <small>+2</small>}
      </span>
    );
  }
  return <span className="timer-digits">0.00</span>;
}

/**
 * The solve timer. The rules live in lib/cube-timer.ts; this file only turns keys and touches into
 * events. Space belongs to the timer only while focus is on the page itself or on the pad, never inside
 * an input or on another control. While a solve is running any key stops it.
 */
export function SolveTimer({ onSolve }: { onSolve: (result: { ms: number; penalty: TimerPenalty }) => void }) {
  const [state, setState] = useState<TimerState>(() => createTimer());
  const current = useRef(state);
  const surface = useRef<HTMLDivElement>(null);
  const pointerActive = useRef(false);
  const spaceHeld = useRef(false);
  const onSolveRef = useRef(onSolve);

  useEffect(() => {
    onSolveRef.current = onSolve;
  }, [onSolve]);

  const dispatch = useCallback((event: TimerEvent) => {
    const before = current.current;
    const after = reduceTimer(before, event);
    if (after === before) return;
    current.current = after;
    setState(after);
    if (before.phase === "running" && after.phase === "stopped") {
      onSolveRef.current({ ms: after.elapsed, penalty: after.penalty });
    }
  }, []);

  // holding turns into ready after HOLD_MS; the reducer decides, this only wakes it up
  useEffect(() => {
    if (state.phase !== "holding" || state.holdStart === null) return;
    const wait = Math.max(0, state.holdStart + HOLD_MS - performance.now()) + 4;
    const id = window.setTimeout(() => dispatch({ type: "tick", at: performance.now() }), wait);
    return () => window.clearTimeout(id);
  }, [state.phase, state.holdStart, dispatch]);

  useEffect(() => {
    const ownsSpace = (target: EventTarget | null) => {
      if (!(target instanceof Element)) return true;
      if (surface.current?.contains(target)) return true;
      return target.closest(OTHER_CONTROLS) === null;
    };
    const isSpace = (event: KeyboardEvent) => event.code === "Space" || event.key === " ";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const phase = current.current.phase;
      // a running solve is never thrown away by a stray key: Escape stops it like any other key
      if (event.key === "Escape" && phase !== "running") {
        if (phase !== "idle" && phase !== "stopped") dispatch({ type: "cancel" });
        return;
      }
      if (phase === "running") {
        if (event.repeat || ["Shift", "Control", "Alt", "Meta", "CapsLock"].includes(event.key)) return;
        if (isSpace(event)) {
          event.preventDefault();
          spaceHeld.current = true;
        }
        dispatch({ type: "press", at: stamp(event) });
        return;
      }
      if (!isSpace(event) || !ownsSpace(event.target)) return;
      event.preventDefault(); // no page scroll, no button click
      if (event.repeat) return;
      spaceHeld.current = true;
      dispatch({ type: "press", at: stamp(event) });
    };

    const onKeyUp = (event: KeyboardEvent) => {
      if (!isSpace(event) || !spaceHeld.current) return;
      spaceHeld.current = false;
      event.preventDefault(); // a button would otherwise click on the key coming up
      dispatch({ type: "release", at: stamp(event) });
    };

    const onAway = () => {
      const phase = current.current.phase;
      if (phase === "holding" || phase === "ready") {
        spaceHeld.current = false;
        pointerActive.current = false;
        dispatch({ type: "cancel" });
      }
    };
    const onHidden = () => {
      if (document.visibilityState === "hidden") onAway();
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onAway);
    document.addEventListener("visibilitychange", onHidden);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onAway);
      document.removeEventListener("visibilitychange", onHidden);
    };
  }, [dispatch]);

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    if (pointerActive.current) return;
    pointerActive.current = true;
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // capture is a nicety; the release below also listens on the pad
    }
    dispatch({ type: "press", at: stamp(event.nativeEvent) });
  };
  const onPointerEnd = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!pointerActive.current) return;
    pointerActive.current = false;
    dispatch({ type: "release", at: stamp(event.nativeEvent) });
  };

  const { phase } = state;
  const status: Record<string, string> = {
    idle: state.inspection ? "inspection on" : "idle",
    inspecting: "inspecting",
    holding: "holding",
    ready: "ready",
    running: "running",
    stopped: state.penalty === "ok" ? "stopped" : `stopped ${state.penalty}`,
  };
  const announce =
    phase === "ready"
      ? "ready"
      : phase === "running"
        ? "timer running"
        : phase === "stopped"
          ? `stopped, ${state.penalty === "DNF" ? "DNF" : formatMs(state.elapsed + (state.penalty === "+2" ? 2000 : 0))}`
          : phase === "inspecting"
            ? "inspection started"
            : "";

  return (
    <div className="cube-timer">
      <div
        ref={surface}
        className="timer-pad"
        role="button"
        tabIndex={0}
        data-phase={phase}
        aria-label="Solve timer. Hold space, or press and hold here, until it says ready, then let go to start."
        onPointerDown={onPointerDown}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
        onContextMenu={(event) => event.preventDefault()}
      >
        <span className="timer-status mono" aria-hidden="true">{status[phase]}</span>
        <span className="timer-readout" aria-hidden="true">
          <Readout state={state} />
        </span>
        <span className="timer-hint" aria-hidden="true">
          {phase === "idle" && !state.inspection && <Both keys="hold space, release to start" touch="press and hold, let go to start" />}
          {phase === "idle" && state.inspection && <Both keys="press space to begin inspection" touch="tap to begin inspection" />}
          {phase === "inspecting" && <Both keys="hold space, release to start" touch="press and hold, let go to start" />}
          {phase === "holding" && <Both keys="keep holding" touch="keep holding" />}
          {phase === "ready" && <Both keys="release to start" touch="let go to start" />}
          {phase === "running" && <Both keys="any key stops" touch="tap to stop" />}
          {phase === "stopped" && <Both keys="space for the next one" touch="press and hold for the next one" />}
        </span>
      </div>
      {/* the switch sits outside the pad so the pad stays one big target */}
      <label className="timer-inspect">
        <input
          type="checkbox"
          checked={state.inspection}
          disabled={phase === "running" || phase === "holding" || phase === "ready"}
          onChange={(event) => dispatch({ type: "inspection", on: event.target.checked })}
        />
        <span className="timer-inspect-name">WCA-style training inspection</span>
        <small>15 seconds to look. start after 15 and it is +2, after 17 a DNF. practice only, not official timing.</small>
      </label>
      <p className="sr-only" role="status">{announce}</p>
    </div>
  );
}
