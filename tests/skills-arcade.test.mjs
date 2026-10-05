import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { skillPages } from "../content/skills.ts";
import { applyEdit, compiled, next, pick, puzzles, start, view } from "../lib/demos/compile.ts";
import { canConnect, connect, disconnect, missing, required, run, show, sinks, sources } from "../lib/demos/factory.ts";
import { derive, initialLab, kinds, MAX_ITEMS, propsFor, REDUCER_AFTER, reduce, setter, stateNames } from "../lib/demos/lab.ts";
import {
  BONUS_AFTER,
  BONUS_POINTS,
  BONUS_TTL,
  BUG_LINE,
  BUG_LINES,
  checkBug,
  chooseSkin,
  COMBO_MAX,
  COMBO_WINDOW,
  DELAY_STEP,
  MAX_LEVEL,
  MIN_DELAY,
  multiplier,
  newGame,
  parseScore,
  placeFood,
  speedFactor,
  speedLevel,
  START_DELAY,
  steer,
  step,
  toggle,
} from "../lib/snake.ts";

const root = new URL("..", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");
const fixed = () => 0.5;
/** A random source that replays the given numbers, then settles on 0.5. */
const replay = (...values) => () => (values.length ? values.shift() : 0.5);
const playing = (overrides = {}) => ({ ...newGame(20, 16, fixed), status: "playing", ...overrides });
/** Food directly in front of the head. */
const feed = (game) => ({ ...game, food: { x: game.snake[0].x + 1, y: game.snake[0].y } });

/* ----------------------------------------------------------------- snake --- */

test("snake: queued turns, reversing and pausing", () => {
  let game = newGame(20, 16, fixed);
  assert.equal(game.status, "ready");
  game = steer(game, "up");
  assert.equal(game.status, "playing", "the first turn starts the game");
  assert.deepEqual(game.queue, ["up"]);
  assert.equal(steer(game, "down").queue.length, 1, "cannot reverse the queued turn");
  game = steer(game, "left");
  assert.equal(steer(game, "up").queue.length, 2, "at most two turns are queued");

  let paused = toggle(playing());
  assert.equal(paused.status, "paused");
  assert.deepEqual(step(paused, fixed), paused, "a paused game does not move");
  assert.equal(toggle(paused).status, "playing");
  assert.equal(toggle(newGame(20, 16, fixed)).status, "playing", "start");
  assert.equal(toggle({ ...playing(), status: "over" }, fixed).status, "ready", "over starts a fresh game");
});

test("snake: speed goes up with every apple and stops at the ceiling", () => {
  let game = playing();
  assert.equal(speedLevel(game.delay), 0);
  for (let i = 0; i < 40; i += 1) {
    game = step(feed({ ...game, snake: [{ x: 5, y: 8 }, { x: 4, y: 8 }, { x: 3, y: 8 }], direction: "right", queue: [] }), fixed);
  }
  assert.equal(game.delay, MIN_DELAY);
  assert.equal(speedLevel(game.delay), MAX_LEVEL);
  assert.equal(speedFactor(START_DELAY), 1);
  assert.ok(speedFactor(MIN_DELAY) > 2 && speedFactor(MIN_DELAY) < 2.4);
  assert.equal(speedLevel(START_DELAY - DELAY_STEP), 1);
  assert.equal(speedLevel(0), MAX_LEVEL, "never above the meter");
});

test("snake: eating in a row builds a combo, a long gap breaks it", () => {
  let game = playing();
  assert.equal(multiplier(game), 1);
  game = step(feed(game), fixed);
  assert.equal(game.score, 1, "first apple is worth 1");
  assert.equal(game.combo, 1);
  assert.equal(game.event.type, "eat");
  game = step(feed(game), fixed);
  assert.equal(game.score, 3, "a quick second apple is worth 2");
  game = step(feed(game), fixed);
  assert.equal(game.score, 6, "then 3");
  game = step(feed(game), fixed);
  game = step(feed(game), fixed);
  assert.equal(game.score, 6 + 4 + 4, "the multiplier stops at 1 + COMBO_MAX");
  assert.equal(multiplier(game), 1 + COMBO_MAX);

  // wait out the window in open space: the combo is gone
  let slow = playing({ combo: 3, sinceEat: 0, snake: [{ x: 2, y: 8 }, { x: 1, y: 8 }, { x: 0, y: 8 }], food: { x: 19, y: 0 } });
  for (let i = 0; i < COMBO_WINDOW + 1; i += 1) slow = step(slow, fixed);
  assert.equal(slow.combo, 0);
  const after = step(feed(slow), fixed);
  assert.equal(after.score, 1, "back to one point");
});

test("snake: a bonus is rare, never early, never under the snake, and runs out", () => {
  // not before the score is high enough, not when the dice say no
  const early = step(feed(playing()), replay(0.5, 0.01));
  assert.equal(early.bonus, null, `no bonus below a score of ${BONUS_AFTER}`);
  const warm = playing({ score: 5 });
  assert.equal(step(feed(warm), replay(0.5, 0.9)).bonus, null, "dice say no");

  const lucky = step(feed(warm), replay(0.5, 0.01, 0.5));
  assert.ok(lucky.bonus, "dice say yes");
  assert.equal(lucky.bonus.ttl, BONUS_TTL);
  assert.ok(!lucky.snake.some((part) => part.x === lucky.bonus.at.x && part.y === lucky.bonus.at.y), "not under the snake");
  assert.notDeepEqual(lucky.bonus.at, lucky.food, "not on the food");
  assert.ok(placeFood(20, 16, [], fixed, [{ x: 10, y: 8 }]) !== null);
  const avoided = placeFood(2, 1, [], fixed, [{ x: 1, y: 0 }]);
  assert.deepEqual(avoided, { x: 0, y: 0 }, "the avoided cell is never chosen");

  // it counts down and disappears on its own
  let timed = { ...playing({ snake: [{ x: 5, y: 8 }, { x: 4, y: 8 }, { x: 3, y: 8 }] }), bonus: { at: { x: 5, y: 1 }, ttl: 2 }, food: { x: 19, y: 15 } };
  timed = step(timed, fixed);
  assert.equal(timed.bonus.ttl, 1);
  timed = step(timed, fixed);
  assert.equal(timed.bonus, null);
  assert.equal(timed.event.type, "expire");

  // eating it is worth a lot, grows the snake and does not speed anything up
  const base = playing({ score: 4, snake: [{ x: 5, y: 8 }, { x: 4, y: 8 }, { x: 3, y: 8 }] });
  const ate = step({ ...base, bonus: { at: { x: 6, y: 8 }, ttl: 10 } }, fixed);
  assert.equal(ate.score, 4 + BONUS_POINTS);
  assert.equal(ate.snake.length, 4);
  assert.equal(ate.delay, base.delay, "the bonus does not make it faster");
  assert.equal(ate.bonus, null);
  assert.equal(ate.event.type, "bonus");
});

test("snake: food never lands on the snake, even on a nearly full board", () => {
  const snake = [];
  for (let x = 0; x < 6; x += 1) for (let y = 0; y < 5; y += 1) if (!(x === 3 && y === 2)) snake.push({ x, y });
  for (const random of [() => 0, () => 0.999, fixed]) assert.deepEqual(placeFood(6, 5, snake, random), { x: 3, y: 2 });
  assert.equal(placeFood(6, 5, [...snake, { x: 3, y: 2 }], fixed), null, "a full board has no free cell");

  // filling the board ends the game as a win
  let game = { ...playing(), cols: 4, rows: 1, snake: [{ x: 1, y: 0 }, { x: 0, y: 0 }], direction: "right", queue: [], food: { x: 2, y: 0 } };
  game = step(game, fixed);
  assert.equal(game.status, "playing");
  assert.deepEqual(game.food, { x: 3, y: 0 });
  game = step(game, fixed);
  assert.equal(game.status, "over");
  assert.equal(game.event.type, "win");
});

test("snake: walls and your own body end the game, and say where", () => {
  let game = playing({ snake: [{ x: 19, y: 8 }, { x: 18, y: 8 }, { x: 17, y: 8 }] });
  game = step(game, fixed);
  assert.equal(game.status, "over");
  assert.equal(game.event.type, "over");
  assert.deepEqual(step(game, fixed), game, "nothing moves after game over");
  const tail = playing({ snake: [{ x: 5, y: 5 }, { x: 5, y: 6 }, { x: 6, y: 6 }, { x: 6, y: 5 }], direction: "up", queue: ["right"] });
  assert.equal(step(tail, fixed).status, "playing", "the tail steps out of the way");
});

test("snake: storage values and skins are sanitised", () => {
  assert.equal(parseScore("12"), 12);
  for (const junk of [null, undefined, "", "abc", "-4", "NaN", "Infinity"]) assert.equal(parseScore(junk), 0, String(junk));
  assert.equal(parseScore("7.9"), 7);
  assert.equal(chooseSkin(false, "python"), "ink", "locked means locked");
  assert.equal(chooseSkin(true, "python"), "python");
  assert.equal(chooseSkin(true, null), "ink");
  assert.equal(chooseSkin(true, "neon"), "ink", "unknown skins fall back");
});

test("snake: the bug puzzle has one answer and it matches the python file", () => {
  assert.equal(BUG_LINES.length, 6);
  const answers = BUG_LINES.map((_, index) => checkBug(index).correct);
  assert.deepEqual(answers.filter(Boolean).length, 1);
  assert.equal(answers[BUG_LINE], true);
  for (let i = 0; i < BUG_LINES.length; i += 1) if (i !== BUG_LINE) assert.ok(checkBug(i).message.length > 10, "wrong lines get a hint");
  assert.equal(BUG_LINES[BUG_LINE], "snake.pop()", "the broken line pops the tail every step");
  const python = read("content/snippets/snake.py");
  for (const line of BUG_LINES) assert.ok(python.includes(line.trim()), `snake.py has: ${line}`);
  assert.match(python, /else:\s*\n\s*snake\.pop\(\)/, "the real file only pops in an else");
});

test("snake: keys are only captured by the board, never by the page", () => {
  const files = ["components/skills/SignalSnake.tsx", "components/skills/arcade/snakeEngine.ts", "components/skills/arcade/SnakeBugFix.tsx"];
  for (const file of files) {
    const code = read(file);
    assert.doesNotMatch(code, /addEventListener\(\s*["']key(down|up|press)/, `${file} listens for keys on the page`);
  }
  const game = read("components/skills/SignalSnake.tsx");
  assert.match(game, /onKeyDown=\{onKeyDown\}/);
  assert.match(game, /aria-label="Signal Snake board"/);
  assert.match(game, /aria-live="polite"/);
  assert.match(game, /prefers-reduced-motion/);
  assert.match(game, /setFlag\("snake-skin"\)/);
  assert.match(game, /discover\("snake-bugfix"\)/);
  assert.match(game, /unlockToy\("snake"\)/);
});

/* ------------------------------------------------------------- typescript --- */

test("typescript: every source and sink pair follows the structural rules", () => {
  const expected = {
    CONNECT: ["onConnect"],
    MESSAGE: ["onMessage"],
    ERROR: ["onError", "retry"],
    TIMEOUT: ["onError"],
  };
  for (const source of sources) {
    const accepted = sinks.filter((sink) => canConnect(source.id, sink.id).ok).map((sink) => sink.id);
    assert.deepEqual(accepted, expected[source.id], `${source.id} fits ${expected[source.id].join(", ")}`);
  }
  // the machine can be completed: every required wire is allowed
  for (const wire of required) assert.equal(canConnect(wire.from, wire.to).ok, true);
});

test("typescript: rejections explain themselves in type terms", () => {
  const missingProp = canConnect("MESSAGE", "onConnect");
  assert.equal(missingProp.reason, "MessagePayload is not assignable to ConnectEvent");
  assert.match(missingProp.detail, /'url' is missing/);

  const wrongType = canConnect("TIMEOUT", "retry");
  assert.equal(wrongType.reason, "TimeoutEvent is not assignable to Retryable");
  assert.match(wrongType.detail, /'code' is string/);
  assert.match(wrongType.detail, /expects number/);

  const extra = canConnect("ERROR", "onError");
  assert.equal(extra.reason, "ErrorPayload is assignable to Failure");
  assert.match(extra.detail, /code is extra, and extra is fine/);
  assert.equal(canConnect("CONNECT", "onConnect").detail, "same shape");
});

test("typescript: connecting, duplicates, removing and running", () => {
  let wires = [];
  const bad = connect(wires, "ERROR", "onMessage");
  assert.equal(bad.added, false);
  assert.deepEqual(bad.wires, []);

  for (const { from, to } of required) wires = connect(wires, from, to).wires;
  assert.equal(wires.length, required.length);
  assert.deepEqual(missing(wires), []);
  const again = connect(wires, "ERROR", "retry");
  assert.equal(again.added, false);
  assert.equal(again.wires.length, wires.length, "no duplicate wires");
  assert.equal(again.verdict.detail, "already wired");

  const fewer = disconnect(wires, { from: "ERROR", to: "retry" });
  assert.deepEqual(missing(fewer), [{ from: "ERROR", to: "retry" }]);

  const lines = run(wires, ["retry"]);
  assert.equal(lines.length, wires.length);
  assert.equal(lines.find((delivery) => delivery.wire.to === "retry").ok, false);
  assert.match(lines.find((delivery) => delivery.wire.to === "onConnect").line, /^onConnect\(\{ url: "wss:\/\/relay\.example" \}\)$/);
  assert.equal(show({ code: 1006, ok: true }), "{ code: 1006, ok: true }");
});

test("typescript: make it compile has one right answer per error, in order", () => {
  assert.equal(puzzles.length, 3);
  for (const puzzle of puzzles) {
    assert.equal(puzzle.fixes.filter((fix) => fix.ok).length, 1, `${puzzle.part} has exactly one right fix`);
    assert.ok(puzzle.fixes.length >= 2 && puzzle.fixes.length <= 3);
    assert.ok(puzzle.line >= 0 && puzzle.line < puzzle.code.length);
    for (const fix of puzzle.fixes) assert.ok(fix.why.length > 10, "every pick explains itself");
  }
  assert.deepEqual(puzzles.map((puzzle) => puzzle.part), ["onConnect", "onMessage", "retry"]);
  // the right fixes really repair the code they point at
  const rights = puzzles.map((puzzle) => puzzle.fixes.find((fix) => fix.ok));
  assert.deepEqual(applyEdit(puzzles[0].code, rights[0].edit)[1], "  openSocket(e.url);");
  assert.deepEqual(applyEdit(puzzles[1].code, rights[1].edit)[1], "  const size: number = m.text.length;");
  assert.ok(applyEdit(puzzles[2].code, rights[2].edit).includes("  retrying: 2000,"));
});

test("typescript: wrong picks go nowhere, right picks repair parts, finishing compiles", () => {
  let progress = start();
  assert.equal(compiled(progress), false);

  const wrong = puzzles[0].fixes.findIndex((fix) => !fix.ok);
  const after = pick(progress, wrong);
  assert.equal(after.verdict, "wrong");
  assert.equal(after.step, 0);
  assert.deepEqual(after.fixed, []);
  assert.deepEqual(view(after), [...puzzles[0].code], "the code is untouched");
  assert.equal(pick(after, wrong), after, "the same wrong pick does nothing twice");
  assert.equal(next(after), after, "cannot move on from an unfixed error");
  assert.equal(pick(progress, 99), progress, "unknown picks are ignored");

  for (let step = 0; step < puzzles.length; step += 1) {
    const right = puzzles[step].fixes.findIndex((fix) => fix.ok);
    const fixedNow = pick(progress, right);
    assert.equal(fixedNow.verdict, "fixed");
    assert.deepEqual(fixedNow.fixed, puzzles.slice(0, step + 1).map((puzzle) => puzzle.part));
    assert.notDeepEqual(view(fixedNow), [...puzzles[step].code], "the fix shows in the code");
    assert.equal(pick(fixedNow, 0), fixedNow, "no more picks once fixed");
    progress = next(fixedNow);
    assert.equal(progress.step, step + 1);
  }
  assert.equal(compiled(progress), true);
  assert.deepEqual(view(progress), []);
  // with every part repaired the whole machine runs
  assert.deepEqual(run(required, []).filter((delivery) => !delivery.ok), []);
});

test("typescript: the page uses the files it shows and fires the achievement", () => {
  const demo = read("components/skills/TypeFactory.tsx");
  assert.match(demo, /achieve\("compiled"\)/);
  assert.match(demo, /the type checker remains unconvinced\./);
  assert.match(demo, /canConnect|connect\(/);
  const skill = skillPages.find((page) => page.slug === "typescript");
  assert.deepEqual(skill.files.map((file) => file.path), ["lib/demos/factory.ts", "lib/demos/compile.ts"]);
  assert.match(skill.demo.note, /runs exactly the files on the left/);
});

/* ----------------------------------------------------------------- react --- */

test("react: adding, nesting, moving and removing components", () => {
  let lab = initialLab();
  assert.equal(lab.items.length, 5);
  const panel = lab.items.find((item) => item.kind === "panel");

  lab = reduce(lab, { type: "add", kind: "list", parent: panel.id });
  const list = lab.items.at(-1);
  assert.equal(list.parent, panel.id, "goes into the panel");
  assert.deepEqual(lab.lists[list.id].length, 2, "a list starts with two items");

  lab = reduce(lab, { type: "add", kind: "panel", parent: panel.id });
  assert.equal(lab.items.at(-1).parent, null, "panels do not nest");
  lab = reduce(lab, { type: "add", kind: "card", parent: 999 });
  assert.equal(lab.items.at(-1).parent, null, "an unknown parent means the canvas");

  // reorder among siblings only
  const rootsBefore = lab.items.filter((item) => item.parent === null).map((item) => item.id);
  lab = reduce(lab, { type: "move", id: rootsBefore[1], by: -1 });
  const rootsAfter = lab.items.filter((item) => item.parent === null).map((item) => item.id);
  assert.deepEqual(rootsAfter.slice(0, 2), [rootsBefore[1], rootsBefore[0]]);
  assert.equal(reduce(lab, { type: "move", id: rootsAfter[0], by: -1 }), lab, "cannot move past the start");

  // removing a panel removes what is inside it, and its label and lists
  lab = reduce(lab, { type: "remove", id: panel.id });
  assert.ok(!lab.items.some((item) => item.id === panel.id || item.parent === panel.id));
  assert.equal(lab.labels[panel.id], undefined);
  assert.equal(lab.lists[list.id], undefined);
});

test("react: shared state, props and derived numbers", () => {
  let lab = initialLab();
  const counters = lab.items.filter((item) => item.kind === "counter");
  assert.equal(counters.length, 2);
  assert.ok(counters.every((counter) => counter.shared), "two counters start bound to one store");

  lab = reduce(lab, { type: "bump", by: 3 });
  assert.equal(lab.count, 3, "one number for every shared counter");
  assert.equal(derive(lab).sharedCounters, 2);
  lab = reduce(lab, { type: "share", id: counters[0].id });
  assert.equal(derive(lab).sharedCounters, 1, "unbinding takes a counter out of the store");
  assert.equal(reduce(lab, { type: "bump", by: -50 }).count, 0, "the store has a floor");
  assert.equal(reduce(lab, { type: "bump", by: 500 }).count, 99, "and a ceiling");

  // props: children of a panel receive its label, root components receive nothing
  const panel = lab.items.find((item) => item.kind === "panel");
  const child = lab.items.find((item) => item.parent === panel.id);
  assert.deepEqual(propsFor(lab, child), { label: "toolbar" });
  lab = reduce(lab, { type: "label", id: panel.id, text: "settings" });
  assert.deepEqual(propsFor(lab, child), { label: "settings" }, "changing the prop changes the child");
  assert.deepEqual(propsFor(lab, counters[0]), {});
  assert.equal(reduce(lab, { type: "label", id: panel.id, text: "x".repeat(40) }).labels[panel.id].length, 16);

  // derived: the count follows the lists, nothing is stored
  lab = reduce(lab, { type: "add", kind: "list", parent: null });
  const list = lab.items.at(-1);
  assert.equal(derive(lab).listItems, 2);
  lab = reduce(lab, { type: "push", id: list.id });
  assert.equal(derive(lab).listItems, 3);
  lab = reduce(lab, { type: "pop", id: list.id });
  lab = reduce(lab, { type: "pop", id: list.id });
  lab = reduce(lab, { type: "pop", id: list.id });
  assert.equal(derive(lab).listItems, 0);
  assert.equal(derive(lab).components, lab.items.length);
  assert.deepEqual(Object.keys(lab).sort(), ["count", "items", "labels", "lists", "nextId"], "no derived numbers in state");
});

test("react: the canvas has a limit and every kind can be added", () => {
  let lab = reduce(initialLab(), { type: "clear" });
  assert.equal(lab.items.length, 0);
  for (const kind of kinds) lab = reduce(lab, { type: "add", kind, parent: null });
  assert.equal(lab.items.length, kinds.length);
  const ids = lab.items.map((item) => item.id);
  assert.equal(new Set(ids).size, ids.length, "ids are unique");
  for (let i = 0; i < 30; i += 1) lab = reduce(lab, { type: "add", kind: "button", parent: null });
  assert.equal(lab.items.length, MAX_ITEMS);
});

test("react: the add state secret needs enough absurd variables", () => {
  assert.ok(stateNames.length > REDUCER_AFTER, "there are more names than the reducer needs");
  assert.equal(new Set(stateNames).size, stateNames.length);
  assert.equal(setter("isProbablyFine"), "setIsProbablyFine");
  const lab = read("components/skills/ComponentLab.tsx");
  assert.match(lab, /discover\("react-reducer"\)/);
  assert.match(lab, /you probably wanted a reducer\./);
  assert.match(lab, /use reducer/);
});

/* ----------------------------------------------------------------- rules --- */

test("arcade files keep the site's rules", () => {
  const walk = (dir) => readdirSync(new URL(dir, root), { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? walk(join(dir, entry.name)) : [join(dir, entry.name).replaceAll("\\", "/")],
  );
  const files = [
    "components/skills/SignalSnake.tsx",
    "components/skills/TypeFactory.tsx",
    "components/skills/ComponentLab.tsx",
    ...walk("components/skills/arcade"),
    "lib/snake.ts",
    "lib/demos/factory.ts",
    "lib/demos/compile.ts",
    "lib/demos/lab.ts",
    "content/snippets/snake.py",
    "content/skills.ts",
    "app/skills-arcade.css",
  ];
  for (const file of files) {
    const code = read(file);
    assert.ok(!code.includes(String.fromCharCode(0x2014)), `${file} has an em dash`);
    assert.doesNotMatch(code, /\beval\(|new Function\(|innerHTML|dangerouslySetInnerHTML/, `${file} runs or injects code`);
    assert.doesNotMatch(code, /new Audio\(|AudioContext/, `${file} makes sound`);
  }
  for (const name of ["SignalSnake", "TypeFactory", "ComponentLab"]) {
    assert.match(read(`components/skills/${name}.tsx`), new RegExp(`^"use client";\\s*[\\r\\n]`), `${name} is its own client island`);
    assert.match(read(`components/skills/${name}.tsx`), new RegExp(`export function ${name}\\(`));
  }
});

test("the python page keeps its honesty line and shows both files", () => {
  const python = skillPages.find((page) => page.slug === "python");
  assert.match(python.demo.note, /nothing here runs Python in the browser/);
  assert.match(python.demo.note, /visual extras/);
  assert.deepEqual(python.files.map((file) => file.path), ["content/snippets/snake.py", "lib/snake.ts"]);
  const react = skillPages.find((page) => page.slug === "react");
  assert.deepEqual(react.files.map((file) => file.path), ["components/skills/ComponentLab.tsx", "lib/demos/lab.ts"]);
});

