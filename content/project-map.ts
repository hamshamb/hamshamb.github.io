/**
 * The hidden project map: how the projects relate by theme, not by architecture. No project
 * shares code with another here; the lines are about the questions they keep asking.
 * Kept small and client-safe; the tests check every slug and link against content/portfolio.ts.
 */

export type MapNode = { id: string; name: string; href: string; x: number; y: number };

export const mapNodes: MapNode[] = [
  { id: "rivet", name: "Rivet", href: "/work/rivet", x: 300, y: 150 },
  { id: "nexus", name: "Nexus", href: "/work/nexus", x: 150, y: 90 },
  { id: "mx", name: "MX", href: "/#lab", x: 460, y: 80 },
  { id: "tinypaste", name: "TinyPaste", href: "https://github.com/hamshamb/TinyPaste", x: 540, y: 230 },
  { id: "inkline", name: "Inkline", href: "https://github.com/hamshamb/inkline", x: 400, y: 260 },
  { id: "studyfilter", name: "StudyFilter", href: "/work/studyfilter", x: 110, y: 270 },
  { id: "areuhuman", name: "AreUHuman", href: "/work/areuhuman", x: 60, y: 180 },
  { id: "chc-review-studio", name: "CHC Review Studio", href: "/work/chc-review-studio", x: 400, y: 360 },
  { id: "pyforge", name: "PyForge", href: "/work/pyforge", x: 560, y: 360 },
];

export const mapLinks: { a: string; b: string; theme: string }[] = [
  { a: "rivet", b: "nexus", theme: "networking" },
  { a: "rivet", b: "mx", theme: "messaging / protocols" },
  { a: "tinypaste", b: "inkline", theme: "privacy / local-first" },
  { a: "studyfilter", b: "areuhuman", theme: "interaction / product" },
  { a: "chc-review-studio", b: "inkline", theme: "local files, local tools" },
  { a: "pyforge", b: "chc-review-studio", theme: "windows desktop tools" },
];
