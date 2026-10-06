// the ui mutation lab's model. the controls become css custom properties (numbers) and
// data attributes (named options); app/demo-card.css turns both into the card you see.

export const THEMES = ["light", "dark", "paper"] as const;
export const DENSITIES = ["compact", "normal", "roomy"] as const;
export const ALIGNS = ["start", "center", "end"] as const;
export const SHADOWS = ["none", "soft", "lifted", "hard"] as const;

export type Theme = (typeof THEMES)[number];
export type Density = (typeof DENSITIES)[number];
export type Align = (typeof ALIGNS)[number];
export type Shadow = (typeof SHADOWS)[number];

export type Controls = {
  width: number;
  spacing: number;
  radius: number;
  border: number;
  typeScale: number;
  density: Density;
  theme: Theme;
  align: Align;
  shadow: Shadow;
};

export const defaults: Controls = { width: 420, spacing: 1, radius: 14, border: 1, typeScale: 1, density: "normal", theme: "light", align: "start", shadow: "none" };

/** slider ranges, shared by the component and the tests. */
export const RANGES = {
  width: { min: 240, max: 720, step: 10 },
  spacing: { min: 0.5, max: 2, step: 0.1 },
  radius: { min: 0, max: 36, step: 1 },
  border: { min: 0, max: 6, step: 1 },
  typeScale: { min: 0.85, max: 1.4, step: 0.05 },
} as const;

export type Vars = Record<string, string>;

/** numbers become custom properties. nothing else is written to the style attribute. */
export function toVars(controls: Controls): Vars {
  return {
    "--frame-w": `${controls.width}px`,
    "--spacing": String(controls.spacing),
    "--card-radius": `${controls.radius}px`,
    "--card-border-w": `${controls.border}px`,
    "--type-scale": String(controls.typeScale),
  };
}

export type Mutation = { id: string; vars: Vars; captions: readonly string[] };

/** deliberately questionable, perfectly valid css. each one touches a different property. */
export const MUTATIONS: readonly Mutation[] = [
  {
    id: "radius",
    vars: { "--card-radius": "120px" },
    captions: ["border-radius: 120px. it started as a card.", "border-radius: 120px. technically a pill with ambitions."],
  },
  {
    id: "shadow",
    vars: { "--card-shadow": "14px 14px 0 4px var(--card-accent), -22px -12px 70px 14px color-mix(in srgb, var(--card-accent) 55%, transparent)" },
    captions: ["box-shadow: two of them. one is a stunt double.", "box-shadow: because one shadow felt under-committed."],
  },
  {
    id: "spacing",
    vars: { "--spacing": "3.4" },
    captions: ["padding: 4rem and change. the content is in there somewhere.", "spacing x3.4. whitespace is a feature, and this is a lot of feature."],
  },
  {
    id: "tilt",
    vars: { "--card-tilt": "-3.5deg" },
    captions: ["rotate(-3.5deg). too little to be a decision, enough to be noticed.", "transform: rotate(-3.5deg). the table was uneven, apparently."],
  },
  {
    id: "border",
    vars: { "--card-border-w": "20px", "--card-border-style": "double" },
    captions: ["border: 20px double. a picture frame for a changelog.", "border: 20px double. very gallery. very much."],
  },
  {
    id: "type",
    vars: { "--type-scale": "1.9" },
    captions: ["font-size x1.9. it is not shouting, it is just loud.", "type scale 1.9. the text would like to be seen from across the room."],
  },
];

export type Worse = { ids: string[]; vars: Vars; captions: string[] };

/**
 * pick two different mutations, never the exact pair that is already applied.
 * `random` is injectable so a test can drive it.
 */
export function makeItWorse(previous: Worse | null, random: () => number = Math.random): Worse {
  const pool = [...MUTATIONS];
  const picked: Mutation[] = [];
  while (picked.length < 2) picked.push(pool.splice(Math.floor(random() * pool.length), 1)[0]);
  if (previous && picked.every((mutation) => previous.ids.includes(mutation.id))) picked[1] = pool[Math.floor(random() * pool.length)];
  const vars: Vars = {};
  for (const mutation of picked) Object.assign(vars, mutation.vars);
  const captions = picked.map((mutation) => mutation.captions[Math.floor(random() * mutation.captions.length)]);
  return { ids: picked.map((mutation) => mutation.id), vars, captions };
}
