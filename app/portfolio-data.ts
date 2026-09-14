export type ProjectMetric = { value: string; label: string };

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

export type BlogPost = {
  slug: string;
  category: string;
  title: string;
  publishedOn: string;
  dateLabel: string;
  readTime: string;
  excerpt: string;
  thesis: string;
  sections: { heading: string; body: string }[];
};

const projects: Project[] = [
  {
    slug: "nexus",
    name: "Nexus",
    sigil: "NX",
    eyebrow: "MINECRAFT · NETWORKING · JAVA",
    availability: "ACTIVE EXPERIMENT",
    phase: "lab",
    role: "Protocol design + Fabric development",
    releasedOn: "2026-08-31",
    releaseLabel: "AUG 31, 2026",
    releaseNote: "Published the clean-room development build for invite-code hosting, with local coordination, authenticated bridging, and explicit release gates.",
    description: "An experimental Fabric mod exploring how a Minecraft Java single-player world could be shared through a short invite code.",
    problem: "Opening a world to a friend usually means server setup, port forwarding, or trusting a large third-party platform. The simple player action hides a difficult networking and security problem.",
    built: "I separated the system into session state machines, a versioned protocol, admission capabilities, coordination services, reliable transport contracts, and a Fabric-facing bridge that preserves normal Minecraft authentication.",
    result: "The local bridge and invite-code flow work as a documented development system. Internet transport and a two-account authenticated join remain honest release blockers, so Nexus is presented as an experiment rather than a finished product.",
    highlights: [
      "Host and join interfaces built directly into a Fabric mod",
      "Short-lived, single-use admission capabilities with replay protections",
      "Local coordination for session creation, joining, heartbeats, and expiry",
      "Reliable ordered transport contracts with explicit backpressure and lifecycle handling",
      "Seven-module architecture with protocol, client, backend, transport, and Minecraft boundaries",
      "Clean-room engineering rules, threat model, evidence ledger, and public release gates",
    ],
    metrics: [
      { value: "07", label: "SYSTEM MODULES" },
      { value: "1×", label: "SINGLE-USE ACCESS" },
      { value: "LAB", label: "HONEST STATUS" },
    ],
    stack: ["Java", "Fabric", "Gradle", "TCP", "Protocol design", "Security"],
    source: "https://github.com/hamshamb/nexus",
    note: "Nexus is under active development. Internet transport is not implemented and the full two-account join still needs manual verification.",
  },
  {
    slug: "chc-review-studio",
    name: "CHC Review Studio",
    sigil: "CR",
    eyebrow: "WINDOWS · EDITORIAL SYSTEM · C#",
    availability: "OPEN SOURCE",
    phase: "open",
    role: "Desktop UX + evidence system design",
    releasedOn: "2026-08-30",
    releaseLabel: "AUG 30, 2026",
    releaseNote: "Released a local-first Windows workbench that keeps source text, rubric evidence, findings, canon decisions, and final grading in one review trail.",
    description: "A local-first Windows workbench for evidence-led editorial review, source-anchored findings, canon checks, and transparent S–F grading.",
    problem: "Serious review work becomes unreliable when the source, rubric, comments, evidence, and final decision live in separate tools. Scores can drift away from evidence and feedback can quietly become ghostwriting.",
    built: "I designed one keyboard-friendly workflow around a read-only source viewer, weighted rubrics, exact evidence anchors, structured findings, canon classifications, tier caps, recovery files, and editorial exports.",
    result: "Reviewers can trace a final tier back to specific criteria and source evidence while leaving authorship with the writer. The application runs locally without telemetry or a network dependency.",
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
    availability: "LIVE EXPERIENCE",
    phase: "live",
    role: "Game systems + interaction engineering",
    releasedOn: "2026-08-15",
    releaseLabel: "AUG 15, 2026",
    releaseNote: "Released the offline-ready touchscreen game with 54 variations, adaptive difficulty, operator tools, and on-device score history.",
    description: "A fast, strange touchscreen challenge booth that measures how people tap, trace, remember, react, and coordinate.",
    problem: "A live touchscreen attraction needs more than visual effects. Challenges must stay varied, measurable, fair, and reliable on the real kiosk hardware operators use.",
    built: "I designed 54 playable variants across 44 mechanics, then added adaptive difficulty, persistent conditions, measured scoring, local records, deterministic prize bands, operator playtesting, touch diagnostics, and procedural audio.",
    result: "The experience is local-first and works offline after its first load. It needs no account, API, database, analytics service, paid service, or essential network connection to keep a crowd moving.",
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
      { value: "12", label: "CONDITIONS" },
    ],
    stack: ["TypeScript", "React", "Pointer Events", "Web Audio", "PWA", "Vitest"],
    source: "https://github.com/hamshamb/AreUHuman",
    live: "https://areuhuman.netlify.app",
    note: "Settings and optional leaderboard names remain on the device; the core experience is local-first.",
  },
  {
    slug: "studyfilter",
    name: "StudyFilter",
    sigil: "SF",
    eyebrow: "EDTECH · FULL STACK · LIVE",
    availability: "LIVE PRODUCT",
    phase: "live",
    role: "Product design + full-stack development",
    releasedOn: "2026-06-25",
    releaseLabel: "JUN 25, 2026",
    releaseNote: "Launched the CBSE learning workspace, bringing syllabus-aware help, verified resources, practice, planning, and progress into one place.",
    description: "A calmer CBSE learning workspace for asking questions, revising chapters, practising papers, planning work, and checking progress.",
    problem: "Studying often means bouncing between notes, videos, PDFs, quizzes, timers, and progress apps. Every switch breaks context, and inaccurate resource labels can make the problem worse.",
    built: "I brought that journey into one focused workspace with syllabus-aware explanations, subject and chapter hubs, verified learning resources, previous-year questions, mock exams, study tools, sign-in, and progress that follows the learner.",
    result: "A student can move from a doubt to an explanation, then into practice and review, without rebuilding the study session across several apps.",
    highlights: [
      "Syllabus-aware answers with structured explanations and mathematical notation",
      "Subject and chapter hubs with summaries, solutions, quizzes, and revision notes",
      "NCERT resources, previous-year papers, mock exams, and marking schemes",
      "Focused tools for revision, flashcards, comparisons, maps, and problem solving",
      "Goals, streaks, mastery, daily plans, focus timer, and recent activity",
      "Public content-integrity, support, security, and reporting documentation",
    ],
    metrics: [
      { value: "10", label: "CBSE FOCUS" },
      { value: "1", label: "CONNECTED WORKSPACE" },
      { value: "LIVE", label: "STUDY PLATFORM" },
    ],
    stack: ["TypeScript", "React", "Node.js", "PostgreSQL", "Drizzle", "PWA"],
    source: "https://github.com/hamshamb/StudyFilter",
    live: "https://studyfilter.online",
    note: "The public repository contains product documentation and reporting workflows. Production source remains private. StudyFilter is not affiliated with CBSE or NCERT.",
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
    releaseNote: "Published the Windows tool that turns Python scripts into shareable executables through a guided drag-and-drop workflow.",
    description: "A Windows desktop app that turns the intimidating Python-to-EXE process into a calm, guided workflow.",
    problem: "Sharing a Python tool should not require memorising PyInstaller flags, chasing hidden imports, or debugging an environment before the real work can begin.",
    built: "I wrapped packaging in a drag-and-drop interface with sensible detection, plain-language choices, static project checks, guided environment repair, advanced controls, and a live log that never hides what the tool is doing.",
    result: "A developer can drop in a script, review sensible defaults, press Forge, and still understand everything happening underneath.",
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
      { value: "STATIC", label: "CODE ANALYSIS" },
      { value: "VISIBLE", label: "BUILD PROCESS" },
    ],
    stack: ["Python", "Tkinter", "PyInstaller", "Windows", "UPX", "Pillow"],
    source: "https://github.com/hamshamb/PyForge",
    note: "PyForge is portable; creating a new executable still requires Python on the build machine.",
  },
];

