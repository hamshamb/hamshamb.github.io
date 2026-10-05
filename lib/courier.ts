/**
 * The packet courier: a tiny store-and-forward game. You hold a sealed envelope, the recipient is
 * far away, and the phones in between drift in and out of range on a tick. You decide when to hand
 * a copy to a phone that is close enough. Handing over early does not cost the copy you already
 * hold, which is the whole lesson: waiting, carrying and forwarding beat needing a clean path.
 *
 * Pure and deterministic (seeded), so it can be tested. It is a conceptual simulation: the track,
 * the range and the tick are drawing units, not Bluetooth distances or timings.
 */

export const TRACK = 100;
export const COURIER_RANGE = 26;
export const COURIER_DEADLINE = 26;
export const COURIER_MAX_HOPS = 6;
/** What the generator assumes a person can do inside one tick. The game itself allows any number. */
export const HANDOVERS_PER_TICK = 2;

export type CourierPhone = { id: string; name: string; base: number; amp: number; speed: number; phase: number };
export type CourierStatus = "playing" | "won" | "lost";
export type Courier = {
  seed: number;
  tick: number;
  deadline: number;
  phones: CourierPhone[];
  /** Hops the sealed copy on each phone has taken. Absent means that phone holds nothing. */
  copies: Record<string, number | undefined>;
  handovers: number;
  status: CourierStatus;
  log: string[];
};

/** Small seeded generator (mulberry32). Same seed, same game. */
function random(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const YOU = "you";
export const FRIEND = "friend";

export function positionOf(phone: CourierPhone, tick: number) {
  const x = phone.base + phone.amp * Math.sin(tick * phone.speed + phone.phase);
  return Math.round(Math.max(3, Math.min(TRACK - 3, x)) * 10) / 10;
}

export const inRange = (game: Courier, a: string, b: string) => {
  const from = game.phones.find((phone) => phone.id === a);
  const to = game.phones.find((phone) => phone.id === b);
  if (!from || !to || a === b) return false;
  return Math.abs(positionOf(from, game.tick) - positionOf(to, game.tick)) <= COURIER_RANGE;
};

function build(seed: number): Courier {
  const next = random(seed);
  const between = (low: number, high: number) => low + next() * (high - low);
  const relays: CourierPhone[] = ["a", "b", "c", "d"].map((letter, index) => ({
    id: `relay-${letter}`,
    name: `relay ${letter}`,
    base: 28 + index * 15 + between(-4, 4),
    amp: between(14, 26),
    speed: between(0.26, 0.58),
    phase: between(0, Math.PI * 2),
  }));
  const phones: CourierPhone[] = [
    { id: YOU, name: "you", base: 9, amp: 3, speed: between(0.2, 0.4), phase: between(0, Math.PI * 2) },
    ...relays,
    { id: FRIEND, name: "friend", base: 91, amp: 3, speed: between(0.2, 0.4), phase: between(0, Math.PI * 2) },
  ];
  return {
    seed,
    tick: 0,
    deadline: COURIER_DEADLINE,
    phones,
    copies: { [YOU]: 0 },
    handovers: 0,
    status: "playing",
    log: ["sealed the message. nobody nearby can read it. the friend is out of range."],
  };
}

/** Who could take a copy right now, and from whom. Phones that already hold one are left out. */
export function options(game: Courier): { id: string; from: string }[] {
  if (game.status !== "playing") return [];
  const found: { id: string; from: string }[] = [];
  for (const phone of game.phones) {
    if (game.copies[phone.id] !== undefined) continue;
    const holders = game.phones.filter(
      (holder) => (game.copies[holder.id] ?? COURIER_MAX_HOPS) < COURIER_MAX_HOPS && inRange(game, holder.id, phone.id),
    );
    if (holders.length === 0) continue;
    const distance = (id: string) =>
      Math.abs(positionOf(game.phones.find((item) => item.id === id)!, game.tick) - positionOf(phone, game.tick));
    holders.sort((a, b) => distance(a.id) - distance(b.id));
    found.push({ id: phone.id, from: holders[0].id });
  }
  return found;
}

/** Hand a sealed copy to `to`, if some phone holding one is in range of it right now. */
export function handOver(game: Courier, to: string): Courier {
  if (game.status !== "playing") return game;
  const name = game.phones.find((phone) => phone.id === to)?.name ?? to;
  if (game.copies[to] !== undefined) return { ...game, log: [...game.log, `${name} already has a sealed copy.`] };
  const option = options(game).find((item) => item.id === to);
  if (!option) return { ...game, log: [...game.log, `${name} is out of range of every phone holding the envelope. wait for it to drift closer.`] };
  const copies = { ...game.copies, [to]: (game.copies[option.from] ?? 0) + 1 };
  const handovers = game.handovers + 1;
  if (to === FRIEND) {
    return {
      ...game,
      copies,
      handovers,
      status: "won",
      log: [...game.log, `delivered on tick ${game.tick}, with ${handovers} handover${handovers === 1 ? "" : "s"}. the friend opened it.`],
    };
  }
  return { ...game, copies, handovers, log: [...game.log, `${name} took a sealed copy. it cannot read it.`] };
}

/** One tick passes. Phones drift. Past the deadline, every copy has expired. */
export function step(game: Courier): Courier {
  if (game.status !== "playing") return game;
  const tick = game.tick + 1;
  if (tick >= game.deadline) {
    return { ...game, tick, copies: {}, status: "lost", log: [...game.log, "the deadline passed and every copy expired. nothing was delivered."] };
  }
  return { ...game, tick };
}

/**
 * The earliest tick at which the friend can hold a copy, if someone plays well: at every tick the
 * copies spread through up to `perTick` rounds of handovers. Returns -1 when it cannot happen.
 * Used to build games that are winnable, and to test that they are.
 */
export function earliestDelivery(game: Courier, perTick: number = HANDOVERS_PER_TICK): number {
  let copies: Record<string, number | undefined> = { ...game.copies };
  for (let tick = game.tick; tick < game.deadline; tick += 1) {
    const at: Courier = { ...game, tick, copies, status: "playing" };
    for (let round = 0; round < perTick; round += 1) {
      const gained = options(at).map((option) => ({ id: option.id, hops: (at.copies[option.from] ?? 0) + 1 }));
      if (gained.length === 0) break;
      const merged = { ...at.copies };
      for (const item of gained) merged[item.id] = item.hops;
      at.copies = merged;
    }
    copies = at.copies;
    if (copies[FRIEND] !== undefined) return tick;
  }
  return -1;
}

/**
 * A fresh game for this seed, nudged forward to the next seed that is winnable but not trivial:
 * the friend cannot be reached in the first few ticks and cannot be left until the last few.
 */
export function newGame(seed = 1): Courier {
  let candidate = build(seed);
  for (let offset = 0; offset < 400; offset += 1) {
    candidate = build(seed + offset);
    const earliest = earliestDelivery(candidate);
    if (earliest >= 7 && earliest <= candidate.deadline - 7) return candidate;
  }
  return candidate;
}
