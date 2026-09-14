export type Project = {
  slug: string;
  name: string;
  sigil: string;
  eyebrow: string;
  availability: string;
  phase: "live" | "open" | "lab";
  role: string;
  releasedOn: string;
  releaseLabel: string;
  releaseNote: string;
  intro: string[];
  description: string;
  problem: string;
  built: string;
  result: string;
  highlights: string[];
  metrics: { value: string; label: string }[];
  stack: string[];
  source: string;
  live?: string;
  image?: string;
  imageAlt?: string;
  note?: string;
};

const projects: Project[] = [
  {
    slug: "nexus",
    name: "Nexus",
    sigil: "NX",
    eyebrow: "MINECRAFT · NETWORKING · JAVA",
    availability: "NOT FINISHED",
    phase: "lab",
    role: "Protocol design + Fabric development",
    releasedOn: "2026-08-31",
    releaseLabel: "AUG 31, 2026",
    releaseNote: "Published the development build for invite-code hosting, local coordination, authenticated bridging, and explicit release gates.",
    intro: [
      "i wanted to send someone a code and have them join my minecraft world.",
      "turns out that is not a small problem.",
    ],
    description: "Nexus is an experimental Fabric mod for sharing a Minecraft Java single-player world through a short invite code.",
    problem: "Open to LAN works on a local network. The moment the other player is somewhere else, the simple idea turns into session discovery, admission, transport, authentication, expiry, abuse controls, and a lot of ways to get it wrong.",
    built: "The code is split into session state machines, a versioned protocol, short-lived admission capabilities, coordination services, transport contracts, and a Fabric bridge that keeps normal Minecraft authentication in the loop.",
    result: "The local bridge and invite-code flow work as a development system. Internet transport and a verified two-account join are still blockers. It is a real experiment, not a finished product wearing a launch badge.",
    highlights: [
      "Host and join screens inside a Fabric mod",
      "Short-lived, single-use admission capabilities with replay protection",
      "Session creation, joining, heartbeats, expiry, and cleanup",
      "Reliable ordered transport contracts with backpressure and lifecycle handling",
      "Seven modules separating protocol, client, backend, transport, and Minecraft code",
      "Threat model, evidence ledger, and public release gates",
    ],
    metrics: [
      { value: "07", label: "MODULES" },
      { value: "1×", label: "SINGLE-USE ACCESS" },
      { value: "LAB", label: "ACTUAL STATUS" },
    ],
    stack: ["Java", "Fabric", "Gradle", "TCP", "protocol design", "security"],
    source: "https://github.com/hamshamb/nexus",
    note: "Internet transport is not implemented yet. The full two-account join still needs manual verification.",
  },
  {
    slug: "chc-review-studio",
    name: "CHC Review Studio",
    sigil: "CR",
    eyebrow: "WINDOWS · EDITORIAL TOOL · C#",
    availability: "OPEN SOURCE",
    phase: "open",
    role: "Desktop UX + evidence system design",
    releasedOn: "2026-08-30",
    releaseLabel: "AUG 30, 2026",
    releaseNote: "Released a local-first workbench that keeps source text, rubric evidence, findings, canon decisions, and grading in one trail.",
    intro: [
      "i wanted one place where a reviewer could prove why a comment or grade exists.",
      "so the source, evidence, rubric and decision all stay connected.",
    ],
    description: "A local-first Windows workbench for evidence-led editorial review, source-anchored findings, canon checks, and transparent S–F grading.",
    problem: "Review work gets unreliable when the source, rubric, evidence, comments, and final decision live in separate tools. Scores drift away from proof, and useful feedback can quietly turn into ghostwriting.",
    built: "One keyboard-friendly workflow combines a read-only source viewer, weighted rubrics, exact evidence anchors, structured findings, canon classifications, tier caps, recovery files, and editorial exports.",
    result: "A reviewer can trace a final tier back to criteria and source evidence. The app runs locally, sends no telemetry, and does not need a network connection.",
    highlights: [
      "Read-only DOCX and text viewer with outline, selection, and search",
      "Weighted Entry, Story, and Group of Interest rubrics with visible 0–4 ratings",
      "Source-anchored evidence, findings, corrections, severity, and resolution states",
      "S–F grading with completion safeguards and explicit cap precedence",
      "Atomic saves, rotating backups, recovery, and source-change detection",
      "Editorial HTML reports and detailed CSV comment logs",
    ],
    metrics: [
      { value: "0–4", label: "EVIDENCE SCALE" },
      { value: "S–F", label: "VISIBLE OUTCOME" },
      { value: "LOCAL", label: "NO TELEMETRY" },
    ],
    stack: ["C#", "WPF", ".NET", "PowerShell", "JSON", "HTML export"],
    source: "https://github.com/hamshamb/chc-review-studio",
  },
  {
    slug: "areuhuman",
    name: "AreUHuman",
    sigil: "AH",
    eyebrow: "TOUCHSCREEN · PWA · LIVE",
    availability: "LIVE",
    phase: "live",
    role: "Game systems + interaction engineering",
    releasedOn: "2026-08-15",
    releaseLabel: "AUG 15, 2026",
    releaseNote: "Released the offline-ready touchscreen game with 54 variations, adaptive difficulty, operator tools, and on-device score history.",
    intro: [
      "a touchscreen game built mostly around making people do increasingly stupid things with their fingers.",
      "under the stupidity is a fairly serious input measurement system.",
    ],
    description: "A fast touchscreen challenge booth that measures how people tap, trace, remember, react, and coordinate.",
    problem: "A live kiosk game has to stay varied, measurable, fair, and reliable on the actual touchscreen while a queue of people is waiting behind it.",
    built: "I made 54 variants across 44 mechanics, then added adaptive difficulty, persistent conditions, measured scoring, local records, deterministic prize bands, operator controls, touch diagnostics, and procedural audio.",
    result: "It works offline after the first load and needs no account, API, database, analytics service, paid service, or essential network connection.",
    highlights: [
      "54 playable variants across 44 mechanics and 12 compatible conditions",
      "Reaction time, timing error, path drift, precision, contact delta, and velocity measurements",
      "Adaptive difficulty, lives, response chains, and deterministic prize thresholds",
      "Local leaderboards, personal bests, aggregate statistics, and JSON/CSV exports",
      "Operator playtesting controls and an application-level multi-touch diagnostic",
      "Procedural Web Audio with an offline-capable PWA shell",
    ],
    metrics: [
      { value: "54", label: "VARIANTS" },
      { value: "44", label: "MECHANICS" },
      { value: "12", label: "CONDITIONS" },
    ],
    stack: ["TypeScript", "React", "Pointer Events", "Web Audio", "PWA", "Vitest"],
    source: "https://github.com/hamshamb/AreUHuman",
    live: "https://areuhuman.netlify.app",
    image: "https://raw.githubusercontent.com/hamshamb/AreUHuman/main/public/og.png",
    imageAlt: "AreUHuman game preview",
    note: "Settings and optional leaderboard names stay on the device.",
  },
  {
    slug: "studyfilter",
    name: "StudyFilter",
    sigil: "SF",
    eyebrow: "SCHOOL · FULL STACK · LIVE",
    availability: "LIVE",
    phase: "live",
    role: "Product design + full-stack development",
    releasedOn: "2026-06-25",
    releaseLabel: "JUN 25, 2026",
    releaseNote: "Launched the CBSE study workspace with syllabus-aware help, checked resources, practice, planning, and progress.",
    intro: [
      "school websites have an incredible ability to make studying involve everything except studying.",
      "i started StudyFilter because my own stuff was scattered everywhere.",
    ],
    description: "One CBSE workspace for questions, chapter revision, papers, quizzes, planning, focus sessions, and progress.",
    problem: "Studying meant bouncing between notes, videos, PDFs, quizzes, timers, and progress apps. Every switch lost context, and bad labels sometimes sent students to the wrong material.",
    built: "The app combines syllabus-aware explanations, subject and chapter hubs, checked resources, previous-year questions, mock exams, study tools, sign-in, and progress that follows the learner.",
    result: "A student can move from a doubt to an explanation, then into practice and review, without rebuilding the session across several apps.",
    highlights: [
      "Syllabus-aware answers with structured explanations and mathematical notation",
      "Subject and chapter hubs with summaries, solutions, quizzes, and revision notes",
      "NCERT resources, previous-year papers, mock exams, and marking schemes",
      "Tools for revision, flashcards, comparisons, maps, and problem solving",
      "Goals, streaks, mastery, daily plans, focus timer, and recent activity",
      "Public content-integrity, support, security, and reporting documentation",
    ],
    metrics: [
      { value: "10", label: "CBSE CLASS" },
      { value: "1", label: "WORKSPACE" },
      { value: "LIVE", label: "STATUS" },
    ],
    stack: ["TypeScript", "React", "Node.js", "PostgreSQL", "Drizzle", "PWA"],
    source: "https://github.com/hamshamb/StudyFilter",
    live: "https://studyfilter.online",
    image: "https://raw.githubusercontent.com/hamshamb/StudyFilter/main/docs/media/logo.png",
    imageAlt: "StudyFilter logo",
    note: "The public repository contains product documentation and reporting routes. Production source is private. StudyFilter is not affiliated with CBSE or NCERT.",
  },
  {
    slug: "pyforge",
    name: "PyForge",
    sigil: "PF",
    eyebrow: "WINDOWS · OPEN SOURCE · PYTHON",
    availability: "OPEN SOURCE",
    phase: "open",
    role: "Desktop UX + Python tooling",
    releasedOn: "2025-10-15",
    releaseLabel: "OCT 15, 2025",
    releaseNote: "Published the Windows tool that turns Python scripts into shareable executables through a guided workflow.",
    intro: [
      "i got tired of explaining how to turn a python script into an exe.",
      "so i put the annoying parts behind a GUI without hiding what PyInstaller is doing.",
    ],
    description: "A Windows desktop app that makes Python-to-EXE packaging understandable instead of mysterious.",
    problem: "Sharing a Python tool should not require memorising PyInstaller flags, chasing hidden imports, or debugging an environment before the actual work begins.",
    built: "A drag-and-drop interface handles sensible detection, plain-language choices, static project checks, guided environment repair, advanced controls, and a live log that shows the exact process.",
    result: "A developer can drop in a script, review the defaults, press Forge, and still understand what is happening underneath.",
    highlights: [
      "Drag-and-drop input with automatic name, path, entry-point, and mode detection",
      "Static project analysis that never executes the selected source",
      "Pre-build checks for paths, permissions, disk space, icons, data, and accidental secrets",
      "Build history, reusable configurations, duration tracking, and comparison",
      "Hidden imports, data files, exclusions, splash screens, UPX, and version metadata",
      "Environment checks, guided repair, exact command preview, and a complete build log",
    ],
    metrics: [
      { value: "96", label: "TESTS" },
      { value: "STATIC", label: "ANALYSIS" },
      { value: "VISIBLE", label: "BUILD PROCESS" },
    ],
    stack: ["Python", "Tkinter", "PyInstaller", "Windows", "UPX", "Pillow"],
    source: "https://github.com/hamshamb/PyForge",
    image: "https://raw.githubusercontent.com/hamshamb/PyForge/main/assets/docs/pyforge-interface.png",
    imageAlt: "PyForge desktop interface",
    note: "PyForge is portable; creating a new executable still requires Python on the build machine.",
  },
];

