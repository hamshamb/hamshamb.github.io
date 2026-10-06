/**
 * A very small 2D physics step for the hidden sandbox: circles with gravity, walls, pairwise
 * collisions, one optional spring anchor and one optional magnet. Not a physics engine, just
 * enough to throw things. Kept free of imports so the tests can run it.
 */

export type Body = { id: number; kind: "ball" | "block"; x: number; y: number; vx: number; vy: number; r: number; m: number; held?: boolean };
export type World = {
  width: number;
  height: number;
  bodies: Body[];
  gravity: number;
  spring?: { x: number; y: number; body: number; rest: number; k: number };
  magnet?: { x: number; y: number; strength: number };
};

const RESTITUTION = 0.62;
const FRICTION = 0.995;
const MAX_SPEED = 2600;

export function step(world: World, dt: number): World {
  const t = Math.min(dt, 1 / 30);
  const bodies = world.bodies.map((body) => ({ ...body }));
  for (const body of bodies) {
    if (body.held) continue;
    body.vy += world.gravity * t;
    if (world.magnet) {
      const dx = world.magnet.x - body.x;
      const dy = world.magnet.y - body.y;
      const d2 = Math.max(dx * dx + dy * dy, 400);
      const pull = (world.magnet.strength / d2) * (body.kind === "block" ? 1.4 : 1);
      body.vx += (dx / Math.sqrt(d2)) * pull * t;
      body.vy += (dy / Math.sqrt(d2)) * pull * t;
    }
    if (world.spring && world.spring.body === body.id) {
      const dx = body.x - world.spring.x;
      const dy = body.y - world.spring.y;
      const d = Math.max(Math.hypot(dx, dy), 0.001);
      const f = -world.spring.k * (d - world.spring.rest);
      body.vx += ((f * dx) / d / body.m) * t;
      body.vy += ((f * dy) / d / body.m) * t;
      body.vx *= 0.99;
      body.vy *= 0.99;
    }
    const speed = Math.hypot(body.vx, body.vy);
    if (speed > MAX_SPEED) {
      body.vx *= MAX_SPEED / speed;
      body.vy *= MAX_SPEED / speed;
    }
    body.vx *= FRICTION;
    body.x += body.vx * t;
    body.y += body.vy * t;
    // walls
    if (body.x < body.r) [body.x, body.vx] = [body.r, Math.abs(body.vx) * RESTITUTION];
    if (body.x > world.width - body.r) [body.x, body.vx] = [world.width - body.r, -Math.abs(body.vx) * RESTITUTION];
    if (body.y < body.r) [body.y, body.vy] = [body.r, Math.abs(body.vy) * RESTITUTION];
    if (body.y > world.height - body.r) {
      body.y = world.height - body.r;
      body.vy = -Math.abs(body.vy) * RESTITUTION;
      body.vx *= 0.96;
      if (Math.abs(body.vy) < 18) body.vy = 0;
    }
  }
  // pairwise collisions: push apart, exchange momentum along the normal
  for (let i = 0; i < bodies.length; i += 1) {
    for (let j = i + 1; j < bodies.length; j += 1) {
      const a = bodies[i];
      const b = bodies[j];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const d = Math.hypot(dx, dy);
      const min = a.r + b.r;
      if (d === 0 || d >= min) continue;
      const nx = dx / d;
      const ny = dy / d;
      const overlap = min - d;
      const ia = a.held ? 0 : 1 / a.m;
      const ib = b.held ? 0 : 1 / b.m;
      if (ia + ib === 0) continue;
      a.x -= nx * overlap * (ia / (ia + ib));
      a.y -= ny * overlap * (ia / (ia + ib));
      b.x += nx * overlap * (ib / (ia + ib));
      b.y += ny * overlap * (ib / (ia + ib));
      const rel = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
      if (rel > 0) continue;
      const impulse = (-(1 + RESTITUTION) * rel) / (ia + ib);
      a.vx -= impulse * nx * ia;
      a.vy -= impulse * ny * ia;
      b.vx += impulse * nx * ib;
      b.vy += impulse * ny * ib;
    }
  }
  return { ...world, bodies };
}

/** Total kinetic energy, so the sandbox can stop animating once everything has settled. */
export function energy(world: World) {
  return world.bodies.reduce((sum, body) => sum + 0.5 * body.m * (body.vx * body.vx + body.vy * body.vy), 0);
}
