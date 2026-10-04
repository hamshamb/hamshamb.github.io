"use client";

import { type KeyboardEvent, type TouchEvent, useCallback, useEffect, useRef, useState } from "react";
import { type Direction, type Game, newGame, recordScore, type ScoreStore, steer, step } from "@/lib/snake";

const KEYS: Record<string, Direction> = {
  ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right",
  w: "up", s: "down", a: "left", d: "right", W: "up", S: "down", A: "left", D: "right",
};
const BEST_KEY = "snake-best";

/** localStorage when it works, nothing when it does not. The score is never critical. */
const browserStore: ScoreStore = {
  get: () => {
    try {
      return Number(window.localStorage.getItem(BEST_KEY)) || 0;
    } catch {
      return 0;
    }
  },
  set: (value) => {
    try {
      window.localStorage.setItem(BEST_KEY, String(value));
    } catch {
      // private mode or blocked storage: the best score just lasts until reload
    }
  },
};

function draw(canvas: HTMLCanvasElement, game: Game) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const styles = getComputedStyle(canvas);
  const cell = canvas.width / game.cols;
  ctx.fillStyle = styles.getPropertyValue("--board").trim() || "#121512";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = styles.getPropertyValue("--grid").trim() || "#1b1f1b";
  for (let x = 0; x < game.cols; x += 1) for (let y = 0; y < game.rows; y += 1) if ((x + y) % 2) ctx.fillRect(x * cell, y * cell, cell, cell);
  ctx.fillStyle = styles.getPropertyValue("--food").trim() || "#e5b766";
  ctx.fillRect(game.food.x * cell + cell * 0.22, game.food.y * cell + cell * 0.22, cell * 0.56, cell * 0.56);
  const body = styles.getPropertyValue("--snake").trim() || "#84d9a0";
  game.snake.forEach((part, index) => {
    ctx.fillStyle = body;
    ctx.globalAlpha = index === 0 ? 1 : Math.max(0.45, 1 - index * 0.025);
    const inset = index === 0 ? 1 : 2;
    ctx.fillRect(part.x * cell + inset, part.y * cell + inset, cell - inset * 2, cell - inset * 2);
  });
  ctx.globalAlpha = 1;
}

/** Snake in the browser: arrows or WASD, swipes or the on-screen pad on touch screens. */
export function SnakeDemo() {
  const [game, setGame] = useState<Game>(() => newGame());
  const [best, setBest] = useState(0);
  const canvas = useRef<HTMLCanvasElement>(null);
  const touch = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setBest(browserStore.get()), 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (canvas.current) draw(canvas.current, game);
  }, [game]);

  // the loop: one step per game.delay while playing
  useEffect(() => {
    if (game.status !== "playing") return;
    const timer = window.setTimeout(() => setGame((current) => step(current)), game.delay);
    return () => window.clearTimeout(timer);
  }, [game]);

  useEffect(() => {
    if (game.status === "over") {
      const timer = window.setTimeout(() => setBest(recordScore(browserStore, game.score)), 0);
      return () => window.clearTimeout(timer);
    }
  }, [game.status, game.score]);

  // a hidden tab pauses the game instead of quietly crashing the snake into a wall
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === "hidden") setGame((current) => (current.status === "playing" ? { ...current, status: "paused" } : current));
    };
    document.addEventListener("visibilitychange", onHide);
    return () => document.removeEventListener("visibilitychange", onHide);
  }, []);

  const turn = useCallback((direction: Direction) => {
    setGame((current) => {
      if (current.status === "over") return current;
      const resumed = current.status === "paused" ? { ...current, status: "playing" as const } : current;
      return steer(resumed, direction);
    });
  }, []);

  const toggle = useCallback(() => {
    setGame((current) => {
      if (current.status === "over") return newGame();
      if (current.status === "ready") return { ...current, status: "playing" };
      return { ...current, status: current.status === "playing" ? "paused" : "playing" };
    });
  }, []);

  const onKey = (event: KeyboardEvent<HTMLButtonElement>) => {
    const direction = KEYS[event.key];
    if (direction) {
      event.preventDefault();
      turn(direction);
    } else if (event.key === " " || event.key === "p") {
      event.preventDefault();
      toggle();
    }
  };

  const onTouchEnd = (event: TouchEvent<HTMLButtonElement>) => {
    const start = touch.current;
    const end = event.changedTouches[0];
    touch.current = null;
    if (!start || !end) return;
    const dx = end.clientX - start.x;
    const dy = end.clientY - start.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
    event.preventDefault();
    turn(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : dy > 0 ? "down" : "up");
  };

  const message = {
    ready: "press an arrow key, WASD or swipe to start",
    playing: "",
    paused: "paused. press space or tap to carry on",
    over: `game over. score ${game.score}. press space or tap to play again`,
  }[game.status];

  return (
    <div className="snake">
      <div className="snake-hud mono">
        <span>score <b>{game.score}</b></span>
        <span>best <b>{best}</b></span>
        <span>speed <b>{Math.round((140 / game.delay) * 10) / 10}x</b></span>
      </div>
      <button
        type="button"
        className="snake-board"
        onKeyDown={onKey}
        onClick={toggle}
        onTouchStart={(event) => {
          const t = event.touches[0];
          touch.current = { x: t.clientX, y: t.clientY };
        }}
        onTouchEnd={onTouchEnd}
        aria-label={`Snake game. ${message || `playing, score ${game.score}`}. arrow keys or WASD to steer, space to pause.`}
        aria-describedby="snake-help"
      >
        <canvas ref={canvas} width={480} height={384} aria-hidden="true" />
        {message && <span className="snake-message">{message}</span>}
      </button>
      <div className="snake-pad" role="group" aria-label="Steer">
        <button type="button" onClick={() => turn("up")} aria-label="up">↑</button>
        <button type="button" onClick={() => turn("left")} aria-label="left">←</button>
        <button type="button" onClick={toggle} aria-label={game.status === "playing" ? "pause" : "play"}>{game.status === "playing" ? "❚❚" : "▶"}</button>
        <button type="button" onClick={() => turn("right")} aria-label="right">→</button>
        <button type="button" onClick={() => turn("down")} aria-label="down">↓</button>
      </div>
      <div className="snake-foot">
        <p id="snake-help" className="mono">focus the board · arrows / WASD · space pauses · best score stays in this browser</p>
        <button type="button" className="button" onClick={() => setGame(newGame())}>restart</button>
      </div>
    </div>
  );
}
