/**
 * The looping Rivet scene's clock: where the envelope is (0 sender, 1 recipient) at a point in
 * one cycle (0 to 1). It waits at the sender, travels to each phone in turn with a short stop
 * at every relay, rests at the recipient while it opens, then starts again. Pure, so tested.
 */

export const LOOP_MS = 7200;

/** [start, end] of each leg as fractions of the cycle; everything between legs is a stop. */
const legs: [number, number, number, number][] = [
  // cycle from, cycle to, progress from, progress to
  [0.08, 0.24, 0, 1 / 3],
  [0.32, 0.48, 1 / 3, 2 / 3],
  [0.56, 0.72, 2 / 3, 1],
];

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

export function loopProgress(t: number) {
  const at = ((t % 1) + 1) % 1;
  let progress = 0;
  for (const [from, to, p0, p1] of legs) {
    if (at >= to) progress = p1;
    else if (at > from) return p0 + (p1 - p0) * ease((at - from) / (to - from));
  }
  return progress;
}
