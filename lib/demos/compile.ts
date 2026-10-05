// make it compile: three tiny type errors, taken in order. each has a few candidate fixes and
// exactly one is right. a right fix repairs one handler of the machine in factory.ts.
// the puzzle on the page is driven by pick() and next() below, nothing else.

export type Part = "onConnect" | "onMessage" | "retry";

/** Replace `remove` lines starting at `at` with `insert`. */
export type Edit = { at: number; remove: number; insert: readonly string[] };
export type Fix = { code: string; ok: boolean; why: string; edit: Edit };

export type Puzzle = {
  part: Part;
  title: string;
  code: readonly string[];
  /** The line the checker points at. */
  line: number;
  error: string;
  fixes: readonly Fix[];
};

export const puzzles: readonly Puzzle[] = [
  {
    part: "onConnect",
    title: "a typo in a property",
    code: ["function onConnect(e: ConnectEvent) {", "  openSocket(e.ulr);", "}"],
    line: 1,
    error: "ts2339: Property 'ulr' does not exist on type 'ConnectEvent'.",
    fixes: [
      { code: "openSocket((e as any).ulr);", ok: false, why: "it compiles because you told the checker to look away.", edit: { at: 1, remove: 1, insert: ["  openSocket((e as any).ulr);"] } },
      { code: "openSocket(e.url);", ok: true, why: "url is the property ConnectEvent really has.", edit: { at: 1, remove: 1, insert: ["  openSocket(e.url);"] } },
      { code: 'openSocket(e["ulr"]);', ok: false, why: "a missing key is still missing in square brackets.", edit: { at: 1, remove: 1, insert: ['  openSocket(e["ulr"]);'] } },
    ],
  },
  {
    part: "onMessage",
    title: "a string where a number goes",
    code: ["function onMessage(m: MessagePayload) {", "  const size: number = m.text;", "  show(size);", "}"],
    line: 1,
    error: "ts2322: Type 'string' is not assignable to type 'number'.",
    fixes: [
      { code: "const size: number = m.text.length;", ok: true, why: "the length of a string is a number.", edit: { at: 1, remove: 1, insert: ["  const size: number = m.text.length;"] } },
      { code: "const size = m.text as number;", ok: false, why: "ts2352: a string cannot be told it is a number.", edit: { at: 1, remove: 1, insert: ["  const size = m.text as number;"] } },
      { code: "const size: string = m.text;", ok: false, why: "show() wants a number, so the error just moved down a line.", edit: { at: 1, remove: 1, insert: ["  const size: string = m.text;"] } },
    ],
  },
  {
    part: "retry",
    title: "a case nobody handled",
    code: ['type Phase = "waiting" | "retrying" | "failed";', "const delay: Record<Phase, number> = {", "  waiting: 500,", "  failed: 0,", "};"],
    line: 1,
    error: "ts2741: Property 'retrying' is missing in type '{ waiting: number; failed: number; }'.",
    fixes: [
      { code: "// @ts-expect-error", ok: false, why: "that silences it. the machine still has no retry delay.", edit: { at: 1, remove: 0, insert: ["// @ts-expect-error"] } },
      { code: "Record<string, number>", ok: false, why: "that compiles, and so would any typo. Phase stopped meaning anything.", edit: { at: 1, remove: 1, insert: ["const delay: Record<string, number> = {"] } },
      { code: "retrying: 2000,", ok: true, why: "every Phase now has a delay, so the record is complete.", edit: { at: 3, remove: 0, insert: ["  retrying: 2000,"] } },
    ],
  },
];

export type Progress = {
  /** Which puzzle we are on. Equal to puzzles.length once everything compiles. */
  step: number;
  fixed: readonly Part[];
  /** Wrong picks on this step, so they can be greyed out. */
  tried: readonly number[];
  verdict: "open" | "wrong" | "fixed";
  chosen: number | null;
  /** Why the last pick was right or wrong. */
  message: string;
};

export const start = (): Progress => ({ step: 0, fixed: [], tried: [], verdict: "open", chosen: null, message: "" });

export const compiled = (progress: Progress) => progress.step >= puzzles.length;

export function applyEdit(code: readonly string[], edit: Edit): string[] {
  return [...code.slice(0, edit.at), ...edit.insert, ...code.slice(edit.at + edit.remove)];
}

/** The code as it should be shown now: broken, or with the chosen fix applied. */
export function view(progress: Progress): string[] {
  const puzzle = puzzles[progress.step];
  if (!puzzle) return [];
  const chosen = progress.chosen === null ? undefined : puzzle.fixes[progress.chosen];
  return progress.verdict === "fixed" && chosen ? applyEdit(puzzle.code, chosen.edit) : [...puzzle.code];
}

export function pick(progress: Progress, index: number): Progress {
  const puzzle = puzzles[progress.step];
  const fix = puzzle?.fixes[index];
  if (!puzzle || !fix || progress.verdict === "fixed" || progress.tried.includes(index)) return progress;
  if (fix.ok) return { ...progress, fixed: [...progress.fixed, puzzle.part], verdict: "fixed", chosen: index, message: fix.why };
  return { ...progress, tried: [...progress.tried, index], verdict: "wrong", message: fix.why };
}

/** Move on after a right fix. Does nothing until the current error is fixed. */
export function next(progress: Progress): Progress {
  if (progress.verdict !== "fixed") return progress;
  return { ...progress, step: progress.step + 1, tried: [], verdict: "open", chosen: null, message: "" };
}
