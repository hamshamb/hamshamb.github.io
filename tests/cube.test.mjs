import test from "node:test";
import assert from "node:assert/strict";
import {
  FACES,
  SOLVED,
  FACE_COLOURS,
  parseMove,
  parseAlg,
  formatMove,
  formatAlg,
  applyMove,
  applyAlg,
  invertAlg,
  isSolved,
  generateScramble,
  mulberry32,
  netLayout,
  endsWithRepeats,
} from "../lib/cube.ts";

const rep = (alg, n, state = SOLVED) => {
  const moves = parseAlg(alg);
  let s = state;
  for (let i = 0; i < n; i++) s = applyAlg(s, moves);
  return s;
};

const AXIS = { U: 0, D: 0, R: 1, L: 1, F: 2, B: 2 };

test("solved constant is valid", () => {
  assert.equal(SOLVED.length, 54);
  assert.equal(isSolved(SOLVED), true);
  assert.deepEqual(FACES, ["U", "R", "F", "D", "L", "B"]);
  assert.equal(FACE_COLOURS.U, "white");
  assert.equal(FACE_COLOURS.F, "green");
});

test("each face move four times returns solved", () => {
  for (const f of FACES) {
    assert.equal(rep(f, 4), SOLVED, f);
    assert.notEqual(rep(f, 1), SOLVED, f);
    assert.notEqual(rep(f, 2), SOLVED, f);
  }
});

test("move followed by its inverse returns solved", () => {
  for (const f of FACES) {
    assert.equal(rep(`${f} ${f}'`, 1), SOLVED, f);
    assert.equal(rep(`${f}' ${f}`, 1), SOLVED, f);
  }
});

test("half turns twice return solved", () => {
  for (const f of FACES) {
    assert.equal(rep(`${f}2`, 2), SOLVED, f);
    assert.equal(rep(`${f}2`, 1), rep(`${f} ${f}`, 1), f);
  }
});

test("sexy move has order 6", () => {
  assert.equal(rep("R U R' U'", 6), SOLVED);
  for (let n = 1; n < 6; n++) assert.notEqual(rep("R U R' U'", n), SOLVED, String(n));
});

test("R U has order 105", () => {
  const moves = parseAlg("R U");
  let s = SOLVED;
  for (let i = 1; i <= 105; i++) {
    s = applyAlg(s, moves);
    if (i < 105) assert.equal(isSolved(s), false, `solved too early at ${i}`);
  }
  assert.equal(s, SOLVED);
  for (const n of [1, 35, 63]) assert.notEqual(rep("R U", n), SOLVED, String(n));
});

test("moves preserve sticker counts and change exactly 20 positions", () => {
  const distinct = Array.from({ length: 54 }, (_, i) => String.fromCharCode(65 + i)).join("");
  for (const f of FACES) {
    for (const turns of [1, 2, 3]) {
      const s = applyMove(SOLVED, { face: f, turns });
      for (const c of FACES) assert.equal(s.split(c).length - 1, 9, `${f}${turns} ${c}`);
    }
    const moved = applyMove(distinct, { face: f, turns: 1 });
    assert.equal(new Set(moved).size, 54);
    let changed = 0;
    for (let i = 0; i < 54; i++) if (moved[i] !== distinct[i]) changed++;
    assert.equal(changed, 20, f);
    // on a solved cube only the 12 side stickers visibly differ
    const solvedMoved = applyMove(SOLVED, { face: f, turns: 1 });
    let visible = 0;
    for (let i = 0; i < 54; i++) if (solvedMoved[i] !== SOLVED[i]) visible++;
    assert.equal(visible, 12, f);
  }
});

test("concrete facelets after U on solved", () => {
  const s = applyMove(SOLVED, parseMove("U"));
  const expected =
    "UUUUUUUUU" + // U unchanged
    "BBBRRRRRR" + // R top row now shows B (from B)
    "RRRFFFFFF" + // F top row now shows R (from R)
    "DDDDDDDDD" +
    "FFFLLLLLL" + // L top row now shows F (from F)
    "LLLBBBBBB"; // B top row now shows L (from L)
  assert.equal(s, expected);
  assert.equal(s.slice(18, 21), "RRR");
  assert.equal(s.slice(36, 39), "FFF");
  assert.equal(s.slice(45, 48), "LLL");
  assert.equal(s.slice(9, 12), "BBB");
});

