"use client";

import { AnimatePresence, m } from "motion/react";
import { useEffect, useReducer } from "react";
import {
  ALLOWED,
  canFault,
  type Event,
  type Fault,
  INVITE_TTL,
  initial,
  isEnded,
  makeToken,
  REASON_COPY,
  type Session,
  type SessionState,
  STEP_FROM,
  type Step,
  transition,
} from "@/lib/demos/session";

/**
 * A little lobby that walks the state machine in lib/demos/session.ts, which follows the
 * illustrative Java beside it. The visitor steps through it; failures are optional.
 */

const NODES: { state: SessionState; label: string }[] = [
  { state: "HOSTING", label: "host" },
  { state: "INVITED", label: "invite" },
  { state: "JOINING", label: "join" },
  { state: "VALIDATING", label: "validate" },
  { state: "AUTHENTICATING", label: "auth" },
  { state: "CONNECTED", label: "connected" },
];

const STEP_LABEL: Record<Step, string> = {
  host: "host a world",
  createInvite: "create invite",
  join: "player joins",
  validate: "validate invite",
  authenticate: "authenticate",
  connect: "finish handshake",
};

const FAULTS: { fault: Fault; label: string }[] = [
  { fault: "expireInvite", label: "invite expired" },
  { fault: "replayInvite", label: "invite already used" },
  { fault: "breakCredentials", label: "authentication failed" },
  { fault: "hostOffline", label: "host offline" },
];

const SAYS: Record<SessionState, string> = {
  IDLE: "nobody is hosting. the world is quiet.",
  HOSTING: "the host is online. no invite yet.",
  INVITED: "an invite is live. waiting for a player.",
  JOINING: "a player is at the door holding a token.",
  VALIDATING: "invite checked and spent. now the handshake.",
  AUTHENTICATING: "identity checked. one step from the door opening.",
  CONNECTED: "connected. two squares, one line.",
  REJECTED: "",
  CLOSED: "",
};

const WIRE_LABEL: Record<SessionState, string> = {
  IDLE: "no link",
  HOSTING: "no link yet",
  INVITED: "invite open",
  JOINING: "knock knock",
  VALIDATING: "token spent",
  AUTHENTICATING: "handshake",
  CONNECTED: "connected",
  REJECTED: "rejected",
  CLOSED: "host offline",
};

type Line = { id: number; text: string };
type View = { session: Session; log: Line[]; n: number };
type Action = { type: "event"; event: Event } | { type: "reset" };

const first: View = { session: initial, log: [{ id: 0, text: "an empty lobby. host a world to begin." }], n: 1 };

/** the dry commentary for whatever just happened. */
function describe(before: Session, after: Session, event: Event): string[] {
  if (after.state === "REJECTED" || (after.state === "CLOSED" && event.type === "hostOffline")) return [REASON_COPY[after.reason ?? "HOST_OFFLINE"]];
  switch (event.type) {
    case "host":
      return ["host online. a lobby with nobody in it."];
    case "createInvite":
      return [`invite ${after.invite?.token} created. ${INVITE_TTL} seconds, one use.`];
    case "join":
      return ["a player knocks and holds up the token."];
    case "validate":
      return ["token checked, then spent on the spot."];
    case "authenticate":
      return ["credentials accepted. nothing dramatic."];
    case "connect":
      return ["connected. the lobby has two people in it."];
    case "expireInvite":
      return ["the invite expired. short-lived on purpose."];
    case "replayInvite":
      return ["someone already spent that invite."];
    case "breakCredentials":
      return ["the player's credentials are now wrong. the handshake will notice."];
    case "tick":
      return before.invite && before.invite.ttl > 0 && after.invite?.ttl === 0 ? ["the invite timed out by itself. nobody was quick enough."] : [];
    default:
      return [];
  }
}

