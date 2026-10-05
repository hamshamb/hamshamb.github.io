import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { accepts, initial, MAX_ATTEMPTS, transition } from "../lib/demos/connection.ts";
import { DELAY_STEP, memoryStore, MIN_DELAY, newGame, recordScore, START_DELAY, steer, step } from "../lib/snake.ts";
import { technologies } from "../content/tech.ts";

const root = new URL("..", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");
const dist = new URL("dist/client/", root);
const built = (path) => (existsSync(new URL(path, dist)) ? readFileSync(new URL(path, dist), "utf8") : "");
const slugs = ["python", "typescript", "react", "java", "csharp", "html-css"];
const fixed = () => 0.5;

test("snake: moves, grows, speeds up, and dies on walls and itself", () => {
  let game = { ...newGame(20, 16, fixed), status: "playing" };
  const head = game.snake[0];
  game = step(game, fixed);
  assert.deepEqual(game.snake[0], { x: head.x + 1, y: head.y }, "moves right by default");
  assert.equal(game.snake.length, 3);

  // put food right in front: it grows, scores and gets faster
  game = { ...game, food: { x: game.snake[0].x + 1, y: game.snake[0].y } };
  game = step(game, fixed);
  assert.equal(game.score, 1);
  assert.equal(game.snake.length, 4);
  assert.equal(game.delay, START_DELAY - DELAY_STEP);
  assert.ok(!game.snake.some((part) => part.x === game.food.x && part.y === game.food.y), "new food never lands on the snake");

  // reversing into your own neck is ignored
  assert.equal(steer(game, "left").queue.length, 0);

  let wall = { ...newGame(20, 16, fixed), status: "playing" };
  for (let i = 0; i < 30 && wall.status === "playing"; i += 1) wall = step(wall, fixed);
  assert.equal(wall.status, "over", "the right wall ends the game");

  const coiled = { ...newGame(20, 16, fixed), status: "playing", direction: "up", snake: [{ x: 5, y: 5 }, { x: 5, y: 6 }, { x: 6, y: 6 }, { x: 6, y: 5 }, { x: 6, y: 4 }], queue: ["right"] };
  assert.equal(step(coiled, fixed).status, "over", "running into your own body ends the game");

  const capped = { ...newGame(20, 16, fixed), status: "playing", delay: MIN_DELAY };
  const ate = step({ ...capped, food: { x: capped.snake[0].x + 1, y: capped.snake[0].y } }, fixed);
  assert.equal(ate.delay, MIN_DELAY, "speed has a ceiling");
});

test("snake: best score persists through any store, including none", () => {
  const store = memoryStore();
  assert.equal(recordScore(store, 7), 7);
  assert.equal(recordScore(store, 3), 7);
  assert.equal(store.get(), 7);
});

test("typescript demo: the connection machine only moves the way it says", () => {
  let [state, ctx] = initial;
  assert.deepEqual(accepts(state, ctx), ["connect"]);
  [state, ctx] = transition(state, { type: "connect" }, ctx);
  assert.equal(state, "connecting");
  for (let i = 0; i < MAX_ATTEMPTS; i += 1) [state, ctx] = transition(state, { type: "timeout" }, ctx);
  assert.equal(state, "retrying");
  [state, ctx] = transition(state, { type: "timeout" }, ctx);
  assert.equal(state, "failed");
  assert.deepEqual(accepts(state, ctx), ["reset"]);
  assert.deepEqual(transition("connected", { type: "connect" }, { attempts: 0 }), ["connected", { attempts: 0 }]);
});

test("skill pages exist, show real code, and say when it is not what runs", () => {
  const registry = technologies.filter((tech) => tech.skillSlug).map((tech) => tech.skillSlug).sort();
  assert.deepEqual(registry, [...slugs].sort());
  const index = built("skills.html");
  assert.match(index, /things i use\./);
  for (const slug of slugs) {
    const page = built(`skills/${slug}.html`);
    assert.ok(page, `missing /skills/${slug}`);
    assert.match(page, /class="code-panel"/);
    assert.match(page, new RegExp(`rel="canonical" href="https://hamshamb\\.github\\.io/skills/${slug}"`));
    assert.match(index, new RegExp(`href="/skills/${slug}"`));
  }
  assert.match(built("skills/python.html"), /nothing here runs Python in the browser/);
  assert.match(built("skills/java.html"), /not Nexus source/);
  assert.match(built("skills/csharp.html"), /not CHC Review Studio source/);
  assert.match(built("skills/typescript.html"), /runs exactly the file on the left/);
  // the TypeScript page shows the very file its demo imports
  const shown = read("lib/demos/connection.ts").split("\n").find((line) => line.startsWith("export const MAX_ATTEMPTS"));
  assert.ok(built("skills/typescript.html").includes("MAX_ATTEMPTS"), shown);
  // the HTML/CSS demo uses the markup it shows
  const markup = read("content/snippets/card.html");
  const demo = read("components/skills/MutationLab.tsx");
  for (const cls of markup.match(/class="([\w-]+)"/g)) assert.ok(demo.includes(cls.replace("class=", "className=")), `${cls} missing from the demo`);
});

test("no live code execution anywhere", () => {
  const walk = (dir) => readdirSync(new URL(dir, root), { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? walk(join(dir, entry.name)) : [join(dir, entry.name).replaceAll("\\", "/")],
  );
  for (const file of [...walk("components"), ...walk("lib"), ...walk("app")].filter((name) => /\.(t|j)sx?$/.test(name))) {
    assert.doesNotMatch(read(file), /\beval\(|new Function\(/, `${file} executes code`);
  }
});

test("demos stay on their own pages", () => {
  const chunks = (html) => [...html.matchAll(/chunks\/([A-Za-z0-9]+)-[\w-]+\.js/g)].map((match) => match[1]);
  const home = chunks(built("index.html"));
  for (const demo of ["SnakeDemo", "ConnectionDemo", "ExperimentQueue", "SessionLobby", "ReviewDesk", "MutationLab", "CodePanel"]) {
    assert.ok(!home.includes(demo), `${demo} loads on the home page`);
  }
  assert.ok(chunks(built("skills/python.html")).includes("SnakeDemo"));
  assert.ok(!chunks(built("skills/python.html")).includes("ReviewDesk"), "a skill page loads only its own demo");
});

test("every internal link points at a page that exists, and ids are unique", () => {
  const pages = [];
  const walk = (dir) => {
    for (const entry of readdirSync(new URL(dir, dist), { withFileTypes: true })) {
      const path = `${dir}${entry.name}`;
      if (entry.isDirectory() && !path.startsWith("_next")) walk(`${path}/`);
      else if (entry.name.endsWith(".html") && !entry.name.startsWith("__")) pages.push(path);
    }
  };
  walk("");
  const exists = (href) => {
    const path = href.split("#")[0].replace(/^\//, "");
    if (!path) return true;
    return [path, `${path}.html`, `${path}/index.html`].some((candidate) => existsSync(new URL(candidate, dist)));
  };
  for (const page of pages) {
    const html = built(page).replace(/<script[\s\S]*?<\/script>/g, "");
    for (const [, href] of html.matchAll(/href="(\/[^"]*)"/g)) {
      if (href.startsWith("/_next")) continue;
      assert.ok(exists(href), `${page} links to missing ${href}`);
    }
    const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
    const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
    assert.deepEqual(dupes, [], `${page} repeats ids`);
  }
  const sitemap = read("public/sitemap.xml");
  for (const path of ["/blog", "/blog/why-i-made-rivet", "/skills", ...slugs.map((slug) => `/skills/${slug}`), "/stuff/cubing"]) {
    assert.match(sitemap, new RegExp(`<loc>https://hamshamb\\.github\\.io${path}</loc>`));
  }
});
