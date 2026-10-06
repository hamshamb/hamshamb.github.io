import assert from "node:assert/strict";
import test from "node:test";
import { achievementLabel, addTo, allBolts, BOLTS, bump, emptyState, parseState, toyboxOpen, TOYBOX_AFTER } from "../lib/secrets-core.ts";
import { onPanic, panic, panicCount } from "../lib/panic.ts";

test("secret state survives a round trip through storage", () => {
  let state = emptyState();
  state = addTo(state, "secrets", "konami");
  state = addTo(state, "achievements", "cube-person");
  state = addTo(state, "bolts", "hero");
  state = addTo(state, "flags", "snake-skin");
  state = bump(state, "scrambles", 3);
  assert.deepEqual(parseState(JSON.stringify(state)), state);
});

test("broken or foreign storage becomes a clean slate, never an error", () => {
  for (const raw of [null, "", "not json", "null", "[]", '{"v":2}', '{"v":1,"secrets":"nope"}']) {
    const state = parseState(raw);
    assert.equal(state.v, 1);
    assert.ok(Array.isArray(state.secrets));
  }
  const dirty = parseState(JSON.stringify({ v: 1, secrets: ["a", "a", 4, ""], bolts: ["hero", "not-a-bolt"], counters: { ok: 2.7, bad: -1, nan: "x" } }));
  assert.deepEqual(dirty.secrets, ["a"], "duplicates and junk are dropped");
  assert.deepEqual(dirty.bolts, ["hero"], "unknown bolts are dropped");
  assert.deepEqual(dirty.counters, { ok: 2 });
});

test("adding is idempotent and reports no change by identity", () => {
  const once = addTo(emptyState(), "secrets", "x");
  assert.equal(addTo(once, "secrets", "x"), once);
  assert.equal(addTo(once, "bolts", "nowhere"), once, "only the five real bolts can be collected");
});

test("bolts are five unique places, and all five are needed", () => {
  assert.equal(BOLTS.length, 5);
  assert.equal(new Set(BOLTS).size, 5);
  let state = emptyState();
  for (const [index, bolt] of BOLTS.entries()) {
    assert.equal(allBolts(state), false);
    state = addTo(state, "bolts", bolt);
    state = addTo(state, "bolts", bolt);
    assert.equal(state.bolts.length, index + 1);
  }
  assert.equal(allBolts(state), true);
});

test("the toybox opens after three secrets and the achievement total stays hidden", () => {
  let state = emptyState();
  for (let i = 0; i < TOYBOX_AFTER; i += 1) {
    assert.equal(toyboxOpen(state), false);
    state = addTo(state, "secrets", `s${i}`);
  }
  assert.equal(toyboxOpen(state), true);
  state = addTo(state, "achievements", "rabbit-hole");
  assert.equal(achievementLabel(state), "1 / ??");
});

test("panic runs every reset once, survives a failing one, and unregisters", () => {
  const ran = [];
  const offA = onPanic(() => ran.push("a"));
  const offB = onPanic(() => {
    throw new Error("broken toy");
  });
  const offC = onPanic(() => ran.push("c"));
  assert.equal(panic(), 2);
  assert.deepEqual(ran, ["a", "c"]);
  offA();
  offB();
  offC();
  assert.equal(panicCount(), 0);
  assert.equal(panic(), 0);
});