function reduce(view: View, action: Action): View {
  if (action.type === "reset") return first;
  const session = transition(view.session, action.event);
  if (session === view.session) return view;
  const lines = describe(view.session, session, action.event);
  if (!lines.length) return { ...view, session };
  const added = lines.map((text, i) => ({ id: view.n + i, text }));
  return { session, log: [...added, ...view.log].slice(0, 5), n: view.n + lines.length };
}

/** an 8 by 8 pixel face. `mood` only changes the eyes and the mouth. */
function Face({ mood }: { mood: "ok" | "asleep" | "sad" }) {
  const rows =
    mood === "ok"
      ? ["..hhhh..", ".hhhhhh.", "hhhhhhhh", "hehhhheh", "hhhhhhhh", "hhhmmhhh", ".hhhhhh.", "..hhhh.."]
      : mood === "asleep"
        ? ["..hhhh..", ".hhhhhh.", "hhhhhhhh", "hhhhhhhh", "heehheeh", "hhhhhhhh", ".hhhhhh.", "..hhhh.."]
        : ["..hhhh..", ".hhhhhh.", "hhhhhhhh", "hehhhheh", "hhhhhhhh", "hhmmmmhh", ".hmhhmh.", "..hhhh.."];
  return (
    <svg className="lobby-face" viewBox="0 0 8 8" shapeRendering="crispEdges" aria-hidden="true">
      {rows.flatMap((row, y) =>
        [...row].map((cell, x) => (cell === "." ? null : <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} className={cell === "h" ? "lobby-px" : "lobby-px-dark"} />)),
      )}
    </svg>
  );
}

function Ring({ ttl }: { ttl: number }) {
  const radius = 11;
  const circumference = 2 * Math.PI * radius;
  return (
    <svg className="lobby-ring" viewBox="0 0 28 28" aria-hidden="true">
      <circle cx="14" cy="14" r={radius} className="lobby-ring-track" />
      <circle cx="14" cy="14" r={radius} className="lobby-ring-fill" strokeDasharray={circumference} strokeDashoffset={circumference * (1 - ttl / INVITE_TTL)} />
    </svg>
  );
}

const clock = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

