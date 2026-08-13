import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const html = readFileSync(new URL("../dist/client/index.html", import.meta.url), "utf8");

test("static export contains portfolio identity and accessible terminal", () => {
  assert.match(html, /hamshamb/);
  assert.match(html, /PORTFOLIO\/OS v1\.0/);
  assert.match(html, /MOUNTING PROJECTS/);
  assert.doesNotMatch(html, /codex-preview|SkeletonPreview|Your site is taking shape/);
});

test("static export metadata is portfolio-specific", () => {
  assert.match(html, /hamshamb — Software Developer &amp; Toolmaker/);
  assert.match(html, /creator of StudyFilter, AreUHuman, and PyForge/);
  assert.match(html, /og\.png/);
});
