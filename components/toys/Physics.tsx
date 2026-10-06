"use client";

import { type PointerEvent, useEffect, useRef, useState } from "react";
import { type Body, energy, step, type World } from "@/lib/physics";

const W = 640;
const H = 360;

function startWorld(): World {
  const bodies: Body[] = [
    { id: 1, kind: "ball", x: 140, y: 80, vx: 120, vy: 0, r: 22, m: 1 },
    { id: 2, kind: "block", x: 320, y: 60, vx: 0, vy: 0, r: 26, m: 2.4 },
    { id: 3, kind: "ball", x: 470, y: 120, vx: -80, vy: 0, r: 16, m: 0.6 },
    { id: 4, kind: "ball", x: 540, y: 200, vx: 0, vy: 0, r: 18, m: 0.8 },
  ];
  return { width: W, height: H, gravity: 1400, bodies, spring: { x: 540, y: 30, body: 4, rest: 110, k: 60 } };
}

/**
 * Balls, a heavy block, a spring and a magnet. Drag to pick something up, let go to throw it.
 * The loop only runs while something is moving, and stops when the dialog closes.
 */
export default function Physics() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const world = useRef<World>(startWorld());
  const grab = useRef<{ id: number; trail: { x: number; y: number; t: number }[] } | null>(null);
  const frame = useRef(0);
  const [magnet, setMagnet] = useState(false);
  const [count, setCount] = useState(() => startWorld().bodies.length);

  useEffect(() => {
    const el = canvas.current;
    const ctx = el?.getContext("2d");
    if (!el || !ctx) return;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    el.width = W * ratio;
    el.height = H * ratio;
    ctx.scale(ratio, ratio);
    const css = getComputedStyle(el);
    const ink = css.getPropertyValue("--fg").trim() || "#ccc";
    const soft = css.getPropertyValue("--fg-3").trim() || "#888";
    const accent = css.getPropertyValue("--accent").trim() || "#84d9a0";
    let last = performance.now();
    let calm = 0;

    const draw = () => {
      const w = world.current;
      ctx.clearRect(0, 0, W, H);
      ctx.strokeStyle = soft;
      ctx.lineWidth = 1;
      if (w.spring) {
        const body = w.bodies.find((item) => item.id === w.spring!.body);
        if (body) {
          ctx.beginPath();
          const segments = 14;
          for (let i = 0; i <= segments; i += 1) {
            const t = i / segments;
            const x = w.spring.x + (body.x - w.spring.x) * t + (i % 2 ? 6 : -6) * (i > 0 && i < segments ? 1 : 0);
            const y = w.spring.y + (body.y - w.spring.y) * t;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
          ctx.fillStyle = soft;
          ctx.fillRect(w.spring.x - 10, w.spring.y - 4, 20, 4);
        }
      }
      if (w.magnet) {
        ctx.strokeStyle = accent;
        for (const r of [10, 24, 40]) {
          ctx.beginPath();
          ctx.arc(w.magnet.x, w.magnet.y, r, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
      for (const body of w.bodies) {
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = body.held ? accent : ink;
        ctx.fillStyle = body.kind === "block" ? soft : "transparent";
        ctx.beginPath();
        if (body.kind === "block") ctx.roundRect(body.x - body.r * 0.86, body.y - body.r * 0.86, body.r * 1.72, body.r * 1.72, 4);
        else ctx.arc(body.x, body.y, body.r, 0, Math.PI * 2);
        if (body.kind === "block") ctx.globalAlpha = 0.35;
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.stroke();
      }
    };

    const loop = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      world.current = step(world.current, dt);
      draw();
      calm = energy(world.current) < 40 && !grab.current ? calm + 1 : 0;
      frame.current = calm > 30 ? 0 : requestAnimationFrame(loop);
    };
    const wake = () => {
      if (frame.current) return;
      last = performance.now();
      calm = 0;
      frame.current = requestAnimationFrame(loop);
    };
    el.dataset.ready = "1";
    (el as HTMLCanvasElement & { wake?: () => void }).wake = wake;
    draw();
    wake();
    return () => {
      cancelAnimationFrame(frame.current);
      frame.current = 0;
    };
  }, []);

  const wake = () => (canvas.current as (HTMLCanvasElement & { wake?: () => void }) | null)?.wake?.();
  const point = (event: PointerEvent<HTMLCanvasElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    return { x: ((event.clientX - box.left) / box.width) * W, y: ((event.clientY - box.top) / box.height) * H };
  };

  /** Drop whatever is held without throwing it (cancelled touches, lost capture). */
  const release = () => {
    const held = grab.current;
    if (!held) return;
    grab.current = null;
    world.current = { ...world.current, bodies: world.current.bodies.map((body) => (body.id === held.id ? { ...body, held: false } : body)) };
    wake();
  };

  const add = (kind: Body["kind"]) => {
    const w = world.current;
    if (w.bodies.length >= 18) return;
    const id = Math.max(...w.bodies.map((body) => body.id)) + 1;
    const r = kind === "block" ? 22 + Math.random() * 8 : 12 + Math.random() * 12;
    world.current = { ...w, bodies: [...w.bodies, { id, kind, x: 60 + Math.random() * (W - 120), y: 40, vx: (Math.random() - 0.5) * 300, vy: 0, r, m: kind === "block" ? 2.4 : r / 20 }] };
    setCount(world.current.bodies.length);
    wake();
  };

  return (
    <div className="physics">
      <canvas
        ref={canvas}
        className="physics-canvas"
        role="img"
        aria-label={`a sandbox with ${count} objects, a spring${magnet ? " and a magnet" : ""}`}
        onPointerDown={(event) => {
          const { x, y } = point(event);
          const hit = world.current.bodies.find((body) => Math.hypot(body.x - x, body.y - y) <= body.r + 6);
          if (!hit) return;
          event.currentTarget.setPointerCapture(event.pointerId);
          grab.current = { id: hit.id, trail: [{ x, y, t: performance.now() }] };
          world.current = { ...world.current, bodies: world.current.bodies.map((body) => (body.id === hit.id ? { ...body, held: true, vx: 0, vy: 0 } : body)) };
          wake();
        }}
        onPointerMove={(event) => {
          if (!grab.current) return;
          const { x, y } = point(event);
          grab.current.trail = [...grab.current.trail.slice(-4), { x, y, t: performance.now() }];
          world.current = { ...world.current, bodies: world.current.bodies.map((body) => (body.id === grab.current!.id ? { ...body, x, y } : body)) };
        }}
        onPointerCancel={() => release()}
        onLostPointerCapture={() => release()}
        onPointerUp={() => {
          const held = grab.current;
          if (!held) return;
          const [first, lastPoint] = [held.trail[0], held.trail[held.trail.length - 1]];
          const dt = Math.max((lastPoint.t - first.t) / 1000, 0.016);
          world.current = {
            ...world.current,
            bodies: world.current.bodies.map((body) => (body.id === held.id ? { ...body, held: false, vx: (lastPoint.x - first.x) / dt, vy: (lastPoint.y - first.y) / dt } : body)),
          };
          grab.current = null;
          wake();
        }}
      />
      <div className="toy-controls">
        <button type="button" className="tool-button mono" onClick={() => add("ball")}>+ ball</button>
        <button type="button" className="tool-button mono" onClick={() => add("block")}>+ block</button>
        <button
          type="button"
          className="tool-button mono"
          aria-pressed={magnet}
          onClick={() => {
            setMagnet(!magnet);
            world.current = { ...world.current, magnet: magnet ? undefined : { x: W / 2, y: H * 0.42, strength: 4.2e6 } };
            wake();
          }}
        >
          magnet
        </button>
        <button
          type="button"
          className="tool-button mono"
          onClick={() => {
            world.current = { ...world.current, bodies: world.current.bodies.map((body) => ({ ...body, vy: body.vy - 900 - Math.random() * 400, vx: body.vx + (Math.random() - 0.5) * 500 })) };
            wake();
          }}
        >
          shake
        </button>
        <button
          type="button"
          className="tool-button mono"
          onClick={() => {
            world.current = startWorld();
            setMagnet(false);
            setCount(world.current.bodies.length);
            wake();
          }}
        >
          reset
        </button>
      </div>
      <p className="toy-foot mono">drag to pick things up, let go to throw. no physics engine was harmed.</p>
    </div>
  );
}
