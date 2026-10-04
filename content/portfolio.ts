import { owner as siteOwner, type Phase } from "./site";

export { phaseLabel, sections, siteUrl, type Phase } from "./site";

export type ProjectMedia = {
  src: string;
  width: number;
  height: number;
  alt: string;
  /** Smaller rendition for thumbnails and narrow screens. */
  small?: { src: string; width: number };
  /** `contain` keeps logos and square art from being cropped. */
  fit?: "cover" | "contain";
  background?: string;
  /** Pixel art: scale with hard edges instead of smoothing. */
  pixelated?: boolean;
  /** Theme-specific artwork, swapped by CSS. `src` is the light version. */
  darkSrc?: string;
};

/** How a project is recognised: its real logo, or a typographic mark when no logo exists. */
export type ProjectIdentity =
  | ({ kind: "image" } & ProjectMedia)
  | { kind: "mark"; mark: "rivet" | "mx"; background?: string };

export type Project = {
  slug: string;
  name: string;
  sigil: string;
  eyebrow: string;
  availability: string;
  /** A second, smaller status, e.g. "version 1 · pre-release". */
  statusDetail?: string;
  phase: Phase;
  role: string;
  /** Public release date. Absent for work that has not been released. */
  releasedOn?: string;
  releaseLabel?: string;
  releaseNote?: string;
  /** One-line idea, shown first everywhere. */
  hook: string;
  summary: string;
  /** Short personality line. */
  aside?: string;
  /** Why i made it, in the original words. */
  intro?: string[];
  description: string;
  problem: string;
  built: string;
  /** Optional deeper note on how it works. */
  architecture?: string;
  result?: string;
  highlights: string[];
  /** Only real, countable facts. No decorative numbers. */
  facts: { value: string; label: string }[];
  stack: string[];
  /** Absent when the source is not public yet. */
  source?: string;
  live?: string;
  identity: ProjectIdentity;
  /** The strongest visual for the top of the case study. Falls back to identity. */
  media?: ProjectMedia;
  /** Screenshots that explain the product, shown further down the case study. */
  screenshots?: ProjectMedia[];
  note?: string;
  limits?: { title: string; paragraphs: string[] };
};

