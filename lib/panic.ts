/**
 * Escape as a universal "put everything back" for secret modes. Toys register a reset; a single
 * keydown listener (SecretLayer) calls them all when Escape was not already handled by a dialog,
 * the command palette or a form control. Free of imports so the tests can load it.
 */

type Reset = () => void;

const resets = new Set<Reset>();

export function onPanic(reset: Reset) {
  resets.add(reset);
  return () => {
    resets.delete(reset);
  };
}

/** Runs every registered reset. One failing reset never stops the others. Returns how many ran. */
export function panic() {
  let ran = 0;
  for (const reset of [...resets]) {
    try {
      reset();
      ran += 1;
    } catch {
      // keep going: the point is to restore as much as possible
    }
  }
  return ran;
}

export function panicCount() {
  return resets.size;
}
