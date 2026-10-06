import test from "node:test";
import assert from "node:assert/strict";
import {
  createTimer,
  reduceTimer,
  inspectionPenalty,
  inspectionLabel,
  liveMs,
  HOLD_MS,
} from "../lib/cube-timer.ts";
import {
  effectiveMs,
  ao3,
  ao5,
  meanOfLast,
  averageOfLast,
  sessionMean,
  bestSingle,
  currentSingle,
  computeStats,
  formatMs,
  formatStat,
  formatSolve,
  parseSession,
  MAX_SOLVES,
} from "../lib/cube-stats.ts";

const run = (state, events) => events.reduce(reduceTimer, state);
const press = (at) => ({ type: "press", at });
const release = (at) => ({ type: "release", at });
const tick = (at) => ({ type: "tick", at });

// ---- timer ----

test("a plain solve: hold, ready, release, run, stop", () => {
  let s = createTimer();
  s = reduceTimer(s, press(1000));
  assert.equal(s.phase, "holding");
  s = reduceTimer(s, tick(1000 + HOLD_MS - 1));
  assert.equal(s.phase, "holding");
  s = reduceTimer(s, tick(1000 + HOLD_MS));
  assert.equal(s.phase, "ready");
  s = reduceTimer(s, release(1500));
  assert.equal(s.phase, "running");
  assert.equal(liveMs(s, 1500 + 4321), 4321);
  s = reduceTimer(s, press(1500 + 23890));
  assert.equal(s.phase, "stopped");
  assert.equal(s.elapsed, 23890);
  assert.equal(s.penalty, "ok");
  assert.equal(liveMs(s, 99999), 23890);
});

test("release without a tick still starts when the hold was long enough", () => {
  const s = run(createTimer(), [press(0), release(HOLD_MS)]);
  assert.equal(s.phase, "running");
});

test("letting go too early cancels quietly", () => {
  const s = run(createTimer(), [press(0), release(HOLD_MS - 1)]);
  assert.equal(s.phase, "idle");
  assert.equal(s.runStart, null);
});

test("key repeat while holding changes nothing", () => {
  const a = reduceTimer(createTimer(), press(0));
  assert.equal(reduceTimer(a, press(40)), a);
  const ready = reduceTimer(a, tick(500));
  assert.equal(reduceTimer(ready, press(520)), ready);
});

test("the release that follows a stop is ignored, and a new press begins the next attempt", () => {
  let s = run(createTimer(), [press(0), release(400), press(10400)]);
  assert.equal(s.phase, "stopped");
  assert.equal(reduceTimer(s, release(10450)), s);
  s = reduceTimer(s, press(12000));
  assert.equal(s.phase, "holding");
  assert.equal(s.penalty, "ok");
});

test("cancel drops a running attempt without a result", () => {
  const s = run(createTimer(), [press(0), release(400), { type: "cancel" }]);
  assert.equal(s.phase, "idle");
  assert.equal(s.runStart, null);
  const stopped = run(createTimer(), [press(0), release(400), press(900)]);
  assert.equal(reduceTimer(stopped, { type: "cancel" }), stopped, "a finished solve is not undone by cancel");
});

test("inspection penalties follow the WCA thresholds", () => {
  assert.equal(inspectionPenalty(0), "ok");
  assert.equal(inspectionPenalty(15000), "ok");
  assert.equal(inspectionPenalty(15001), "+2");
  assert.equal(inspectionPenalty(17000), "+2");
  assert.equal(inspectionPenalty(17001), "DNF");
});

test("inspection flow: tap starts it, hold arms, release starts the solve with its penalty", () => {
  const base = createTimer(true);
  let s = reduceTimer(base, press(0));
  assert.equal(s.phase, "inspecting");
  s = reduceTimer(s, release(80)); // the release of the tap that started inspection
  assert.equal(s.phase, "inspecting");
  s = run(s, [press(10000), release(10400)]);
  assert.equal(s.phase, "running");
  assert.equal(s.penalty, "ok");

  const late = run(base, [press(0), press(16000), release(16400)]);
  assert.equal(late.penalty, "+2");
  const dnf = run(base, [press(0), press(18000), release(18400)]);
  assert.equal(dnf.penalty, "DNF");
  assert.equal(dnf.phase, "running");
});

test("letting go early during inspection goes back to inspecting, clock untouched", () => {
  const s = run(createTimer(true), [press(0), press(5000), release(5100)]);
  assert.equal(s.phase, "inspecting");
  assert.equal(s.inspectStart, 0);
});

test("inspection label counts down, then +2, then DNF", () => {
  const s = reduceTimer(createTimer(true), press(1000));
  assert.equal(inspectionLabel(s, 1000), "15");
  assert.equal(inspectionLabel(s, 1000 + 4200), "11");
  assert.equal(inspectionLabel(s, 1000 + 15500), "+2");
  assert.equal(inspectionLabel(s, 1000 + 17500), "DNF");
});

test("the inspection switch only applies between attempts", () => {
  const idle = reduceTimer(createTimer(), { type: "inspection", on: true });
  assert.equal(idle.inspection, true);
  const running = run(createTimer(), [press(0), release(400)]);
  assert.equal(reduceTimer(running, { type: "inspection", on: true }), running);
  const inspecting = reduceTimer(idle, press(0));
  const off = reduceTimer(inspecting, { type: "inspection", on: false });
  assert.equal(off.phase, "idle");
  assert.equal(off.inspection, false);
});