const projects: Project[] = [
  {
    slug: "studyfilter",
    name: "StudyFilter",
    sigil: "SF",
    eyebrow: "LEARNING · FULL STACK · LIVE",
    availability: "live",
    phase: "live",
    role: "Product design + full-stack development",
    releasedOn: "2026-06-25",
    releaseLabel: "JUN 25, 2026",
    releaseNote: "Launched the CBSE study workspace with syllabus-aware help, checked resources, practice, planning, and progress.",
    hook: "i got tired of rebuilding the same study session across five different apps.",
    summary: "a CBSE study workspace that keeps explanations, revision, practice, planning and progress in one place.",
    aside: "started as \"this should be simpler.\" did not remain simple.",
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
    facts: [],
    stack: ["TypeScript", "React", "PostgreSQL", "Node.js", "Drizzle", "PWA"],
    source: "https://github.com/hamshamb/StudyFilter",
    live: "https://studyfilter.online",
    identity: {
      kind: "image",
      src: "/work/studyfilter.webp",
      width: 800,
      height: 800,
      alt: "StudyFilter logo: an open book sitting inside a funnel.",
      fit: "contain",
      background: "#fff4ed",
    },
    note: "The public repository contains product documentation and reporting routes. Production source is private. StudyFilter is not affiliated with CBSE or NCERT.",
  },
  {
    slug: "rivet",
    name: "Rivet",
    sigil: "RV",
    eyebrow: "BLE MESH · PRIVATE MESSAGING · MOBILE",
    availability: "in progress",
    statusDetail: "version 1 · pre-release",
    phase: "wip",
    role: "protocol design + mobile systems + security engineering",
    hook: "private messaging that keeps moving even when the internet doesn't.",
    summary: "no account. no phone number. no server. nearby phones carry the messages.",
    description: "Rivet is a private messenger designed to work without infrastructure. Phones exchange encrypted messages directly over Bluetooth Low Energy, then carry and forward messages for other people as they move through the mesh.",
    problem: "most messaging systems stop being messaging systems the moment the network disappears. Rivet starts from the opposite assumption: the phones are the network.",
    built: "every device behaves as both a Bluetooth peripheral and a Bluetooth central. messages are encrypted for their recipient, wrapped in deliberately sparse envelopes, stored temporarily and offered to peers until somebody who can decrypt them receives them.",
    architecture: "there is no routing table. every unexpired envelope moves through the mesh, which spends bandwidth and battery to avoid keeping a convenient map of who talks to whom.",
    highlights: [
      "direct encrypted messages",
      "QR or pasted-code contact exchange",
      "60-digit in-person safety numbers",
      "store-and-forward delivery",
      "multi-hop relaying",
      "honest waiting / in mesh / delivered states",
      "private circles",
      "shared-passphrase channels",
      "nearby public broadcast",
      "Android relay mode",
      "emergency reset",
      "six languages",
      "light, dark and system themes",
    ],
    facts: [
      { value: "60", label: "digit safety numbers" },
      { value: "6", label: "languages" },
    ],
    stack: [
      "TypeScript",
      "React Native / Expo",
      "Bluetooth Low Energy",
      "SQLite",
      "Ed25519",
      "X25519",
      "HKDF-SHA256",
      "XChaCha20-Poly1305",
      "Swift",
      "Kotlin",
    ],
    identity: { kind: "mark", mark: "rivet" },
    note: "version 1 is not released. the automated suite is green and the protocol is frozen for this version, but physical-phone field testing has not been completed and Rivet has not had an independent security review.",
    limits: {
      title: "deliberately not pretending",
      paragraphs: [
        "Rivet v1 does not have internet messaging, cloud sync, attachments, voice, video or synchronized group chat.",
        "Bluetooth also does not make somebody invisible. a radio still announces that a device is physically present.",
        "encryption protects message content. it does not solve radio direction finding, sybil identities, an unlocked seized phone or forensic erasure.",
      ],
    },
  },
  {
    slug: "nexus",
    name: "Nexus",
    sigil: "NX",
    eyebrow: "MINECRAFT · NETWORKING · JAVA",
    availability: "lab",
    phase: "lab",
    role: "Protocol design + Fabric development",
    releasedOn: "2026-08-31",
    releaseLabel: "AUG 31, 2026",
    releaseNote: "Published the development build for invite-code hosting, local coordination, authenticated bridging, and explicit release gates.",
    hook: "\"send them a code and let them join my world\" turned out to be a networking project.",
    summary: "an experimental Fabric mod for sharing a Minecraft Java single-player world through a short invite code.",
    aside: "the distance between \"open to LAN\" and \"the internet\" is apparently an architecture diagram.",
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
    facts: [
      { value: "7", label: "gradle modules" },
      { value: "1", label: "use per invite" },
    ],
    stack: ["Java", "Fabric", "Gradle", "TCP", "protocol design", "security"],
    source: "https://github.com/hamshamb/nexus",
    identity: {
      kind: "image",
      src: "/work/nexus.svg",
      width: 512,
      height: 512,
      alt: "Nexus wordmark: white italic letters with a blue swoosh, on black.",
      fit: "contain",
      background: "#000000",
    },
    note: "Internet transport is not implemented yet. The full two-account join still needs manual verification.",
  },
  {
    slug: "areuhuman",
    name: "AreUHuman",
    sigil: "AH",
    eyebrow: "TOUCHSCREEN · GAME · LIVE",
    availability: "live",
    phase: "live",
    role: "Game systems + interaction engineering",
    releasedOn: "2026-08-15",
    releaseLabel: "AUG 15, 2026",
    releaseNote: "Released the offline-ready touchscreen game with 54 variations, adaptive difficulty, operator tools, and on-device score history.",
    hook: "54 different ways to make somebody prove they can still use their fingers.",
    summary: "a fast touchscreen challenge game built around measurable tapping, tracing, timing, memory and coordination.",
    aside: "looks silly. measures rather more than it admits.",
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
    facts: [
      { value: "54", label: "variants" },
      { value: "44", label: "mechanics" },
      { value: "12", label: "conditions" },
    ],
    stack: ["TypeScript", "React", "Pointer Events", "Web Audio", "PWA", "Vitest"],
    source: "https://github.com/hamshamb/AreUHuman",
    live: "https://areuhuman.netlify.app",
    identity: {
      kind: "image",
      src: "/work/areuhuman-mark.svg",
      width: 512,
      height: 512,
      alt: "AreUHuman mark: the letters AUH in green inside calibration corner brackets.",
      fit: "contain",
      background: "#111210",
    },
    media: {
      src: "/work/areuhuman.webp",
      width: 1600,
      height: 841,
      small: { src: "/work/areuhuman-800.webp", width: 800 },
      alt: "AreUHuman title card: the game name in large condensed type beside a calibration-document style layout.",
      background: "#0d0d0c",
    },
    note: "Settings and optional leaderboard names stay on the device.",
  },
  {
    slug: "chc-review-studio",
    name: "CHC Review Studio",
    sigil: "CR",
    eyebrow: "WINDOWS · EDITORIAL TOOL · C#",
    availability: "open source",
    phase: "open",
    role: "Desktop UX + evidence system design",
    releasedOn: "2026-08-30",
    releaseLabel: "AUG 30, 2026",
    releaseNote: "Released a local-first workbench that keeps source text, rubric evidence, findings, canon decisions, and grading in one trail.",
    hook: "if a review says something is wrong, it should be able to prove where that conclusion came from.",
    summary: "a local-first Windows workbench that keeps source text, evidence, rubric decisions, findings and grades connected.",
    aside: "comments are cheap. evidence trails are harder.",
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
    facts: [
      { value: "3", label: "weighted rubrics" },
      { value: "0–4", label: "rating scale" },
      { value: "0", label: "telemetry" },
    ],
    stack: ["C#", "WPF", ".NET", "PowerShell", "JSON", "HTML export"],
    source: "https://github.com/hamshamb/chc-review-studio",
    identity: {
      kind: "image",
      src: "/work/crs.png",
      width: 512,
      height: 512,
      alt: "CRS logo: the letters C, R and S in yellow, magenta and cyan pixel type on black.",
      fit: "contain",
      background: "#000000",
      pixelated: true,
    },
  },
  {
    slug: "pyforge",
    name: "PyForge",
    sigil: "PF",
    eyebrow: "WINDOWS · PYTHON · OPEN SOURCE",
    availability: "open source",
    phase: "open",
    role: "Desktop UX + Python tooling",
    releasedOn: "2025-10-15",
    releaseLabel: "OCT 15, 2025",
    releaseNote: "Published the Windows tool that turns Python scripts into shareable executables through a guided workflow.",
    hook: "turning a Python script into an EXE should not require remembering a wall of PyInstaller flags.",
    summary: "a Windows tool that makes Python packaging understandable without pretending the underlying build process does not exist.",
    aside: "one button on top. a suspicious amount of validation underneath.",
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
    facts: [
      { value: "96", label: "tests" },
    ],
    stack: ["Python", "Tkinter", "PyInstaller", "Windows", "UPX", "Pillow"],
    source: "https://github.com/hamshamb/PyForge",
    identity: {
      kind: "image",
      src: "/work/pyforge-mark.webp",
      width: 256,
      height: 256,
      alt: "PyForge logo: an orange flame with a code symbol rising from a blue anvil.",
      fit: "contain",
      background: "#0f1218",
    },
    media: {
      src: "/work/pyforge-logo.webp",
      width: 1200,
      height: 800,
      alt: "PyForge logo: an orange flame with a code symbol rising from a blue anvil, glowing on a dark field.",
      background: "#14161a",
    },
    screenshots: [
      {
        src: "/work/pyforge.webp",
        width: 1366,
        height: 720,
        small: { src: "/work/pyforge-800.webp", width: 800 },
        alt: "PyForge build screen: a drop zone for a Python file, app name and icon fields, and a choice between auto-detect, windowed, and console modes.",
        background: "#1e2230",
      },
    ],
    note: "PyForge is portable; creating a new executable still requires Python on the build machine.",
  },
];

