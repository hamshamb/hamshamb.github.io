"use client";

import { type KeyboardEvent, type PointerEvent, useCallback, useEffect, useId, useRef, useState } from "react";
import { SnakeBugFix } from "@/components/skills/arcade/SnakeBugFix";
import { type Hud, SnakeEngine } from "@/components/skills/arcade/snakeEngine";
import { useTheme } from "@/lib/client-stores";
import { discover, setFlag, unlockToy, useSecrets } from "@/lib/secrets";
import { chooseSkin, type Direction, parseScore, recordScore, type ScoreStore } from "@/lib/snake";

const KEYS: Record<string, Direction> = {
  ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right",
  w: "up", s: "down", a: "left", d: "right", W: "up", S: "down", A: "left", D: "right",
};
const BEST_KEY = "snake-best";
const SKIN_KEY = "snake-skin-choice";
const SWIPE_PX = 22;

/** localStorage when it works, nothing when it does not. The score is never critical. */
const browserStore: ScoreStore = {
  get: () => {
    try {
      return parseScore(window.localStorage.getItem(BEST_KEY));
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

const idle: Hud = { status: "ready", score: 0, speed: 1, factor: 1, atCeiling: false, combo: 0, multiplier: 1, bonus: false };

/**
 * Signal Snake. The game in the browser is TypeScript (lib/snake.ts has the rules, the files in
 * components/skills/arcade draw it); the terminal Python version is the other file in the panel.
 */
export function SignalSnake() {
  const [hud, setHud] = useState<Hud>(idle);
  const [best, setBest] = useState(0);
  const [session, setSession] = useState(0);
  const [record, setRecord] = useState(false);
  const [wanted, setWanted] = useState<string | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const board = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const engine = useRef<SnakeEngine | null>(null);
  const swipe = useRef<{ x: number; y: number } | null>(null);
  const help = useId();
  const secrets = useSecrets();
  const theme = useTheme();
  const unlocked = secrets?.flags.includes("snake-skin") ?? false;
  const skin = chooseSkin(unlocked, wanted);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setBest(browserStore.get());
      try {
        setWanted(window.localStorage.getItem(SKIN_KEY));
      } catch {
        // no storage, no remembered skin
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const onOver = useCallback((score: number) => {
    const before = browserStore.get();
    setBest(recordScore(browserStore, score));
    setSession((value) => Math.max(value, score));
    setRecord(score > before && score > 0);
  }, []);

  useEffect(() => {
    const canvasEl = canvas.current;
    const rootEl = root.current;
    const boardEl = board.current;
    if (!canvasEl || !rootEl || !boardEl) return;
    const game = new SnakeEngine(canvasEl, rootEl, setHud, onOver);
    engine.current = game;

    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const calm = () => game.setCalm(media.matches);
    calm();
    media.addEventListener("change", calm);
    // a hidden tab or a scrolled-away board pauses the game instead of quietly crashing the snake
    const onHide = () => {
      if (document.visibilityState === "hidden") game.pause();
    };
    document.addEventListener("visibilitychange", onHide);
    const watcher = new IntersectionObserver(([entry]) => {
      if (entry && !entry.isIntersecting) game.pause();
    }, { threshold: 0.2 });
    watcher.observe(boardEl);

    return () => {
      media.removeEventListener("change", calm);
      document.removeEventListener("visibilitychange", onHide);
      watcher.disconnect();
      game.destroy();
      engine.current = null;
    };
  }, [onOver]);

  // colours come from CSS custom properties, so read them again when the theme or skin changes
  useEffect(() => {
    engine.current?.restyle();
  }, [skin, theme]);

  const focusBoard = () => board.current?.focus({ preventScroll: true });
  const turn = (direction: Direction) => engine.current?.turn(direction);
  const toggle = () => engine.current?.toggle();

  const chooseSkinNow = (next: string) => {
    setWanted(next);
    try {
      window.localStorage.setItem(SKIN_KEY, next);
    } catch {
      // the skin just lasts until reload
    }
  };

  const solved = () => {
    setFlag("snake-skin");
    discover("snake-bugfix");
    unlockToy("snake");
    chooseSkinNow("python");
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    const onButton = event.target instanceof HTMLButtonElement;
    const direction = KEYS[event.key];
    if (direction) {
      event.preventDefault();
      turn(direction);
    } else if (event.key === " " || event.key === "p" || event.key === "P") {
      if (onButton && event.key === " ") return;
      event.preventDefault();
      if (hud.status === "over") engine.current?.restart(true);
      else toggle();
    } else if (event.key === "r" || event.key === "R") {
      event.preventDefault();
      engine.current?.restart(true);
    } else if (event.key === "Enter" && !onButton) {
      event.preventDefault();
      if (hud.status === "over") engine.current?.restart(true);
      else if (hud.status !== "playing") toggle();
    }
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse") return;
    swipe.current = { x: event.clientX, y: event.clientY };
  };
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const start = swipe.current;
    if (!start || hud.status !== "playing") return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < SWIPE_PX) return;
    turn(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : dy > 0 ? "down" : "up");
    swipe.current = { x: event.clientX, y: event.clientY };
  };
  const endSwipe = () => {
    swipe.current = null;
  };

  const start = () => {
    if (hud.status === "over") engine.current?.restart(true);
    else toggle();
    focusBoard();
  };

  const live =
    hud.status === "over" ? `signal lost. score ${hud.score}. best ${best}.`
    : hud.status === "paused" ? `paused. score ${hud.score}.`
    : hud.status === "ready" ? "ready."
    : `score ${Math.floor(hud.score / 5) * 5}.`;

  return (
    <div className="sg" data-skin={skin} ref={root}>
      <div className="sg-hud" role="group" aria-label="Game stats">
        <div className="sg-stat">
          <span className="sg-label mono">score</span>
          <b key={hud.score} className="sg-score">{hud.score}</b>
        </div>
        <div className="sg-stat">
          <span className="sg-label mono">best</span>
          <b>{best}</b>
          <small className="mono">session {session}</small>
        </div>
        <div className="sg-stat sg-speed">
          <span className="sg-label mono">speed</span>
          <span className="sg-meter" role="img" aria-label={`speed ${hud.factor} times${hud.atCeiling ? ", the maximum" : ""}`}>
            {Array.from({ length: 10 }, (_, index) => <i key={index} data-on={index < hud.speed || undefined} />)}
          </span>
          <small className="mono">{hud.atCeiling ? "max" : `${hud.factor}x`}</small>
        </div>
      </div>

      {/* a game board is the one place where "application" with a tab stop is the right role: it owns its keys while focused */}
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
      <div
        ref={board}
        className="sg-board"
        data-status={hud.status}
        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
        tabIndex={0}
        role="application"
        aria-roledescription="game board"
        aria-label="Signal Snake board"
        aria-describedby={help}
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endSwipe}
        onPointerCancel={endSwipe}
      >
        <canvas ref={canvas} aria-hidden="true" />
        <div className="sg-flags" aria-hidden="true">
          <span className="sg-combo mono" data-on={hud.combo > 0 || undefined}>combo x{hud.multiplier}</span>
          <span className="sg-bonus mono" data-on={hud.bonus || undefined}>bonus</span>
        </div>
        {hud.status !== "playing" && (
          <div className="sg-screen" data-screen={hud.status}>
            {hud.status === "ready" && (
              <>
                <p className="sg-title">signal snake</p>
                <p className="sg-sub">eat the signal. mind the walls, and yourself.</p>
                <button type="button" className="sg-btn sg-btn-primary" onClick={start}>start</button>
                <p className="sg-hint mono"><span className="sg-hint-keys">arrows or wasd · space pauses</span><span className="sg-hint-touch">swipe the board or use the pad</span></p>
              </>
            )}
            {hud.status === "paused" && (
              <>
                <p className="sg-title">paused.</p>
                <p className="sg-sub">the snake is waiting. it does not mind.</p>
                <button type="button" className="sg-btn sg-btn-primary" onClick={start}>resume</button>
              </>
            )}
            {hud.status === "over" && (
              <>
                <p className="sg-title">signal lost.</p>
                <p className="sg-sub">
                  score <b>{hud.score}</b>
                  {record ? ", a new best." : `. best ${best}.`}
                </p>
                <button type="button" className="sg-btn sg-btn-primary" onClick={start}>play again</button>
                <p className="sg-hint mono"><span className="sg-hint-keys">press r or enter</span></p>
              </>
            )}
          </div>
        )}
      </div>
      <p id={help} className="sr-only">Arrow keys or WASD steer. Space or P pauses. R restarts. Eat the diamonds, avoid the walls and your own tail.</p>
      <p className="sr-only" aria-live="polite">{live}</p>

      <div className="sg-bar">
        <button type="button" className="sg-btn" onClick={start}>
          {hud.status === "playing" ? "pause" : hud.status === "paused" ? "resume" : hud.status === "over" ? "again" : "start"}
        </button>
        <button type="button" className="sg-btn" onClick={() => { engine.current?.restart(false); focusBoard(); }}>restart</button>
        {unlocked && (
          <button type="button" className="sg-btn" aria-pressed={skin === "python"} onClick={() => chooseSkinNow(skin === "python" ? "ink" : "python")}>
            skin: {skin === "python" ? "python" : "ink"}
          </button>
        )}
      </div>

      <div className="sg-pad" role="group" aria-label="Steer">
        <button type="button" className="sg-pad-up" onClick={() => turn("up")} aria-label="up"><span aria-hidden="true">↑</span></button>
        <button type="button" className="sg-pad-left" onClick={() => turn("left")} aria-label="left"><span aria-hidden="true">←</span></button>
        <button type="button" className="sg-pad-right" onClick={() => turn("right")} aria-label="right"><span aria-hidden="true">→</span></button>
        <button type="button" className="sg-pad-down" onClick={() => turn("down")} aria-label="down"><span aria-hidden="true">↓</span></button>
      </div>

      <p className="sg-foot mono">best score stays in this browser. the keys only work while the board has focus.</p>
      <SnakeBugFix solved={unlocked} onSolved={solved} />
    </div>
  );
}