export const portfolio = {
  owner: {
    name: "hamshamb",
    handle: "@hamshamb",
    role: "student who makes stuff.",
    statement: "mostly software. occasionally questionable decisions.",
    location: "India · IST",
    status: "probably building something",
    github: "https://github.com/hamshamb",
    email: "hamshambdev@gmail.com",
    bio: [
      "hi, i'm hamshamb.",
      "i'm a student in india and i spend a lot of my free time making things on computers.",
      "websites, windows apps, minecraft stuff, random tools — basically whatever seems interesting enough to ruin my weekend.",
      "i don't really have a neat “i specialise in ___” answer yet.",
      "i like programming. i've been getting more interested in security and osint. i read a lot about geopolitics. i like maps for some reason. recently i've also been speedcubing.",
      "that's about it.",
      "this website is mostly where i keep the things i've made before i forget they exist.",
    ],
    now: {
      month: "september 2026",
      items: [
        "building Nexus",
        "messing with this portfolio",
        "trying to get faster at 3x3",
        "reading about OSINT and security",
        "school, unfortunately",
      ],
    },
  },
  projects,
  skills: [
    { group: "LANGUAGES", items: ["Python", "Java", "JavaScript", "TypeScript", "C#", "C++", "Rust"] },
    { group: "WEB", items: ["React", "Node.js", "HTML / CSS", "PWAs", "Web APIs", "PostgreSQL"] },
    { group: "OTHER THINGS I USE", items: ["Git / GitHub", "automated tests", "protocol design", "Windows desktop", "local-first apps", "accessible UX"] },
    { group: "CURRENT RABBIT HOLES", items: ["OSINT", "security", "Minecraft networking", "geopolitics", "maps", "speedcubing"] },
  ],
};

export const releaseLog = [...projects].sort((a, b) => b.releasedOn.localeCompare(a.releasedOn));
export const latestProject = releaseLog[0];

export const futureWriting = [
  "I tried making Minecraft's Open to LAN work over the internet",
  "54 ways to poke a touchscreen",
  "I accidentally wrote 96 tests for a PyInstaller GUI",
  "Why StudyFilter became much bigger than I planned",
  "I tried analysing a Rubik's Cube solve without a smart cube",
];

export const commandNames = [
  "help", "whoami", "about", "projects", "latest", "open nexus",
  "open chc-review-studio", "open areuhuman", "open studyfilter", "open pyforge",
  "log", "stuff", "ls ~/stuff", "writing", "now", "stack", "contact",
  "status", "theme green", "theme amber", "theme cyan", "fx on", "fx off", "clear",
];