/** Experiments that are not written up as case studies. */
export type LabProject = {
  name: string;
  /** How the name is written in casual copy. */
  casual: string;
  eyebrow: string;
  availability: string;
  statusDetail: string;
  hook: string;
  description: string;
  story: string[];
  stack: string[];
  pipeline: string[];
};

const mx: LabProject = {
  name: "MX",
  casual: "mx",
  eyebrow: "PRIVATE MESSAGING · MLS · RUST / WASM",
  availability: "experiment",
  statusDetail: "in progress",
  hook: "a private messenger where the cryptography is part of the build, not somebody else's service.",
  description: "MX is an experimental private messenger with no phone number, no email and no account.",
  story: [
    "the cryptographic path is intentionally narrow: a Rust crate wraps OpenMLS, compiles to WebAssembly and is loaded through TypeScript bindings.",
    "the release build compiles the crypto module from source. if the artifact is missing, the application fails loudly instead of quietly starting without encryption.",
    "changing a button should not require recompiling Rust, so development can use a verified existing WASM artifact while release builds rebuild the crypto path from source.",
  ],
  stack: ["TypeScript", "Rust", "WebAssembly", "OpenMLS", "RFC 9420", "pnpm"],
  pipeline: ["source", "rust", "wasm", "crypto engine"],
};