const blog: BlogPost[] = [
  {
    slug: "osint-starts-with-restraint",
    category: "OSINT / ETHICS",
    title: "OSINT starts with restraint",
    publishedOn: "2026-09-14",
    dateLabel: "SEP 14, 2026",
    readTime: "3 MIN",
    excerpt: "Finding information is the easy part. Knowing what is verified, relevant, and responsible to use is the real skill.",
    thesis: "Open-source intelligence is not a licence to collect everything. It is a discipline of asking precise questions, preserving context, and stopping when the evidence stops.",
    sections: [
      { heading: "Collection is not understanding", body: "A search result, username match, old photo, or map pin is only an observation. It becomes useful after provenance, time, context, and alternative explanations are checked. I want my investigations to show the chain from source to conclusion instead of hiding uncertainty behind confidence." },
      { heading: "Public does not mean harmless", body: "Information can be technically public and still become dangerous when it is aggregated. Before sharing a finding, I ask whether it is necessary, whether it affects a real public-interest question, and whether it could expose someone who never chose to become the subject." },
      { heading: "The best result may be a limit", body: "A responsible investigation can end with not enough evidence. That is not failure. Clear limits make later work stronger, protect people from false claims, and keep curiosity from turning into certainty without proof." },
    ],
  },
  {
    slug: "why-i-kept-the-terminal",
    category: "DESIGN / SYSTEMS",
    title: "Why I kept the terminal",
    publishedOn: "2026-09-08",
    dateLabel: "SEP 08, 2026",
    readTime: "3 MIN",
    excerpt: "A terminal can be more than an aesthetic. Used carefully, it turns navigation into a system you can see, learn, and control.",
    thesis: "I kept the terminal in this portfolio because it matches how I think: explicit state, small commands, visible feedback, and no mystery about what happened.",
    sections: [
      { heading: "The interface has two speeds", body: "Every screen is clickable for someone who wants to browse. The command line is there for someone who wants to move directly. Neither path is treated as the advanced one; they are simply two ways to operate the same system." },
      { heading: "Atmosphere should not block access", body: "Scanlines, boot text, phosphor themes, and motion build the feeling, but they must remain optional. Keyboard focus, reduced motion, readable contrast, responsive layouts, and semantic structure are part of the design rather than cleanup after it." },
      { heading: "A portfolio should reveal judgement", body: "Technology lists are useful, but decisions are more interesting. The project records explain the problem, what I built, what changed, and where the limits remain. A believable system says what is experimental as clearly as it says what is live." },
    ],
  },
  {
    slug: "geopolitics-is-a-systems-problem",
    category: "GEOPOLITICS / NOTES",
    title: "Geopolitics is a systems problem",
    publishedOn: "2026-09-01",
    dateLabel: "SEP 01, 2026",
    readTime: "4 MIN",
    excerpt: "Borders matter, but so do cables, chips, ports, standards, platforms, energy routes, and the incentives connecting them.",
    thesis: "My interest in geopolitics comes from the same place as my interest in software: complicated outcomes emerge from connected systems, constraints, and people making decisions with incomplete information.",
    sections: [
      { heading: "Follow the dependencies", body: "A country can be powerful in one layer and dependent in another. Energy, semiconductor supply chains, shipping routes, payment rails, satellite coverage, and undersea cables reveal relationships that a political map alone cannot show." },
      { heading: "Technology changes the terrain", body: "Open-source software, export controls, cloud regions, encryption, platform rules, and technical standards can shape who has access and who sets the terms. Code is not separate from geopolitics once infrastructure becomes strategic." },
      { heading: "Models need humility", body: "Systems thinking helps organise evidence, but people and history do not behave like clean software. I use maps and models to generate better questions, then look for primary sources, competing explanations, and facts that would prove my first idea wrong." },
    ],
  },
];