export function SessionLobby() {
  const [{ session, log }, dispatch] = useReducer(reduce, first);
  const { state, invite } = session;
  const ended = isEnded(state);
  const step = STEP_FROM[state];
  const ticking = !!invite && !invite.used && invite.ttl > 0 && (state === "INVITED" || state === "JOINING");

  useEffect(() => {
    if (!ticking) return;
    const timer = window.setInterval(() => dispatch({ type: "event", event: { type: "tick", seconds: 1 } }), 1000);
    return () => window.clearInterval(timer);
  }, [ticking]);

  const send = (event: Event) => dispatch({ type: "event", event });
  const advance = () => {
    if (!step) return dispatch({ type: "reset" });
    send(step === "createInvite" ? { type: "createInvite", token: makeToken() } : { type: step });
  };

  const hostOnline = state !== "IDLE" && state !== "CLOSED";
  const playerHere = session.joined && state !== "CLOSED";
  const inviteTag = !invite ? "none yet" : invite.ttl <= 0 ? "expired" : invite.used ? "spent" : "live";
  const reachable = new Set(ALLOWED[state]);
  const stepIndex = NODES.findIndex((node) => node.state === state);
  const says = ended && session.reason ? REASON_COPY[session.reason] : SAYS[state];

  return (
    <div className="lobby" data-state={state}>
      <div className="lobby-stage">
        <div className="lobby-seat" data-role="host" data-online={hostOnline || undefined}>
          <Face mood={hostOnline ? "ok" : "asleep"} />
          <p className="lobby-name">alder</p>
          <p className="lobby-role mono">{hostOnline ? "host · online" : state === "CLOSED" ? "host · offline" : "host · idle"}</p>
        </div>

        <div className="lobby-wire" aria-hidden="true">
          <span className="lobby-line" />
          {(state === "INVITED" || state === "JOINING") && <span className="lobby-packet" />}
          <span className="lobby-wire-label mono">{WIRE_LABEL[state]}</span>
        </div>

        <m.div className="lobby-seat" data-role="player" data-online={playerHere || undefined} animate={state === "REJECTED" ? { x: [0, -6, 6, -3, 0] } : { x: 0 }} transition={{ duration: 0.4 }}>
          <AnimatePresence initial={false} mode="wait">
            {playerHere ? (
              <m.div key="face" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }} transition={{ type: "spring", stiffness: 320, damping: 18 }}>
                <Face mood={state === "REJECTED" ? "sad" : "ok"} />
              </m.div>
            ) : (
              <m.div key="empty" className="lobby-empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} aria-hidden="true">
                ?
              </m.div>
            )}
          </AnimatePresence>
          <p className="lobby-name">pike</p>
          <p className="lobby-role mono">{playerHere ? (state === "CONNECTED" ? "player · in" : "player · at the door") : "empty seat"}</p>
        </m.div>
      </div>

      <p className="lobby-says" role="status" data-tone={state === "REJECTED" ? "bad" : state === "CLOSED" ? "quiet" : state === "CONNECTED" ? "good" : undefined}>
        {says}
      </p>

      <div className="lobby-invite" data-tag={inviteTag}>
        <span className="lobby-invite-label mono">invite</span>
        <code className="lobby-token">{invite ? invite.token : "LB-????"}</code>
        <span className="lobby-invite-tag mono">{inviteTag}</span>
        <span className="lobby-clock mono">
          {invite && !invite.used ? (
            <>
              <Ring ttl={invite.ttl} /> {clock(invite.ttl)}
            </>
          ) : (
            <>&nbsp;</>
          )}
        </span>
      </div>

      <ol className="lobby-track" aria-label="session states">
        {NODES.map((node, index) => (
          <li key={node.state} data-current={node.state === state || undefined} data-done={stepIndex > index || undefined} data-next={reachable.has(node.state) || undefined}>
            <span className="lobby-node-name mono">{node.state}</span>
            <span className="sr-only">{node.state === state ? " (current)" : reachable.has(node.state) ? " (reachable)" : ""}</span>
          </li>
        ))}
        <li className="lobby-side" data-kind="bad" data-current={state === "REJECTED" || undefined} data-next={reachable.has("REJECTED") || undefined}>
          <span className="lobby-node-name mono">REJECTED</span>
          <span className="sr-only">{state === "REJECTED" ? " (current)" : reachable.has("REJECTED") ? " (reachable)" : ""}</span>
        </li>
        <li className="lobby-side" data-kind="quiet" data-current={state === "CLOSED" || undefined} data-next={reachable.has("CLOSED") || undefined}>
          <span className="lobby-node-name mono">CLOSED</span>
          <span className="sr-only">{state === "CLOSED" ? " (current)" : reachable.has("CLOSED") ? " (reachable)" : ""}</span>
        </li>
      </ol>

      <div className="lobby-actions">
        <button type="button" className="button button-primary lobby-go" onClick={advance}>
          {step ? (
            <>
              <span className="lobby-step mono">{stepIndex + 2}/6</span> {STEP_LABEL[step]} <span className="arrow" aria-hidden="true">→</span>
            </>
          ) : (
            <>start over</>
          )}
        </button>
        <fieldset className="lobby-faults">
          <legend className="mono">make it go wrong</legend>
          {FAULTS.map(({ fault, label }) => (
            <button key={fault} type="button" className="lobby-fault" disabled={!canFault(session, fault)} onClick={() => send({ type: fault })}>
              {label}
            </button>
          ))}
        </fieldset>
      </div>

      <ol className="lobby-log" aria-label="what happened">
        <AnimatePresence initial={false}>
          {log.map((line) => (
            <m.li key={line.id} layout="position" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.22 }}>
              {line.text}
            </m.li>
          ))}
        </AnimatePresence>
      </ol>

      <p className="lobby-foot mono">illustrative java model · mirrors Session.java · invented tokens, not Nexus source</p>
    </div>
  );
}
