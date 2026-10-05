import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import { DEFAULT_COMMENT, SAMPLE, addFinding, chunksOf, findingsAt, newReview, openCount, quote, resolveFinding, seeded, segment, SEVERITIES, spanOfChunks, STATUSES, trimAnchor } from "../lib/demos/review.ts";
import { ALLOWED, INVITE_TTL, STATES, STEP_FROM, canFault, initial, isEnded, transition } from "../lib/demos/session.ts";
import { MUTATIONS, RANGES, defaults, makeItWorse, toVars } from "../lib/demos/mutation.ts";

const root = new URL("..", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");
const dist = new URL("dist/client/", root);
const built = (path) => (existsSync(new URL(path, dist)) ? readFileSync(new URL(path, dist), "utf8") : "");

/** a seeded generator so the fuzz tests are repeatable */
function lcg(seed) {
  let value = seed;
  return () => {
    value = (value * 1664525 + 1013904223) % 4294967296;
    return value / 4294967296;
  };
}

// ---------------------------------------------------------------- java ---

function javaTransitions() {
  const java = read("content/snippets/Session.java").replaceAll("\r\n", "\n");
  const constants = java.match(/enum SessionState \{\s*([A-Z_,\s]+);/)[1].split(",").map((name) => name.trim()).filter(Boolean);
  const table = {};
  for (const [, from, kind, list] of java.matchAll(/case (\w+) -> EnumSet\.(of|noneOf)\(([^)]*)\)/g)) {
    table[from] = kind === "noneOf" ? [] : list.split(",").map((name) => name.trim());
  }
  return { constants, table };
}

test("java: the TypeScript lobby has the same states and allowed transitions as Session.java", () => {
  const { constants, table } = javaTransitions();
  assert.deepEqual([...STATES], constants, "same states, same order");
  assert.deepEqual(Object.keys(table).sort(), [...STATES].sort(), "every state has a case in next()");
  for (const state of STATES) assert.deepEqual([...ALLOWED[state]].sort(), [...table[state]].sort(), `${state} allows the same moves`);
  const java = read("content/snippets/Session.java");
  assert.match(java, /illustrative java model/);
  assert.match(java, /not Nexus source/);
});

test("java: the lobby happy path walks every step and ends connected", () => {
  let session = initial;
  const seen = [session.state];
  const expected = ["host", "createInvite", "join", "validate", "authenticate", "connect"];
  for (const type of expected) {
    assert.equal(STEP_FROM[session.state], type);
    session = transition(session, { type }, lcg(7));
    seen.push(session.state);
  }
  assert.deepEqual(seen, ["IDLE", "HOSTING", "INVITED", "JOINING", "VALIDATING", "AUTHENTICATING", "CONNECTED"]);
  assert.equal(session.invite.used, true, "the invite is spent by validation");
  assert.equal(session.reason, null);
});

test("java: every failure ends where it says it does, and nothing leaves an ended session", () => {
  const to = (steps) => steps.reduce((session, type) => transition(session, { type }, lcg(3)), initial);

  const expired = transition(to(["host", "createInvite", "join"]), { type: "expireInvite" });
  assert.equal(expired.invite.ttl, 0);
  const afterExpired = transition(expired, { type: "validate" });
  assert.deepEqual([afterExpired.state, afterExpired.reason], ["REJECTED", "INVITE_EXPIRED"]);

  const replayed = transition(to(["host", "createInvite", "join"]), { type: "replayInvite" });
  const afterReplay = transition(replayed, { type: "validate" });
  assert.deepEqual([afterReplay.state, afterReplay.reason], ["REJECTED", "INVITE_ALREADY_USED"]);

  const broken = transition(to(["host", "createInvite", "join", "validate"]), { type: "breakCredentials" });
  const afterBroken = transition(broken, { type: "authenticate" });
  assert.deepEqual([afterBroken.state, afterBroken.reason], ["REJECTED", "AUTH_FAILED"]);

  const offline = transition(to(["host", "createInvite", "join", "validate", "authenticate", "connect"]), { type: "hostOffline" });
  assert.deepEqual([offline.state, offline.reason], ["CLOSED", "HOST_OFFLINE"]);

  for (const ended of [afterExpired, afterReplay, afterBroken, offline]) {
    assert.ok(isEnded(ended.state));
    for (const type of ["host", "createInvite", "join", "validate", "authenticate", "connect", "hostOffline", "expireInvite"]) assert.equal(transition(ended, { type }), ended, `${type} does nothing once ${ended.state}`);
  }
  assert.equal(canFault(initial, "hostOffline"), false, "no host to knock offline yet");
});

test("java: the invite times out on its own, and only while it can still be used", () => {
  let session = to(["host", "createInvite"]);
  function to(steps) {
    return steps.reduce((current, type) => transition(current, { type }, lcg(1)), initial);
  }
  assert.equal(session.invite.ttl, INVITE_TTL);
  session = transition(session, { type: "tick", seconds: 30 });
  assert.equal(session.invite.ttl, INVITE_TTL - 30);
  session = transition(session, { type: "tick", seconds: 1000 });
  assert.equal(session.invite.ttl, 0, "never below zero");
  assert.equal(transition(session, { type: "validate" }).state, "INVITED", "validate before the player joined does nothing");
  const spent = to(["host", "createInvite", "join", "validate"]);
  assert.equal(transition(spent, { type: "tick", seconds: 5 }), spent, "a spent invite stops counting");
});

test("java: random event sequences only ever take transitions Session.java allows", () => {
  const events = [
    ...["host", "createInvite", "join", "validate", "authenticate", "connect", "expireInvite", "replayInvite", "breakCredentials", "hostOffline"].map((type) => ({ type })),
    { type: "tick", seconds: 20 },
  ];
  for (let seed = 1; seed <= 60; seed += 1) {
    const random = lcg(seed);
    let session = initial;
    for (let i = 0; i < 40; i += 1) {
      const next = transition(session, events[Math.floor(random() * events.length)], random);
      if (next.state !== session.state) assert.ok(ALLOWED[session.state].includes(next.state), `${session.state} -> ${next.state}`);
      session = next;
    }
  }
});

// ------------------------------------------------------------------ c# ---

test("c#: Review.cs and the TypeScript model agree on enums and rules", () => {
  const cs = read("content/snippets/Review.cs").replaceAll("\r\n", "\n");
  const members = (name) => cs.match(new RegExp(`enum ${name} \\{([^}]*)\\}`))[1].split(",").map((item) => item.trim().toLowerCase()).filter(Boolean);
  assert.deepEqual(members("Severity"), [...SEVERITIES]);
  assert.deepEqual(members("Status"), [...STATUSES]);
  for (const piece of ["record struct Anchor", "record Finding", "public Finding Resolve()", "public int OpenCount(Severity atLeast)", "ArgumentOutOfRangeException", "evidence.Start < 0 || evidence.Length <= 0 || evidence.Start + evidence.Length > Source.Length"]) {
    assert.ok(cs.includes(piece), `Review.cs lost: ${piece}`);
  }
  assert.match(cs, /illustrative c# model/);
  assert.match(cs, /not CHC Review Studio source/);
});

test("c#: a finding must point at text that exists, and says exactly which", () => {
  let review = newReview(SAMPLE);
  for (const evidence of [{ start: -1, length: 4 }, { start: 0, length: 0 }, { start: SAMPLE.length - 2, length: 5 }, { start: 1.5, length: 2 }]) {
    assert.throws(() => addFinding(review, evidence, "x", "low"), RangeError, JSON.stringify(evidence));
  }
  review = addFinding(review, { start: 4, length: 5 }, "  ", "high");
  assert.equal(review.findings[0].comment, DEFAULT_COMMENT, "an empty note falls back to the default");
  assert.equal(quote(SAMPLE, review.findings[0].evidence), SAMPLE.slice(4, 9));
  assert.equal(review.findings[0].status, "open");
  assert.equal(review.nextId, 2);
});

test("c#: open counts respect severity and resolving, like Review.OpenCount", () => {
  let review = newReview(SAMPLE);
  review = addFinding(review, { start: 0, length: 3 }, "a", "low");
  review = addFinding(review, { start: 4, length: 5 }, "b", "medium");
  review = addFinding(review, { start: 10, length: 4 }, "c", "high");
  assert.deepEqual([openCount(review), openCount(review, "medium"), openCount(review, "high")], [3, 2, 1]);
  review = resolveFinding(review, 3);
  assert.equal(openCount(review, "high"), 0);
  assert.equal(openCount(review), 2);
  assert.deepEqual(findingsAt(review, 5).map((finding) => finding.id), [2]);
});

test("c#: seeded findings, phrases and selection helpers stay inside the text", () => {
  const review = seeded();
  assert.equal(review.findings.length, 2);
  for (const finding of review.findings) assert.ok(quote(SAMPLE, finding.evidence).length > 0 && quote(SAMPLE, finding.evidence) === SAMPLE.substr(finding.evidence.start, finding.evidence.length));

  const chunks = chunksOf(SAMPLE);
  assert.ok(chunks.length >= 8);
  let last = 0;
  for (const chunk of chunks) {
    assert.ok(chunk.start >= last, "phrases are in order and do not overlap");
    assert.ok(!/^\s|\s$/.test(quote(SAMPLE, chunk)), "phrases carry no stray whitespace");
    last = chunk.start + chunk.length;
  }
  const joined = spanOfChunks(chunks, 3, 1);
  assert.equal(joined.start, chunks[1].start);
  assert.equal(joined.start + joined.length, chunks[3].start + chunks[3].length);

  assert.deepEqual(trimAnchor(SAMPLE, 3, 10), { start: 4, length: 5 });
  assert.equal(trimAnchor("a   b", 1, 4), null);
  assert.deepEqual(trimAnchor(SAMPLE, 9, 4), { start: 4, length: 5 }, "backwards drags work");

  const pieces = segment("abcdef", [2, 2, 4, 99, 0]);
  assert.deepEqual(pieces.map((piece) => piece.text), ["ab", "cd", "ef"]);
});

// ------------------------------------------------------------ html/css ---

test("html/css: the lab only writes custom properties, and ranges bound the numbers", () => {
  const vars = toVars(defaults);
  for (const key of Object.keys(vars)) assert.match(key, /^--[a-z-]+$/);
  assert.equal(vars["--frame-w"], "420px");
  for (const [key, range] of Object.entries(RANGES)) assert.ok(defaults[key] >= range.min && defaults[key] <= range.max, `${key} default sits inside its range`);

  const css = read("app/demo-card.css");
  for (const variable of Object.keys(vars)) assert.ok(css.includes(variable), `demo-card.css never reads ${variable}`);
  assert.match(css, /@container card/);
  for (const mutation of MUTATIONS) for (const variable of Object.keys(mutation.vars)) assert.ok(css.includes(variable), `demo-card.css never reads ${variable}`);
});

test("html/css: make it worse picks two different mutations, and valid-looking ones", () => {
  for (let seed = 1; seed <= 40; seed += 1) {
    const random = lcg(seed);
    const first = makeItWorse(null, random);
    assert.equal(new Set(first.ids).size, 2);
    assert.equal(first.captions.length, 2);
    const second = makeItWorse(first, random);
    assert.ok(!second.ids.every((id) => first.ids.includes(id)), "never the exact same pair twice in a row");
    for (const value of Object.values(first.vars)) assert.ok(value.length > 0 && !value.includes(";"));
  }
});

// ---------------------------------------------------------------- site ---

test("the three apps keep their promises in the built pages", () => {
  const java = built("skills/java.html");
  const csharp = built("skills/csharp.html");
  const lab = built("skills/html-css.html");
  if (java) {
    assert.match(java, /session lobby/);
    assert.match(java, /not Nexus source/);
  }
  if (csharp) {
    assert.match(csharp, /review desk/);
    assert.match(csharp, /not CHC Review Studio source/);
  }
  if (lab) assert.match(lab, /ui mutation lab/);
});

test("no em dashes in the files these playgrounds own", () => {
  const files = [
    "components/skills/SessionLobby.tsx", "components/skills/ReviewDesk.tsx", "components/skills/MutationLab.tsx", "components/skills/apps/Segmented.tsx",
    "lib/demos/session.ts", "lib/demos/review.ts", "lib/demos/mutation.ts",
    "content/snippets/Session.java", "content/snippets/Review.cs", "content/snippets/card.html", "app/demo-card.css", "app/skills-apps.css",
  ];
  for (const file of files) assert.ok(!read(file).includes(String.fromCharCode(0x2014)), `${file} has an em dash`);
});
