/**
 * Hobby and personal data, kept apart from the project content.
 *
 * Anything unknown stays undefined and the UI hides it. Never fill a field with a guess or a
 * placeholder number: no "0 hours", no made-up PB. Real values get added here when known.
 */

export type SocialId = "github" | "email" | "steam" | "discord" | "x" | "reddit" | "youtube" | "linkedin";

/** A social only renders with a real URL, or with a handle that can be copied (no invented profile links). */
export type Social = { id: SocialId; label: string; href?: string; handle?: string; copyHandle?: boolean };

export type Game = {
  title: string;
  /** Only real, self-reported hours. */
  playtimeHours?: number;
  note?: string;
  favorite?: boolean;
  /** A user-provided screenshot or cover, self-hosted under /public. */
  cover?: string;
};

export type Minecraft = {
  playtimeHours?: number;
  /** As given, e.g. "June 2019". */
  since?: string;
  edition?: string[];
  favoriteStyle?: string[];
  screenshot?: string;
};

/** Times in seconds as given. `average` is just the current average, not a specific WCA format. */
export type Cubing = { pb?: string; average?: string; cubes?: string[] };

export const personal = {
  socials: [
    { id: "github", label: "github", href: "https://github.com/hamshamb", handle: "hamshamb" },
    { id: "email", label: "email", href: "mailto:hamshambdev@gmail.com", handle: "hamshambdev@gmail.com" },
    { id: "steam", label: "Steam", href: "https://steamcommunity.com/profiles/76561199245583759/" },
    { id: "x", label: "X", href: "https://x.com/hamshamb_", handle: "@hamshamb_" },
    { id: "youtube", label: "YouTube", href: "https://www.youtube.com/@hamshamb", handle: "@hamshamb" },
    // no public profile URL: the handle is shown and copyable, never linked
    { id: "discord", label: "Discord", handle: "@hamshamb", copyHandle: true },
  ] satisfies Social[] as Social[],
  minecraft: {
    playtimeHours: 15974,
    since: "June 2019",
    edition: ["Java Edition"],
    favoriteStyle: ["vanilla"],
    screenshot: "/stuff/minecraft.webp",
  } as Minecraft,
  cubing: { pb: "23.89", average: "26.23", cubes: ["GAN 15", "MoYu WeiLong V10"] } as Cubing,
  games: [
    { title: "Undertale", playtimeHours: 125 },
    { title: "BeamNG.drive", playtimeHours: 850 },
    { title: "Geometry Dash", playtimeHours: 1100 },
    { title: "Buckshot Roulette", playtimeHours: 65 },
    { title: "Sky: Children of the Light", playtimeHours: 375 },
    { title: "Hydroneer", playtimeHours: 260 },
    { title: "Counter-Strike 2", playtimeHours: 1250 },
    { title: "Call of Duty: Modern Warfare III", playtimeHours: 210 },
    { title: "Call of Duty: Black Ops Cold War", playtimeHours: 320 },
    { title: "Garry's Mod", playtimeHours: 900 },
    { title: "My Summer Car", playtimeHours: 600 },
    { title: "My Winter Car", playtimeHours: 120 },
    { title: "Kerbal Space Program", playtimeHours: 575 },
    { title: "Sandboxels", playtimeHours: 300 },
    { title: "Meccha Chameleon", playtimeHours: 30 },
  ] as Game[],
};

/** Socials with somewhere to go or something real to copy. Empty fields never render. */
export const liveSocials = () => personal.socials.filter((social) => Boolean(social.href || (social.copyHandle && social.handle)));

/** "1,842h". Undefined when there is no real number, so callers render nothing. */
export function formatHours(hours?: number) {
  if (typeof hours !== "number" || !Number.isFinite(hours) || hours <= 0) return undefined;
  return `${Math.round(hours).toLocaleString("en-US")}h`;
}
