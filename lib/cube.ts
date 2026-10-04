// pure 3x3 rubik's cube engine. no imports, no enums, runs under node type stripping.
//
// state is a 54 char facelet string in kociemba order: U1..U9 R1..R9 F1..F9 D1..D9 L1..L9 B1..B9.
// each char is the face letter whose colour that sticker shows. orientation is standard wca:
// white U, yellow D, green F, blue B, red R, orange L.
//
// scrambles are "wca-style": random moves in wca notation obeying the usual axis rules.
// they are NOT the official wca random-state scrambler.

export type Face = "U" | "R" | "F" | "D" | "L" | "B";

export const FACES: Face[] = ["U", "R", "F", "D", "L", "B"];

// turns: 1 = clockwise, 2 = half turn, 3 = counter-clockwise (prime)
export type Move = { face: Face; turns: 1 | 2 | 3 };

export type CubeState = string;

export const SOLVED: CubeState =
  "UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB";

export const FACE_COLOURS: Record<Face, string> = {
  U: "white",
  R: "red",
  F: "green",
  D: "yellow",
  L: "orange",
  B: "blue",
};

// ---- quarter turn permutation tables, derived from 3d geometry at load time ----
// axes: x towards R, y towards U, z towards F. facelet i of a face sits at row i/3, col i%3
// as seen when looking at that face with the usual net orientation.

type Vec = [number, number, number];

const FACE_NORMAL: Record<Face, Vec> = {
  U: [0, 1, 0],
  R: [1, 0, 0],
  F: [0, 0, 1],
  D: [0, -1, 0],
  L: [-1, 0, 0],
  B: [0, 0, -1],
};

function faceletPosition(face: Face, i: number): Vec {
  const r = Math.floor(i / 3);
  const c = i % 3;
  switch (face) {
    case "U":
      return [c - 1, 1, r - 1];
    case "R":
      return [1, 1 - r, 1 - c];
    case "F":
      return [c - 1, 1 - r, 1];
    case "D":
      return [c - 1, -1, 1 - r];
    case "L":
      return [-1, 1 - r, c - 1];
    default:
      return [1 - c, 1 - r, -1];
  }
}

function dot(a: Vec, b: Vec): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

