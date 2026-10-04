/**
 * Hobby and personal data, kept apart from the project content.
 *
 * Anything unknown stays undefined and the UI hides it. Never fill a field with a guess or a
 * placeholder number: no "0 hours", no made-up PB. Real values get added here when known.
 */

export type SocialId = "github" | "email" | "steam" | "discord" | "x" | "reddit" | "youtube" | "linkedin";

export type Social = { id: SocialId; label: string; href?: string; handle?: string };

export type Game = {
  title: string;
  /** Only real, self-reported hours. */
  playtimeHours?: number;
  note?: string;
  favorite?: boolean;
  /** A user-provided screenshot or cover, self-hosted under /public. */
  cover?: string;
  /** The title as given, not yet confirmed. Never shown in the UI. */
  unconfirmedTitle?: true;
};

export type Minecraft = {
  playtimeHours?: number;
  since?: number;
  edition?: string[];
  favoriteStyle?: string[];
  screenshot?: string;
};

export type Cubing = { pb?: string; average?: string; cube?: string };

export const personal = {
  socials: [
    { id: "github", label: "github", href: "https://github.com/hamshamb", handle: "hamshamb" },
    { id: "email", label: "email", href: "mailto:hamshambdev@gmail.com", handle: "hamshambdev@gmail.com" },
    { id: "steam", label: "steam" },
    { id: "discord", label: "discord" },
    { id: "x", label: "x" },
    { id: "reddit", label: "reddit" },
    { id: "youtube", label: "youtube" },
    { id: "linkedin", label: "linkedin" },
  ] satisfies Social[] as Social[],
  minecraft: {} as Minecraft,
  cubing: {} as Cubing,
  games: [
    { title: "Undertale" },
    { title: "BeamNG.drive" },
    { title: "Geometry Dash" },
    { title: "Buckshot Roulette" },
    { title: "Sky: Children of the Light" },
    { title: "Hydroneer" },
    { title: "Counter-Strike 2" },
    { title: "Call of Duty: Modern Warfare III" },
    { title: "Call of Duty: Black Ops Cold War" },
    { title: "Garry's Mod" },
    { title: "My Summer Car" },
    { title: "My Winter Car" },
    { title: "Kerbal Space Program" },
    { title: "Sandboxels" },
    // Given as "Mecha/Mecha Chameleon": kept exactly as written until the title is confirmed.
    { title: "Mecha/Mecha Chameleon", unconfirmedTitle: true },
  ] as Game[],
};

/** Socials that actually have somewhere to go. Empty fields never render. */
export const liveSocials = () => personal.socials.filter((social) => Boolean(social.href));

/** "1,842h". Undefined when there is no real number, so callers render nothing. */
export function formatHours(hours?: number) {
  if (typeof hours !== "number" || !Number.isFinite(hours) || hours <= 0) return undefined;
  return `${Math.round(hours).toLocaleString("en-US")}h`;
}