export type SmallThing = {
  name: string;
  eyebrow: string;
  availability: string;
  phase: Phase;
  hook: string;
  summary: string;
  technical: string;
  aside: string;
  stack: string[];
  source: string;
  live?: string;
  startedOn: string;
  identity?: ProjectMedia;
};

/** Real, public and mine, but smaller than a full case study. */
const smallThings: SmallThing[] = [
  {
    name: "TinyPaste",
    eyebrow: "PRIVACY · WEB · LIVE",
    availability: "live",
    phase: "live",
    hook: "a pastebin that tries very hard to know as little as possible.",
    summary: "share code, text and formatted documents without accounts, tracking or a public feed.",
    technical: "pastes can expire, burn after reading, use passwords or be encrypted in the browser before the server ever sees the content.",
    aside: "sometimes the best database feature is \"please delete this later.\"",
    stack: ["TypeScript", "Next.js", "Supabase"],
    source: "https://github.com/hamshamb/TinyPaste",
    live: "https://tinypastedev.vercel.app",
    startedOn: "2026-09-15",
    identity: {
      src: "/work/tinypaste-light.png",
      darkSrc: "/work/tinypaste-dark.png",
      width: 512,
      height: 341,
      alt: "TinyPaste logo: a document with a folded corner, a large T and three text lines.",
      fit: "contain",
      background: "#ffffff",
    },
  },
  {
    name: "Inkline",
    eyebrow: "LOCAL FIRST · WRITING · PWA / WINDOWS",
    availability: "active",
    phase: "wip",
    hook: "a writing app where \"save\" mostly means \"keep it on my machine.\"",
    summary: "a local-first editor for rich text, markdown and plain text with no account, backend, analytics or cloud requirement.",
    technical: "the web version works as an offline-capable PWA and the Windows build uses Tauri. both share the same React and TypeScript application.",
    aside: "because opening a blank document should not start a relationship with a server.",
    stack: ["TypeScript", "React", "Tiptap", "CodeMirror", "Tauri"],
    source: "https://github.com/hamshamb/inkline",
    startedOn: "2026-09-17",
  },
];

export type Fork = {
  name: string;
  fork: string;
  upstream: string;
  upstreamOwner: string;
  /** Neutral description of the upstream project. */
  about: string;
};

