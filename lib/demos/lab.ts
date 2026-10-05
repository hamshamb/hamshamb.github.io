// the state behind the component lab, as one reducer. the page imports this file, and the
// numbers shown next to the canvas (how many components, how many list items) are derived by
// derive() on every render, never stored.

export type Kind = "button" | "card" | "counter" | "toggle" | "list" | "panel";
export const kinds: readonly Kind[] = ["button", "card", "counter", "toggle", "list", "panel"];

export type Item = {
  id: number;
  kind: Kind;
  /** The panel this lives in, or null for the canvas itself. */
  parent: number | null;
  /** Counters only: read the shared store instead of keeping their own count. */
  shared: boolean;
};

export type Lab = {
  items: Item[];
  nextId: number;
  /** The shared store: every shared counter shows this one number. */
  count: number;
  /** Panel labels. A panel hands its label to the children inside it. */
  labels: Record<number, string>;
  /** What each list holds. Lifted up here so other parts of the page can derive from it. */
  lists: Record<number, string[]>;
};

export type Action =
  | { type: "add"; kind: Kind; parent: number | null }
  | { type: "remove"; id: number }
  | { type: "move"; id: number; by: -1 | 1 }
  | { type: "label"; id: number; text: string }
  | { type: "share"; id: number }
  | { type: "bump"; by: number }
  | { type: "push"; id: number }
  | { type: "pop"; id: number }
  | { type: "clear" };

export const MAX_ITEMS = 12;
const panelNames = ["inbox", "settings", "toolbar", "sidebar"];
const listWords = ["buy milk", "ship it", "reply to that email", "touch grass", "fix the thing", "fix the other thing"];

export function initialLab(): Lab {
  return {
    items: [
      { id: 1, kind: "counter", parent: null, shared: true },
      { id: 2, kind: "counter", parent: null, shared: true },
      { id: 3, kind: "panel", parent: null, shared: false },
      { id: 4, kind: "button", parent: 3, shared: false },
      { id: 5, kind: "toggle", parent: 3, shared: false },
    ],
    nextId: 6,
    count: 0,
    labels: { 3: "toolbar" },
    lists: {},
  };
}

export const childrenOf = (lab: Lab, parent: number | null) => lab.items.filter((item) => item.parent === parent);

export function reduce(lab: Lab, action: Action): Lab {
  switch (action.type) {
    case "add": {
      if (lab.items.length >= MAX_ITEMS) return lab;
      // only panels hold things, and panels do not nest
      const holder = lab.items.find((item) => item.id === action.parent && item.kind === "panel");
      const parent = action.kind === "panel" || !holder ? null : holder.id;
      const id = lab.nextId;
      const panels = lab.items.filter((item) => item.kind === "panel").length;
      return {
        ...lab,
        items: [...lab.items, { id, kind: action.kind, parent, shared: action.kind === "counter" }],
        nextId: id + 1,
        labels: action.kind === "panel" ? { ...lab.labels, [id]: panelNames[panels % panelNames.length] } : lab.labels,
        lists: action.kind === "list" ? { ...lab.lists, [id]: listWords.slice(0, 2) } : lab.lists,
      };
    }
    case "remove": {
      const gone = new Set([action.id, ...lab.items.filter((item) => item.parent === action.id).map((item) => item.id)]);
      return {
        ...lab,
        items: lab.items.filter((item) => !gone.has(item.id)),
        labels: Object.fromEntries(Object.entries(lab.labels).filter(([id]) => !gone.has(Number(id)))),
        lists: Object.fromEntries(Object.entries(lab.lists).filter(([id]) => !gone.has(Number(id)))),
      };
    }
    case "move": {
      const item = lab.items.find((candidate) => candidate.id === action.id);
      if (!item) return lab;
      const siblings = childrenOf(lab, item.parent);
      const at = siblings.findIndex((sibling) => sibling.id === item.id);
      const other = siblings[at + action.by];
      if (!other) return lab;
      const items = lab.items.slice();
      const i = items.findIndex((candidate) => candidate.id === item.id);
      const j = items.findIndex((candidate) => candidate.id === other.id);
      [items[i], items[j]] = [items[j], items[i]];
      return { ...lab, items };
    }
    case "label":
      return { ...lab, labels: { ...lab.labels, [action.id]: action.text.slice(0, 16) } };
    case "share":
      return { ...lab, items: lab.items.map((item) => (item.id === action.id ? { ...item, shared: !item.shared } : item)) };
    case "bump":
      return { ...lab, count: Math.max(0, Math.min(99, lab.count + action.by)) };
    case "push": {
      const list = lab.lists[action.id] ?? [];
      if (list.length >= 6) return lab;
      return { ...lab, lists: { ...lab.lists, [action.id]: [...list, listWords[list.length % listWords.length]] } };
    }
    case "pop":
      return { ...lab, lists: { ...lab.lists, [action.id]: (lab.lists[action.id] ?? []).slice(0, -1) } };
    case "clear":
      return { ...lab, items: [], labels: {}, lists: {} };
  }
}

/** Numbers computed from the state on demand. Nothing here is ever stored. */
export function derive(lab: Lab) {
  const listItems = Object.values(lab.lists).reduce((total, list) => total + list.length, 0);
  return {
    components: lab.items.length,
    sharedCounters: lab.items.filter((item) => item.kind === "counter" && item.shared).length,
    lists: lab.items.filter((item) => item.kind === "list").length,
    listItems,
  };
}

/** The label a child receives from its panel. This is what "passing props" means. */
export function propsFor(lab: Lab, item: Item): { label?: string } {
  return item.parent === null ? {} : { label: lab.labels[item.parent] };
}

/** The absurd useState variables of the "add state" button, in order. */
export const stateNames = [
  "isProbablyFine",
  "hasBeenClicked",
  "maybeLoading",
  "didItWork",
  "isReallyOpen",
  "theOtherFlag",
  "wasHovered",
  "shouldUpdate",
  "isThisRight",
  "countAgain",
] as const;

/** After this many, the reducer button appears. */
export const REDUCER_AFTER = 7;

export const setter = (name: string) => `set${name[0].toUpperCase()}${name.slice(1)}`;
