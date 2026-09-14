import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const html = readFileSync(new URL("../dist/client/index.html", import.meta.url), "utf8");
const nowEntry = readFileSync(new URL("../dist/client/now/index.html", import.meta.url), "utf8");
const portfolioData = readFileSync(new URL("../app/portfolio-data.ts", import.meta.url), "utf8");
const terminalSource = readFileSync(new URL("../app/TerminalOS.tsx", import.meta.url), "utf8");

test("homepage is the actual portfolio, not portfolio documentation", () => {
  assert.match(html, /hamshamb/);
  assert.match(html, /student who makes stuff/);
  assert.match(html, /mostly software\. occasionally questionable decisions/);
  assert.match(html, /PROJECTS/);
  assert.match(html, /STUFF/);
  assert.match(html, /WRITING/);
  assert.doesNotMatch(html, /Your site is taking shape|I follow signals|I build systems|Curiosity is the operating system/);
});

test("metadata uses the human voice", () => {
  assert.match(html, /hamshamb — student who makes stuff/);
  assert.match(html, /Software, Minecraft experiments, random tools/);
  assert.match(html, /og\.png/);
  assert.match(html, /application\/ld\+json/);
});

test("portfolio contains five original public projects", () => {
  assert.equal((portfolioData.match(/slug: "/g) ?? []).length, 5);
  for (const slug of ["nexus", "chc-review-studio", "areuhuman", "studyfilter", "pyforge"]) {
    assert.match(portfolioData, new RegExp('slug: "' + slug + '"'));
  }
  for (const fork of ["deanonymizer", "protestchat", "wappix", "worldwideview-local-"]) {
    assert.doesNotMatch(portfolioData, new RegExp('slug: "' + fork + '"'));
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

test("fake essays are gone and writing is intentionally empty", () => {
  assert.doesNotMatch(portfolioData, /OSINT starts with restraint|Why I kept the terminal|Geopolitics is a systems problem/);
  assert.doesNotMatch(portfolioData, /const blog/);
  assert.match(terminalSource, /nothing here yet/);
  assert.match(terminalSource, /they sounded like chatgpt wrote them/);
});

test("stuff and now are real sections", () => {
  assert.match(terminalSource, /this page has no professional purpose/);
  assert.match(terminalSource, /making this website stop sounding like chatgpt/);
  assert.match(portfolioData, /september 2026/);
  assert.match(portfolioData, /building Nexus/);
  assert.match(portfolioData, /school, unfortunately/);
  assert.match(nowEntry, /\/#now/);
});

test("release log remains newest-first", () => {
  assert.match(portfolioData, /releaseLog = \[\.\.\.projects\]\.sort\(\(a, b\) => b\.releasedOn\.localeCompare\(a\.releasedOn\)\)/);
  assert.match(portfolioData, /slug: "nexus"[\s\S]*?releasedOn: "2026-08-31"/);
  assert.match(portfolioData, /slug: "pyforge"[\s\S]*?releasedOn: "2025-10-15"/);
});

test("dedicated developer contact is used", () => {
  assert.match(portfolioData, /hamshambdev@gmail\.com/);
  assert.doesNotMatch(portfolioData, /deadender9677/);
});
