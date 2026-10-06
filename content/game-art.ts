/**
 * How each game's title card looks. Logos are the games' own Steam library logos, stored locally
 * (see docs/game-assets.md for sources); they belong to their owners and are only used to name
 * the game. Games without a published logo asset get a typographic card instead, never a
 * recreation of their logo. Motifs are small original drawings, not game artwork.
 */

export type Motif =
  | "soul" | "crumple" | "jump" | "shells" | "stars" | "dig" | "crosshair" | "contour" | "radio"
  | "props" | "road" | "snow" | "orbit" | "sand" | "shift";

export type GameArt = {
  hue: number;
  /** Tile tone behind the logo: most library logos are drawn for dark backgrounds. */
  tile: "dark" | "light";
  motif: Motif;
  logo?: { src: string; width: number; height: number };
  /** Typographic card when there is no logo: a small kicker above the title, if any. */
  kicker?: string;
  type?: "condensed" | "rounded" | "pixel" | "spectrum";
};

export const gameArt: Record<string, GameArt> = {
  Undertale: { hue: 350, tile: "dark", motif: "soul", logo: { src: "/games/undertale.webp", width: 440, height: 55 } },
  "BeamNG.drive": { hue: 24, tile: "dark", motif: "crumple", logo: { src: "/games/beamng.webp", width: 440, height: 45 } },
  "Geometry Dash": { hue: 100, tile: "dark", motif: "jump", logo: { src: "/games/geometry-dash.webp", width: 440, height: 169 } },
  "Buckshot Roulette": { hue: 4, tile: "dark", motif: "shells", logo: { src: "/games/buckshot-roulette.webp", width: 388, height: 200 } },
  "Sky: Children of the Light": { hue: 215, tile: "dark", motif: "stars", logo: { src: "/games/sky.webp", width: 174, height: 200 } },
  Hydroneer: { hue: 32, tile: "dark", motif: "dig", logo: { src: "/games/hydroneer.webp", width: 440, height: 125 } },
  "Counter-Strike 2": { hue: 205, tile: "light", motif: "crosshair", logo: { src: "/games/cs2.webp", width: 440, height: 91 } },
  "Call of Duty: Modern Warfare III": { hue: 95, tile: "dark", motif: "contour", kicker: "call of duty", type: "condensed" },
  "Call of Duty: Black Ops Cold War": { hue: 12, tile: "dark", motif: "radio", logo: { src: "/games/cod-cold-war.webp", width: 440, height: 169 } },
  "Garry's Mod": { hue: 208, tile: "dark", motif: "props", logo: { src: "/games/garrys-mod.webp", width: 440, height: 86 } },
  "My Summer Car": { hue: 46, tile: "dark", motif: "road", logo: { src: "/games/my-summer-car.webp", width: 308, height: 200 } },
  "My Winter Car": { hue: 196, tile: "dark", motif: "snow", type: "rounded" },
  "Kerbal Space Program": { hue: 228, tile: "dark", motif: "orbit", logo: { src: "/games/ksp.webp", width: 440, height: 162 } },
  Sandboxels: { hue: 36, tile: "dark", motif: "sand", type: "pixel" },
  "Meccha Chameleon": { hue: 290, tile: "dark", motif: "shift", type: "spectrum" },
};

/** A quiet default for any game added later without art. */
export const defaultArt: GameArt = { hue: 150, tile: "dark", motif: "stars" };