export const portfolio = {
  owner: {
    name: "hamshamb",
    handle: "@hamshamb",
    role: "Developer · investigator · student",
    statement: "I build useful systems, investigate open information, and study how technology, people, and power connect.",
    location: "India · IST (UTC+5:30)",
    status: "LEARNING IN PUBLIC",
    github: "https://github.com/hamshamb",
    email: "hamshambdev@gmail.com",
    bio: [
      "I am a student developer from India. I like building tools that remove friction, expose how a system works, and stay honest about their limits.",
      "My work moves between full-stack products, Windows utilities, touchscreen interaction, Minecraft networking, and local-first software. I care about open-source development because useful ideas improve when their reasoning can be inspected.",
      "Beyond code, I am deeply curious about OSINT, digital investigations, geopolitics, security, maps, infrastructure, and the hidden dependencies that shape everyday life.",
      "I am still learning, deliberately. This portfolio is a record of what I can build now, the questions I am following, and the quality bar I am trying to raise with every release.",
    ],
    interests: [
      { code: "01", title: "OSINT", detail: "Verification, provenance, maps, timelines, and responsible public-source research." },
      { code: "02", title: "OPEN SOURCE", detail: "Inspectable tools, useful documentation, clean contribution paths, and shared learning." },
      { code: "03", title: "GEOPOLITICS", detail: "Technology, infrastructure, borders, incentives, supply chains, and power." },
      { code: "04", title: "SYSTEMS", detail: "Protocols, local-first software, product design, accessibility, and honest interfaces." },
    ],
    principles: [
      { title: "VERIFY BEFORE CLAIMING", detail: "Separate observations, inferences, and unknowns. Confidence should come from a visible evidence trail." },
      { title: "BUILD IN THE OPEN", detail: "Document decisions, invite inspection, and make it easier for the next person to understand the system." },
      { title: "STATE THE LIMITS", detail: "A lab build should look like a lab build. Trust grows when unfinished work is described precisely." },
    ],
  },
  projects,
  blog,
  skills: [
    { group: "LANGUAGES", items: ["Python", "Java", "JavaScript", "TypeScript", "C#", "C++", "Rust"] },
    { group: "WEB", items: ["React", "Node.js", "HTML / CSS", "PWAs", "Web APIs", "PostgreSQL"] },
    { group: "ENGINEERING", items: ["Git / GitHub", "automated testing", "protocol design", "Windows desktop", "local-first systems", "accessible UX"] },
    { group: "RESEARCH", items: ["OSINT", "source verification", "digital investigations", "geopolitics", "security research", "systems thinking"] },
  ],
};

export const releaseLog = [...projects].sort((a, b) => b.releasedOn.localeCompare(a.releasedOn));
export const latestProject = releaseLog[0];
export const latestPost = blog[0];

export const commandNames = [
  "help", "whoami", "about", "projects", "latest", "log", "blog", "notes",
  "read osint-starts-with-restraint", "read why-i-kept-the-terminal",
  "read geopolitics-is-a-systems-problem", "open nexus", "open chc-review-studio",
  "open areuhuman", "open studyfilter", "open pyforge", "skills", "interests",
  "contact", "status", "theme green", "theme amber", "theme cyan",
  "fx on", "fx off", "clear",
];