/** Repositories forked to inspect or learn from. Original authorship belongs upstream. */
const forks: Fork[] = [
  { name: "WorldWideView", fork: "https://github.com/hamshamb/worldwideview", upstream: "https://github.com/silvertakana/worldwideview", upstreamOwner: "silvertakana", about: "an open-source, plugin-driven 3D globe for live geospatial data." },
  { name: "BentoPDF", fork: "https://github.com/hamshamb/bentopdf", upstream: "https://github.com/alam00000/bentopdf", upstreamOwner: "alam00000", about: "a privacy-first PDF toolkit that works in the browser." },
  { name: "convert", fork: "https://github.com/hamshamb/convert", upstream: "https://github.com/p2r3/convert", upstreamOwner: "p2r3", about: "an online file converter for a very wide range of formats." },
  { name: "Wappix", fork: "https://github.com/hamshamb/wappix", upstream: "https://github.com/ni5arga/wappix", upstreamOwner: "ni5arga", about: "a web app for reading and searching exported WhatsApp chats." },
  { name: "protestchat", fork: "https://github.com/hamshamb/protestchat", upstream: "https://github.com/ni5arga/protestchat", upstreamOwner: "ni5arga", about: "phone-to-phone messaging over a Bluetooth mesh, for when the normal network is unavailable." },
  { name: "deanonymizer", fork: "https://github.com/hamshamb/deanonymizer", upstream: "https://github.com/ni5arga/deanonymizer", upstreamOwner: "ni5arga", about: "an OSINT tool that studies what public posting patterns reveal." },
];

/**
 * The coding journey. Broad stages, not releases: these carry a year only and never a date,
 * so they can never be mistaken for repository history. Real events come from projects.
 */
export type JourneyStage = { year: number; title: string; copy: string };

export const journey: JourneyStage[] = [
  { year: 2021, title: "first lines", copy: "started coding. mostly tiny experiments, broken things, copied ideas, rewrites and the occasional moment where the computer finally did what i meant." },
  { year: 2022, title: "learning by making", copy: "kept building things instead of following a neat curriculum. most of them were disposable. the habit wasn't." },
  { year: 2023, title: "projects started sticking", copy: "less \"can i make this work?\" and more \"can i make this make sense?\"" },
  { year: 2024, title: "past the prototype", copy: "started paying more attention to interfaces, edge cases, structure and the unglamorous parts that decide whether software survives contact with somebody else." },
  { year: 2025, title: "shipping publicly", copy: "some experiments finally survived enough rewrites to become things i was comfortable putting in public." },
  { year: 2026, title: "bigger systems, stranger problems", copy: "the projects spread into learning software, touchscreen systems, desktop tooling, privacy, bluetooth, cryptography, networking and a lot more protocol diagrams than i expected." },
];

export type JourneyEvent = {
  year: number;
  kind: "released" | "started" | "developing";
  /** ISO date. Absent for work still in development, which has no release date. */
  date?: string;
  name: string;
  href: string;
};

