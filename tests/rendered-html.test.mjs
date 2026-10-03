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
const stuffSource = read("components/home/StuffSection.tsx");
const writingSource = read("components/home/ClosingSections.tsx");

const slugs = ["nexus", "chc-review-studio", "areuhuman", "studyfilter", "pyforge"];

test("homepage is the actual portfolio, not portfolio documentation", () => {
  assert.match(html, /hamshamb/);
  assert.match(html, /student who makes stuff/);
  assert.match(html, /mostly software\. occasionally questionable decisions/);
  for (const id of ["work", "log", "about", "stuff", "writing", "contact"]) {
    assert.match(html, new RegExp(`id="${id}"`), `missing section #${id}`);
  }
  assert.match(html, /things i made\./);
  assert.doesNotMatch(html, /Your site is taking shape|I follow signals|I build systems|Curiosity is the operating system/);
});

test("all content is server rendered, not hidden behind client-side views", () => {
  for (const slug of slugs) assert.match(html, new RegExp(`href="/work/${slug}"`));
  assert.match(html, /hi, i&#x27;m hamshamb\.|hi, i'm hamshamb\./);
  assert.match(html, /nothing here yet/);
});

test("metadata uses the human voice", () => {
  assert.match(html, /<title>hamshamb · student who makes stuff<\/title>/);
  assert.match(html, /Software, Minecraft experiments, random tools/);
  assert.match(html, /og\.png/);
  assert.match(html, /application\/ld\+json/);
  assert.match(html, /rel="canonical" href="https:\/\/hamshamb\.github\.io\/?"/);
});

test("every original project has its own exported case study", () => {
  for (const slug of slugs) {
    const page = read(`dist/client/work/${slug}.html`);
    assert.match(page, /<h1 id="case-title"/);
    assert.match(page, new RegExp(`rel="canonical" href="https://hamshamb\\.github\\.io/work/${slug}"`));
    assert.match(page, /the technical bits\./);
    assert.match(sitemap, new RegExp(`<loc>https://hamshamb\\.github\\.io/work/${slug}</loc>`));
  }
  assert.match(notFound, /this page doesn/);
});

test("portfolio contains five original public projects", () => {
  assert.equal((portfolioData.match(/slug: "/g) ?? []).length, 5);
  for (const slug of slugs) {
    assert.match(portfolioData, new RegExp('slug: "' + slug + '"'));
  }
  for (const fork of ["deanonymizer", "protestchat", "wappix", "worldwideview", "bentopdf", "convert"]) {
    assert.doesNotMatch(portfolioData, new RegExp(`hamshamb/${fork}\\b`, "i"));
  }
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
  for (const match of portfolioData.matchAll(/src: "(\/work\/[^"]+)"/g)) {
    const file = new URL(`public${match[1]}`, root);
    assert.ok(existsSync(file), `missing ${match[1]}`);
    assert.ok(statSync(file).size < 120_000, `${match[1]} is larger than expected`);
  }
});

test("fake essays are gone and writing is intentionally empty", () => {
  assert.doesNotMatch(portfolioData, /OSINT starts with restraint|Why I kept the terminal|Geopolitics is a systems problem/);
  assert.doesNotMatch(portfolioData, /const blog/);
  assert.match(writingSource, /nothing here yet/);
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
  assert.match(portfolioData, /releaseLog = \[\.\.\.projects\]\.sort\(\(a, b\) => b\.releasedOn\.localeCompare\(a\.releasedOn\)\)/);
  assert.match(portfolioData, /slug: "nexus"[\s\S]*?releasedOn: "2026-08-31"/);
  assert.match(portfolioData, /slug: "pyforge"[\s\S]*?releasedOn: "2025-10-15"/);
});

test("dedicated developer contact is used", () => {
  assert.match(siteData, /hamshambdev@gmail\.com/);
  assert.doesNotMatch(portfolioData + siteData, /deadender9677/);
  assert.match(html, /href="mailto:hamshambdev@gmail\.com"/);
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
