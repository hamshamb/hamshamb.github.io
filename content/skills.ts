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
  /** kicker: one honest line about what runs; keys: shown as keyboard hints under the demo. */
  demo: { title: string; kicker: string; note: string; keys?: string[] };
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
      title: "signal snake",
      kicker: "python · the browser game is TypeScript",
      note: "the game on this page runs in your browser, written in TypeScript: snake.ts holds the rules and a canvas renderer (not shown here) draws them. snake.py is the same core game for a terminal: same walls, same self-collision, same speed-up per apple. nothing here runs Python in the browser. the browser version adds visual extras on top: a combo, a rare bonus item, particles and a skin. there may be a bug in the python.",
      keys: ["arrows / wasd steer", "space / p pause", "r restarts", "swipe or use the pad on touch"],
    },
    docs: { label: "docs.python.org", href: "https://docs.python.org/3/" },
  },
  {
    slug: "typescript",
    name: "TypeScript",
    techId: "typescript",
    line: "where most of the bigger projects here ended up.",
    intro: "StudyFilter, Rivet, AreUHuman, TinyPaste, Inkline and MX's app layer are all TypeScript. a lot of that code is state machines pretending to be something else.",
    files: [
      { name: "factory.ts", path: "lib/demos/factory.ts", lang: "typescript" },
      { name: "compile.ts", path: "lib/demos/compile.ts", lang: "typescript" },
    ],
    demo: {
      title: "type factory",
      kicker: "typescript · runs the files it shows",
      note: "the machine runs exactly the files on the left: factory.ts decides whether a wire is allowed and compile.ts holds the three puzzles. the drawing around them is not shown. the type check is a tiny structural one written for this page, not the real TypeScript compiler.",
      keys: ["tab to a port, enter to pick", "esc drops the selected source"],
    },
    docs: { label: "typescriptlang.org", href: "https://www.typescriptlang.org/docs/" },
  },
  {
    slug: "react",
    name: "React",
    techId: "react",
    line: "for interfaces that have to keep track of more than they show.",
    intro: "StudyFilter, AreUHuman and Inkline are React; Rivet is React Native. this demo is a toy: add parts to a canvas and see which state is shared, which is passed down and which is derived.",
    files: [
      { name: "ComponentLab.tsx", path: "components/skills/ComponentLab.tsx", lang: "tsx" },
      { name: "lab.ts", path: "lib/demos/lab.ts", lang: "typescript" },
    ],
    demo: {
      title: "component lab",
      kicker: "react · runs the component it shows",
      note: "the lab on the right is this component: ComponentLab.tsx is the file on the left and lab.ts is its reducer. counters and toggles keep their own useState, shared counters read one store, panels pass a label prop down, and the numbers under the canvas are derived on every render. the motion library does the animation.",
      keys: ["tab through the parts", "enter adds or presses", "← → reorder"],
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
      title: "session lobby",
      kicker: "java · illustrative model",
      note: "an illustrative Java model written for this page, not Nexus source. the lobby beside it runs in the browser as a TypeScript state machine that follows the same allowed transitions as SessionState.next(); a test keeps the two in step. tokens are invented and expire after 90 seconds.",
      keys: ["enter  next step", "tab  to the fault buttons"],
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
      title: "review desk",
      kicker: "c# · illustrative model",
      note: "an illustrative C# model written for this page, not CHC Review Studio source. the desk beside it runs in the browser on a made-up paragraph; its rules (evidence must sit inside the text, open counts by severity) mirror Review.cs and are tested against it.",
      keys: ["← →  move between phrases", "space  select", "shift + arrows  extend", "c  create finding", "esc  clear"],
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
      title: "ui mutation lab",
      kicker: "html / css · styled by the css it shows",
      note: "the controls only write custom properties and data attributes. the card is the markup in card.html, adapting through app/demo-card.css: variables for the numbers, a container query for the layout. the one thing the lab will not stop you doing is making it worse.",
      keys: ["tab + arrows  sliders", "click a preset for quick widths"],
    },
    docs: { label: "MDN", href: "https://developer.mozilla.org/docs/Web" },
  },
];

export function getSkill(slug: string) {
  return skillPages.find((skill) => skill.slug === slug);
}
