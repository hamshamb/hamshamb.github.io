export type ProjectMetric = {
  value: string;
  label: string;
};

export type Project = {
  slug: string;
  name: string;
  eyebrow: string;
  availability: string;
  role: string;
  releasedOn: string;
  releaseLabel: string;
  releaseNote: string;
  description: string;
  problem: string;
  built: string;
  result: string;
  highlights: string[];
  metrics: ProjectMetric[];
  stack: string[];
  source: string;
  live?: string;
  note?: string;
};

const projects: Project[] = [
  {
    slug: "studyfilter",
    name: "StudyFilter",
    eyebrow: "EDTECH · FULL STACK · LIVE",
    availability: "LIVE PRODUCT",
    role: "Product design + full-stack development",
    releasedOn: "2026-06-25",
    releaseLabel: "JUN 25, 2026",
    releaseNote:
      "Launched the CBSE workspace for Classes 8–12, bringing syllabus-aware help, NCERT resources, practice exams, and progress into one place.",
    description:
      "A calmer place for CBSE students in Classes 8–12 to ask questions, revise chapters, practise papers, and see what is improving.",
    problem:
      "Studying often means bouncing between notes, videos, NCERT PDFs, quizzes, timers, and progress apps. The tools exist, but the learning journey feels fragmented and every switch breaks context.",
    built:
      "I brought that journey into one focused workspace: syllabus-aware explanations, subject and chapter hubs, NCERT resources, previous-year questions, mock exams, study tools, sign-in, and progress that follows the learner.",
    result:
      "A student can move from a doubt to an explanation, then into practice and review, without losing context or rebuilding their study session across several apps.",
    highlights: [
      "Syllabus-aware answers with structured explanations and mathematical notation",
      "Classes 8–12 subject hubs with summaries, solutions, quizzes, and revision notes",
      "NCERT library, answers, previous-year papers, mock exams, and marking schemes",
      "Focused tools for revision, flashcards, comparisons, maps, and problem solving",
      "Goals, streaks, XP, mastery, daily plans, focus timer, and recent activity",
      "Responsive desktop and mobile navigation with light and dark themes",
    ],
    metrics: [
      { value: "8–12", label: "CBSE CLASSES" },
      { value: "1", label: "CONNECTED WORKSPACE" },
      { value: "LIVE", label: "STUDY PLATFORM" },
    ],
    stack: ["TypeScript", "React 19", "Node.js", "PostgreSQL", "Drizzle", "OpenAI (optional)"],
    source: "https://github.com/hamshamb/StudyFilter",
    live: "https://studyfilter.online",
    note: "StudyFilter is an independent product and is not affiliated with or endorsed by CBSE or NCERT.",
  },
  {
    slug: "areuhuman",
    name: "AreUHuman",
    eyebrow: "TOUCHSCREEN · PWA · LIVE",
    availability: "LIVE EXPERIENCE",
    role: "Game systems + interaction engineering",
    releasedOn: "2026-08-15",
    releaseLabel: "AUG 15, 2026",
    releaseNote:
      "Released the offline-ready touchscreen game with 54 variations, adaptive difficulty, operator tools, and on-device score history.",
    description:
      "A fast, slightly strange touchscreen challenge booth that tests how people tap, trace, remember, and react—and keeps every result honest.",
    problem:
      "A live touchscreen attraction needs more than flashy effects. Challenges must stay varied, measurable, fair, and reliable on the real kiosk hardware operators use every day.",
    built:
      "I designed 54 playable variants across 44 mechanics, then added adaptive difficulty, persistent conditions, measured scoring, local records, deterministic prize bands, operator playtesting, touch diagnostics, and procedural audio.",
    result:
      "The experience is local-first and works offline after its first load. It needs no account, API, database, analytics service, paid service, or essential network connection to keep a crowd moving.",
    highlights: [
      "54 playable variants across 44 mechanics and 12 compatible persistent conditions",
      "Measured reaction time, timing error, path drift, precision, contact delta, and velocity",
      "Adaptive difficulty, lives, response chains, and deterministic prize thresholds",
      "Local leaderboards, personal bests, aggregate statistics, and JSON/CSV exports",
      "Operator playtesting controls and an application-level multi-touch diagnostic",
      "Procedural Web Audio with an offline-capable PWA shell",
    ],
    metrics: [
      { value: "54", label: "PLAYABLE VARIANTS" },
      { value: "44", label: "CORE MECHANICS" },
      { value: "12", label: "PERSISTENT CONDITIONS" },
    ],
    stack: ["TypeScript", "React", "Pointer Events", "Web Audio", "PWA", "Vitest"],
    source: "https://github.com/hamshamb/AreUHuman",
    live: "https://areuhuman.netlify.app",
    note: "Settings and optional leaderboard names remain on the device; the core experience is local-first.",
  },
  {
    slug: "pyforge",
    name: "PyForge",
    eyebrow: "WINDOWS · OPEN SOURCE · 2025",
    availability: "OPEN SOURCE",
    role: "Desktop UX + Python tooling",
    releasedOn: "2025-10-15",
    releaseLabel: "OCT 15, 2025",
    releaseNote:
      "Published the Windows tool that turns Python scripts into shareable executables through a guided drag-and-drop workflow.",
    description:
      "A Windows desktop app that turns the intimidating Python-to-EXE process into a calm, guided workflow.",
    problem:
      "Sharing a Python tool should not require memorising PyInstaller flags, chasing hidden imports, or debugging an environment before the real work can begin.",
    built:
      "I wrapped the packaging flow in a drag-and-drop interface with sensible detection, plain-language choices, static project checks, guided environment repair, advanced controls, and a live log that never hides what the tool is doing.",
    result:
      "Instead of memorising packaging commands, a developer can drop in a script, review sensible defaults, press Forge, and still understand everything happening underneath.",
    highlights: [
      "Drag-and-drop input with automatic name, output path, entry-point, and mode detection",
      "Static project analysis that never executes the selected source",
      "Pre-build checks for paths, permissions, disk space, icons, data, and accidental secrets",
      "Build history, reusable configurations, duration tracking, and build comparison",
      "Hidden imports, data files, exclusions, splash screens, UPX, and version metadata",
      "Environment checks, guided repair, exact command preview, and a complete build log",
    ],
    metrics: [
      { value: "96", label: "AUTOMATED TESTS" },
      { value: "STATIC", label: "PROJECT ANALYSIS" },
      { value: "VISIBLE", label: "BUILD PROCESS" },
    ],
    stack: ["Python", "Tkinter", "PyInstaller", "Windows", "UPX", "Pillow"],
    source: "https://github.com/hamshamb/PyForge",
    note: "PyForge is portable; creating a new executable still requires Python on the build machine.",
  },
];

