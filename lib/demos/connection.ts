// a typed connection lifecycle. the demo on this page runs exactly this file.

export type State = "idle" | "connecting" | "connected" | "retrying" | "failed";

export type Event =
  | { type: "connect" }
  | { type: "opened" }
  | { type: "timeout" }
  | { type: "dropped" }
  | { type: "reset" };

export type Context = { attempts: number };

export const MAX_ATTEMPTS = 3;

export const initial: [State, Context] = ["idle", { attempts: 0 }];

export function transition(state: State, event: Event, ctx: Context): [State, Context] {
  switch (state) {
    case "idle":
      return event.type === "connect" ? ["connecting", { attempts: 0 }] : [state, ctx];

    case "connecting":
    case "retrying": {
      if (event.type === "opened") return ["connected", { attempts: 0 }];
      if (event.type !== "timeout") return [state, ctx];
      const attempts = ctx.attempts + 1;
      return attempts > MAX_ATTEMPTS ? ["failed", { attempts }] : ["retrying", { attempts }];
    }

    case "connected":
      return event.type === "dropped" ? ["retrying", { attempts: 0 }] : [state, ctx];

    case "failed":
      return event.type === "reset" ? initial : [state, ctx];
  }
}

/** which events change anything from here, so the UI can disable the rest. */
export function accepts(state: State, ctx: Context): Event["type"][] {
  const all: Event["type"][] = ["connect", "opened", "timeout", "dropped", "reset"];
  return all.filter((type) => {
    const [next, nextCtx] = transition(state, { type } as Event, ctx);
    return next !== state || nextCtx.attempts !== ctx.attempts;
  });
}