test("concrete facelets after R on solved", () => {
  // clockwise R: F right column goes up to U, U to B, B to D, D to F
  const s = applyMove(SOLVED, parseMove("R"));
  const expected =
    "UUFUUFUUF" +
    "RRRRRRRRR" +
    "FFDFFDFFD" +
    "DDBDDBDDB" +
    "LLLLLLLLL" +
    "UBBUBBUBB";
  assert.equal(s, expected);
});

test("scrambles are deterministic, valid, and invertible", () => {
  const a = generateScramble(20, mulberry32(12345));
  const b = generateScramble(20, mulberry32(12345));
  assert.deepEqual(a, b);
  assert.equal(a.length, 20);
  assert.notDeepEqual(a, generateScramble(20, mulberry32(54321)));
  assert.equal(generateScramble().length, 20);

  const rnd = mulberry32(2024);
  for (let n = 0; n < 500; n++) {
    const s = generateScramble(20, rnd);
    assert.equal(s.length, 20);
    for (let i = 0; i < s.length; i++) {
      assert.ok([1, 2, 3].includes(s[i].turns));
      if (i > 0) {
        assert.notEqual(s[i].face, s[i - 1].face);
        if (AXIS[s[i].face] === AXIS[s[i - 1].face]) {
          // canonical order: U before D, R before L, F before B
          assert.ok("URF".includes(s[i - 1].face) && "DLB".includes(s[i].face), formatAlg(s));
        }
      }
      if (i > 1) {
        const same = AXIS[s[i].face] === AXIS[s[i - 1].face] && AXIS[s[i].face] === AXIS[s[i - 2].face];
        assert.equal(same, false, formatAlg(s));
      }
    }
    assert.equal(applyAlg(applyAlg(SOLVED, s), invertAlg(s)), SOLVED);
  }
});

test("parse and format round-trip", () => {
  const alg = "R U R' U' F2 D L' B2";
  assert.equal(formatAlg(parseAlg(alg)), alg);
  assert.deepEqual(parseAlg(""), []);
  assert.deepEqual(parseAlg("  R   U'  "), [
    { face: "R", turns: 1 },
    { face: "U", turns: 3 },
  ]);
  for (const f of FACES) {
    for (const t of ["", "'", "2"]) assert.equal(formatMove(parseMove(f + t)), f + t);
  }
  assert.deepEqual(invertAlg(parseAlg("R U2 F'")), parseAlg("F U2 R'"));
});

test("parseMove throws on invalid tokens", () => {
  for (const bad of ["X", "R3", "", "r", "R2'", "RR", " R"]) {
    assert.throws(() => parseMove(bad), bad);
  }
});

test("net layout positions", () => {
  const layout = netLayout();
  assert.equal(layout.length, 6);
  const get = (f) => layout.find((l) => l.face === f);
  assert.deepEqual(get("U"), { face: "U", col: 1, row: 0 });
  assert.deepEqual(get("L"), { face: "L", col: 0, row: 1 });
  assert.deepEqual(get("F"), { face: "F", col: 1, row: 1 });
  assert.deepEqual(get("R"), { face: "R", col: 2, row: 1 });
  assert.deepEqual(get("B"), { face: "B", col: 3, row: 1 });
  assert.deepEqual(get("D"), { face: "D", col: 1, row: 2 });
});

test("endsWithRepeats finds a sequence repeated at the tail of a history", () => {
  const sexy = parseAlg("R U R' U'");
  const six = parseAlg("R U R' U' ".repeat(6));
  assert.equal(endsWithRepeats(six, sexy, 6), true);
  assert.equal(endsWithRepeats([...parseAlg("F B"), ...six], sexy, 6), true, "earlier moves do not matter");
  assert.equal(endsWithRepeats(parseAlg("R U R' U' ".repeat(5)), sexy, 6), false);
  assert.equal(endsWithRepeats([...six, ...parseAlg("F")], sexy, 6), false, "it has to be the tail");
  assert.equal(endsWithRepeats(parseAlg("R U R' U' R U R' U2 ".repeat(3)), sexy, 6), false);
  assert.equal(endsWithRepeats([], sexy, 1), false);
  assert.equal(endsWithRepeats(six, [], 6), false);
  assert.equal(isSolved(applyAlg(SOLVED, six)), true);
});
