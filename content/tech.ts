/**
 * Technology registry. Stack lists elsewhere stay plain strings; `resolveTech` maps a label to an
 * entry here, which knows its logo (content/tech-icons.ts) and, for a few, an internal skill page.
 * Anything that does not resolve renders as plain text, never as a button.
 */

export type SkillSlug = "python" | "typescript" | "react" | "java" | "csharp" | "html-css";

export type TechCategory = "language" | "frontend" | "platform" | "data" | "tooling";

export type Technology = {
  id: string;
  name: string;
  category: TechCategory;
  /** Key in techIcons. Absent when no logo can be used cleanly. */
  icon?: string;
  /** Other labels used in stack lists for the same thing. */
  aliases?: string[];
  skillSlug?: SkillSlug;
};

export const technologies: Technology[] = [
  { id: "python", name: "Python", category: "language", icon: "python", skillSlug: "python" },
  { id: "typescript", name: "TypeScript", category: "language", icon: "typescript", skillSlug: "typescript" },
  { id: "javascript", name: "JavaScript", category: "language", icon: "javascript" },
  { id: "java", name: "Java", category: "language", icon: "java", skillSlug: "java" },
  { id: "csharp", name: "C#", category: "language", icon: "csharp", skillSlug: "csharp" },
  { id: "cpp", name: "C++", category: "language", icon: "cplusplus" },
  { id: "rust", name: "Rust", category: "language", icon: "rust" },
  { id: "kotlin", name: "Kotlin", category: "language", icon: "kotlin" },
  { id: "swift", name: "Swift", category: "language", icon: "swift" },
  { id: "react", name: "React", category: "frontend", icon: "react", skillSlug: "react" },
  { id: "react-native", name: "React Native / Expo", category: "frontend", icon: "expo", aliases: ["React Native", "Expo"] },
  { id: "html-css", name: "HTML / CSS", category: "frontend", icon: "html", aliases: ["HTML", "CSS", "HTML export"], skillSlug: "html-css" },
  { id: "nextjs", name: "Next.js", category: "frontend", icon: "nextjs" },
  { id: "pwa", name: "PWA", category: "frontend", icon: "pwa", aliases: ["PWAs"] },
  { id: "tauri", name: "Tauri", category: "platform" },
  { id: "nodejs", name: "Node.js", category: "platform", icon: "nodejs" },
  { id: "dotnet", name: ".NET", category: "platform", icon: "dotnet" },
  { id: "webassembly", name: "WebAssembly", category: "platform", icon: "webassembly" },
  { id: "bluetooth", name: "Bluetooth Low Energy", category: "platform", icon: "bluetooth" },
  { id: "windows", name: "Windows", category: "platform", icon: "windows", aliases: ["Windows desktop"] },
  { id: "postgresql", name: "PostgreSQL", category: "data", icon: "postgresql" },
  { id: "sqlite", name: "SQLite", category: "data", icon: "sqlite" },
  { id: "supabase", name: "Supabase", category: "data", icon: "supabase" },
  { id: "drizzle", name: "Drizzle", category: "data", icon: "drizzle" },
  { id: "json", name: "JSON", category: "data", icon: "json" },
  { id: "git", name: "Git / GitHub", category: "tooling", icon: "git", aliases: ["Git", "GitHub"] },
  { id: "gradle", name: "Gradle", category: "tooling", icon: "gradle" },
  { id: "pnpm", name: "pnpm", category: "tooling", icon: "pnpm" },
  { id: "vitest", name: "Vitest", category: "tooling", icon: "vitest" },
  { id: "powershell", name: "PowerShell", category: "tooling", icon: "powershell" },
  { id: "pyinstaller", name: "PyInstaller", category: "tooling", icon: "pyinstaller" },
];

const byLabel = new Map<string, Technology>();
for (const tech of technologies) {
  for (const label of [tech.name, ...(tech.aliases ?? [])]) byLabel.set(label.toLowerCase(), tech);
}

export function resolveTech(label: string): Technology | undefined {
  return byLabel.get(label.trim().toLowerCase());
}

export function getTech(id: string): Technology | undefined {
  return technologies.find((tech) => tech.id === id);
}
