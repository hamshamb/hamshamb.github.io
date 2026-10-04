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

/** Home-page sections, in page order. Writing is not a section: it is the /blog route below. */
export const sections = [
  { id: "work", label: "work" },
  { id: "lab", label: "lab" },
  { id: "journey", label: "journey" },
  { id: "about", label: "about" },
  { id: "stuff", label: "stuff" },
  { id: "contact", label: "contact" },
] as const;

/** Top-level pages that sit beside the sections in the navigation. */
export const pages = [{ href: "/blog", label: "blog" }] as const;

export type Phase = "live" | "open" | "lab" | "wip";

export const phaseLabel: Record<Phase, string> = {
  live: "live",
  open: "open source",
  lab: "lab",
  wip: "in progress",
};

/** What the command palette needs to know about a project. */
export type PaletteProject = { slug: string; name: string; hint: string; keywords: string };

/** Any other page the command palette can open: posts, skill playgrounds, the cube lab. */
export type PaletteLink = { href: string; group: string; label: string; hint?: string; keywords?: string };
