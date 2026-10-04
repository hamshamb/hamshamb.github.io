"use client";

import { type FormEvent, useState } from "react";

type State = "IDLE" | "HOSTING" | "INVITED" | "AUTHENTICATING" | "CONNECTED" | "CLOSED";

/** The same allowed transitions as SessionState.next() in the Java beside it. */
const next: Record<State, State[]> = {
  IDLE: ["HOSTING", "INVITED"],
  HOSTING: ["AUTHENTICATING", "CLOSED"],
  INVITED: ["AUTHENTICATING", "CLOSED"],
  AUTHENTICATING: ["CONNECTED", "CLOSED"],
  CONNECTED: ["CLOSED"],
  CLOSED: [],
};
const order: State[] = ["IDLE", "HOSTING", "INVITED", "AUTHENTICATING", "CONNECTED", "CLOSED"];

const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const makeCode = () => Array.from({ length: 6 }, () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]).join("").replace(/^(...)/, "$1-");

/** A browser visualisation of the illustrative Java model: states, transitions and a one-use invite. */
export function SessionDemo() {
  const [state, setState] = useState<State>("IDLE");
  const [invite, setInvite] = useState<{ code: string; used: boolean } | null>(null);
  const [attempt, setAttempt] = useState("");
  const [log, setLog] = useState<string[]>([]);

  const say = (line: string) => setLog((lines) => [line, ...lines].slice(0, 5));
  const move = (target: State) => {
    if (!next[state].includes(target)) {
      say(`IllegalStateException: ${state} cannot go to ${target}`);
      return;
    }
    if (target === "HOSTING") setInvite({ code: makeCode(), used: false });
    setState(target);
    say(`${state} -> ${target}`);
  };

  const redeem = (event: FormEvent) => {
    event.preventDefault();
    const typed = attempt.trim().toUpperCase();
    if (!invite) return say("no invite has been issued yet. host first.");
    if (invite.used) return say(`invite ${invite.code} was already used. one use only.`);
    if (typed !== invite.code) return say(`"${typed || "(empty)"}" does not match. nothing happens.`);
    setInvite({ ...invite, used: true });
    setState("AUTHENTICATING");
    say(`invite accepted and consumed. ${state} -> AUTHENTICATING`);
  };

  return (
    <div className="session">
      <ol className="session-states" aria-label="Session states">
        {order.map((name) => (
          <li key={name} data-current={name === state || undefined} data-reachable={next[state].includes(name) || undefined}>{name}</li>
        ))}
      </ol>
      <div className="machine-events" role="group" aria-label="Move to">
        {order.map((name) => (
          <button key={name} type="button" className="button" disabled={!next[state].includes(name)} onClick={() => move(name)}>
            {name.toLowerCase()}
          </button>
        ))}
        <button type="button" className="button" onClick={() => { setState("IDLE"); setInvite(null); setLog([]); }}>reset</button>
      </div>
      <div className="session-invite">
        <p className="mono">invite {invite ? <b>{invite.code}</b> : "none yet"} {invite?.used ? "(used)" : ""}</p>
        <form onSubmit={redeem}>
          <label htmlFor="invite-code" className="mono">join with code</label>
          <input id="invite-code" value={attempt} onChange={(event) => setAttempt(event.target.value)} placeholder="ABC-123" autoComplete="off" />
          <button type="submit" className="button">join</button>
        </form>
      </div>
      <ol className="machine-log mono" aria-live="polite" aria-label="Log">
        {log.length ? log.map((line, index) => <li key={`${index}-${line}`}>{line}</li>) : <li>host to issue an invite, then type its code to join.</li>}
      </ol>
    </div>
  );
}
