import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const root = new URL("..", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");

const html = read("dist/client/index.html");
const nowEntry = read("dist/client/now/index.html");
const notFound = read("dist/client/404.html");
const sitemap = read("dist/client/sitemap.xml");
const portfolioData = read("content/portfolio.ts");
const siteData = read("content/site.ts");
const paletteSource = read("components/ui/CommandPalette.tsx");
const stuffSource = read("components/home/StuffSection.tsx");

const slugs = ["studyfilter", "rivet", "nexus", "areuhuman", "chc-review-studio", "pyforge"];
const forkNames = ["worldwideview", "bentopdf", "convert", "wappix", "protestchat", "deanonymizer"];

/** The text of the HTML with tags removed, so split words read as a sentence. */
const text = html.replace(/<script[\s\S]*?<\/script>/g, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");

test("homepage is the actual portfolio, not portfolio documentation", () => {
  assert.match(text, /i build things i wish existed\./);
  assert.match(text, /student developer \/ india \/ coding since 2021/i);
  assert.match(text, /software, tools and experiments built from curiosity, irritation, or both\./);
  for (const id of ["work", "lab", "more", "journey", "about", "stuff", "contact"]) {
    assert.match(html, new RegExp(`id="${id}"`), `missing section #${id}`);
  }
  assert.doesNotMatch(html, /Your site is taking shape|I follow signals|I build systems|Curiosity is the operating system/);
});

test("writing is hidden from every public surface but kept in content", () => {
  assert.doesNotMatch(html, /id="writing"/);
  assert.doesNotMatch(text, /nothing here yet|things i might genuinely write/);
  assert.doesNotMatch(siteData, /id: "writing"/);
  assert.doesNotMatch(paletteSource, /writing/);
  assert.doesNotMatch(sitemap, /writing/);
  assert.match(portfolioData, /Writing is intentionally hidden for now/);
  assert.match(portfolioData, /export const futureWriting/);
});

test("all content is server rendered, not hidden behind client-side views", () => {
  for (const slug of slugs) assert.match(html, new RegExp(`href="/work/${slug}"`));
  assert.match(text, /hi, i&#x27;m hamshamb\.|hi, i'm hamshamb\./);
  assert.match(text, /things i keep falling into\./);
});

test("metadata uses the human voice", () => {
  assert.match(html, /<title>hamshamb · i build things i wish existed<\/title>/);
  assert.match(html, /coding since 2021/);
  assert.match(html, /og\.png/);
  assert.match(html, /application\/ld\+json/);
  assert.match(html, /rel="canonical" href="https:\/\/hamshamb\.github\.io\/?"/);
});

test("every flagship project has its own exported case study", () => {
  for (const slug of slugs) {
    const page = read(`dist/client/work/${slug}.html`);
    assert.match(page, /<h1 id="case-title"/);
    assert.match(page, new RegExp(`rel="canonical" href="https://hamshamb\\.github\\.io/work/${slug}"`));
    assert.match(page, /the technical bits\./);
    assert.match(sitemap, new RegExp(`<loc>https://hamshamb\\.github\\.io/work/${slug}</loc>`));
  }
  assert.match(notFound, /this page doesn/);
});

test("rivet stays honestly unreleased", () => {
  const page = read("dist/client/work/rivet.html");
  assert.match(page, /deliberately not pretending/);
  assert.match(page, /has not had an independent security review/);
  assert.match(page, /source not public yet/);
  assert.doesNotMatch(page, /battle tested|production ready|audited|anonymous messenger/i);
  assert.doesNotMatch(portfolioData, /slug: "rivet"[\s\S]*?releasedOn:[\s\S]*?slug: "nexus"/);
});

test("portfolio contains six flagship projects and no forks presented as mine", () => {
  assert.equal((portfolioData.match(/slug: "/g) ?? []).length, 6);
  for (const slug of slugs) assert.match(portfolioData, new RegExp('slug: "' + slug + '"'));
  for (const fork of forkNames) {
    assert.doesNotMatch(portfolioData, new RegExp(`slug: "${fork}"`, "i"));
    assert.doesNotMatch(portfolioData, new RegExp(`source: "https://github\\.com/hamshamb/${fork}"`, "i"));
  }
  assert.match(portfolioData, /Original authorship belongs upstream/);
  assert.match(text, /forks \/ things i(&#x27;|&rsquo;|’|')ve explored\./);
  assert.equal((html.match(/class="fork-badge mono"/g) ?? []).length, forkNames.length);
});

test("real dates are preserved and journey stages carry no dates", () => {
  for (const [slug, date] of [["studyfilter", "2026-06-25"], ["nexus", "2026-08-31"], ["areuhuman", "2026-08-15"], ["chc-review-studio", "2026-08-30"], ["pyforge", "2025-10-15"]]) {
    assert.match(portfolioData, new RegExp(`slug: "${slug}"[\\s\\S]*?releasedOn: "${date}"`));
  }
  assert.match(portfolioData, /name: "TinyPaste"[\s\S]*?startedOn: "2026-09-15"/);
  assert.match(portfolioData, /name: "Inkline"[\s\S]*?startedOn: "2026-09-17"/);
  const stages = portfolioData.slice(portfolioData.indexOf("export const journey:"), portfolioData.indexOf("export type JourneyEvent"));
  assert.doesNotMatch(stages, /\d{4}-\d{2}-\d{2}/);
  for (const year of [2021, 2022, 2023, 2024, 2025, 2026]) assert.match(text, new RegExp(String(year)));
  assert.match(text, /in development/);
});

test("project openings are human-first and technical detail remains", () => {
  assert.match(portfolioData, /turns out that is not a small problem/);
  assert.match(portfolioData, /increasingly stupid things with their fingers/);
  assert.match(portfolioData, /school websites have an incredible ability/);
  assert.match(portfolioData, /96/);
  assert.match(portfolioData, /Short-lived, single-use admission capabilities/);
  assert.match(portfolioData, /Reaction time, timing error, path drift/);
});

test("project media is local, optimised, and present", () => {
  assert.doesNotMatch(portfolioData, /raw\.githubusercontent\.com/);
  for (const match of portfolioData.matchAll(/(?:src|darkSrc): "(\/work\/[^"]+)"/g)) {
    const file = new URL(`public${match[1]}`, root);
    assert.ok(existsSync(file), `missing ${match[1]}`);
    assert.ok(statSync(file).size < 120_000, `${match[1]} is larger than expected`);
  }
});

test("stuff and now are real sections", () => {
  assert.match(stuffSource, /this page has no professional purpose/);
  assert.match(portfolioData, /september 2026/);
  assert.match(portfolioData, /building Nexus/);
  assert.match(portfolioData, /school, unfortunately/);
  assert.match(html, /id="now"/);
  assert.match(nowEntry, /\/#now/);
});

test("release log remains newest-first", () => {
  assert.match(portfolioData, /releaseLog = \[\.\.\.released\]\.sort\(\(a, b\) => b\.releasedOn\.localeCompare\(a\.releasedOn\)\)/);
});

test("dedicated developer contact is used", () => {
  assert.match(siteData, /hamshambdev@gmail\.com/);
  assert.doesNotMatch(portfolioData + siteData, /deadender9677/);
  assert.match(html, /href="mailto:hamshambdev@gmail\.com"/);
  assert.match(text, /say hi\./);
});

test("authored copy and docs never use em dashes", () => {
  const emDash = new RegExp(String.fromCharCode(0x2014));
  const files = ["README.md", "content/portfolio.ts", "content/site.ts", "app/layout.tsx", "app/globals.css"];
  const walk = (dir) => readdirSync(new URL(dir, root), { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? walk(join(dir, entry.name)) : [join(dir, entry.name)],
  );
  files.push(...walk("components"), ...walk("lib"), ...walk("app/work"));
  for (const file of files) {
    assert.doesNotMatch(read(file.replaceAll("\\", "/")), emDash, `${file} contains an em dash`);
  }
  assert.doesNotMatch(html, emDash);
});
