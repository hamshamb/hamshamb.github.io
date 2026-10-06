// the rules behind the type factory. every wire you draw is checked by check(), a tiny
// structural type check: is what this source sends assignable to what that sink asks for?
// the machine on the page imports this file and calls these same functions.

export type Prim = "string" | "number" | "boolean";
export type Shape = Readonly<Record<string, Prim>>;
export type TypeDef = { readonly name: string; readonly shape: Shape };

export const types = {
  ConnectEvent: { name: "ConnectEvent", shape: { url: "string" } },
  MessagePayload: { name: "MessagePayload", shape: { text: "string", from: "string" } },
  ErrorPayload: { name: "ErrorPayload", shape: { message: "string", code: "number" } },
  TimeoutEvent: { name: "TimeoutEvent", shape: { message: "string", code: "string" } },
  // what the sinks ask for. a sink may want less than a source sends
  Failure: { name: "Failure", shape: { message: "string" } },
  Retryable: { name: "Retryable", shape: { code: "number" } },
} as const satisfies Record<string, TypeDef>;

export type SourceId = "CONNECT" | "MESSAGE" | "ERROR" | "TIMEOUT";
export type SinkId = "onConnect" | "onMessage" | "onError" | "retry";
export type Payload = Readonly<Record<string, string | number | boolean>>;

export type Source = { id: SourceId; type: TypeDef; sample: Payload };
export type Sink = { id: SinkId; signature: string; accepts: TypeDef };
export type Wire = { from: SourceId; to: SinkId };

export const sources: readonly Source[] = [
  { id: "CONNECT", type: types.ConnectEvent, sample: { url: "wss://relay.example" } },
  { id: "MESSAGE", type: types.MessagePayload, sample: { text: "hello", from: "ham" } },
  { id: "ERROR", type: types.ErrorPayload, sample: { message: "socket closed", code: 1006 } },
  { id: "TIMEOUT", type: types.TimeoutEvent, sample: { message: "no pong", code: "408" } },
];

export const sinks: readonly Sink[] = [
  { id: "onConnect", signature: "(e: ConnectEvent)", accepts: types.ConnectEvent },
  { id: "onMessage", signature: "(m: MessagePayload)", accepts: types.MessagePayload },
  { id: "onError", signature: "(e: Failure)", accepts: types.Failure },
  { id: "retry", signature: "(s: Retryable)", accepts: types.Retryable },
];

/** The machine works when these four wires exist. */
export const required: readonly Wire[] = [
  { from: "CONNECT", to: "onConnect" },
  { from: "MESSAGE", to: "onMessage" },
  { from: "ERROR", to: "onError" },
  { from: "ERROR", to: "retry" },
];

export type Verdict = { ok: boolean; reason: string; detail: string };

/** Is `from` assignable to `to`? Every property the target wants must exist, with the same type. */
export function check(from: TypeDef, to: TypeDef): Verdict {
  for (const [key, want] of Object.entries(to.shape)) {
    const have = from.shape[key];
    const reason = `${from.name} is not assignable to ${to.name}`;
    if (have === undefined) return { ok: false, reason, detail: `property '${key}' is missing in ${from.name}` };
    if (have !== want) return { ok: false, reason, detail: `property '${key}' is ${have}, but ${to.name} expects ${want}` };
  }
  const extra = Object.keys(from.shape).filter((key) => !(key in to.shape));
  return {
    ok: true,
    reason: `${from.name} is assignable to ${to.name}`,
    detail: extra.length ? `${extra.join(", ")} ${extra.length > 1 ? "are" : "is"} extra, and extra is fine` : "same shape",
  };
}

const find = <T extends { id: string }>(list: readonly T[], id: string) => list.find((item) => item.id === id);

export function canConnect(from: SourceId, to: SinkId): Verdict {
  const source = find(sources, from);
  const sink = find(sinks, to);
  if (!source || !sink) return { ok: false, reason: "no such port", detail: `${from} to ${to}` };
  return check(source.type, sink.accepts);
}

export const sameWire = (a: Wire, b: Wire) => a.from === b.from && a.to === b.to;

/** Try to add a wire. Only compatible ones are kept. */
export function connect(wires: readonly Wire[], from: SourceId, to: SinkId): { wires: Wire[]; verdict: Verdict; added: boolean } {
  const verdict = canConnect(from, to);
  const wire = { from, to };
  if (!verdict.ok) return { wires: [...wires], verdict, added: false };
  if (wires.some((existing) => sameWire(existing, wire))) {
    return { wires: [...wires], verdict: { ...verdict, detail: "already wired" }, added: false };
  }
  return { wires: [...wires, wire], verdict, added: true };
}

export const disconnect = (wires: readonly Wire[], wire: Wire) => wires.filter((existing) => !sameWire(existing, wire));

export const missing = (wires: readonly Wire[]) => required.filter((need) => !wires.some((wire) => sameWire(wire, need)));

export function show(payload: Payload): string {
  const parts = Object.entries(payload).map(([key, value]) => `${key}: ${typeof value === "string" ? `"${value}"` : value}`);
  return `{ ${parts.join(", ")} }`;
}

export type Delivery = { wire: Wire; ok: boolean; line: string };

/** Send each source's sample down its wires. A sink that does not compile yet cannot run. */
export function run(wires: readonly Wire[], broken: readonly SinkId[] = []): Delivery[] {
  return wires.map((wire) => {
    const source = find(sources, wire.from);
    if (!source) return { wire, ok: false, line: `${wire.from}: no such source` };
    if (broken.includes(wire.to)) return { wire, ok: false, line: `${wire.to}(...) does not compile yet` };
    return { wire, ok: true, line: `${wire.to}(${show(source.sample)})` };
  });
}
