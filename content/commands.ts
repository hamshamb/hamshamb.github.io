/**
 * Hidden command palette commands. None of these appear in suggestions until the visitor has run
 * them once; they only match when typed in full. Kept free of imports so the tests can load it.
 */

export type CommandAction =
  | { kind: "none" }
  | { kind: "toy"; toy: "physics" | "touch-grass" | "map" | "reaction" | "fidget" }
  | { kind: "gravity"; on: boolean }
  | { kind: "navigate"; to: "snake" | "random" }
  | { kind: "panic" }
  | { kind: "email" };

export type Command = {
  id: string;
  /** What has to be typed, lowercase. Extra spaces are ignored. */
  names: string[];
  /** The secret recorded the first time it runs. */
  secret: string;
  hint: string;
  run: (pick: () => number) => { lines: string[]; action: CommandAction };
};

export const fortunes = [
  "you will rename this variable three more times.",
  "the bug is in the file you are sure it is not in.",
  "a side project will become a main project. the main project will become a side project.",
  "it works on your machine. this is less comforting than it sounds.",
  "you will open fourteen tabs to answer one question.",
  "the second rewrite will be faster. the third will be the one you keep.",
  "someone will read the README. not today.",
  "a protocol will need a version number sooner than you think.",
] as const;

export const commands: Command[] = [
  { id: "whoami", names: ["whoami"], secret: "cmd-whoami", hint: "who is this", run: () => ({ lines: ["hamshamb", "student developer", "probably building something"], action: { kind: "none" } }) },
  {
    id: "status",
    names: ["status"],
    secret: "cmd-status",
    hint: "how things are",
    run: () => ({ lines: ["build       stable", "curiosity   elevated", "tabs        excessive", "sleep       unknown"], action: { kind: "none" } }),
  },
  { id: "snake", names: ["snake"], secret: "cmd-snake", hint: "the python page's game", run: () => ({ lines: ["loading the snake."], action: { kind: "navigate", to: "snake" } }) },
  { id: "physics", names: ["physics"], secret: "cmd-physics", hint: "a small sandbox", run: () => ({ lines: ["opening the sandbox."], action: { kind: "toy", toy: "physics" } }) },
  { id: "gravity-off", names: ["gravity off"], secret: "cmd-gravity", hint: "for about twenty seconds", run: () => ({ lines: ["gravity disabled. temporarily. esc puts it back."], action: { kind: "gravity", on: false } }) },
  { id: "gravity-on", names: ["gravity on"], secret: "cmd-gravity", hint: "back to normal", run: () => ({ lines: ["gravity restored."], action: { kind: "gravity", on: true } }) },
  { id: "touch-grass", names: ["touch grass"], secret: "cmd-touch-grass", hint: "a chart, and a request", run: () => ({ lines: ["fetching outdoor statistics."], action: { kind: "toy", toy: "touch-grass" } }) },
  { id: "rabbit-hole", names: ["rabbit hole", "send me somewhere"], secret: "cmd-rabbit", hint: "a random page", run: () => ({ lines: ["picking somewhere."], action: { kind: "navigate", to: "random" } }) },
  { id: "map", names: ["map"], secret: "cmd-map", hint: "how the projects relate", run: () => ({ lines: ["drawing the map."], action: { kind: "toy", toy: "map" } }) },
  { id: "reaction", names: ["reaction"], secret: "cmd-reaction", hint: "a reaction test", run: () => ({ lines: ["get ready."], action: { kind: "toy", toy: "reaction" } }) },
  { id: "panic", names: ["panic"], secret: "cmd-panic", hint: "put everything back", run: () => ({ lines: ["everything is fine.", "everything has been put back."], action: { kind: "panic" } }) },
  { id: "ship-it", names: ["ship it"], secret: "cmd-ship", hint: "deploy", run: () => ({ lines: ["tests?"], action: { kind: "none" } }) },
  {
    id: "hire",
    names: ["sudo hire hamshamb", "hire hamshamb"],
    secret: "cmd-hire",
    hint: "elevated request",
    run: () => ({ lines: ["permission granted.", "email button unlocked."], action: { kind: "email" } }),
  },
  { id: "fortune", names: ["fortune"], secret: "cmd-fortune", hint: "one line of advice", run: (pick) => ({ lines: [fortunes[Math.floor(pick() * fortunes.length) % fortunes.length]], action: { kind: "none" } }) },
  { id: "break", names: ["break something"], secret: "cmd-break", hint: "a request", run: () => ({ lines: ["please be more specific."], action: { kind: "none" } }) },
];

export function normalise(input: string) {
  return input.trim().toLowerCase().replace(/^[~$>\s]+/, "").replace(/\s+/g, " ");
}

/** The command typed, if the whole input is one. Partial input never matches an undiscovered command. */
export function matchCommand(input: string) {
  const typed = normalise(input);
  if (!typed) return undefined;
  return commands.find((command) => command.names.includes(typed));
}

/** Discovered commands whose name starts with what was typed, for suggestions. */
export function suggestCommands(input: string, discovered: readonly string[]) {
  const typed = normalise(input);
  return commands.filter((command) => discovered.includes(command.secret) && (!typed || command.names.some((name) => name.startsWith(typed))));
}