export const portfolio = {
  owner: {
    name: "hamshamb",
    handle: "@hamshamb",
    role: "Software developer & toolmaker",
    statement:
      "I build useful software for moments when the tool is getting in the way—whether that’s studying, packaging code, or running a touchscreen game.",
    location: "India · IST (UTC+5:30)",
    status: "OPEN TO COLLABORATION",
    email: "deadender9677@gmail.com",
    github: "https://github.com/hamshamb",
    bio: [
      "I’m a product-minded developer who enjoys finding the frustrating step everyone has learned to tolerate—and designing it out.",
      "That has led me from education software to touchscreen game systems and Windows developer tools. Different surfaces, same goal: make a capable system feel understandable.",
      "I care about useful defaults, visible feedback, honest interfaces, and shipping the version that works in the real world—not only in the demo.",
    ],
    principles: [
      { title: "START WITH FRICTION", detail: "Find the step that makes a person stop, switch tools, or second-guess themselves." },
      { title: "SHOW THE WORK", detail: "Good software explains what it is doing without making the user manage the machinery." },
      { title: "SHIP FOR REAL", detail: "Design around actual devices, unreliable networks, edge cases, and the person operating the product." },
    ],
  },
  projects,
  skills: [
    { group: "BUILD", items: ["Python", "JavaScript / TypeScript", "React", "Node.js", "PostgreSQL"] },
    { group: "DESIGN", items: ["product thinking", "interaction design", "accessible UX", "systems thinking", "clear defaults"] },
    { group: "SHIP", items: ["PWAs", "Windows apps", "open source", "automated testing", "documentation"] },
  ],
};

export const releaseLog = [...projects].sort((a, b) => b.releasedOn.localeCompare(a.releasedOn));
export const latestProject = releaseLog[0];

export const commandNames = [
  "help", "whoami", "about", "projects", "latest", "releases", "open latest", "open studyfilter",
  "open areuhuman", "open pyforge", "experience", "skills", "contact", "status", "theme green",
  "theme amber", "fx on", "fx off", "clear",
];
