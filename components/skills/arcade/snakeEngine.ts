import { type Direction, type Game, type GameEvent, MAX_LEVEL, multiplier, newGame, type Point, speedFactor, speedLevel, step, type Status, steer, toggle } from "@/lib/snake";
import { CELL, drawFrame, emptyFx, type Fx, fxActive, type Palette, readPalette, spawnBurst, spawnFloater, spawnRing, spawnTrail, updateFx } from "./snakeCanvas";

/** What the HUD and the screens need. Only sent to React when something in it changes. */
export type Hud = {
  status: Status;
  score: number;
  /** Lit segments of the speed meter, 1 to 10. */
  speed: number;
  factor: number;
  atCeiling: boolean;
  combo: number;
  multiplier: number;
  bonus: boolean;
};

/**
 * Runs one game: the loop, the canvas and the effects. React owns the screens and the buttons and
 * calls turn / toggle / restart; this owns time. The loop only runs while something is moving, so
 * an idle or paused board costs nothing.
 */
export class SnakeEngine {
  private game: Game = newGame();
  private prev: Point[] = this.game.snake;
  private acc = 0;
  private last = 0;
  private raf = 0;
  private fx: Fx = emptyFx();
  private born = 0;
  private seen = 0;
  private palette: Palette;
  private calm = false;
  private ctx: CanvasRenderingContext2D | null;
  private key = "";
  private dead = false;

  constructor(
    private canvas: HTMLCanvasElement,
    private styleSource: HTMLElement,
    private onHud: (hud: Hud) => void,
    private onOver: (score: number) => void,
  ) {
    const ratio = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = this.game.cols * CELL * ratio;
    canvas.height = this.game.rows * CELL * ratio;
    this.ctx = canvas.getContext("2d");
    this.ctx?.scale(ratio, ratio);
    this.palette = readPalette(styleSource);
    this.born = performance.now();
    this.emit();
    this.kick();
  }

  destroy() {
    this.dead = true;
    cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  /** Reduced motion: movement snaps to cells, nothing flies or pulses. */
  setCalm(calm: boolean) {
    this.calm = calm;
    if (calm) this.fx = emptyFx();
    this.kick();
  }

  /** The theme or skin changed: read the colours again. */
  restyle() {
    this.palette = readPalette(this.styleSource);
    this.kick();
  }

  get status() {
    return this.game.status;
  }

  turn(direction: Direction) {
    if (this.game.status === "over") return;
    const resumed = this.game.status === "paused" ? { ...this.game, status: "playing" as const } : this.game;
    this.game = steer(resumed, direction);
    this.afterInput();
  }

  /** Start, pause, resume or play again, depending on where the game is. */
  toggle() {
    const was = this.game.status;
    this.game = toggle(this.game);
    if (was === "over") this.reset(false);
    this.afterInput();
  }

  pause() {
    if (this.game.status !== "playing") return;
    this.game = { ...this.game, status: "paused" };
    this.afterInput();
  }

  restart(start = false) {
    this.game = newGame();
    this.reset(start);
    this.afterInput();
  }

  private reset(start: boolean) {
    if (start) this.game = { ...this.game, status: "playing" };
    this.prev = this.game.snake;
    this.acc = 0;
    this.seen = 0;
    this.fx = emptyFx();
    this.born = performance.now();
  }

  private afterInput() {
    this.last = 0;
    this.emit();
    this.kick();
  }

  private kick() {
    if (this.dead || this.raf) return;
    this.raf = requestAnimationFrame(this.frame);
  }

  private frame = (now: number) => {
    this.raf = 0;
    if (this.dead) return;
    const dt = Math.min(80, this.last ? now - this.last : 16);
    this.last = now;

    if (this.game.status === "playing") {
      this.acc += dt;
      let steps = 0;
      while (this.acc >= this.game.delay && this.game.status === "playing" && steps < 4) {
        this.acc -= this.game.delay;
        this.advance(now);
        steps += 1;
      }
      if (steps >= 4) this.acc = 0;
    }

    updateFx(this.fx, dt);
    this.draw(now);
    if (this.game.status === "playing" || fxActive(this.fx)) this.raf = requestAnimationFrame(this.frame);
    else this.last = 0;
  };

  private advance(now: number) {
    const before = this.game;
    this.prev = before.snake;
    this.game = step(before);
    const after = this.game;
    if (!this.calm && before.snake.length === after.snake.length && after.status === "playing") spawnTrail(this.fx, before.snake[before.snake.length - 1]);
    if (after.event && after.event.id !== this.seen) {
      this.seen = after.event.id;
      this.react(after.event, now);
    }
    if (after.status === "over") {
      this.prev = after.snake;
      this.acc = 0;
      this.onOver(after.score);
    }
    this.emit();
  }

  private react(event: GameEvent, now: number) {
    if (event.type === "eat") this.born = now;
    if (this.calm) return;
    if (event.type === "eat") {
      spawnBurst(this.fx, event.at, "food", 12);
      spawnRing(this.fx, event.at, "food");
      spawnFloater(this.fx, event.at, `+${event.points}`, event.points > 1 ? "head" : "food");
    } else if (event.type === "bonus") {
      spawnBurst(this.fx, event.at, "bonus", 18);
      spawnRing(this.fx, event.at, "bonus");
      spawnFloater(this.fx, event.at, `+${event.points}`, "bonus");
    } else if (event.type === "expire") {
      spawnRing(this.fx, event.at, "bonus");
    } else if (event.type === "over") {
      spawnBurst(this.fx, event.at, "ink", 16);
      spawnRing(this.fx, event.at, "food");
    }
  }

  private draw(now: number) {
    if (!this.ctx) return;
    const moving = this.game.status === "playing" || this.game.status === "paused";
    drawFrame(this.ctx, {
      game: this.game,
      prev: this.prev,
      alpha: moving ? this.acc / this.game.delay : 1,
      time: now,
      foodBorn: this.born,
      palette: this.palette,
      fx: this.fx,
      calm: this.calm,
    });
  }

  private emit() {
    const game = this.game;
    const level = speedLevel(game.delay);
    const hud: Hud = {
      status: game.status,
      score: game.score,
      speed: Math.max(1, Math.round((level / MAX_LEVEL) * 10)),
      factor: speedFactor(game.delay),
      atCeiling: level >= MAX_LEVEL,
      combo: game.combo,
      multiplier: multiplier(game),
      bonus: game.bonus !== null,
    };
    const key = JSON.stringify(hud);
    if (key === this.key) return;
    this.key = key;
    this.onHud(hud);
  }
}
