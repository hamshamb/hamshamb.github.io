import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import { commands, fortunes, matchCommand, normalise, suggestCommands } from "../content/commands.ts";
import { mapLinks, mapNodes } from "../content/project-map.ts";
import { achievements, secrets, toys } from "../content/secrets.ts";
import { energy, step } from "../lib/physics.ts";
import { BOLTS } from "../lib/secrets-core.ts";

const root = new URL("..", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");
const built = (path) => (existsSync(new URL(`dist/client/${path}`, root)) ? read(`dist/client/${path}`) : "");

test("hidden commands match only when typed in full, and appear only once discovered", () => {
  for (const name of ["whoami", "status", "snake", "physics", "gravity off", "gravity on", "touch grass", "rabbit hole", "panic", "ship it", "sudo hire hamshamb", "fortune", "break something", "map"]) {
    assert.ok(matchCommand(name), `${name} is not a command`);
    assert.ok(matchCommand(`  ${name.toUpperCase()}  `), "case and spacing do not matter");
  }
  assert.equal(matchCommand("who"), undefined, "a prefix never reveals an undiscovered command");
  assert.equal(matchCommand("rivet"), undefined, "normal search terms are not commands");
  assert.deepEqual(suggestCommands("who", []), [], "nothing is suggested before discovery");
  assert.deepEqual(suggestCommands("who", ["cmd-whoami"]).map((c) => c.id), ["whoami"]);
  assert.equal(normalise("~$  gravity   off "), "gravity off");
  const names = commands.flatMap((c) => c.names);
  assert.equal(new Set(names).size, names.length, "two commands share a name");
  for (const command of commands) assert.ok(command.secret in secrets, `${command.secret} has no toast`);
});

test("command responses are the ones promised, in the site voice", () => {
  const run = (name) => matchCommand(name).run(() => 0);
  assert.deepEqual(run("whoami").lines, ["hamshamb", "student developer", "probably building something"]);
  assert.deepEqual(run("sudo hire hamshamb").lines, ["permission granted.", "email button unlocked."]);
  assert.deepEqual(run("ship it").lines, ["tests?"]);
  assert.deepEqual(run("break something").lines, ["please be more specific."]);
  assert.equal(run("gravity off").action.kind, "gravity");
  assert.equal(run("panic").action.kind, "panic");
  for (let i = 0; i < 20; i += 1) assert.ok(fortunes.includes(matchCommand("fortune").run(() => i / 20).lines[0]));
  const words = commands.flatMap((c) => c.run(() => 0.5).lines).join(" ");
  assert.ok(!words.includes(String.fromCharCode(0x2014)), "no em dash");
  assert.doesNotMatch(words, /unleash|synergy|passionate|rockstar/i);
});

test("toys, achievements and secrets are consistent", () => {
  for (const id of ["reaction", "fidget", "physics", "gravity", "courier", "touch-grass", "map", "snake", "rabbit"]) assert.ok(id in toys);
  for (const [id, toy] of Object.entries(toys)) if ("href" in toy) assert.match(toy.href, /^\//, `${id} must stay on this site`);
  assert.ok(Object.keys(achievements).length >= 7);
  const used = [
    read("components/toys/SecretLayer.tsx"), read("components/toys/DoNotClick.tsx"), read("components/home/MinecraftInventory.tsx"),
    read("components/toys/PacketLost.tsx"), read("components/ui/CommandPalette.tsx"),
  ].join("\n");
  for (const id of ["konami", "dev-panel", "do-not-click", "minecraft-inventory", "minecraft-craft", "bug-caught", "tech-logo", "packet-lost"]) {
    assert.ok(id in secrets, `${id} has no toast`);
    assert.ok(used.includes(`"${id}"`), `${id} is never discovered`);
  }
});

test("each bolt is placed exactly once, outside real controls", () => {
  const sources = ["components/home/Hero.tsx", "components/home/WorkSection.tsx", "components/home/JourneySection.tsx", "components/home/StuffSection.tsx", "components/layout/SiteFooter.tsx"].map(read).join("\n");
  for (const id of BOLTS) {
    const placed = (sources.match(new RegExp(`(Bolt id|bolt)="${id}"`, "g")) ?? []).length;
    assert.equal(placed, 1, `bolt ${id} is placed ${placed} times`);
  }
});

test("nothing secret is in the server HTML, and the toys load only when opened", () => {
  const home = built("index.html");
  assert.ok(home, "build first");
  assert.doesNotMatch(home, /class="bolt|toybox|class="bug|mc-inv"|dev-panel/, "secrets render only on the client");
  assert.match(home, /do not click/, "the one deliberately visible button");
  const chunks = [...home.matchAll(/chunks\/([A-Za-z0-9]+)-[\w-]+\.js/g)].map((m) => m[1]);
  for (const lazy of ["Physics", "Reaction", "Fidget", "TouchGrass", "ProjectMap", "DevPanel"]) assert.ok(!chunks.includes(lazy), `${lazy} is preloaded`);
  const layer = read("components/toys/SecretLayer.tsx");
  assert.doesNotMatch(layer, /fetch\(|sendBeacon|XMLHttpRequest|navigator\.userAgent|canvas\.toDataURL/, "no network, no fingerprinting");
  assert.doesNotMatch(read("components/toys/Fidget.tsx"), /autoplay|new Audio\(/);
});

test("escape is a panic button that respects dialogs", () => {
  const layer = read("components/toys/SecretLayer.tsx");
  assert.match(layer, /event\.key !== "Escape" \|\| event\.defaultPrevented/);
  assert.match(layer, /\[aria-modal="true"\]:not\(\[data-toy\]\)/, "real dialogs keep their own Escape");
  assert.match(layer, /onPanic\(/);
  assert.match(layer, /CHAOS_MS = 1[0-5]_000/, "chaos lasts 10 to 15 seconds");
  assert.match(layer, /GRAVITY_MS = 20_000/);
  const css = read("app/toys.css");
  assert.match(css, /\.chaos-still body::after/, "reduced motion gets a still joke instead");
});

test("the project map uses real projects and real links", () => {
  const portfolio = read("content/portfolio.ts");
  const ids = mapNodes.map((node) => node.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const node of mapNodes) {
    if (node.href.startsWith("/work/")) assert.match(portfolio, new RegExp(`slug: "${node.href.slice(6)}"`));
    else if (node.href.startsWith("http")) assert.ok(portfolio.includes(node.href), `${node.href} is not a known source link`);
  }
  for (const link of mapLinks) assert.ok(ids.includes(link.a) && ids.includes(link.b));
  for (const [a, b] of [["rivet", "nexus"], ["rivet", "mx"], ["tinypaste", "inkline"], ["studyfilter", "areuhuman"]]) {
    assert.ok(mapLinks.some((link) => (link.a === a && link.b === b) || (link.a === b && link.b === a)), `${a} <-> ${b}`);
  }
});

test("the physics sandbox keeps bodies inside the box and settles", () => {
  let world = { width: 400, height: 300, gravity: 1400, bodies: [
    { id: 1, kind: "ball", x: 100, y: 50, vx: 900, vy: -300, r: 20, m: 1 },
    { id: 2, kind: "block", x: 120, y: 60, vx: -400, vy: 0, r: 24, m: 2.4 },
  ] };
  for (let i = 0; i < 2000; i += 1) {
    world = step(world, 1 / 60);
    for (const body of world.bodies) {
      assert.ok(body.x >= body.r - 0.01 && body.x <= world.width - body.r + 0.01, "inside horizontally");
      assert.ok(body.y >= body.r - 0.01 && body.y <= world.height - body.r + 0.01, "inside vertically");
    }
  }
  assert.ok(energy(world) < 40, `still moving: ${energy(world)}`);
});
