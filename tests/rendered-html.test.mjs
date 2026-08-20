import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const html = readFileSync(new URL("../dist/client/index.html", import.meta.url), "utf8");
const portfolioData = readFileSync(new URL("../app/portfolio-data.ts", import.meta.url), "utf8");

test("static export contains portfolio identity and accessible terminal", () => {
  assert.match(html, /hamshamb/);
  assert.match(html, /PORTFOLIO\/OS v2\.0/);
  assert.match(html, /INDEXING RELEASES/);
  assert.doesNotMatch(html, /codex-preview|SkeletonPreview|Your site is taking shape/);
});

test("static export metadata is portfolio-specific", () => {
  assert.match(html, /hamshamb — Software Developer &amp; Toolmaker/);
  assert.match(html, /creator of StudyFilter, AreUHuman, and PyForge/);
  assert.match(html, /og\.png/);
});

test("release records contain the exact public launch dates", () => {
  assert.match(portfolioData, /slug: "studyfilter"[\s\S]*?releasedOn: "2026-06-25"[\s\S]*?releaseLabel: "JUN 25, 2026"/);
  assert.match(portfolioData, /slug: "areuhuman"[\s\S]*?releasedOn: "2026-08-15"[\s\S]*?releaseLabel: "AUG 15, 2026"/);
  assert.match(portfolioData, /slug: "pyforge"[\s\S]*?releasedOn: "2025-10-15"[\s\S]*?releaseLabel: "OCT 15, 2025"/);
  assert.match(portfolioData, /WINDOWS · OPEN SOURCE · 2025/);
});

test("release log is derived newest-first from project release data", () => {
  assert.match(portfolioData, /releaseLog = \[\.\.\.projects\]\.sort\(\(a, b\) => b\.releasedOn\.localeCompare\(a\.releasedOn\)\)/);
  assert.equal((portfolioData.match(/slug: "/g) ?? []).length, 3);
});
