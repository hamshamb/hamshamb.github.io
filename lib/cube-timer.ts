// solve timer state machine. pure: no DOM, no clocks. every event carries its own timestamp
// (milliseconds, any monotonic origin), so the whole thing runs under node type stripping and
// can be tested with made up times.
//
// flow without inspection:  idle -press-> holding -(300ms)-> ready -release-> running -press-> stopped
// flow with inspection:     idle -press-> inspecting -press-> holding -> ready -release-> running -> stopped
//
// inspection is "WCA-style training inspection". it follows the WCA convention for penalties,
// but it is a practice aid on a web page, not official timing, and the ui never says otherwise.
//   starting the solve up to and including 15.00s into inspection: no penalty
//   starting after 15.00s, up to and including 17.00s:             +2
//   starting after 17.00s:                                         DNF
// inspection keeps counting past 17s; the penalty is decided when the solve starts.

export type TimerPenalty = "ok" | "+2" | "DNF";
export type TimerPhase = "idle" | "inspecting" | "holding" | "ready" | "running" | "stopped";

/** how long the pad must be held before it counts as armed. */
export const HOLD_MS = 300;
export const INSPECTION_MS = 15_000;
export const INSPECTION_DNF_MS = 17_000;

export type TimerState = {
  phase: TimerPhase;
  /** whether the next attempt starts with inspection. */
  inspection: boolean;
  /** when inspection began, while it is in play (also kept while holding after inspecting). */
  inspectStart: number | null;
  holdStart: number | null;
  runStart: number | null;
  /** final time of the last stopped solve, in ms. */
  elapsed: number;
  /** penalty earned by inspection for the current or last solve. */
  penalty: TimerPenalty;
};

export type TimerEvent =
  | { type: "press"; at: number }
  | { type: "release"; at: number }
  | { type: "tick"; at: number }
  | { type: "cancel" }
  | { type: "inspection"; on: boolean };

export function createTimer(inspection = false): TimerState {
  return { phase: "idle", inspection, inspectStart: null, holdStart: null, runStart: null, elapsed: 0, penalty: "ok" };
}

/** penalty for starting the solve `elapsedMs` into inspection. */
export function inspectionPenalty(elapsedMs: number): TimerPenalty {
  if (elapsedMs > INSPECTION_DNF_MS) return "DNF";
  if (elapsedMs > INSPECTION_MS) return "+2";
  return "ok";
}

function begin(state: TimerState, at: number): TimerState {
  const fresh = { ...state, holdStart: null, runStart: null, penalty: "ok" as const };
  if (state.inspection) return { ...fresh, phase: "inspecting", inspectStart: at };
  return { ...fresh, phase: "holding", inspectStart: null, holdStart: at };
}

export function reduceTimer(state: TimerState, event: TimerEvent): TimerState {
  switch (event.type) {
    case "press": {
      switch (state.phase) {
        case "idle":
        case "stopped":
          return begin(state, event.at);
        case "inspecting":
          return { ...state, phase: "holding", holdStart: event.at };
        case "running":
          return { ...state, phase: "stopped", elapsed: Math.max(0, event.at - (state.runStart ?? event.at)) };
        default:
          return state; // holding or ready: key repeat or a second finger
      }
    }
    case "release": {
      if (state.phase !== "holding" && state.phase !== "ready") return state;
      const held = event.at - (state.holdStart ?? event.at);
      if (state.phase === "holding" && held < HOLD_MS) {
        // let go too early: back to where we were, nothing is recorded
        return state.inspectStart !== null
          ? { ...state, phase: "inspecting", holdStart: null }
          : { ...state, phase: "idle", holdStart: null };
      }
      return {
        ...state,
        phase: "running",
        runStart: event.at,
        holdStart: null,
        penalty: state.inspectStart !== null ? inspectionPenalty(event.at - state.inspectStart) : "ok",
        inspectStart: null,
      };
    }
    case "tick": {
      if (state.phase === "holding" && event.at - (state.holdStart ?? event.at) >= HOLD_MS) {
        return { ...state, phase: "ready" };
      }
      return state;
    }
    case "cancel": {
      // escape, a lost window or a hidden tab: drop the attempt without recording anything
      if (state.phase === "idle" || state.phase === "stopped") return state;
      return { ...state, phase: "idle", inspectStart: null, holdStart: null, runStart: null, penalty: "ok" };
    }
    case "inspection": {
      if (state.phase === "running" || state.phase === "holding" || state.phase === "ready") return state;
      const phase = state.phase === "inspecting" ? "idle" : state.phase;
      return { ...state, inspection: event.on, phase, inspectStart: null };
    }
  }
}

/** milliseconds on the clock right now: the running time, or the last result. */
export function liveMs(state: TimerState, now: number): number {
  if (state.phase === "running") return Math.max(0, now - (state.runStart ?? now));
  if (state.phase === "stopped") return state.elapsed;
  return 0;
}

/** what the inspection countdown shows: whole seconds left, then "+2", then "DNF". */
export function inspectionLabel(state: TimerState, now: number): string {
  const spent = state.inspectStart === null ? 0 : Math.max(0, now - state.inspectStart);
  const penalty = inspectionPenalty(spent);
  if (penalty === "DNF") return "DNF";
  if (penalty === "+2") return "+2";
  return String(Math.ceil((INSPECTION_MS - spent) / 1000));
}
