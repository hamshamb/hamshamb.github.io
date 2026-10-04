/**
 * Snake rules for the browser demo on /skills/python. Same rules as the Python version shown
 * beside it: walls kill, your own body kills, every apple speeds things up a little.
 * Pure functions so the rules can be tested without a canvas.
 */

export type Point = { x: number; y: number };
export type Direction = "up" | "down" | "left" | "right";
export type Status = "ready" | "playing" | "paused" | "over";

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
};

export const START_DELAY = 140;
export const MIN_DELAY = 60;
export const DELAY_STEP = 4;

const vectors: Record<Direction, Point> = { up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } };
const opposite: Record<Direction, Direction> = { up: "down", down: "up", left: "right", right: "left" };

const same = (a: Point, b: Point) => a.x === b.x && a.y === b.y;

export function placeFood(cols: number, rows: number, snake: Point[], random: () => number = Math.random): Point {
  const free: Point[] = [];
  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) if (!snake.some((part) => part.x === x && part.y === y)) free.push({ x, y });
  }
  return free[Math.floor(random() * free.length)] ?? { x: 0, y: 0 };
}

export function newGame(cols = 20, rows = 16, random: () => number = Math.random): Game {
  const y = Math.floor(rows / 2);
  const snake = [{ x: 5, y }, { x: 4, y }, { x: 3, y }];
  return { cols, rows, snake, direction: "right", queue: [], food: placeFood(cols, rows, snake, random), score: 0, delay: START_DELAY, status: "ready" };
}

/** Queue a turn. Reversing straight into your own neck is ignored, like in the Python version. */
export function steer(game: Game, turn: Direction): Game {
  const last = game.queue.at(-1) ?? game.direction;
  if (turn === last || turn === opposite[last] || game.queue.length >= 2) return game;
  return { ...game, queue: [...game.queue, turn], status: game.status === "ready" ? "playing" : game.status };
}

export function step(game: Game, random: () => number = Math.random): Game {
  if (game.status !== "playing") return game;
  const [turn, ...queue] = game.queue;
  const direction = turn ?? game.direction;
  const v = vectors[direction];
  const head = { x: game.snake[0].x + v.x, y: game.snake[0].y + v.y };

  const hitWall = head.x < 0 || head.y < 0 || head.x >= game.cols || head.y >= game.rows;
  const eats = same(head, game.food);
  // the tail moves out of the way this step unless we are growing
  const body = eats ? game.snake : game.snake.slice(0, -1);
  if (hitWall || body.some((part) => same(part, head))) return { ...game, direction, queue, status: "over" };

  const snake = [head, ...body];
  if (!eats) return { ...game, snake, direction, queue };
  return {
    ...game,
    snake,
    direction,
    queue,
    score: game.score + 1,
    delay: Math.max(MIN_DELAY, game.delay - DELAY_STEP),
    food: placeFood(game.cols, game.rows, snake, random),
  };
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
