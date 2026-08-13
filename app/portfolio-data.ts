export type Project = {
  slug: string;
  name: string;
  eyebrow: string;
  description: string;
  problem: string;
  built: string;
  result: string;
  stack: string[];
  source: string;
  featured?: boolean;
};

export const portfolio = {
  owner: {
    name: "hamshamb",
    handle: "@hamshamb",
    role: "Software developer & toolmaker",
    statement:
      "I turn fiddly technical workflows into software that feels direct, calm, and human.",
    location: "India · IST (UTC+5:30)",
    status: "OPEN TO COLLABORATION",
    email: "deadender9677@gmail.com",
    github: "https://github.com/hamshamb",
    bio: [
      "I’m a product-minded developer who likes the seam between systems code and thoughtful interfaces.",
      "My work favors clear defaults, portable tools, and explanations that help people feel in control of the machine.",
    ],
  },
  projects: [
    {
      slug: "pyforge",
      name: "PyForge",
      eyebrow: "WINDOWS · OPEN SOURCE · 2026",
      description: "A friendly Windows app that turns Python scripts into portable executables.",
      problem:
        "PyInstaller is powerful, but its flags, dependency checks, and packaging decisions are intimidating for many developers.",
      built:
        "A drag-and-drop desktop workflow with auto-detection, plain-English controls, environment repair, advanced packaging, and a transparent live build log.",
      result:
        "A portable application that reduces a multi-step command-line process to: drop a file, review the defaults, press Forge.",
      stack: ["Python", "Tkinter", "PyInstaller", "Windows", "UPX"],
      source: "https://github.com/hamshamb/PyForge",
      featured: true,
    },
    {
      slug: "areuhuman",
      name: "AreUHuman",
      eyebrow: "EXPERIMENT · IN DEVELOPMENT",
      description: "A new experiment currently taking shape behind the curtain.",
      problem: "Exploring playful ways to ask a familiar question: what makes an interaction feel human?",
      built: "Private prototyping and product exploration are underway.",
      result: "Repository is intentionally private while the first version is being developed.",
      stack: ["Prototype", "Interaction design", "R&D"],
      source: "https://github.com/hamshamb",
    },
  ] satisfies Project[],
  skills: [
    { group: "CORE", items: ["Python", "JavaScript / TypeScript", "Git", "systems thinking"] },
    { group: "PRODUCT", items: ["desktop tooling", "interaction design", "workflow automation", "accessible UX"] },
    { group: "SHIP", items: ["Windows apps", "open source", "packaging", "documentation"] },
  ],
  timeline: [
    { date: "NOW", title: "Independent developer", detail: "Building focused utilities and unusual, useful software." },
    { date: "2026", title: "Released PyForge", detail: "Designed and shipped an approachable Python-to-EXE desktop workflow." },
  ],
};

export const commandNames = [
  "help", "whoami", "about", "projects", "open pyforge", "experience",
  "skills", "contact", "status", "theme green", "theme amber", "fx on", "fx off", "clear",
];
