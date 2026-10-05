/**
 * Snake rules for the browser game on /skills/python. The core is the same as the Python version
 * shown beside it: walls kill, your own body kills, you cannot reverse into your neck, every apple
 * speeds things up a little. The browser version adds a few extras on top: a combo for eating
 * quickly in a row, a rare bonus item and an unlockable skin.
 *
 * Everything here is a pure function so the rules can be tested without a canvas or a clock.
 */

export type Point = { x: number; y: number };
export type Direction = "up" | "down" | "left" | "right";
export type Status = "ready" | "playing" | "paused" | "over";

export type GameEvent = {
  /** Unique per step, so the renderer can tell a new event from one it already showed. */
  id: number;
  type: "eat" | "bonus" | "expire" | "over" | "win";
  at: Point;
  points: number;
};

export type Bonus = { at: Point; ttl: number };

export type Game = {
  cols: number;
  rows: number;
  snake: Point[];
  direction: Direction;
  /** Turns queued since the last tick, so two quick key presses both count. */
  queue: Direction[];
  food: Point;
  score: number;
  /** Milliseconds per step. */
  delay: number;
  status: Status;
  /** Apples eaten in a row without a long gap. Drives the multiplier. */
  combo: number;
  /** Steps since the last apple. */
  sinceEat: number;
  bonus: Bonus | null;
  /** Steps taken so far. */
  steps: number;
  /** The most notable thing that happened on the last step, for effects. */
  event: GameEvent | null;
};

export const START_DELAY = 140;
export const MIN_DELAY = 60;
export const DELAY_STEP = 4;
/** Steps allowed between two apples for the combo to survive. */
export const COMBO_WINDOW = 14;
/** The multiplier is 1 plus the combo, up to this much extra. */
export const COMBO_MAX = 3;
export const BONUS_CHANCE = 0.18;
export const BONUS_TTL = 36;
export const BONUS_POINTS = 5;
/** The bonus never shows up before this score, so the first apples stay plain. */
export const BONUS_AFTER = 2;
export const MAX_LEVEL = (START_DELAY - MIN_DELAY) / DELAY_STEP;

const vectors: Record<Direction, Point> = { up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } };
const opposite: Record<Direction, Direction> = { up: "down", down: "up", left: "right", right: "left" };

const same = (a: Point, b: Point) => a.x === b.x && a.y === b.y;

/** A free cell, never on the snake and never on anything in `avoid`. Null when the board is full. */
export function placeFood(cols: number, rows: number, snake: Point[], random: () => number = Math.random, avoid: Point[] = []): Point | null {
  const free: Point[] = [];
  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      const cell = { x, y };
      if (!snake.some((part) => same(part, cell)) && !avoid.some((other) => same(other, cell))) free.push(cell);
    }
  }
  return free[Math.floor(random() * free.length)] ?? null;
}

export function newGame(cols = 20, rows = 16, random: () => number = Math.random): Game {
  const y = Math.floor(rows / 2);
  const snake = [{ x: 5, y }, { x: 4, y }, { x: 3, y }];
  return {
    cols,
    rows,
    snake,
    direction: "right",
    queue: [],
    food: placeFood(cols, rows, snake, random) ?? { x: 0, y: 0 },
    score: 0,
    delay: START_DELAY,
    status: "ready",
    combo: 0,
    sinceEat: 0,
    bonus: null,
    steps: 0,
    event: null,
  };
}

/** Queue a turn. Reversing straight into your own neck is ignored, like in the Python version. */
export function steer(game: Game, turn: Direction): Game {
  const last = game.queue.at(-1) ?? game.direction;
  if (turn === last || turn === opposite[last] || game.queue.length >= 2) return game;
  return { ...game, queue: [...game.queue, turn], status: game.status === "ready" ? "playing" : game.status };
}

/** Points for the next apple: 1, then 2, 3, up to 1 + COMBO_MAX while the combo holds. */
export function multiplier(game: Game): number {
  return 1 + Math.min(game.combo, COMBO_MAX);
}

/** 0 at the start, MAX_LEVEL at the speed ceiling. */
export function speedLevel(delay: number): number {
  return Math.max(0, Math.min(MAX_LEVEL, Math.round((START_DELAY - delay) / DELAY_STEP)));
}

/** Speed relative to the start, for display: 1x up to about 2.3x. */
export function speedFactor(delay: number): number {
  return Math.round((START_DELAY / delay) * 10) / 10;
}