// ---- stats ----

let n = 0;
const solve = (ms, penalty = "ok") => ({ id: "s" + n++, ms, scramble: "R U", at: "2026-01-01T00:00:00.000Z", penalty });
const secs = (...list) => list.map((v) => solve(v * 1000));

test("effective time: +2 adds 2000ms, DNF has none", () => {
  assert.equal(effectiveMs(solve(10000)), 10000);
  assert.equal(effectiveMs(solve(10000, "+2")), 12000);
  assert.equal(effectiveMs(solve(10000, "DNF")), null);
});

test("too few solves gives null", () => {
  assert.equal(ao3(secs(10, 11)), null);
  assert.equal(ao5(secs(10, 11, 12, 13)), null);
  assert.equal(sessionMean([]), null);
  assert.equal(bestSingle([]), null);
  assert.equal(currentSingle([]), null);
});

test("ao3 is the plain mean of the last three", () => {
  assert.equal(ao3(secs(99, 10, 11, 12)), 11000);
});

test("ao3 with any DNF is DNF", () => {
  assert.equal(ao3([solve(10000), solve(11000, "DNF"), solve(12000)]), "DNF");
});

test("ao5 drops best and worst and means the middle three", () => {
  // last five are 20 10 12 14 30; drop 10 and 30; mean of 20 12 14 is 15.333
  assert.equal(ao5(secs(99, 20, 10, 12, 14, 30)), 15330);
  assert.equal(ao5(secs(10, 11, 12, 13, 14)), 12000);
});

test("ao5 with one DNF drops it as the worst, with two it is DNF", () => {
  assert.equal(ao5([solve(10000), solve(11000), solve(12000), solve(9000, "DNF"), solve(13000)]), 12000);
  assert.equal(ao5([solve(10000), solve(11000, "DNF"), solve(12000), solve(9000, "DNF"), solve(13000)]), "DNF");
});

test("+2 flows through singles and averages", () => {
  const list = [solve(10000), solve(10000, "+2"), solve(10000)];
  assert.equal(ao3(list), 10670);
  assert.equal(currentSingle(list), 10000);
  assert.equal(bestSingle([solve(10500, "+2"), solve(12000)]), 12000);
  assert.equal(bestSingle([solve(10500, "+2"), solve(12600)]), 12500);
});

test("session mean skips DNFs, best skips DNFs, current can be a DNF", () => {
  const list = [solve(10000), solve(20000, "DNF"), solve(14000)];
  assert.equal(sessionMean(list), 12000);
  assert.equal(bestSingle(list), 10000);
  assert.equal(currentSingle([...list, solve(1, "DNF")]), "DNF");
  assert.equal(sessionMean([solve(5000, "DNF")]), null);
  assert.equal(bestSingle([solve(5000, "DNF")]), null);
});

test("averages round to the nearest hundredth in whole milliseconds", () => {
  // 10.000 + 10.001 + 10.004 = 30.005s, mean 10.00167s -> 10.00
  assert.equal(meanOfLast([solve(10000), solve(10001), solve(10004)], 3), 10000);
  // 10.000 + 10.000 + 10.020 -> 10.00667s -> 10.01
  assert.equal(meanOfLast([solve(10000), solve(10000), solve(10020)], 3), 10010);
  assert.equal(averageOfLast(secs(1, 2, 3, 4, 5), 5), 3000);
  assert.equal(averageOfLast(secs(1, 2), 5), null);
});

test("computeStats bundles everything", () => {
  const stats = computeStats(secs(30, 25, 20, 22, 24, 21));
  assert.equal(stats.count, 6);
  assert.equal(stats.current, 21000);
  assert.equal(stats.best, 20000);
  assert.equal(stats.ao3, 22330);
  assert.equal(stats.ao5, 22330);
  assert.equal(stats.mean, 23670);
});

test("formatting truncates singles to hundredths", () => {
  assert.equal(formatMs(23899), "23.89");
  assert.equal(formatMs(5), "0.00");
  assert.equal(formatMs(59999), "59.99");
  assert.equal(formatMs(62340), "1:02.34");
  assert.equal(formatMs(3_723_450), "1:02:03.45");
  assert.equal(formatStat(null), "-");
  assert.equal(formatStat("DNF"), "DNF");
  assert.equal(formatStat(12000), "12.00");
  assert.equal(formatSolve(solve(10000, "+2")), "12.00+");
  assert.equal(formatSolve(solve(10000, "DNF")), "DNF");
  assert.equal(formatSolve(solve(10000)), "10.00");
});

test("parseSession tolerates broken storage", () => {
  assert.deepEqual(parseSession(null), []);
  assert.deepEqual(parseSession(""), []);
  assert.deepEqual(parseSession("not json"), []);
  assert.deepEqual(parseSession('{"a":1}'), []);
  const good = solve(12345);
  const raw = JSON.stringify([
    good,
    good, // duplicate id
    { ...solve(1), penalty: "maybe" },
    { ...solve(1), ms: "fast" },
    { ...solve(1), at: "yesterday-ish" },
    null,
    7,
  ]);
  assert.deepEqual(parseSession(raw), [good]);
});

test("parseSession keeps only the newest solves", () => {
  const many = Array.from({ length: MAX_SOLVES + 5 }, (_, i) => solve(1000 + i));
  const out = parseSession(JSON.stringify(many));
  assert.equal(out.length, MAX_SOLVES);
  assert.equal(out[out.length - 1].id, many[many.length - 1].id);
});
