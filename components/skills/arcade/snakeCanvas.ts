import { BONUS_TTL, COMBO_WINDOW, type Direction, type Game, type Point } from "@/lib/snake";

/**
 * Drawing for Signal Snake: a grid, a snake with smooth movement between ticks, and a handful of
 * small effects. No game rules in here; those live in lib/snake.ts. Colours come from CSS custom
 * properties so the board follows the site theme and the unlockable skin.
 */

export const CELL = 32;

export type Palette = {
  board: string;
  grid: string;
  ink: string;
  head: string;
  food: string;
  bonus: string;
  accent: string;
  muted: string;
  font: string;
};

export function readPalette(el: Element): Palette {
  const styles = getComputedStyle(el);
  const read = (name: string, fallback: string) => styles.getPropertyValue(name).trim() || fallback;
  return {
    board: read("--sg-board", "#f5f4ef"),
    grid: read("--sg-grid", "rgba(20,22,19,0.11)"),
    ink: read("--sg-ink", "#141613"),
    head: read("--sg-head", "#1c7341"),
    food: read("--sg-food", "#95580a"),
    bonus: read("--sg-bonus", "#3c5a8a"),
    accent: read("--sg-accent", "#1c7341"),
    muted: read("--sg-muted", "#686b62"),
    font: styles.fontFamily || "monospace",
  };
}

type Tone = "ink" | "food" | "bonus" | "head";
type Particle = { x: number; y: number; vx: number; vy: number; age: number; life: number; size: number; tone: Tone; alpha: number };
type Ring = { x: number; y: number; age: number; life: number; radius: number; tone: Tone };
type Floater = { x: number; y: number; age: number; life: number; text: string; tone: Tone };

export type Fx = { particles: Particle[]; rings: Ring[]; floaters: Floater[] };

export const emptyFx = (): Fx => ({ particles: [], rings: [], floaters: [] });
export const fxActive = (fx: Fx) => fx.particles.length + fx.rings.length + fx.floaters.length > 0;

const center = (cell: Point) => ({ x: (cell.x + 0.5) * CELL, y: (cell.y + 0.5) * CELL });

export function spawnBurst(fx: Fx, at: Point, tone: Tone, count: number) {
  const c = center(at);
  for (let i = 0; i < count; i += 1) {
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
    const speed = 50 + Math.random() * 110;
    fx.particles.push({ x: c.x, y: c.y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, age: 0, life: 380 + Math.random() * 280, size: 2 + Math.random() * 2.4, tone, alpha: 1 });
  }
  if (fx.particles.length > 160) fx.particles.splice(0, fx.particles.length - 160);
}

/** A faint dot left where the tail just was. */
export function spawnTrail(fx: Fx, at: Point) {
  const c = center(at);
  fx.particles.push({ x: c.x, y: c.y, vx: (Math.random() - 0.5) * 14, vy: (Math.random() - 0.5) * 14, age: 0, life: 460, size: 3, tone: "ink", alpha: 0.32 });
}

export function spawnRing(fx: Fx, at: Point, tone: Tone) {
  const c = center(at);
  fx.rings.push({ x: c.x, y: c.y, age: 0, life: 420, radius: CELL * 1.1, tone });
}

export function spawnFloater(fx: Fx, at: Point, text: string, tone: Tone) {
  const c = center(at);
  fx.floaters.push({ x: c.x, y: c.y - CELL * 0.5, age: 0, life: 720, text, tone });
}

export function updateFx(fx: Fx, ms: number) {
  const dt = ms / 1000;
  fx.particles = fx.particles.filter((p) => {
    p.age += ms;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= 0.93;
    p.vy *= 0.93;
    return p.age < p.life;
  });
  fx.rings = fx.rings.filter((r) => ((r.age += ms), r.age < r.life));
  fx.floaters = fx.floaters.filter((f) => ((f.age += ms), f.age < f.life));
}

const vectors: Record<Direction, Point> = { up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } };
const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
const easeOutBack = (t: number) => 1 + 2.2 * Math.pow(t - 1, 3) + 1.2 * Math.pow(t - 1, 2);

export type Frame = {
  game: Game;
  /** The snake as it was one step ago, for movement between ticks. */
  prev: Point[];
  /** 0 to 1 through the current step. */
  alpha: number;
  time: number;
  /** When the current food appeared. */
  foodBorn: number;
  palette: Palette;
  fx: Fx;
  /** Reduced motion: no pulsing, no pop-in. */
  calm: boolean;
};

