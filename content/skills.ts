import type { Lang } from "@/lib/highlight";
import type { SkillSlug } from "./tech";

/**
 * The six skills that get a playground page. Each shows real code beside a live demo. When the
 * code is not literally what runs in the browser, the page says so.
 */

export type SkillFile = { name: string; path: string; lang: Lang };

export type SkillPage = {
  slug: SkillSlug;
  name: string;
  techId: string;
  line: string;
  intro: string;
  files: SkillFile[];
  demo: { title: string; note: string };
  docs: { label: string; href: string };
};

export const skillPages: SkillPage[] = [
  {
    slug: "python",
    name: "Python",
    techId: "python",
    line: "one of the first languages that turned \"i wonder if...\" into actual programs.",
    intro: "PyForge is Python all the way down: a Tkinter app that wraps PyInstaller. the playground here is smaller and sillier.",
    files: [
      { name: "snake.py", path: "content/snippets/snake.py", lang: "python" },
      { name: "snake.ts", path: "lib/snake.ts", lang: "typescript" },
    ],
    demo: {
      title: "snake",
      note: "the game on this page runs in your browser, written in TypeScript (snake.ts). snake.py is the same game for a terminal: same board rules, same speed-up per apple. nothing here runs Python in the browser.",
    },
    docs: { label: "docs.python.org", href: "https://docs.python.org/3/" },
  },
  {
    slug: "typescript",
    name: "TypeScript",
    techId: "typescript",
    line: "where most of the bigger projects here ended up.",
    intro: "StudyFilter, Rivet, AreUHuman, TinyPaste, Inkline and MX's app layer are all TypeScript. a lot of that code is state machines pretending to be something else.",
    files: [{ name: "connection.ts", path: "lib/demos/connection.ts", lang: "typescript" }],
    demo: {
      title: "a typed connection lifecycle",
      note: "the panel on the right runs exactly the file on the left. every button is an event; disabled ones would not change anything from the current state.",
    },
    docs: { label: "typescriptlang.org", href: "https://www.typescriptlang.org/docs/" },
  },
  {
    slug: "react",
    name: "React",
    techId: "react",
    line: "for interfaces that have to keep track of more than they show.",
    intro: "StudyFilter, AreUHuman and Inkline are React; Rivet is React Native. this demo is a tiny board for where my ideas tend to end up.",
    files: [{ name: "ExperimentQueue.tsx", path: "components/skills/ExperimentQueue.tsx", lang: "tsx" }],
    demo: {
      title: "experiment queue",
      note: "the board on the right is this component. state lives in one reducer; the counts and the \"probably broken\" warning are derived, not stored.",
    },
    docs: { label: "react.dev", href: "https://react.dev/" },
  },
  {
    slug: "java",
    name: "Java",
    techId: "java",
    line: "because Minecraft mods are written in it, and then it was networking.",
    intro: "Nexus is a Fabric mod, so it is Java: session state machines, a versioned protocol and short-lived invites.",
    files: [{ name: "Session.java", path: "content/snippets/Session.java", lang: "java" }],
    demo: {
      title: "a session, step by step",
      note: "an illustrative Java model written for this page, not Nexus source. the visualisation beside it runs in the browser and follows the same allowed transitions.",
    },
    docs: { label: "dev.java", href: "https://dev.java/learn/" },
  },
  {
    slug: "csharp",
    name: "C#",
    techId: "csharp",
    line: "for desktop tools that need to be fast, local and a bit strict.",
    intro: "CHC Review Studio is C# and WPF. the idea it is built on: a finding should always point at the exact text that caused it.",
    files: [{ name: "Review.cs", path: "content/snippets/Review.cs", lang: "csharp" }],
    demo: {
      title: "evidence-first review",
      note: "an illustrative C# model written for this page, not CHC Review Studio source. the review panel beside it runs in the browser on made-up sample text.",
    },
    docs: { label: "learn.microsoft.com", href: "https://learn.microsoft.com/dotnet/csharp/" },
  },
  {
    slug: "html-css",
    name: "HTML / CSS",
    techId: "html-css",
    line: "everything on the web ends up here eventually, including this site.",
    intro: "semantic markup, custom properties, container queries and nothing clever in JavaScript. the card on the right is styled by the CSS on the left.",
    files: [
      { name: "card.html", path: "content/snippets/card.html", lang: "html" },
      { name: "card.css", path: "app/demo-card.css", lang: "css" },
    ],
    demo: {
      title: "one card, many widths",
      note: "change the width, theme and density. the only JavaScript is the controls; the card itself adapts with a container query and CSS variables.",
    },
    docs: { label: "MDN", href: "https://developer.mozilla.org/docs/Web" },
  },
];

export function getSkill(slug: string) {
  return skillPages.find((skill) => skill.slug === slug);
}