function cross(a: Vec, b: Vec): Vec {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

// clockwise seen from outside the face = -90 degrees about the outward normal
function rotateClockwise(n: Vec, v: Vec): Vec {
  const c = cross(n, v);
  const d = dot(n, v);
  return [-c[0] + n[0] * d, -c[1] + n[1] * d, -c[2] + n[2] * d];
}

const FACE_INDEX: Record<Face, number> = { U: 0, R: 1, F: 2, D: 3, L: 4, B: 5 };

// key "x,y,z,nx,ny,nz" -> facelet index
const POSITION_TO_INDEX: Record<string, number> = {};
const FACELET_POS: Vec[] = [];
const FACELET_NORMAL: Vec[] = [];

for (const f of FACES) {
  for (let i = 0; i < 9; i++) {
    const idx = FACE_INDEX[f] * 9 + i;
    const p = faceletPosition(f, i);
    FACELET_POS[idx] = p;
    FACELET_NORMAL[idx] = FACE_NORMAL[f];
    POSITION_TO_INDEX[p.join(",") + "," + FACE_NORMAL[f].join(",")] = idx;
  }
}

// QUARTER[face][j] = index of the old facelet that lands at position j after a clockwise quarter turn
const QUARTER: Record<Face, number[]> = { U: [], R: [], F: [], D: [], L: [], B: [] };

for (const f of FACES) {
  const n = FACE_NORMAL[f];
  const table: number[] = [];
  for (let idx = 0; idx < 54; idx++) table[idx] = idx;
  for (let idx = 0; idx < 54; idx++) {
    const p = FACELET_POS[idx];
    if (dot(p, n) !== 1) continue;
    const p2 = rotateClockwise(n, p);
    const n2 = rotateClockwise(n, FACELET_NORMAL[idx]);
    const dest = POSITION_TO_INDEX[p2.join(",") + "," + n2.join(",")];
    table[dest] = idx;
  }
  QUARTER[f] = table;
}

// ---- notation ----

export function parseMove(token: string): Move {
  const m = /^([URFDLB])(2|')?$/.exec(token);
  if (!m) throw new Error("invalid move: " + JSON.stringify(token));
  const turns = m[2] === "2" ? 2 : m[2] === "'" ? 3 : 1;
  return { face: m[1] as Face, turns };
}

export function parseAlg(alg: string): Move[] {
  const trimmed = alg.trim();
  if (trimmed === "") return [];
  return trimmed.split(/\s+/).map(parseMove);
}

export function formatMove(m: Move): string {
  return m.face + (m.turns === 2 ? "2" : m.turns === 3 ? "'" : "");
}

export function formatAlg(moves: Move[]): string {
  return moves.map(formatMove).join(" ");
}

// ---- applying moves ----

export function applyMove(state: CubeState, move: Move): CubeState {
  if (state.length !== 54) throw new Error("state must be 54 chars");
  const table = QUARTER[move.face];
  let cur = state;
  for (let t = 0; t < move.turns; t++) {
    let next = "";
    for (let j = 0; j < 54; j++) next += cur[table[j]];
    cur = next;
  }
  return cur;
}

export function applyAlg(state: CubeState, moves: Move[]): CubeState {
  let cur = state;
  for (const m of moves) cur = applyMove(cur, m);
  return cur;
}

export function invertAlg(moves: Move[]): Move[] {
  const out: Move[] = [];
  for (let i = moves.length - 1; i >= 0; i--) {
    const m = moves[i];
    out.push({ face: m.face, turns: (4 - m.turns) as 1 | 2 | 3 });
  }
  return out;
}

export function isSolved(state: CubeState): boolean {
  if (state.length !== 54) return false;
  for (let f = 0; f < 6; f++) {
    const c = state[f * 9];
    for (let i = 1; i < 9; i++) if (state[f * 9 + i] !== c) return false;
  }
  return true;
}

// ---- scrambles ----

// small seeded prng, returns floats in [0, 1)
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const AXIS: Record<Face, number> = { U: 0, D: 0, R: 1, L: 1, F: 2, B: 2 };
// canonical order inside an axis: U before D, R before L, F before B
const AXIS_RANK: Record<Face, number> = { U: 0, D: 1, R: 0, L: 1, F: 0, B: 1 };

export function generateScramble(
  length: number = 20,
  random: () => number = Math.random
): Move[] {
  if (!Number.isInteger(length) || length < 1) {
    throw new Error("scramble length must be a positive integer");
  }
  const out: Move[] = [];
  while (out.length < length) {
    const prev = out.length > 0 ? out[out.length - 1].face : null;
    const prev2 = out.length > 1 ? out[out.length - 2].face : null;
    const candidates = FACES.filter((f) => {
      if (prev === null) return true;
      if (f === prev) return false;
      if (AXIS[f] === AXIS[prev]) {
        if (prev2 !== null && AXIS[prev2] === AXIS[prev]) return false;
        if (AXIS_RANK[f] < AXIS_RANK[prev]) return false;
      }
      return true;
    });
    const face = candidates[Math.floor(random() * candidates.length)];
    const turns = (Math.floor(random() * 3) + 1) as 1 | 2 | 3;
    out.push({ face, turns });
  }
  return out;
}

// ---- net layout (4x3 grid of faces) ----

export function netLayout(): { face: Face; col: number; row: number }[] {
  return [
    { face: "U", col: 1, row: 0 },
    { face: "L", col: 0, row: 1 },
    { face: "F", col: 1, row: 1 },
    { face: "R", col: 2, row: 1 },
    { face: "B", col: 3, row: 1 },
    { face: "D", col: 1, row: 2 },
  ];
}

// ---- geometry for views ----

/** where a facelet sits: x right, y up, z toward the viewer (the F face). coordinates are -1, 0 or 1. */
export type Sticker = { index: number; face: Face; position: [number, number, number]; normal: [number, number, number] };

export function stickers(): Sticker[] {
  return FACELET_POS.map((position, index) => ({
    index,
    face: FACES[Math.floor(index / 9)],
    position: [...position] as [number, number, number],
    normal: [...FACELET_NORMAL[index]] as [number, number, number],
  }));
}

/** the outward normal of a face, which is also the axis its layer turns around. */
export function faceNormal(face: Face): [number, number, number] {
  return [...FACE_NORMAL[face]] as [number, number, number];
}

/** whether a facelet moves when this face turns. */
export function inLayer(face: Face, index: number): boolean {
  return dot(FACELET_POS[index], FACE_NORMAL[face]) === 1;
}
