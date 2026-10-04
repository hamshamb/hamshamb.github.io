import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import { getTech, resolveTech, technologies } from "../content/tech.ts";
import { techIcons } from "../content/tech-icons.ts";
import { formatHours, liveSocials, personal } from "../content/personal.ts";
import { LIFETIME, MAX_HOPS, moveNode, newSim, send, tick } from "../lib/relay-sim.ts";

const root = new URL("..", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");
const built = (path) => (existsSync(new URL(`dist/client/${path}`, root)) ? read(`dist/client/${path}`) : "");
const portfolioData = read("content/portfolio.ts");

test("technology registry resolves every label it claims, without duplicates", () => {
  const ids = technologies.map((tech) => tech.id);
  assert.equal(new Set(ids).size, ids.length, "duplicate technology id");
  const labels = technologies.flatMap((tech) => [tech.name, ...(tech.aliases ?? [])].map((label) => label.toLowerCase()));
  assert.equal(new Set(labels).size, labels.length, "two technologies share a label");
  const slugs = technologies.map((tech) => tech.skillSlug).filter(Boolean);
  assert.equal(new Set(slugs).size, slugs.length, "duplicate skill slug");
  for (const tech of technologies) {
    assert.equal(resolveTech(tech.name), tech);
    assert.equal(resolveTech(`  ${tech.name.toUpperCase()} `), tech, "resolution ignores case and spacing");
    if (tech.icon) assert.ok(techIcons[tech.icon] || ["java", "csharp", "windows", "powershell", "pyinstaller", "cplusplus"].includes(tech.icon), `${tech.id} points at a missing icon`);
  }
  assert.equal(resolveTech("definitely not a technology"), undefined);
});

test("project stacks resolve to known technologies where they should", () => {
  for (const label of ["TypeScript", "React", "PostgreSQL", "Java", "C#", "Python", "SQLite", "Rust", "Next.js", "Supabase"]) {
    assert.ok(resolveTech(label), `${label} should resolve`);
  }
  assert.equal(resolveTech("Python").skillSlug, "python");
  assert.equal(resolveTech("C#").skillSlug, "csharp");
  assert.equal(resolveTech("Tauri").icon, undefined, "the Tauri mark is not used (licence)");
  assert.equal(getTech("java").icon && techIcons[getTech("java").icon], undefined, "no substitute logo for Java");
});

test("logos are local data with attribution, never hotlinked", () => {
  for (const [id, icon] of Object.entries(techIcons)) {
    assert.match(icon.hex, /^[0-9A-F]{6}$/i, `${id} hex`);
    assert.match(icon.path, /^[Mm][\d.\s,MmLlHhVvCcSsQqTtAaZz-]+$/, `${id} path is plain path data`);
  }
  const doc = read("docs/third-party-logos.md");
  assert.match(doc, /Simple Icons/);
  assert.match(doc, /trademark/);
});

test("unknown personal stats are absent, never zero", () => {
  assert.equal(formatHours(undefined), undefined);
  assert.equal(formatHours(0), undefined);
  assert.equal(formatHours(1842), "1,842h");
  assert.ok(personal.games.length >= 10);
  for (const game of personal.games) assert.equal(game.playtimeHours, undefined, `${game.title} has an invented playtime`);
  assert.deepEqual(personal.cubing, {});
  assert.equal(personal.minecraft.playtimeHours, undefined);
  assert.deepEqual(liveSocials().map((social) => social.id), ["github", "email"], "only socials with real URLs render");
});

test("the relay simulation spreads copies, waits, delivers and expires", () => {
  let sim = send(newSim());
  assert.equal(sim.status, "queued");
  for (let i = 0; i < 4; i += 1) sim = tick(sim);
  assert.equal(sim.status, "in mesh", "the default layout leaves a gap before the recipient");
  assert.equal(sim.holding.friend, undefined);
  const carried = tick(moveNode(sim, "c", 80));
  assert.equal(carried.status, "delivered");
  assert.ok(carried.holding.friend <= MAX_HOPS);
  let stranded = sim;
  for (let i = 0; i <= LIFETIME; i += 1) stranded = tick(stranded);
  assert.equal(stranded.status, "expired");
  assert.deepEqual(stranded.holding, {});
});

test("the blog exists as a route, while the home page still has no writing section", () => {
  const home = built("index.html");
  const index = built("blog.html");
  const post = built("blog/why-i-made-rivet.html");
  assert.ok(index && post, "build first: npm run build");
  assert.doesNotMatch(home, /id="writing"/);
  assert.match(index, /writing\./);
  assert.match(index, /href="\/blog\/why-i-made-rivet"/);
  assert.match(index, /min read/);
  assert.match(portfolioData, /export const futureWriting/, "unwritten ideas stay unpublished, not turned into fake posts");
});

test("the Rivet post is honest, linked both ways, and has article metadata", () => {
  const post = built("blog/why-i-made-rivet.html");
  const caseStudy = built("work/rivet.html");
  assert.match(post, /<h1 id="post-title"/);
  assert.match(post, /rel="canonical" href="https:\/\/hamshamb\.github\.io\/blog\/why-i-made-rivet"/);
  assert.match(post, /"@type":"BlogPosting"/);
  assert.match(post, /property="article:published_time"/);
  assert.match(post, /<time dateTime="2026-10-04"/);
  assert.match(post, /href="\/work\/rivet"/);
  assert.match(caseStudy, /href="\/blog\/why-i-made-rivet"/);
  for (const honest of [/at most six hours/, /no independent security review/, /field testing has not been done/, /conceptual simulation/, /does not solve/]) {
    assert.match(post, honest);
  }
  assert.doesNotMatch(post, /anonymous messenger|battle[- ]tested|production[- ]ready|is audited|military[- ]grade/i);
  // figures are islands; the prose is static and complete without JavaScript
  const text = post.replace(/<script[\s\S]*?<\/script>/g, "");
  for (const heading of ["the annoying question.", "why there is no routing table.", "where it is right now."]) assert.match(text, new RegExp(heading.replace(".", "\\.")));
});
