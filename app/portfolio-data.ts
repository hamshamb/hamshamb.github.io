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
  live?: string;
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
      slug: "studyfilter",
      name: "StudyFilter",
      eyebrow: "EDTECH · FULL STACK · LIVE",
      description: "A focused CBSE learning workspace for Classes 8–12.",
      problem:
        "Students move between disconnected tools for explanations, NCERT material, revision, practice, exams, and progress tracking.",
      built:
        "A unified React learning workspace with syllabus-aware study assistance, subject hubs, practice and mock exams, an NCERT library, authentication, progress loops, and responsive mobile navigation.",
      result:
        "A production learning platform that brings asking, understanding, revision, practice, official resources, and progress into one coherent workflow.",
      stack: ["TypeScript", "React", "Node.js", "PostgreSQL", "Drizzle", "OpenAI"],
      source: "https://github.com/hamshamb/StudyFilter",
      live: "https://studyfilter.online",
      featured: true,
    },
    {
      slug: "areuhuman",
      name: "AreUHuman",
      eyebrow: "TOUCHSCREEN · PWA · LIVE",
      description: "A production touchscreen skill game for supervised carnival and kiosk use.",
      problem:
        "Touchscreen attractions need varied, fair, measurable challenges plus practical tools for operators and real kiosk hardware.",
      built:
        "54 playable variants across 44 mechanics, adaptive difficulty, persistent conditions, measured scoring, local leaderboards, operator playtesting, touch diagnostics, procedural audio, and an offline PWA shell.",
      result:
        "A fully client-side kiosk game with no account, API, database, analytics, paid service, or core network dependency.",
      stack: ["TypeScript", "React", "Pointer Events", "Web Audio", "PWA", "Vitest"],
      source: "https://github.com/hamshamb/AreUHuman",
      live: "https://areuhuman.netlify.app",
      featured: true,
    },
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
  ] satisfies Project[],
  skills: [
    { group: "CORE", items: ["Python", "JavaScript / TypeScript", "Git", "systems thinking"] },
    { group: "PRODUCT", items: ["desktop tooling", "interaction design", "workflow automation", "accessible UX"] },
    { group: "SHIP", items: ["Windows apps", "open source", "packaging", "documentation"] },
  ],
  timeline: [
    { date: "NOW", title: "Released StudyFilter", detail: "Shipped a full-stack CBSE learning workspace for Classes 8–12." },
    { date: "2026", title: "Released AreUHuman", detail: "Built a production touchscreen skill game with 54 playable variants and offline kiosk support." },
    { date: "2026", title: "Released PyForge", detail: "Designed and shipped an approachable Python-to-EXE desktop workflow." },
  ],
};

export const commandNames = [
  "help", "whoami", "about", "projects", "open studyfilter", "open areuhuman", "open pyforge", "experience",
  "skills", "contact", "status", "theme green", "theme amber", "fx on", "fx off", "clear",
];