export const portfolio = {
  owner: {
    ...siteOwner,
    handle: "@hamshamb",
    role: "student developer",
    since: 2021,
    headline: ["i build things", "i wish existed."],
    statement: "software, tools and experiments built from curiosity, irritation, or both.",
    range: "privacy tools, weird utilities, games, networking experiments and whatever else becomes impossible to ignore once i start thinking about it.",
    habit: "i have a bad habit of turning \"wouldn't it be cool if...\" into a repository.",
    habitAside: "sometimes it ships. sometimes it becomes a research problem. usually it gets much more complicated than expected.",
    status: "probably building something",
    bio: [
      "hi, i'm hamshamb.",
      "i'm a student in india. i started coding in 2021, mostly by following ideas until they became complicated enough that i had to learn something new.",
      "the first projects were small and disposable. eventually they turned into web apps, windows tools, games, networking experiments and software i was willing to let other people use.",
      "i tend to like problems where the interesting part is hiding underneath the interface: what happens when the network disappears, where data should live, how two devices trust each other, whether a result can prove where it came from, or how much software can work without an account at all.",
      "right now a lot of that curiosity is pointed at security, privacy, protocols and OSINT.",
      "outside code, i read about geopolitics, stare at maps for longer than is reasonable and try to solve a 3x3 faster.",
      "this site is less a résumé and more a record of what happened when i kept following the rabbit holes.",
    ],
    currently: [
      { label: "building", value: "Rivet", href: "/work/rivet" },
      { label: "experimenting", value: "MX", href: "/#lab" },
      { label: "learning", value: "security / OSINT" },
      { label: "away from code", value: "speedcubing" },
    ],
    now: {
      month: "september 2026",
      updated: "2026-09-14",
      updatedLabel: "14 sep 2026",
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
  mx,
  smallThings,
  forks,
  themes: [
    { name: "privacy", copy: "if an app can work while knowing less about the person using it, that is usually where i want to start." },
    { name: "networks", copy: "i like the point where two machines have to discover each other, agree on a protocol and somehow keep working when the obvious path disappears." },
    { name: "local first", copy: "accounts and cloud backends are useful. they are not automatically mandatory." },
    { name: "strange interfaces", copy: "touchscreens, desktop tools, games, command palettes, editors. i like interfaces that exist because the problem demanded them." },
  ],
  skills: [
    { group: "languages", note: "the ones i've actually written things in", items: ["Python", "Java", "JavaScript", "TypeScript", "C#", "C++", "Rust"] },
    { group: "web", note: "what the live stuff runs on", items: ["React", "Node.js", "HTML / CSS", "PWAs", "Web APIs", "PostgreSQL"] },
    { group: "other things i use", note: "the boring parts that make things work", items: ["Git / GitHub", "automated tests", "protocol design", "Windows desktop", "local-first apps", "accessible UX"] },
    { group: "current rabbit holes", note: "interests, not expertise. just where my evenings go", interest: true, items: ["OSINT", "security", "Minecraft networking", "geopolitics", "maps", "speedcubing"] },
  ],
};

const released = projects.filter((project): project is Project & { releasedOn: string } => Boolean(project.releasedOn));

export const releaseLog = [...released].sort((a, b) => b.releasedOn.localeCompare(a.releasedOn));
export const latestProject = releaseLog[0];

/** Real, dated events plus undated in-development work, merged for the journey view. */
export const journeyEvents: JourneyEvent[] = ([
  ...released.map((project) => ({
    year: Number(project.releasedOn.slice(0, 4)),
    kind: "released" as const,
    date: project.releasedOn,
    name: project.name,
    href: `/work/${project.slug}`,
  })),
  ...smallThings.map((thing) => ({
    year: Number(thing.startedOn.slice(0, 4)),
    kind: "started" as const,
    date: thing.startedOn,
    name: thing.name,
    href: thing.source,
  })),
  { year: 2026, kind: "developing" as const, name: "Rivet", href: "/work/rivet" },
  { year: 2026, kind: "developing" as const, name: "MX", href: "/#lab" },
] as JourneyEvent[]).sort((a, b) => (a.date ?? "9999").localeCompare(b.date ?? "9999"));

/**
 * Writing is intentionally hidden for now: nothing renders this list and the section is out of
 * the navigation, palette, footer and sitemap. Kept here so it can be restored later.
 */
export const futureWriting = [
  "I tried making Minecraft's Open to LAN work over the internet",
  "54 ways to poke a touchscreen",
  "I accidentally wrote 96 tests for a PyInstaller GUI",
  "Why StudyFilter became much bigger than I planned",
  "I tried analysing a Rubik's Cube solve without a smart cube",
];

export function getProject(slug: string) {
  return projects.find((project) => project.slug === slug);
}

export function getNeighbours(slug: string) {
  const index = projects.findIndex((project) => project.slug === slug);
  return {
    previous: projects[(index - 1 + projects.length) % projects.length],
    next: projects[(index + 1) % projects.length],
  };
}
