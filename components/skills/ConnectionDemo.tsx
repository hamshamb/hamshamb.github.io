"use client";

import { useState } from "react";
import { accepts, type Context, type Event, initial, MAX_ATTEMPTS, type State, transition } from "@/lib/demos/connection";

const states: State[] = ["idle", "connecting", "connected", "retrying", "failed"];
const events: Event["type"][] = ["connect", "opened", "timeout", "dropped", "reset"];

/** Runs lib/demos/connection.ts: the same transition function shown in the code panel. */
export function ConnectionDemo() {
  const [[state, ctx], setMachine] = useState<[State, Context]>(initial);
  const [history, setHistory] = useState<string[]>([]);
  const allowed = accepts(state, ctx);

  const fire = (type: Event["type"]) => {
    const [next, nextCtx] = transition(state, { type } as Event, ctx);
    setMachine([next, nextCtx]);
    setHistory((log) => [`${state} --${type}--> ${next}${nextCtx.attempts ? ` (attempt ${nextCtx.attempts})` : ""}`, ...log].slice(0, 6));
  };

  return (
    <div className="machine">
      <ol className="machine-states" aria-label="States">
        {states.map((name) => (
          <li key={name} data-current={name === state || undefined}>
            <span className="machine-dot" aria-hidden="true" />
            {name}
            {name === "retrying" && <span className="mono"> {ctx.attempts}/{MAX_ATTEMPTS}</span>}
          </li>
        ))}
      </ol>
      <div className="machine-events" role="group" aria-label="Send an event">
        {events.map((type) => (
          <button key={type} type="button" className="button" disabled={!allowed.includes(type)} onClick={() => fire(type)}>
            {type}
          </button>
        ))}
      </div>
      <p className="machine-now" aria-live="polite">
        state: <b>{state}</b>
      </p>
      <ol className="machine-log mono" aria-label="Recent transitions">
        {history.length ? history.map((line, index) => <li key={`${index}-${line}`}>{line}</li>) : <li>no events yet. try connect, then timeout a few times.</li>}
      </ol>
    </div>
  );
}
