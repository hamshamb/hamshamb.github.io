import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const html = readFileSync(new URL("../dist/client/index.html", import.meta.url), "utf8");
const portfolioData = readFileSync(new URL("../app/portfolio-data.ts", import.meta.url), "utf8");

test("static export contains the portfolio OS and accessible navigation", () => {
  assert.match(html, /hamshamb/);
  assert.match(html, /PORTFOLIO\/OS v3\.0/);
  assert.match(html, /FILTERING FORKS/);
  assert.match(html, /FIELD NOTES/);
  assert.doesNotMatch(html, /codex-preview|SkeletonPreview|Your site is taking shape/);
});

test("metadata describes the expanded portfolio", () => {
  assert.match(html, /hamshamb — Developer, OSINT &amp; Open Source/);
  assert.match(html, /student developer exploring open-source software, OSINT, systems, and geopolitics/);
  assert.match(html, /og\.png/);
  assert.match(html, /application\/ld\+json/);
});

test("portfolio contains five original public project records", () => {
  const projectSection = portfolioData.split("const blog: BlogPost[]")[0];
  assert.equal((projectSection.match(/slug: "/g) ?? []).length, 5);
  for (const slug of ["nexus", "chc-review-studio", "areuhuman", "studyfilter", "pyforge"]) {
    assert.match(projectSection, new RegExp('slug: "' + slug + '"'));
  }
  for (const fork of ["deanonymizer", "protestchat", "wappix", "worldwideview-local-"]) {
    assert.doesNotMatch(projectSection, new RegExp('slug: "' + fork + '"'));
  }
});

test("field notes contain three complete entries", () => {
  const blogSection = portfolioData.split("const blog: BlogPost[]")[1].split("export const portfolio")[0];
  assert.equal((blogSection.match(/slug: "/g) ?? []).length, 3);
  assert.match(blogSection, /OSINT starts with restraint/);
  assert.match(blogSection, /Why I kept the terminal/);
  assert.match(blogSection, /Geopolitics is a systems problem/);
});

test("release log remains derived newest-first", () => {
  assert.match(portfolioData, /releaseLog = \[\.\.\.projects\]\.sort\(\(a, b\) => b\.releasedOn\.localeCompare\(a\.releasedOn\)\)/);
  assert.match(portfolioData, /slug: "studyfilter"[\s\S]*?releasedOn: "2026-06-25"/);
  assert.match(portfolioData, /slug: "areuhuman"[\s\S]*?releasedOn: "2026-08-15"/);
  assert.match(portfolioData, /slug: "pyforge"[\s\S]*?releasedOn: "2025-10-15"/);
});

test("dedicated developer contact is used", () => {
  assert.match(portfolioData, /hamshambdev@gmail\.com/);
  assert.doesNotMatch(portfolioData, /deadender9677/);
});
