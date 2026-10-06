// the lobby's state machine. pure functions, no react. the transitions mirror SessionState.next()
// in content/snippets/Session.java (an illustrative model, not Nexus source), and a test checks that.

export const STATES = ["IDLE", "HOSTING", "INVITED", "JOINING", "VALIDATING", "AUTHENTICATING", "CONNECTED", "REJECTED", "CLOSED"] as const;
export type SessionState = (typeof STATES)[number];

export type Rejection = "INVITE_EXPIRED" | "INVITE_ALREADY_USED" | "AUTH_FAILED";
export type Reason = Rejection | "HOST_OFFLINE";

/** the allowed moves. same table as the switch in Session.java. */
export const ALLOWED: Record<SessionState, readonly SessionState[]> = {
  IDLE: ["HOSTING"],
  HOSTING: ["INVITED", "CLOSED"],
  INVITED: ["JOINING", "CLOSED"],
  JOINING: ["VALIDATING", "REJECTED", "CLOSED"],
  VALIDATING: ["AUTHENTICATING", "REJECTED", "CLOSED"],
  AUTHENTICATING: ["CONNECTED", "CLOSED"],
  CONNECTED: ["CLOSED"],
  REJECTED: [],
  CLOSED: [],
};

export const INVITE_TTL = 90;

export type Invite = { token: string; ttl: number; used: boolean };

export type Session = {
  state: SessionState;
  invite: Invite | null;
  /** set by "break credentials": the next authenticate fails */
  badCredentials: boolean;
  /** a player has presented themselves at some point */
  joined: boolean;
  reason: Reason | null;
};

export type Step = "host" | "createInvite" | "join" | "validate" | "authenticate" | "connect";
export type Fault = "expireInvite" | "replayInvite" | "breakCredentials" | "hostOffline";
/** createInvite takes an optional token so the caller (not a reducer) can be the one that rolls dice. */
export type Event =
  | { type: Exclude<Step, "createInvite"> }
  | { type: "createInvite"; token?: string }
  | { type: Fault }
  | { type: "tick"; seconds: number };

export const initial: Session = { state: "IDLE", invite: null, badCredentials: false, joined: false, reason: null };

/** which state each step moves to, when nothing goes wrong. */
export const STEP_TARGET: Record<Step, SessionState> = {
  host: "HOSTING",
  createInvite: "INVITED",
  join: "JOINING",
  validate: "VALIDATING",
  authenticate: "AUTHENTICATING",
  connect: "CONNECTED",
};

/** the step that is possible from a state, if any. */
export const STEP_FROM: Partial<Record<SessionState, Step>> = {
  IDLE: "host",
  HOSTING: "createInvite",
  INVITED: "join",
  JOINING: "validate",
  VALIDATING: "authenticate",
  AUTHENTICATING: "connect",
};

const TOKEN_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

/** a made-up, short token for the chip. `random` is injectable so tests are deterministic. */
export function makeToken(random: () => number = Math.random): string {
  const pick = () => TOKEN_ALPHABET[Math.floor(random() * TOKEN_ALPHABET.length)];
  return `LB-${pick()}${pick()}${pick()}${pick()}`;
}

export const isEnded = (state: SessionState) => state === "REJECTED" || state === "CLOSED";
export const isLive = (state: SessionState) => !isEnded(state) && state !== "IDLE";

/** is this fault worth offering right now? */
export function canFault(session: Session, fault: Fault): boolean {
  const { state, invite } = session;
  switch (fault) {
    case "expireInvite":
      return (state === "INVITED" || state === "JOINING") && !!invite && invite.ttl > 0;
    case "replayInvite":
      return (state === "INVITED" || state === "JOINING") && !!invite && !invite.used;
    case "breakCredentials":
      return (state === "INVITED" || state === "JOINING" || state === "VALIDATING") && !session.badCredentials;
    case "hostOffline":
      return isLive(state);
  }
}

function move(session: Session, target: SessionState, patch: Partial<Session> = {}): Session {
  if (!ALLOWED[session.state].includes(target)) return session;
  return { ...session, ...patch, state: target };
}

/** one event in, one session out. an event that does not apply changes nothing. */
export function transition(session: Session, event: Event, random: () => number = Math.random): Session {
  const { state, invite } = session;
  switch (event.type) {
    case "host":
      return state === "IDLE" ? move(session, "HOSTING") : session;
    case "createInvite":
      return state === "HOSTING" ? move(session, "INVITED", { invite: { token: event.token ?? makeToken(random), ttl: INVITE_TTL, used: false } }) : session;
    case "join":
      return state === "INVITED" ? move(session, "JOINING", { joined: true }) : session;
    case "validate": {
      if (state !== "JOINING" || !invite) return session;
      if (invite.ttl <= 0) return move(session, "REJECTED", { reason: "INVITE_EXPIRED" });
      if (invite.used) return move(session, "REJECTED", { reason: "INVITE_ALREADY_USED" });
      return move(session, "VALIDATING", { invite: { ...invite, used: true } });
    }
    case "authenticate":
      if (state !== "VALIDATING") return session;
      return session.badCredentials ? move(session, "REJECTED", { reason: "AUTH_FAILED" }) : move(session, "AUTHENTICATING");
    case "connect":
      return state === "AUTHENTICATING" ? move(session, "CONNECTED") : session;
    case "expireInvite":
      return canFault(session, "expireInvite") && invite ? { ...session, invite: { ...invite, ttl: 0 } } : session;
    case "replayInvite":
      return canFault(session, "replayInvite") && invite ? { ...session, invite: { ...invite, used: true } } : session;
    case "breakCredentials":
      return canFault(session, "breakCredentials") ? { ...session, badCredentials: true } : session;
    case "hostOffline":
      return isLive(state) ? move(session, "CLOSED", { reason: "HOST_OFFLINE" }) : session;
    case "tick":
      // time only runs on an invite nobody has consumed yet
      if (!invite || invite.used || invite.ttl <= 0 || (state !== "INVITED" && state !== "JOINING")) return session;
      return { ...session, invite: { ...invite, ttl: Math.max(0, invite.ttl - event.seconds) } };
  }
}

/** the one-line story for each ending. */
export const REASON_COPY: Record<Reason, string> = {
  INVITE_EXPIRED: "the invite ran out of time. invites are short-lived on purpose.",
  INVITE_ALREADY_USED: "that invite was already spent. one use each.",
  AUTH_FAILED: "the handshake failed. the door stays shut.",
  HOST_OFFLINE: "the host went offline. the lobby is just a room now.",
};