export function drawFrame(ctx: CanvasRenderingContext2D, frame: Frame) {
  const { game, palette: p, fx, calm } = frame;
  const width = game.cols * CELL;
  const height = game.rows * CELL;
  const tone = (name: Tone) => ({ ink: p.ink, food: p.food, bonus: p.bonus, head: p.head })[name];

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = p.board;
  ctx.fillRect(0, 0, width, height);

  // paper grid with small registration marks every few cells
  ctx.strokeStyle = p.grid;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 1; x < game.cols; x += 1) {
    ctx.moveTo(x * CELL + 0.5, 0);
    ctx.lineTo(x * CELL + 0.5, height);
  }
  for (let y = 1; y < game.rows; y += 1) {
    ctx.moveTo(0, y * CELL + 0.5);
    ctx.lineTo(width, y * CELL + 0.5);
  }
  ctx.stroke();
  ctx.strokeStyle = p.muted;
  ctx.globalAlpha = 0.55;
  ctx.beginPath();
  for (let x = 4; x < game.cols; x += 4) {
    for (let y = 4; y < game.rows; y += 4) {
      ctx.moveTo(x * CELL - 4, y * CELL + 0.5);
      ctx.lineTo(x * CELL + 5, y * CELL + 0.5);
      ctx.moveTo(x * CELL + 0.5, y * CELL - 4);
      ctx.lineTo(x * CELL + 0.5, y * CELL + 5);
    }
  }
  ctx.stroke();
  ctx.globalAlpha = 1;

  // combo timer: a thin bar along the top edge that runs down between apples
  if (game.combo > 0 && game.status === "playing") {
    const left = clamp01(1 - (game.sinceEat + (calm ? 0 : frame.alpha)) / COMBO_WINDOW);
    ctx.fillStyle = p.accent;
    ctx.fillRect(0, 0, width * left, 4);
  }

  // food: a diamond that pops in when it appears
  const food = center(game.food);
  const age = frame.time - frame.foodBorn;
  const grow = calm ? 1 : easeOutBack(clamp01(age / 300));
  const pulse = calm ? 0 : Math.sin(frame.time / 240) * 0.05;
  const radius = CELL * 0.3 * Math.max(0, grow + pulse);
  ctx.save();
  ctx.translate(food.x, food.y);
  ctx.strokeStyle = p.food;
  ctx.globalAlpha = 0.35;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(0, 0, CELL * 0.44 * Math.max(0.2, grow), 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.rotate(Math.PI / 4);
  ctx.fillStyle = p.food;
  ctx.fillRect(-radius * 0.78, -radius * 0.78, radius * 1.56, radius * 1.56);
  ctx.restore();

  // bonus: a ring that runs out
  if (game.bonus) {
    const at = center(game.bonus.at);
    const blink = game.bonus.ttl <= 8 && Math.floor(frame.time / 130) % 2 === 0;
    if (!blink) {
      ctx.save();
      ctx.translate(at.x, at.y);
      ctx.strokeStyle = p.bonus;
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.arc(0, 0, CELL * 0.42, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (game.bonus.ttl / BONUS_TTL));
      ctx.stroke();
      ctx.fillStyle = p.bonus;
      ctx.rotate(calm ? 0 : frame.time / 700);
      const s = CELL * 0.17;
      ctx.beginPath();
      for (let i = 0; i < 8; i += 1) {
        const r = i % 2 === 0 ? s * 1.5 : s * 0.6;
        const a = (Math.PI * 2 * i) / 8;
        ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  // snake: segments slide from where they were to where they are
  const t = calm ? 1 : clamp01(frame.alpha);
  const last = frame.prev.at(-1);
  const points = game.snake.map((cell, index) => {
    const from = frame.prev[index] ?? last ?? cell;
    return { x: (from.x + (cell.x - from.x) * t + 0.5) * CELL, y: (from.y + (cell.y - from.y) * t + 0.5) * CELL };
  });
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  const dim = game.status === "over" ? 0.6 : 1;
  ctx.globalAlpha = dim;
  for (let i = points.length - 1; i >= 1; i -= 1) {
    const taper = 0.7 - 0.2 * (i / points.length);
    ctx.strokeStyle = p.ink;
    ctx.lineWidth = CELL * taper;
    ctx.beginPath();
    ctx.moveTo(points[i].x, points[i].y);
    ctx.lineTo(points[i - 1].x, points[i - 1].y);
    ctx.stroke();
  }
  // a thin wire down the middle, like a trace on a board
  ctx.strokeStyle = p.board;
  ctx.globalAlpha = 0.3 * dim;
  ctx.lineWidth = 2;
  ctx.beginPath();
  points.forEach((point, index) => (index === 0 ? ctx.moveTo(point.x, point.y) : ctx.lineTo(point.x, point.y)));
  ctx.stroke();
  ctx.globalAlpha = dim;

  const head = points[0];
  const forward = vectors[game.direction];
  ctx.fillStyle = p.head;
  ctx.beginPath();
  ctx.arc(head.x, head.y, CELL * 0.44, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = p.board;
  ctx.fillStyle = p.board;
  ctx.lineWidth = 2;
  for (const side of [-1, 1]) {
    const ex = head.x + forward.x * CELL * 0.14 - forward.y * side * CELL * 0.17;
    const ey = head.y + forward.y * CELL * 0.14 + forward.x * side * CELL * 0.17;
    if (game.status === "over") {
      ctx.beginPath();
      ctx.moveTo(ex - 3, ey - 3);
      ctx.lineTo(ex + 3, ey + 3);
      ctx.moveTo(ex + 3, ey - 3);
      ctx.lineTo(ex - 3, ey + 3);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(ex, ey, CELL * 0.07, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;

  // effects sit on top
  for (const ring of fx.rings) {
    const k = ring.age / ring.life;
    ctx.strokeStyle = tone(ring.tone);
    ctx.globalAlpha = 0.7 * (1 - k);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(ring.x, ring.y, ring.radius * (0.3 + 0.7 * k), 0, Math.PI * 2);
    ctx.stroke();
  }
  for (const particle of fx.particles) {
    ctx.globalAlpha = particle.alpha * (1 - particle.age / particle.life);
    ctx.fillStyle = tone(particle.tone);
    ctx.fillRect(particle.x - particle.size / 2, particle.y - particle.size / 2, particle.size, particle.size);
  }
  ctx.font = `600 15px ${p.font}`;
  ctx.textAlign = "center";
  for (const floater of fx.floaters) {
    const k = floater.age / floater.life;
    ctx.globalAlpha = 1 - k * k;
    ctx.fillStyle = tone(floater.tone);
    ctx.fillText(floater.text, floater.x, floater.y - k * 22);
  }
  ctx.globalAlpha = 1;
}
