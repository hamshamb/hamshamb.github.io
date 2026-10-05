/**
 * The hidden-feature state: what a visitor has found, stored only in their own browser.
 * No backend, no account, no analytics. Kept free of imports so the tests can load it directly.
 *
 *   secrets       easter eggs found (commands, hotspots, sequences)
 *   achievements  small milestones; the total is never shown
 *   bolts         build engine bolts hidden around the site, exactly five
 *   toys          entries the toybox may show; locked toys are never listed
 *   flags         one-off unlocks, such as an alternate snake skin
 *   counters      running tallies that feed achievements (scrambles, source links, bugs)
 */

export type SecretState = {
  v: 1;
  secrets: string[];
  achievements: string[];
  bolts: string[];
  toys: string[];
  flags: string[];
  counters: Record<string, number>;
};

export type ListKey = "secrets" | "achievements" | "bolts" | "toys" | "flags";

export const STORAGE_KEY = "hamshamb-secrets";

/** Five bolts, one per place. Ids are unique by construction and checked by the tests. */
export const BOLTS = ["hero", "work", "journey", "stuff", "footer"] as const;
export type BoltId = (typeof BOLTS)[number];

/** Secrets needed before the toybox shows up in the footer. */
export const TOYBOX_AFTER = 3;

export function emptyState(): SecretState {
  return { v: 1, secrets: [], achievements: [], bolts: [], toys: [], flags: [], counters: {} };
}

const ids = (value: unknown) =>
  Array.isArray(value) ? [...new Set(value.filter((item): item is string => typeof item === "string" && item.length > 0 && item.length < 64))] : [];

/** Anything unreadable becomes a clean slate rather than an error. */
export function parseState(raw: string | null | undefined): SecretState {
  if (!raw) return emptyState();
  try {
    const data = JSON.parse(raw) as Partial<SecretState> | null;
    if (!data || typeof data !== "object" || data.v !== 1) return emptyState();
    const counters: Record<string, number> = {};
    if (data.counters && typeof data.counters === "object") {
      for (const [key, value] of Object.entries(data.counters)) {
        if (typeof value === "number" && Number.isFinite(value) && value >= 0) counters[key] = Math.floor(value);
      }
    }
    return {
      v: 1,
      secrets: ids(data.secrets),
      achievements: ids(data.achievements),
      bolts: ids(data.bolts).filter((id) => (BOLTS as readonly string[]).includes(id)),
      toys: ids(data.toys),
      flags: ids(data.flags),
      counters,
    };
  } catch {
    return emptyState();
  }
}

/** Adds an id to one list. Returns the same object when nothing changed, so callers can tell. */
export function addTo(state: SecretState, key: ListKey, id: string): SecretState {
  if (key === "bolts" && !(BOLTS as readonly string[]).includes(id)) return state;
  if (state[key].includes(id)) return state;
  return { ...state, [key]: [...state[key], id] };
}

export function bump(state: SecretState, counter: string, by = 1): SecretState {
  return { ...state, counters: { ...state.counters, [counter]: (state.counters[counter] ?? 0) + by } };
}

export function toyboxOpen(state: SecretState) {
  return state.secrets.length >= TOYBOX_AFTER;
}

export function allBolts(state: SecretState) {
  return BOLTS.every((id) => state.bolts.includes(id));
}

/** "3 / ??": the count is real, the total stays a mystery. */
export function achievementLabel(state: SecretState) {
  return `${state.achievements.length} / ??`;
}
