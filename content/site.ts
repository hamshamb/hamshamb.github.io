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

export const sections = [
  { id: "work", label: "work" },
  { id: "log", label: "log" },
  { id: "about", label: "about" },
  { id: "stuff", label: "stuff" },
  { id: "contact", label: "contact" },
] as const;

export type Phase = "live" | "open" | "lab";

export const phaseLabel: Record<Phase, string> = {
  live: "live",
  open: "open source",
  lab: "not finished",
};

/** What the command palette needs to know about a project. */
export type PaletteProject = { slug: string; name: string; hint: string; keywords: string };
