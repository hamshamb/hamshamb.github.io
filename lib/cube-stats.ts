// session statistics for the solve timer. pure functions over a list of solves, oldest first.
// no imports, so it runs under node type stripping.
//
// rounding, in one place:
//   a single time is shown truncated to hundredths, like a timer display (23.899s shows as 23.89).
//   an average or mean is rounded to the nearest hundredth, then shown the same way.
//   averages come back as whole milliseconds that are already a multiple of 10, so formatting
//   them never changes them.
// a +2 solve counts as its time plus 2000ms. a DNF has no time and never counts as a best or a mean entry.

export type Penalty = "ok" | "+2" | "DNF";

export type Solve = {
  id: string;
  /** raw time on the clock, in whole milliseconds, before any penalty. */
  ms: number;
  scramble: string;
  /** ISO timestamp of when the solve finished. */
  at: string;
  penalty: Penalty;
};

/** a time in ms, "DNF", or null when there is not enough to say. */
export type Stat = number | "DNF" | null;

export const MAX_SOLVES = 500;

/** the time a solve counts for, or null for a DNF. */
export function effectiveMs(solve: Solve): number | null {
  if (solve.penalty === "DNF") return null;
  return solve.ms + (solve.penalty === "+2" ? 2000 : 0);
}

function roundToHundredth(ms: number): number {
  return Math.round(ms / 10) * 10;
}

/** mean of the last `n` solves: any DNF makes it a DNF. null with fewer than `n` solves. */
export function meanOfLast(solves: Solve[], n: number): Stat {
  if (solves.length < n) return null;
  let sum = 0;
  for (const solve of solves.slice(-n)) {
    const ms = effectiveMs(solve);
    if (ms === null) return "DNF";
    sum += ms;
  }
  return roundToHundredth(sum / n);
}

/**
 * average of the last `n` solves with the best and worst dropped (n >= 5), the way the WCA does it.
 * one DNF counts as the worst and is dropped; two or more make the average a DNF.
 */
export function averageOfLast(solves: Solve[], n: number): Stat {
  if (n < 3 || solves.length < n) return null;
  const times = solves.slice(-n).map((solve) => effectiveMs(solve));
  const dnfs = times.filter((t) => t === null).length;
  if (dnfs >= 2) return "DNF";
  const sorted = times.map((t) => (t === null ? Infinity : t)).sort((a, b) => a - b);
  const middle = sorted.slice(1, -1);
  return roundToHundredth(middle.reduce((a, b) => a + b, 0) / middle.length);
}

export const ao3 = (solves: Solve[]): Stat => meanOfLast(solves, 3);
export const ao5 = (solves: Solve[]): Stat => averageOfLast(solves, 5);

/** mean of every solve that is not a DNF. null when there are none. */
export function sessionMean(solves: Solve[]): number | null {
  const times = solves.map(effectiveMs).filter((t): t is number => t !== null);
  if (times.length === 0) return null;
  return roundToHundredth(times.reduce((a, b) => a + b, 0) / times.length);
}

export function bestSingle(solves: Solve[]): number | null {
  let best: number | null = null;
  for (const solve of solves) {
    const ms = effectiveMs(solve);
    if (ms !== null && (best === null || ms < best)) best = ms;
  }
  return best;
}

export function currentSingle(solves: Solve[]): Stat {
  const last = solves[solves.length - 1];
  if (!last) return null;
  return effectiveMs(last) ?? "DNF";
}

export type SessionStats = {
  count: number;
  current: Stat;
  best: number | null;
  ao3: Stat;
  ao5: Stat;
  mean: number | null;
};

export function computeStats(solves: Solve[]): SessionStats {
  return {
    count: solves.length,
    current: currentSingle(solves),
    best: bestSingle(solves),
    ao3: ao3(solves),
    ao5: ao5(solves),
    mean: sessionMean(solves),
  };
}

// ---- formatting ----

/** "23.89", "1:02.34" or "1:02:03.45". truncates to hundredths. */
export function formatMs(ms: number): string {
  const total = Math.floor(Math.max(0, ms) / 10);
  const hundredths = total % 100;
  const seconds = Math.floor(total / 100) % 60;
  const minutes = Math.floor(total / 6000) % 60;
  const hours = Math.floor(total / 360000);
  const pad = (value: number) => String(value).padStart(2, "0");
  const tail = `${pad(seconds)}.${pad(hundredths)}`;
  if (hours > 0) return `${hours}:${pad(minutes)}:${tail}`;
  if (minutes > 0) return `${minutes}:${tail}`;
  return `${seconds}.${pad(hundredths)}`;
}

export function formatStat(stat: Stat): string {
  if (stat === null) return "-";
  if (stat === "DNF") return "DNF";
  return formatMs(stat);
}

/** one solve as the history shows it: "25.89+" for a +2, "DNF" for a DNF. */
export function formatSolve(solve: Solve): string {
  if (solve.penalty === "DNF") return "DNF";
  const ms = effectiveMs(solve) as number;
  return formatMs(ms) + (solve.penalty === "+2" ? "+" : "");
}

// ---- persistence helpers (the storage itself lives next to the ui) ----

function isSolve(value: unknown): value is Solve {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === "string" &&
    v.id.length > 0 &&
    typeof v.ms === "number" &&
    Number.isFinite(v.ms) &&
    v.ms >= 0 &&
    typeof v.scramble === "string" &&
    typeof v.at === "string" &&
    Number.isFinite(Date.parse(v.at)) &&
    (v.penalty === "ok" || v.penalty === "+2" || v.penalty === "DNF")
  );
}

/** reads whatever was stored. anything broken is dropped instead of thrown, and the newest MAX_SOLVES are kept. */
export function parseSession(raw: string | null): Solve[] {
  if (!raw) return [];
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(data)) return [];
  const seen = new Set<string>();
  const out: Solve[] = [];
  for (const item of data) {
    if (!isSolve(item) || seen.has(item.id)) continue;
    seen.add(item.id);
    out.push({ id: item.id, ms: Math.round(item.ms), scramble: item.scramble, at: item.at, penalty: item.penalty });
  }
  return out.slice(-MAX_SOLVES);
}
