/**
 * Names for the things a curious visitor can find. Nothing here is linked from the navigation;
 * these labels only appear after the thing itself has been discovered.
 */

export const achievements = {
  "rabbit-hole": { title: "rabbit hole", note: "visited every homepage section." },
  "source-reader": { title: "source reader", note: "opened three source links." },
  "network-engineer": { title: "network engineer, apparently", note: "delivered a sealed Rivet envelope." },
  "cube-person": { title: "cube person", note: "generated ten scrambles." },
  "bug-hunter": { title: "bug hunter", note: "caught a bug on the page." },
  "still-here": { title: "still here?", note: "spent a while actually exploring." },
  completionist: { title: "completionist", note: "opened every flagship project." },
  "bolt-collector": { title: "loose bolts", note: "found all five bolts." },
  compiled: { title: "compiled", note: "convinced the type checker." },
  "fine-you-win": { title: "fine. you win.", note: "clicked the button you were told not to." },
} as const;

export type AchievementId = keyof typeof achievements;

/** Toast text for a newly found secret. Short, because the thing itself is the reward. */
export const secrets: Record<string, string> = {
  "cmd-whoami": "found a command.",
  "cmd-status": "found a command.",
  "cmd-fortune": "found a command.",
  "cmd-hire": "found a command.",
  "cmd-ship": "found a command.",
  "cmd-break": "found a command.",
  "cmd-panic": "found a command.",
  "cmd-rabbit": "found a command.",
  "cmd-touch-grass": "found a command.",
  "cmd-physics": "found a command.",
  "cmd-gravity": "found a command.",
  "cmd-map": "found a command.",
  "cmd-snake": "found a command.",
  "cmd-reaction": "found a command.",
  konami: "up up down down. you know the rest.",
  "dev-panel": "diagnostics, apparently.",
  "do-not-click": "you were asked nicely.",
  "minecraft-inventory": "an inventory. obviously.",
  "minecraft-craft": "that is roughly how it happened.",
  "snake-bugfix": "bug fixed. snake noticed.",
  "react-reducer": "you probably wanted a reducer.",
  "css-worse": "that was worse. as requested.",
  "cube-sequence": "a familiar sequence.",
  "packet-courier": "delivered against the odds.",
  "scroll-speed": "okay okay.",
  "bug-caught": "caught one.",
  "tech-logo": "logos do things now.",
  "packet-lost": "packet delivered. the page is still missing.",
};

/** What the toybox can show, once each has been discovered. Locked toys are never listed. */
export const toys = {
  reaction: { title: "reaction test", note: "random delay. one signal. not science." },
  fidget: { title: "fidget panel", note: "switches and dials. no purpose." },
  physics: { title: "physics", note: "balls, blocks, a spring, a magnet." },
  gravity: { title: "gravity off", note: "decorations float for a bit." },
  courier: { title: "packet courier", note: "deliver a message before it expires.", href: "/blog/why-i-made-rivet#courier" },
  "touch-grass": { title: "touch grass", note: "a chart of game hours. request denied." },
  map: { title: "project map", note: "how the projects relate, thematically." },
  snake: { title: "signal snake", note: "the python page's arcade game.", href: "/skills/python" },
  rabbit: { title: "send me somewhere", note: "a random page on this site." },
} as const;

export type ToyId = keyof typeof toys;