export function step(game: Game, random: () => number = Math.random): Game {
  if (game.status !== "playing") return game;
  const [turn, ...queue] = game.queue;
  const direction = turn ?? game.direction;
  const v = vectors[direction];
  const head = { x: game.snake[0].x + v.x, y: game.snake[0].y + v.y };
  const steps = game.steps + 1;

  const hitWall = head.x < 0 || head.y < 0 || head.x >= game.cols || head.y >= game.rows;
  const eatsFood = same(head, game.food);
  const eatsBonus = game.bonus !== null && same(head, game.bonus.at);
  const grows = eatsFood || eatsBonus;
  // the tail moves out of the way this step unless we are growing
  const body = grows ? game.snake : game.snake.slice(0, -1);
  if (hitWall || body.some((part) => same(part, head))) {
    const at = hitWall ? game.snake[0] : head;
    return { ...game, direction, queue, steps, status: "over", event: { id: steps, type: "over", at, points: 0 } };
  }

  const snake = [head, ...body];
  const sinceEat = eatsFood ? 0 : game.sinceEat + 1;
  // a long gap ends the combo
  const kept = game.sinceEat + 1 > COMBO_WINDOW ? 0 : game.combo;
  let next: Game = { ...game, snake, direction, queue, steps, sinceEat, combo: kept, event: null };

  // the bonus counts down and quietly disappears
  if (next.bonus && !eatsBonus) {
    const ttl = next.bonus.ttl - 1;
    next = ttl > 0
      ? { ...next, bonus: { ...next.bonus, ttl } }
      : { ...next, bonus: null, event: { id: steps, type: "expire", at: next.bonus.at, points: 0 } };
  }

  if (eatsBonus) {
    return { ...next, score: game.score + BONUS_POINTS, bonus: null, event: { id: steps, type: "bonus", at: head, points: BONUS_POINTS } };
  }
  if (!eatsFood) return next;

  const points = multiplier({ ...game, combo: kept });
  const score = game.score + points;
  const food = placeFood(game.cols, game.rows, snake, random, next.bonus ? [next.bonus.at] : []);
  if (!food) return { ...next, score, status: "over", event: { id: steps, type: "win", at: head, points } };

  let bonus = next.bonus;
  if (!bonus && score >= BONUS_AFTER && random() < BONUS_CHANCE) {
    const at = placeFood(game.cols, game.rows, snake, random, [food]);
    if (at) bonus = { at, ttl: BONUS_TTL };
  }
  return {
    ...next,
    score,
    combo: kept + 1,
    delay: Math.max(MIN_DELAY, game.delay - DELAY_STEP),
    food,
    bonus,
    event: { id: steps, type: "eat", at: head, points },
  };
}

/** Space / P / the pause button. Also starts a fresh game from the start and game over screens. */
export function toggle(game: Game, random: () => number = Math.random): Game {
  if (game.status === "over") return newGame(game.cols, game.rows, random);
  if (game.status === "ready") return { ...game, status: "playing" };
  return { ...game, status: game.status === "playing" ? "paused" : "playing" };
}

/** Where the best score lives. Anything can stand in for localStorage, including nothing. */
export type ScoreStore = { get(): number; set(value: number): void };

export function memoryStore(start = 0): ScoreStore {
  let value = start;
  return { get: () => value, set: (next) => { value = next; } };
}

export function recordScore(store: ScoreStore, score: number): number {
  const best = Math.max(store.get(), score);
  if (best !== store.get()) store.set(best);
  return best;
}

/** Whatever was in storage, as a safe score. */
export function parseScore(raw: string | null | undefined): number {
  const value = Number(raw);
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
}

/** The skins. "python" is the unlockable one. */
export const SKINS = ["ink", "python"] as const;
export type Skin = (typeof SKINS)[number];

/** The skin to wear: the one asked for, unless it is still locked. */
export function chooseSkin(unlocked: boolean, wanted: string | null | undefined): Skin {
  return unlocked && wanted === "python" ? "python" : "ink";
}

/**
 * The bug-fix puzzle: six lines of terminal snake with one broken. Picking the right line
 * unlocks the skin. The fixed version of these lines is what content/snippets/snake.py runs.
 */
export const BUG_LINES = [
  "head = (snake[0][0] + direction[0], snake[0][1] + direction[1])",
  "snake.appendleft(head)",
  "if head == food:",
  "    score += 1",
  "    food = place_food(rows, cols, snake)",
  "snake.pop()",
] as const;
export const BUG_LINE = 5;

export type BugAnswer = { correct: boolean; message: string };

const bugHints: Record<number, string> = {
  0: "that line only works out where the head goes next. it behaves.",
  1: "growing the front is fine. something else decides if the snake gets longer.",
  2: "this just asks whether the head landed on food.",
  3: "the score goes up. the snake does not. keep looking.",
  4: "new food shows up fine. look at what happens to the tail.",
};

export function checkBug(index: number): BugAnswer {
  if (index === BUG_LINE) {
    return { correct: true, message: "right. pop() runs every step, even after eating, so the snake never grows. it belongs in an else." };
  }
  return { correct: false, message: bugHints[index] ?? "not that one. what happens to the tail after eating?" };
}
