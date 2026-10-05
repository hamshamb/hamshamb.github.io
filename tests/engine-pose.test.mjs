import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { BUILT, combine, EXPLODE, INTRO, introPose, PARTS, REST, SCROLL, scrollPose } from "../lib/engine-pose.ts";

const near = (a, b) => Math.abs(a - b) < 1e-9;
const isRest = (pose) => near(pose.x, 0) && near(pose.y, 0) && near(pose.rotate, 0) && near(pose.scale, 1) && near(pose.opacity, 1);

test("the finished opening and the top of the scroll are exactly the server-rendered machine", () => {
  for (const id of PARTS) assert.ok(isRest(combine(BUILT.parts[id], id, scrollPose(0).explode)), `${id} is not at rest`);
  assert.equal(BUILT.rails, 1);
  assert.equal(BUILT.underline, 1);
  assert.ok(BUILT.tags.every((tag) => tag === 1), "every label is shown");
  const top = scrollPose(0);
  assert.equal(top.explode, 0);
  assert.equal(top.labels, 1);
  assert.deepEqual(top.machine, { scale: 1, opacity: 1, y: 0 });
});

test("the opening is staged: every part starts at its own time, in engineering order", () => {
  const order = ["frame", "core", "protocol", "ring", "local", "network", "interface", "privacy"];
  const starts = order.map((id) => INTRO[id].at);
  assert.deepEqual([...starts].sort((a, b) => a - b), starts, "parts arrive in order");
  assert.equal(new Set(starts).size, starts.length, "no two parts start together");
  assert.ok(INTRO.rails.at > INTRO.privacy.at && INTRO.tags.at > INTRO.rails.at && INTRO.underline.at > INTRO.tags.at);
  const first = introPose(0, 6);
  for (const id of PARTS) assert.ok(first.parts[id].opacity < 1, `${id} is visible before it is built`);
  assert.ok(INTRO.total <= 3200, "the opening stays short");
  for (let t = 0; t <= INTRO.total; t += 50) {
    for (const pose of Object.values(introPose(t, 6).parts)) assert.ok(Math.abs(pose.scale - 1) < 0.4 && pose.opacity >= 0 && pose.opacity <= 1);
  }
});

test("only mechanical parts overshoot, and only a little", () => {
  for (const id of ["ring", "core"]) {
    let peak = 0;
    for (let t = INTRO[id].at; t <= INTRO[id].at + INTRO[id].dur; t += 5) {
      const pose = introPose(t, 6).parts[id];
      const from = INTRO[id].from.y ?? INTRO[id].from.rotate;
      peak = Math.max(peak, -(pose.y || pose.rotate) / from);
    }
    assert.ok(peak > 0 && peak < 0.05, `${id} overshoot ${peak}`);
  }
});

test("the exploded view moves each part on its own and leaves the core alone", () => {
  assert.deepEqual(EXPLODE.core, {});
  const moves = PARTS.filter((id) => id !== "core").map((id) => JSON.stringify(EXPLODE[id]));
  assert.equal(new Set(moves).size, moves.length, "two parts share a movement");
  const mid = scrollPose(0.45);
  assert.equal(mid.explode, 1);
  assert.equal(mid.notes, 1);
  assert.equal(scrollPose(0.65).projects, 1);
  assert.ok(Math.abs(mid.camera.rotate) <= 3, "framing tilts a few degrees at most");
  assert.ok(mid.camera.scale > 0.95);
  const phone = combine(REST, "local", 1, 0.6);
  const desk = combine(REST, "local", 1, 1);
  assert.ok(Math.abs(phone.y) < Math.abs(desk.y), "small screens explode less");
  assert.ok(Math.abs(combine(REST, "local", 1, 1, true).y) > Math.abs(desk.y), "the bolt variant pulls further apart");
});

test("scroll is reversible and ends calm", () => {
  for (let p = 0; p <= 1.0001; p += 0.01) {
    const a = scrollPose(p);
    const b = scrollPose(p);
    assert.deepEqual(a, b, "the same scroll position always gives the same pose");
    assert.ok(a.explode >= 0 && a.explode <= 1 && a.notes * a.projects === 0, "notes and projects never overlap");
  }
  const end = scrollPose(1);
  assert.equal(end.explode, 0, "the machine is reassembled when the hero releases");
  assert.equal(end.machine.opacity, SCROLL.exitOpacity);
  const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
  const height = Number(css.match(/\.motion-ok \.hero-sequence \{ height: (\d+)svh; \}/)[1]);
  assert.ok(height >= 180 && height <= 230, `hero scroll length ${height}svh`);
});
