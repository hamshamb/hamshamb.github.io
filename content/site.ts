/**
 * Small, client-safe site facts. Client components import from here so the full
 * project content in content/portfolio.ts stays on the server.
 */
export const siteUrl = "https://hamshamb.github.io";

export const owner = {
  name: "hamshamb",
  email: "hamshambdev@gmail.com",
  github: "https://github.com/hamshamb",
  location: "India",
  timeZone: "Asia/Kolkata",
  timeZoneLabel: "IST",
} as const;

/** Public sections, in page order. Writing is intentionally absent while it is hidden. */
export const sections = [
  { id: "work", label: "work" },
  { id: "lab", label: "lab" },
  { id: "journey", label: "journey" },
  { id: "about", label: "about" },
  { id: "stuff", label: "stuff" },
  { id: "contact", label: "contact" },
] as const;

export type Phase = "live" | "open" | "lab" | "wip";

export const phaseLabel: Record<Phase, string> = {
  live: "live",
  open: "open source",
  lab: "lab",
  wip: "in progress",
};

/** What the command palette needs to know about a project. */
export type PaletteProject = { slug: string; name: string; hint: string; keywords: string };
